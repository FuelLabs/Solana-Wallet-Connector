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
  Script,
  Account,
  ScriptTransactionRequest,
  ScriptRequest,
  Interface,
  ReceiptType,
  Signer,
  TransactionResultReceipt,
  ReceiptLogData,
  bn,
  BaseAssetId,
  Wallet,
} from 'fuels';
import memoize from 'memoizee';

import { predicates } from './predicateResources';
import { scripts } from './scriptResources';
import { Keypair, PublicKey } from '@solana/web3.js';
import * as uint8arraytools from 'uint8array-tools';
import nacl from 'tweetnacl';
import { decodeBase64, decodeUTF8 } from 'tweetnacl-util';
import base58 from 'bs58';

type SolanaWalletConnectorConfig = {
  fuelProvider?: Provider | string;
  solanaProvider?: any;
};

export class OkxSolanaWalletConnector extends FuelConnector {
  solanaProvider: any | null = null;
  fuelProvider: Provider | null = null;
  //private predicate: { abi: any; bytecode: Uint8Array };
  private predicate: { abi: any; bytecode: string };
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
    //this.predicate = predicates['verification-predicate'];
    this.predicate = scripts['verification-script'];
    this.installed = true;
    this.config = Object.assign(config, {
      fuelProvider: 'https://beta-5.fuel.network/graphql',
      solanaProvider: (window as any).okxwallet?.solana,
    });
    console.log(`window`, (window as any).okxwallet?.solana);
  }

  /**
   * Application communication methods
   */

  async getProviders() {
    if (!this.fuelProvider || !this.solanaProvider) {
      if (typeof window !== undefined) {
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
        throw new Error('window.okxwallet.solana not found');
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
    const [currentAccount = null] = await this.accounts();
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

  async signMessage(address: string, message: string): Promise<string> {
    throw new Error('A predicate account cannot sign messages');
  }

  // async sendTransaction(
  //   address: string,
  //   transaction: TransactionRequestLike
  // ): Promise<string> {
  //   if (!(await this.isConnected())) {
  //     throw new Error('No connected accounts');
  //   }

  //   const { solanaProvider, fuelProvider } = await this.getProviders();
  //   const chainId = fuelProvider.getChainId();
  //   const account = await this.getPredicateFromAddress(address);
  //   if (!account) {
  //     throw new Error(`No account found for ${address}`);
  //   }
  //   const transactionRequest = transactionRequestify(transaction);

  //   // Create a predicate and set the witness index to call in the predicate
  //   const predicate = createPredicate(
  //     account.solanaAccount,
  //     fuelProvider,
  //     this.predicate.bytecode,
  //     this.predicate.abi
  //   );
  //   predicate.connect(fuelProvider);
  //   console.log(`transactionRequest.witnesses.length`, transactionRequest.witnesses.length);
  //   //predicate.setData(transactionRequest.witnesses.length);
  //   predicate.setData(0);

  //   // Attach missing inputs (including estimated predicate gas usage) / outputs to the request
  //   //await predicate.provider.estimateTxDependencies(transactionRequest);
  //   // const resources = await predicate.getResourcesToSpend([{ amount: 1, assetId: BaseAssetId }]);
  //   // transactionRequest.addPredicateResources(resources, predicate);
  //   const reqClone = structuredClone(transactionRequest);
  //   console.log(`transactionRequest`, reqClone);
  //   console.log("pred addr", Address.fromString("fuel187g6jy2zzyemaqx2gfxcw5hyut3czk8vswurk98ux2jukue6wywskqxxxq").toHexString());

  //   // To each input of the request, attach the predicate and its data
  //   const requestWithPredicateAttached =
  //     predicate.populateTransactionPredicateData(transactionRequest);

  //   const txId = requestWithPredicateAttached.getTransactionId(chainId);
  //   console.log(`txId`, txId);
  //   const encodedMessage = new TextEncoder().encode(txId);
  //   const signedMessage = await solanaProvider.signMessage(encodedMessage);
  //   const signature = `0x${uint8arraytools.toHex(signedMessage.signature)}`;
  //   console.log(`signature`, signature);

  //   // We have a witness, attach it to the transaction for inspection / recovery via the predicate
  //   // TODO: is below comment still relevant?
  //   // TODO: note that there is a strange witness before we add out compact signature
  //   //       it is [ 0x ] and we may need to update versions later if / when this is fixed
  //   //transactionRequest.witnesses.push(signature);
  //   transactionRequest.updateWitness(0, signature);

  //   const transactionWithPredicateEstimated =
  //     await fuelProvider.estimatePredicates(requestWithPredicateAttached);

  //   console.log("obj", transactionWithPredicateEstimated)
  //   console.log(`transactionWithPredicatesEstimated.toTransactionBytes()`, transactionWithPredicateEstimated.toTransactionBytes());
  //   console.log(`transactionWithPredicatesEstimated.toTransactionBytes()`, hexlify(transactionWithPredicateEstimated.toTransactionBytes()));
  //   const newClone = structuredClone(transactionRequest);
  //   console.log(`newClone`, newClone);
  //   const response = await predicate.sendTransaction(transactionRequest);
  //   // const temp  = await fuelProvider.simulate(transactionWithPredicateEstimated);
  //   // console.log(`temp`, temp);
  //   // const response = await fuelProvider.operations.submit({
  //   //   encodedTransaction: hexlify(
  //   //     transactionWithPredicateEstimated.toTransactionBytes()
  //   //   ),
  //   // });
  //   console.log("done")

  //   return response.id;
  //   //return response.submit.id;
  // }

  async sendTransaction(
    address: string,
    transaction: TransactionRequestLike
  ): Promise<string> {
    if (!(await this.isConnected())) {
      throw new Error('No connected accounts');
    }

    const { solanaProvider, fuelProvider } = await this.getProviders();
    const account = await this.getPredicateFromAddress(address);
    if (!account) {
      throw new Error(`No account found for ${address}`);
    }
    const transactionRequest = transactionRequestify(transaction);

    const accountFund = Wallet.fromPrivateKey(
      '0x80acb3fa5b95638671fe39747571ccd82f971da8bd26545542edb81c53848552',
      fuelProvider
    );
    const script = new Script(
      this.predicate.bytecode,
      this.predicate.abi,
      accountFund
    );
    await script.provider.estimateTxDependencies(transactionRequest);
    console.log(`account.solanaAccount`, account.solanaAccount);
    script.setConfigurableConstants({ SIGNER: account.solanaAccount });
    //const tx = script.functions.main(transactionRequest.witnesses.length);
    const tx = script.functions.main(1);
    tx.txParams({ gasLimit: 100_000, gasPrice: 1 });
    let txRequest = await tx.getTransactionRequest();
    const chainId = await fuelProvider.getChainId();
    const txId = await tx.getTransactionId(chainId);

    await accountFund.fund(
      txRequest,
      [{ amount: bn(1), assetId: BaseAssetId }],
      bn(500)
    );

    const txID2 = await txRequest.getTransactionId(chainId);
    const txId2Clone1 = structuredClone(txID2);
    console.log(`txID2`, txId2Clone1);
    const u8TxId = arrayify(txID2);
    console.log(`arrayify(txID2)`, u8TxId);
    const test = nacl.sign.detached(
      u8TxId,
      base58.decode(
        'gvigzt9FYbKr3Y83LXPqLQaUQTecJj7ojhpawvfifiHutES51SHvLbkXfUFb6sBdgQDD5W1YH8ycqLhEVx5fWVQ'
      )
    );
    console.log(`test`, test);
    console.log(`solanaProvider.signMessage`, solanaProvider.signMessage);
    const signedMessagetemp = await solanaProvider.signMessage(u8TxId);
    console.log(`signedMessagetemp`, signedMessagetemp.signature);
    const signedMessage = await solanaProvider.signMessage(
      u8TxId,
      'hexadecimal'
    );
    console.log(`signedMessage.signature`, signedMessage.signature);
    const signature = hexlify(signedMessage.signature);
    console.log(`signature`, signature);
    txRequest.witnesses.push(signature);

    await accountFund.populateTransactionWitnessesSignature(txRequest);

    const response = await fuelProvider.operations.dryRun({
      encodedTransaction: hexlify(txRequest.toTransactionBytes()),
    });
    console.log(`response`, response);
    const response2 = await fuelProvider.sendTransaction(txRequest);
    const res = await response2.waitForResult();
    console.log(`response2`, res);

    console.log('done');
    return res.id!;
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

export const getPredicateAddress = memoize(
  (
    solanaAddress: string,
    predicateBytecode: BytesLike,
    predicateAbi: JsonAbi
  ): string => {
    console.log(`solanaAddress`, solanaAddress);
    const configurable = {
      SIGNER: solanaAddress,
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

const solanaPublicKeyToHex = (publicKey: PublicKey) => {
  return hexlify(publicKey.toBytes());
};
