import { ReactNode } from "react"
import { QueryClientProvider, QueryClient } from "react-query";
import { FuelProvider } from "@fuels/react";
import { SolanaWalletConnector } from '@fuels/wallet-connector-solana';

type ProvidersProps = {
    children?: ReactNode;
};

// TODO: add toast for errors?
export const queryClient = new QueryClient()

export const Providers = ({ children }: ProvidersProps) => {
    return (
        <QueryClientProvider client={queryClient}>
            <FuelProvider
                fuelConfig={{ devMode: true, connectors: [new SolanaWalletConnector()] }}
            >
                {children}
            </FuelProvider>
        </QueryClientProvider>
    );
}
