import { ReactNode } from 'react';
import { QueryClientProvider, QueryClient } from 'react-query';
import { FuelProvider } from '@fuels/react';
//import { OkxSolanaWalletConnector } from '@fuels/wallet-connector-solana';
//import { SolanaWalletConnector } from '@fuels/wallet-connector-solana';
import { SolflareSolanaWalletConnector } from '@fuels/wallet-connector-solana';

type ProvidersProps = {
  children?: ReactNode;
};

// TODO: add toast for errors?
export const queryClient = new QueryClient();

export const Providers = ({ children }: ProvidersProps) => {
  return (
    <FuelProvider
      fuelConfig={{
        devMode: true,
        connectors: [new SolflareSolanaWalletConnector()],
      }}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </FuelProvider>
  );
};
