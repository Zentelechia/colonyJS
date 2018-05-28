#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const parser = require('flow-parser');
const types = require('ast-types');

const TYPES = {
  BooleanTypeAnnotation: 'boolean',
  StringTypeAnnotation: 'string',
  NumberTypeAnnotation: 'number',
  Date: 'Date',
  Address: 'Address',
  BigNumber: 'BigNumber',
  Role: 'Role',
};

const ast = parser.parse(
  fs.readFileSync(path.resolve(process.cwd(), process.argv[2])).toString(),
);

const callers = [];
const senders = [];
const multisig = [];

types.visit(ast, {
  visitQualifiedTypeIdentifier(p) {
    if (p.value.id.name === 'Caller') {
      const { params } = p.parent.value.typeParameters;

      callers.push({
        name: getName(p),
        description: getDescription(p),
        args: mapObjectProps(params[0]),
        returns: mapObjectProps(params[1]),
      });
    }
    if (p.value.id.name === 'Sender') {
      const { params } = p.parent.value.typeParameters;

      senders.push({
        name: getName(p),
        description: getDescription(p),
        args: mapObjectProps(params[0]),
        events: mapObjectProps(params[1]),
      });
    }
    if (p.value.id.name === 'MultisigSender') {
      const { params } = p.parent.value.typeParameters;

      multisig.push({
        name: getName(p),
        description: getDescription(p),
        args: mapObjectProps(params[0]),
        events: mapObjectProps(params[1]),
      });
    }
    return false;
  },
});

const md = `
${printCallers()}
${printSenders()}
${printMultiSig()}
`.trim();

console.log(md);

function printCallers() {
  if (!callers.length) return '';
  // TODO: use templates to properly place this text into the file
  return `## Callers

**All callers return promises which resolve to an object containing the given return values.** For a reference please check [here](/colonyjs/docs-contract-client/#callers).
` +
    callers
      .map(
        caller => `
### \`${caller.name}.call(${printArgs(caller.args, false)})\`

${caller.description}
${caller.args && caller.args.length ? '\n**Arguments**\n\n' : ''}${printProps('Argument', caller.args)}

**Returns**

A promise which resolves to an object containing the following properties:

${printProps('Return value', caller.returns)}
`,
    )
    .join('');
}

function printSenders() {
  if (!senders.length) return '';
  // TODO: use templates to properly place this text into the file
  return `## Senders

**All senders return an instance of a \`ContractResponse\`.** Every \`send()\` method takes an \`options\` object as the second argument. For a reference please check [here](/colonyjs/docs-contract-client/#senders).` +
    senders
      .map(
        sender => `
### \`${sender.name}.send(${printArgs(sender.args, true)})\`

${sender.description}
${sender.args && sender.args.length ? '\n**Arguments**\n\n' : ''}${printProps('Argument', sender.args)}

**Returns**

An instance of a \`ContractResponse\` ${sender.events && sender.events.length ? 'which will eventually receive the following event data:' : ''}

${printProps('Event data', sender.events)}
`,
    )
    .join('');
}

function printMultiSig() {
  if (!multisig.length) return '';
  // TODO: use templates to properly place this text into the file
  return `## Task MultiSig

**All MultiSig functions return an instance of a \`MultiSigOperation\`.** For a reference please check [here](/colonyjs/docs-multisignature-transactions/).` +
    multisig
      .map(
        ms => `
### \`${ms.name}.startOperation(${printArgs(ms.args, false)})\`

${ms.description}
${ms.args && ms.args.length ? '\n**Arguments**\n\n' : ''}${printProps('Argument', ms.args)}

**Returns**

An instance of a \`MultiSigOperation\` ${ms.events && ms.events.length ? 'whose sender will eventually receive the following event data:' : ''}

${printProps('Event data', ms.events)}
`,
    )
    .join('');
}

function printProps(title, props) {
  if (props && props.length) {
    return `|${title}|Type|Description|
|---|---|---|
${props
      .map(param => `|${param.name}|${param.type}|${param.description}|`)
      .join('\n')}`;
  }
  return ``;
}

function printArgs(args, withOpts) {
  if (args && args.length) {
    return `{ ${args.map(arg => arg.name).join(', ')} }${withOpts ? ', options' : ''}`;
  }
  return withOpts ? 'options' : '';
}

function mapObjectProps(param) {
  if (param.type === 'ObjectTypeAnnotation') {
    return param.properties.map(prop => {
      const comment = ast.comments.find(
        c => c.loc.start.line === prop.key.loc.start.line,
      );
      return {
        name: prop.key.name,
        type: mapType(prop.value),
        description: formatDescription(comment && comment.value),
      };
    });
  }
}

function getName(p) {
  return p.parent.parent.parent.value.key.name;
}

function getDescription(p) {
  const commentLine = p.parent.parent.parent.value.loc.start.line - 1;
  const comment = ast.comments.find(c => c.loc.end.line === commentLine);
  return formatDescription(comment && comment.value);
}

function formatDescription(str) {
  if (str) {
    const description = str
      .trim()
      .replace(
        /\[(.+)\]\((.+?)#(.+)\)/g,
        (_, $1, $2, $3) => `[${$1}](${$2}.html#${$3})`,
      );
    return description;
  }
  return '';
}

function mapType(type) {
  if (type.type === 'GenericTypeAnnotation') {
    return TYPES[type.id.name];
  }
  return TYPES[type.type];
}
