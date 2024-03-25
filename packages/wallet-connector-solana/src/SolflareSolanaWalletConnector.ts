/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import type {
  Asset,
  ConnectorMetadata,
  Network,
  Version,
} from '@fuel-wallet/sdk';
import { FuelConnector } from '@fuel-wallet/sdk';
import type { PublicKey } from '@solana/web3.js';
import Solflare from '@solflare-wallet/sdk';
import type { JsonAbi, TransactionRequestLike, AbiMap } from 'fuels';
import { Provider, arrayify, hexlify, transactionRequestify } from 'fuels';

import { SolflareIcon } from './SolflareIcon';
import { predicates } from './resources';
import {
  getPredicateAddress,
  createPredicate,
  solanaPublicKeyToHex,
} from './utils';

type SolanaWalletConnectorConfig = {
  fuelProvider?: Provider | string;
  solanaProvider?: any;
};

export class SolflareSolanaWalletConnector extends FuelConnector {
  solanaProvider: any | null = null;
  fuelProvider: Provider | null = null;
  private predicate: { abi: any; bytecode: Uint8Array };
  private setupLock: boolean = false;
  private _currentAccount: string | null = null;
  private config: Required<SolanaWalletConnectorConfig>;

  // metadata placeholder
  metadata: ConnectorMetadata = {
    image: SolflareIcon,
    install: {
      action: 'Install',
      description: 'Install a solana wallet to connect to Fuel',
      link: 'https://solana.com/ecosystem/solflare?categories=wallet&nextInternalLocale=en',
    },
  };

  constructor(config: SolanaWalletConnectorConfig = {}) {
    super();
    this.name = 'Solana wallet connector';
    this.predicate = predicates['verification-predicate'];
    this.installed = true;
    this.config = Object.assign(config, {
      fuelProvider: 'https://beta-5.fuel.network/graphql',
      solanaProvider: new Solflare(),
    });
  }

  /**
   * Application communication methods
   */

  async getProviders() {
    if (!this.fuelProvider || !this.solanaProvider) {
      if (typeof window !== 'undefined') {
        this.solanaProvider = this.config.solanaProvider;
        if (!this.solanaProvider) {
          throw new Error('Solana provider not found');
        }

        if (typeof this.config.fuelProvider === 'string') {
          this.fuelProvider = await Provider.create(this.config.fuelProvider);
        } else {
          this.fuelProvider = this.config.fuelProvider;
        }
        if (!this.fuelProvider) {
          throw new Error('Fuel provider not found');
        }
      } else {
        throw new Error('Solflare not found');
      }
    }

    return {
      fuelProvider: this.fuelProvider,
      solanaProvider: this.solanaProvider,
    };
  }

  async setup() {
    if (this.setupLock) return;
    this.setupLock = true;
    await this.setupEventBridge();
    await this.setupCurrentAccount();
  }

  async setupCurrentAccount() {
    //const { solanaProvider } = await this.getProviders();
    //const isWalletDetected = await solanaProvider.detectWallet();
    // if (isWalletDetected) {
    //   await this.connect();
    // }
    const [currentAccount = null] = await this.accounts();
    console.log(`currentAccount`, currentAccount);
    this._currentAccount = currentAccount;
  }

  async setupEventBridge() {
    const { solanaProvider } = await this.getProviders();
    solanaProvider.on('accountChanged', async (account: string | null) => {
      this.emit('accounts', await this.accounts());
      if (this._currentAccount !== account) {
        await this.setupCurrentAccount();
      }
    });
    solanaProvider.on('connect', async () => {
      this.emit('connection', await this.isConnected());
    });
    solanaProvider.on('disconnect', async () => {
      this.emit('connection', await this.isConnected());
    });
  }

  /**
   * Connector methods
   */

  async ping() {
    await this.getProviders();
    await this.setup();
    return true;
  }

  async version(): Promise<Version> {
    return { app: '0.0.0', network: '0.0.0' };
  }

  async isConnected() {
    const accounts = await this.accounts();
    return accounts.length > 0;
  }

  // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  // TODO: this only ever returns an array w/ a single account
  // I do not know how to fetch all accounts from Phantom
  // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  async accounts() {
    const accounts = await this.getPredicateAccounts();
    return accounts.map((account) => account.predicateAccount);
  }

  async connect() {
    if (!(await this.isConnected())) {
      const { solanaProvider } = await this.getProviders();
      await solanaProvider.connect();
    }
    this.connected = true;
    return true;
  }

  async disconnect() {
    if (await this.isConnected()) {
      const { solanaProvider } = await this.getProviders();
      await solanaProvider.disconnect();
    }
    this.connected = false;
    return false;
  }

  async signMessage(_0: string, _1: string): Promise<string> {
    throw new Error('A predicate account cannot sign messages');
  }

  async sendTransaction(
    address: string,
    transaction: TransactionRequestLike
  ): Promise<string> {
    if (!(await this.isConnected())) {
      throw new Error('No connected accounts');
    }

    const { solanaProvider, fuelProvider } = await this.getProviders();
    const chainId = fuelProvider.getChainId();
    const account = await this.getPredicateFromAddress(address);
    if (!account) {
      throw new Error(`No account found for ${address}`);
    }
    const transactionRequest = transactionRequestify(transaction);

    // Create a predicate and set the witness index to call in the predicate
    const predicate = createPredicate(
      account.solanaAccount,
      fuelProvider,
      this.predicate.bytecode,
      this.predicate.abi
    );
    predicate.connect(fuelProvider);
    predicate.setData(transactionRequest.witnesses.length);

    // To each input of the request, attach the predicate and its data
    const requestWithPredicateAttached =
      predicate.populateTransactionPredicateData(transactionRequest);

    const txId = requestWithPredicateAttached.getTransactionId(chainId);
    const u8TxId = arrayify(txId);
    const signedMessage = await solanaProvider.signMessage(u8TxId, 'hex');
    const signature = hexlify(signedMessage);

    // We have a witness, attach it to the transaction for inspection / recovery via the predicate
    // TODO: is below comment still relevant?
    // TODO: note that there is a strange witness before we add out compact signature
    //       it is [ 0x ] and we may need to update versions later if / when this is fixed
    transactionRequest.witnesses.push(signature);

    const response = await predicate.sendTransaction(transactionRequest);

    return response.id;
  }

  async currentAccount(): Promise<string | null> {
    if (!(await this.isConnected())) {
      throw Error('No connected accounts');
    }

    const { solanaProvider } = await this.getProviders();
    const solanaAccount = solanaPublicKeyToHex(
      solanaProvider.publicKey as PublicKey
    );

    const fuelAccount = getPredicateAddress(
      solanaAccount,
      this.predicate.bytecode,
      this.predicate.abi
    );

    return fuelAccount;
  }

  async addAssets(_: Asset[]): Promise<boolean> {
    console.warn('A predicate account cannot add assets');
    return false;
  }

  async addAsset(_: Asset): Promise<boolean> {
    console.warn('A predicate accout cannot add an asset');
    return false;
  }

  async addNetwork(_: string): Promise<boolean> {
    console.warn('A predicate account cannot ad a network');
    return false;
  }

  async selectNetwork(_: Network): Promise<boolean> {
    // TODO: allow selecting networks once mainnet is released?
    console.warn('A predicate account cannot select a network');
    return false;
  }

  async networks(): Promise<Network[]> {
    return [await this.currentNetwork()];
  }

  async currentNetwork(): Promise<Network> {
    const { fuelProvider } = await this.getProviders();
    const chainId = fuelProvider.getChainId();
    return { url: fuelProvider.url, chainId: chainId };
  }

  async addAbi(_: AbiMap): Promise<boolean> {
    console.warn('Cannot add an ABI to a predicate account');
    return false;
  }

  async getAbi(_: string): Promise<JsonAbi> {
    throw Error('Cannot get contractId ABI for a predicate');
  }

  async hasAbi(_: string): Promise<boolean> {
    console.warn('A predicate account cannot have an ABI');
    return false;
  }

  private async getPredicateFromAddress(address: string) {
    const accounts = await this.getPredicateAccounts();
    return accounts.find((account) => account.predicateAccount === address);
  }

  private async getPredicateAccounts(): Promise<
    Array<{
      solanaAccount: string;
      predicateAccount: string;
    }>
  > {
    const { solanaProvider } = await this.getProviders();
    const solanaAccounts: Array<string> = solanaProvider.publicKey
      ? [solanaPublicKeyToHex(solanaProvider.publicKey as PublicKey)]
      : [];
    const accounts = solanaAccounts.map((account) => ({
      solanaAccount: account,
      predicateAccount: getPredicateAddress(
        account,
        this.predicate.bytecode,
        this.predicate.abi
      ),
    }));
    return accounts;
  }
}
