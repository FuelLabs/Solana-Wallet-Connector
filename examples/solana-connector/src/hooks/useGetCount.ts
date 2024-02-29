import { useQuery } from 'react-query';
import { COUNTER_CONTRACT_ID, DEMO_QUERY_KEYS } from '../config';
import { CounterContractAbi__factory } from '../contracts';
import { useWallet } from '@fuels/react';

export const useGetCount = () => {
  const { wallet, isLoading, isError } = useWallet();

  const query = useQuery(
    [DEMO_QUERY_KEYS.count],
    async () => {
      const counterContract = CounterContractAbi__factory.connect(
        COUNTER_CONTRACT_ID,
        wallet!
      );
      const { value: count } = await counterContract.functions
        .count()
        .txParams({
          gasPrice: 1,
          gasLimit: 100_000,
        })
        .simulate();

      return count;
    },
    {
      enabled: !!wallet && !isLoading && !isError,
    }
  );

  return { ...query, count: query.data };
};
