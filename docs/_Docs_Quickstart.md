---
title: Quickstart
section: Docs
order: 1
---

## Getting started

This guide will help you set up various prerequisites for using colonyJS, get connected to a local version of the Colony Network, and create a Colony.

## Environment prerequisites

* For local development, you will need some means of running the [Colony Network contracts](https://github.com/JoinColony/colonyNetwork) locally. The recommended commit to clone is currently [`ce9811a`](https://github.com/JoinColony/colonyNetwork/commit/ce9811a9f0fca53d9ab417d5fc24bbcf29c351c8). See our guide to [running the Colony Network contracts](/colonynetwork/docs-get-started/).
* Next, you will need some means of loading the contract definitions into your app. This is easy to do with [TrufflePig](https://github.com/JoinColony/trufflepig). See our guide to [starting TrufflePig](/colonynetwork/docs-get-started/#install-and-configure-a-contract-loader-like-trufflepig).
* It's also beneficial to have a JavaScript environment that supports `async`/`await`, since colonyJS uses Promises extensively. Recent versions of Node and Chrome support Promises out of the box, but you may want to consider using [webpack](https://webpack.js.org/) and [Babel](https://babeljs.io/) for better support.

## Installing prerequisites for your app

This command will add a number of packages to help get you started with colonyJS.

* `@colony/colony-js-client` – The Colony Network client itself
* `@colony/colony-js-adapter-ethers` – An Ethereum client [adapter](/colonyjs/docs-adapters/)
* `@colony/colony-js-contract-loader-http` – An Ethereum contract definition [loader](/colonyjs/docs-loaders/)
* `ethers` – [Complete Ethereum wallet implementation and library](https://github.com/ethers-io/ethers.js/)

To install these with `yarn`, run:

```
yarn add @colony/colony-js-client @colony/colony-js-adapter-ethers @colony/colony-js-contract-loader-http ethers
```

Or with `npm`, run:

```
npm install --save @colony/colony-js-client @colony/colony-js-adapter-ethers @colony/colony-js-contract-loader-http ethers
```

## Example code

```js
(async () => {
  const DEFAULT_GANACHE_HOST = 'http://localhost:8545/';

  // Get the first account's private key from Trufflepig
  const { privateKey } = await loader.getAccount(0);

  // Create a provider and wallet with ethers
  const provider = new providers.JsonRpcProvider(DEFAULT_GANACHE_HOST);
  const wallet = new Wallet(privateKey, provider);

  // Create an adapter (powered by ethers)
  const adapter = new EthersAdapter({
    loader,
    provider,
    wallet,
  });

  // Connect to ColonyNetwork!
  const networkClient = new ColonyNetworkClient({ adapter });
  await networkClient.init();

  // Log networkClient in the console so we can poke around
  console.log(networkClient);

  // Get an instance of the Meta Colony!
  const metaColonyClient = await networkClient.getMetaColonyClient();

  // Log metaColonyClient in the console so we can poke around
  console.log(metaColonyClient);

  // Create a new Token contract
  const tokenAddress = await networkClient.createToken({
    name: 'CoolonyToken',
    symbol: 'COOL',
  });
  console.log(`CoolonyToken contract address: ${tokenAddress}`);

  // Create a cool Colony! (with a unique name)
  const { eventData: { colonyId, colonyAddress } } = await networkClient.createColony.send({
    name: `Coolony-${Date.now()}`,
    tokenAddress,
  });

  // Congrats, you've created a Colony!
  console.log(`Colony created with ID: ${colonyId} at address: ${colonyAddress}`);

  // We can now connect to our Colony
  const colonyClient = await networkClient.getColonyClient(colonyId);

  // Log colonyClient in the console so we can poke around
  console.log(colonyClient);
})();
```
