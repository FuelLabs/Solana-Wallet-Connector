import { ConnectorMetadata, FuelConnector } from "@fuel-wallet/sdk";
import { Provider } from "fuels";
import { Connection, clusterApiUrl, Cluster } from "@solana/web3.js";

import { predicates } from "./predicateResources";

type SolanaWalletConnectorConfig = {
    fuelProvider?: Provider | string;
    solanaProvider?: Connection | Cluster;
}

export class SolanaWalletConnector extends FuelConnector {
    solanaProvider: Connection | null = null;
    fuelProvider: Provider | null = null;
    private predicate: { abi: any; bytecode: Uint8Array };
    private setupLock: boolean = false;
    private _currentAccount: string | null = null;
    private config: Required<SolanaWalletConnectorConfig>;

    // metadata placeholder
    metadata: ConnectorMetadata = {
        image: "",
        install: {
            action: 'Install',
            description: 'Install a solana wallet to connect to Fuel',
            link: "https://solana.com/ecosystem/explore?categories=wallet"
        }
    };

    constructor(config: SolanaWalletConnectorConfig = {}) {
        super();
        this.name = "Solana wallet connector";
        this.predicate = predicates['verification-predicate'];
        this.installed = true;
        this.config = Object.assign(config, {
            fuelProvider: 'https://beta-5.fuel.network/graphql',
            solanaProvider: 'mainnet-beta'
        });
    }

    /**
     * Application communication methods
     */

    async getProviders() {
        if (!this.fuelProvider || !this.solanaProvider) {
            if (typeof window !== undefined) {
                if (this.config.solanaProvider instanceof Connection) {
                    this.solanaProvider = this.config.solanaProvider;
                } else {
                    this.solanaProvider = new Connection(clusterApiUrl(this.config.solanaProvider));
                }
                if (!this.solanaProvider) {
                    throw new Error("Solana provider not found");
                }

                if (typeof this.config.fuelProvider === 'string') {
                    this.fuelProvider = await Provider.create(this.config.fuelProvider);
                } else {
                    this.fuelProvider = this.config.fuelProvider;
                }

                if (!this.fuelProvider) {
                    throw new Error("Fuel provider not found");
                }
            } else {
                throw new Error('window.solana not found');
            }
        }

        return { fuelProvider: this.fuelProvider, solanaProvider: this.solanaProvider };
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
        this.emit('currentAccount', currentAccount);
    }

    async setupEventBridge() {
        const { solanaProvider } = await this.getProviders();
        solanaProvider.on('accountsChanges', async (accounts) => {
            this.emit('accounts', await this.accounts());
            if (this._currentAccount !== accounts[0]) {
                await this.setupCurrentAccount();
            }
        });
        solanaProvider.on('connect', async (arg) => {
            this.emit('connection', await this.isConnected());
        });
        solanaProvider.on('disconnect', async (arg) => {
            this.emit('connection', await this.isConnected());
        });
    }
}
