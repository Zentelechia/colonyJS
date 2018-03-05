/* @flow */

import type BigNumber from 'bn.js';
import type { IAdapter } from '@colony/colony-js-adapter';
import ContractClient from '@colony/colony-js-contract-client';

import type { ColonyNetworkContract } from '../interface/ColonyNetworkContract';
import ColonyClient from '../ColonyClient/index';

type CallOptions = { timeoutMs: number };

export default class ColonyNetworkClient extends ContractClient<
  ColonyNetworkContract,
> {
  contract: ColonyNetworkContract;
  getColonyById: ColonyNetworkClient.Caller<
    { id: number },
    { address: string },
    ColonyNetworkClient,
  >;
  getColonyByKey: ColonyNetworkClient.Caller<
    { key: string },
    { address: string },
    ColonyNetworkClient,
  >;
  getColonyCount: ColonyNetworkClient.Caller<
    null,
    { count: number },
    ColonyNetworkClient,
  >;
  getColonyVersionResolver: ColonyNetworkClient.Caller<
    { version: number },
    { address: string },
    ColonyNetworkClient,
  >;
  getCurrentColonyVersion: ColonyNetworkClient.Caller<
    null,
    { version: number },
    ColonyNetworkClient,
  >;
  getParentSkillId: ColonyNetworkClient.Caller<
    { skillId: number, parentSkillIndex: number },
    { parentSkillId: number },
    ColonyNetworkClient,
  >;
  getReputationUpdateLogEntry: ColonyNetworkClient.Caller<
    { id: number },
    {
      amount: number,
      colony: string,
      nPreviousUpdates: number,
      nUpdates: number,
      skillId: number,
      user: string,
    },
    ColonyNetworkClient,
  >;
  getReputationUpdateLogLength: ColonyNetworkClient.Caller<
    null,
    { count: number },
    ColonyNetworkClient,
  >;
  getSkill: ColonyNetworkClient.Caller<
    { id: number },
    { nParents: number, nChildren: number },
    ColonyNetworkClient,
  >;
  getSkillCount: ColonyNetworkClient.Caller<
    null,
    { count: number },
    ColonyNetworkClient,
  >;
  createColony: ColonyNetworkClient.Sender<
    {
      name: string,
      tokenName: string,
      tokenSymbol: string,
      tokenDecimals: number,
    },
    { colonyId: number },
    ColonyNetworkClient,
  >;
  deposit: ColonyNetworkClient.Sender<
    { amount: number },
    null,
    ColonyNetworkClient,
  >;
  upgradeColony: ColonyNetworkClient.Sender<
    {
      key: string,
      newVersion: number,
    },
    null,
    ColonyNetworkClient,
  >;
  withdraw: ColonyNetworkClient.Sender<
    { amount: number },
    null,
    ColonyNetworkClient,
  >;
  static async createSelf(
    adapter: IAdapter<ColonyNetworkContract>,
  ): Promise<ColonyNetworkClient> {
    return this.create(adapter, 'IColonyNetwork', { router: 'EtherRouter' });
  }
  static get ColonyClient(): * {
    return ColonyClient;
  }
  get callerDefs(): * {
    return {
      getColonyById: {
        call: this.contract.functions.getColonyAt,
        params: [['id', 'int']],
        returnValues: [['address', 'address']],
      },
      getColonyByKey: {
        call: this.contract.functions.getColony,
        params: [['key', 'string']],
        returnValues: [['address', 'address']],
      },
      getColonyCount: {
        call: this.contract.functions.getColonyCount,
        returnValues: [['address', 'address']],
      },
      getColonyVersionResolver: {
        call: this.contract.functions.getColonyVersionResolver,
        params: [['version', 'number']],
        returnValues: [['address', 'address']],
      },
      getCurrentColonyVersion: {
        call: this.contract.functions.getCurrentColonyVersion,
        returnValues: [['version', 'number']],
      },
      getParentSkillId: {
        call: this.contract.functions.getParentSkillId,
        params: [['skillId', 'int']],
        returnValues: [['parentSkillIndex', 'number']],
      },
      getReputationUpdateLogEntry: {
        call: this.contract.functions.getReputationUpdateLogEntry,
        params: [['id', 'int']],
        returnValues: [
          ['user', 'string'],
          ['amount', 'number'],
          ['skillId', 'number'],
          ['colony', 'string'],
          ['nUpdates', 'number'],
          ['nPreviousUpdates', 'number'],
        ],
      },
      getReputationUpdateLogLength: {
        call: this.contract.functions.getReputationUpdateLogLength,
        returnValues: [['count', 'number']],
      },
      getSkill: {
        call: this.contract.functions.getSkill,
        params: [['id', 'int']],
        returnValues: [['nParents', 'number'], ['nChildren', 'number']],
      },
      getSkillCount: {
        call: this.contract.functions.getSkillCount,
        returnValues: [['count', 'number']],
      },
    };
  }
  get senderDefs(): * {
    return {
      createColony: {
        send: this.contract.functions.createColony,
        estimate: this.contract.estimate.createColony,
        params: [
          ['name', 'string'],
          ['tokenName', 'string'],
          ['tokenSymbol', 'string'],
          ['tokenDecimals', 'int'],
        ],
        eventHandlers: {
          success: {
            ColonyAdded({ id }: { id: BigNumber }) {
              return {
                colonyId: id.toNumber(),
              };
            },
          },
        },
      },
      deposit: {
        send: this.contract.functions.deposit,
        estimate: this.contract.estimate.deposit,
        params: [['amount', 'number']],
      },
      upgradeColony: {
        send: this.contract.functions.upgradeColony,
        estimate: this.contract.estimate.upgradeColony,
        params: [['key', 'string'], ['newVersion', 'int']],
      },
      withdraw: {
        send: this.contract.functions.withdraw,
        estimate: this.contract.estimate.withdraw,
        params: [['amount', 'number']],
      },
    };
  }
  async getColonyClientByAddress(address: string): Promise<*> {
    return this.constructor.ColonyClient.createSelf(this.adapter, this, {
      address,
    });
  }
  async getColonyClient(
    {
      key,
      id,
    }: {
      key?: string,
      id?: number,
    },
    callOptions: CallOptions,
  ): Promise<*> {
    const address = await this.getColonyAddress({ key, id }, callOptions);
    return this.getColonyClientByAddress(address);
  }
  async getColonyAddress(
    {
      key,
      id,
    }: {
      key?: string,
      id?: number,
    },
    callOptions?: CallOptions,
  ): Promise<string> {
    let address;
    if (key) {
      ({ address } = await this.getColonyByKey.call({ key }, callOptions));
    } else if (id) {
      ({ address } = await this.getColonyById.call({ id }, callOptions));
    }
    if (!address)
      throw new Error(
        `Colony with ${
          key ? `key ${key}` : `id ${id || 'unknown'}`
        } could not be found`,
      );
    return address;
  }
}
