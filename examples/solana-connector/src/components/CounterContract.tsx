import { useBalance, useWallet } from '@fuels/react';
import { useEffect, useState } from 'react';
import { CounterContractAbi__factory } from '../contracts';
import { COUNTER_CONTRACT_ID } from '../config';

export const ContractCounter = () => {
  const { wallet } = useWallet();
  const { balance } = useBalance({
    address: wallet?.address.toString(),
  });
  const [counter, setCounter] = useState(0);
  const shouldShouwCounter = wallet && balance?.gt(0);

  useEffect(() => {
    if (!shouldShouwCounter) return;
    getCount();
    // const interval = setInterval(() => getCount(), 5000);
    // return () => clearInterval(interval);
  }, [shouldShouwCounter]);

  const getCount = async () => {
    if (wallet) {
      const counterContract = CounterContractAbi__factory.connect(
        COUNTER_CONTRACT_ID,
        wallet
      );
      try {
        const { value } = await counterContract.functions
          .count()
          .txParams({
            gasPrice: 1,
            gasLimit: 100_000,
          })
          .simulate();

        setCounter(value.toNumber());
      } catch (err: any) {
        console.error(err.message);
      }
    }
  };

  if (!shouldShouwCounter) return null;

  return (
    <div>
      <h3>Counter: {counter}</h3>
    </div>
  );
};
