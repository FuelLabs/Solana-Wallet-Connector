import { useWallet } from '@fuels/react';
import { useMutation } from 'react-query';
import { queryClient } from '../components/Providers';
import { COUNTER_CONTRACT_ID, DEMO_QUERY_KEYS } from '../config';
import { CounterContractAbi__factory } from '../contracts';

export const useIncrement = (incrementerAddress: string) => {
  const { wallet } = useWallet(incrementerAddress);

  const mutation = useMutation(
    async () => {
      if (!wallet) throw new Error(`Cannot increment if wallet is ${wallet}`);

      const contract = CounterContractAbi__factory.connect(
        COUNTER_CONTRACT_ID,
        wallet
      );
      await contract.functions
        .increment()
        .txParams({ gasPrice: 1, gasLimit: 100_000 })
        .call();
    },
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries(DEMO_QUERY_KEYS.count);
      },
      onError: async (error: any) => {
        await queryClient.invalidateQueries(DEMO_QUERY_KEYS.count);
        console.error(error);
      },
    }
  );

  return mutation;
};
