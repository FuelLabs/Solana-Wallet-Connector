import {
  Asset,
  ConnectorMetadata,
  FuelConnector,
  Network,
  Version,
} from '@fuel-wallet/sdk';
import {
  Address,
  BytesLike,
  InputValue,
  JsonAbi,
  Predicate,
  Provider,
  TransactionRequestLike,
  arrayify,
  hexlify,
  transactionRequestify,
  AbiMap,
  getPredicateRoot,
} from 'fuels';
import memoize from 'memoizee';

import { predicates } from './predicateResources';
import { PublicKey } from '@solana/web3.js';
import * as uint8arraytools from 'uint8array-tools';

type SolanaWalletConnectorConfig = {
  fuelProvider?: Provider | string;
  solanaProvider?: any;
};

export class SolanaWalletConnector extends FuelConnector {
  solanaProvider: any | null = null;
  fuelProvider: Provider | null = null;
  private predicate: { abi: any; bytecode: Uint8Array };
  private setupLock: boolean = false;
  private _currentAccount: string | null = null;
  private config: Required<SolanaWalletConnectorConfig>;

  // metadata placeholder
  metadata: ConnectorMetadata = {
    image: '', // TODO: add image of Solana or Phantom
    install: {
      action: 'Install',
      description: 'Install a solana wallet to connect to Fuel',
      link: 'https://solana.com/ecosystem/explore?categories=wallet',
    },
  };

  constructor(config: SolanaWalletConnectorConfig = {}) {
    super();
    this.name = 'Solana wallet connector';
    this.predicate = predicates['verification-predicate'];
    this.installed = true;
    this.config = Object.assign(config, {
      fuelProvider: 'https://beta-5.fuel.network/graphql',
      solanaProvider: (window as any).phantom?.solana,
    });
  }

  /**
   * Application communication methods
   */

  async getProviders() {
    if (!this.fuelProvider || !this.solanaProvider) {
      if (typeof window !== undefined) {
        this.solanaProvider = this.config.solanaProvider;
        if (!this.solanaProvider?.isPhantom) {
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
        throw new Error('window.phantom.solana not found');
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
    await this.setupCurrentAccount();
    await this.setupEventBridge();
  }

  async setupCurrentAccount() {
    const { solanaProvider } = await this.getProviders();
    // This is needed to maintain connection between page refreshes
    try {
      // Throws an error if the user has not connected yet
      await solanaProvider.connect({ onlyIfTrusted: true });
    } catch (_) {}
    const [currentAccount = null] = await this.accounts();
    this._currentAccount = currentAccount;
    this.emit('currentAccount', currentAccount);
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

  async signMessage(address: string, message: string): Promise<string> {
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

    // Attach missing inputs (including estimated predicate gas usage) / outputs to the request
    await predicate.provider.estimateTxDependencies(transactionRequest);

    // To each input of the request, attach the predicate and its data
    const requestWithPredicateAttached =
      predicate.populateTransactionPredicateData(transactionRequest);

    const txId = requestWithPredicateAttached.getTransactionId(chainId);
    const signature = await solanaProvider.signMessage(txId);

    // We have a witness, attach it to the transaction for inspection / recovery via the predicate
    // TODO: is below comment still relevant?
    // TODO: note that there is a strange witness before we add out compact signature
    //       it is [ 0x ] and we may need to update versions later if / when this is fixed
    transactionRequest.witnesses.push(signature);

    const transactionWithPredicateEstimated =
      await fuelProvider.estimatePredicates(requestWithPredicateAttached);

    const response = await fuelProvider.operations.submit({
      encodedTransaction: hexlify(
        transactionWithPredicateEstimated.toTransactionBytes()
      ),
    });

    return response.submit.id;
  }

  async currentAccount(): Promise<string | null> {
    if (!(await this.isConnected())) {
      throw Error('No connected accounts');
    }

    const { solanaProvider } = await this.getProviders();
    const solanaAccount = solanaProvider.publicKey;

    const fuelAccount = getPredicateAddress(
      solanaAccount,
      this.predicate.bytecode,
      this.predicate.abi
    );

    return fuelAccount;
  }

  async addAssets(assets: Asset[]): Promise<boolean> {
    console.warn('A predicate account cannot add assets');
    return false;
  }

  async addAsset(asset: Asset): Promise<boolean> {
    console.warn('A predicate accout cannot add an asset');
    return false;
  }

  async addNetwork(networkUrl: string): Promise<boolean> {
    console.warn('A predicate account cannot ad a network');
    return false;
  }

  async selectNetwork(network: Network): Promise<boolean> {
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

  async addAbi(abiMap: AbiMap): Promise<boolean> {
    console.warn('Cannot add an ABI to a predicate account');
    return false;
  }

  async getAbi(contractId: string): Promise<JsonAbi> {
    throw Error('Cannot get contractId ABI for a predicate');
  }

  async hasAbi(contractId: string): Promise<boolean> {
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
      ? [
          uint8arraytools.toHex(
            (solanaProvider.publicKey as PublicKey).toBytes()
          ),
        ]
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

export const getPredicateAddress = memoize(
  (
    solanaAddress: string,
    predicateBytecode: BytesLike,
    predicateAbi: JsonAbi
  ): string => {
    const configurable = {
      SIGNER: `0x${solanaAddress}`,
    };

    // @ts-ignore
    const { predicateBytes } = Predicate.processPredicateData(
      predicateBytecode,
      predicateAbi,
      configurable
    );
    const address = Address.fromB256(getPredicateRoot(predicateBytes));
    return address.toString();
  }
);

export const createPredicate = memoize(
  (
    solanaAddress: string,
    provider: Provider,
    predicateBytecode: BytesLike,
    predicateAbi: JsonAbi
  ): Predicate<InputValue[]> => {
    const configurable = {
      SIGNER: solanaAddress,
    };

    const predicate = new Predicate(
      arrayify(predicateBytecode),
      provider,
      predicateAbi,
      configurable
    );

    return predicate;
  }
);
