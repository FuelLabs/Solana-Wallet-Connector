import { useBalance, useWallet } from '@fuels/react';
import { Address, BaseAssetId } from 'fuels';
import { useState } from 'react';
import { CounterContractAbi__factory } from '../contracts';
import {
  DEFAULT_AMOUNT,
  DEFAULT_ADDRESS,
  COUNTER_CONTRACT_ID,
} from '../config';

type AccountItemProps = {
  address: string;
};

export const AccountItem = ({ address }: AccountItemProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCall, setIsLoadingCall] = useState(false);
  const { balance } = useBalance({ address });
  const { wallet } = useWallet(address);

  const hasBalance = balance && balance.gte(DEFAULT_AMOUNT);

  async function transfer() {
    setIsLoading(true);
    try {
      const receiverAddress = prompt('Receiver address', DEFAULT_ADDRESS);
      const receiver = Address.fromString(receiverAddress || DEFAULT_ADDRESS);
      const response = await wallet?.transfer(
        receiver,
        DEFAULT_AMOUNT,
        BaseAssetId,
        {
          gasPrice: 1,
          gasLimit: 10_000,
        }
      );
      await response?.waitForResult();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function increment() {
    if (wallet) {
      setIsLoadingCall(true);
      const contract = CounterContractAbi__factory.connect(
        COUNTER_CONTRACT_ID,
        wallet
      );
      try {
        await contract.functions
          .increment()
          .txParams({ gasPrice: 1, gasLimit: 100_000 })
          .call();
      } catch (err: any) {
        console.log(err.message);
      } finally {
        setIsLoadingCall(false);
      }
    }
  }

  return (
    <div>
      <div>
        <span>
          <b>Account:</b> {address}{' '}
        </span>
        <span>
          <b>Balance:</b> {balance?.format() || '0'} ETH
        </span>
      </div>
      <div>
        {!hasBalance && (
          <a
            href={`https://faucet-beta-5.fuel.network/?address=${address}`}
            target="_blank"
          >
            <button>Get some coins</button>
          </a>
        )}
        <button
          onClick={() => increment()}
          disabled={isLoadingCall || !hasBalance}
        >
          {isLoadingCall
            ? 'Incrementing...'
            : 'Increment the counter on the contract'}
        </button>
        <button onClick={() => transfer()} disabled={isLoading || !hasBalance}>
          {isLoading
            ? 'Transferring...'
            : `Transfer ${DEFAULT_AMOUNT.format()} ETH`}
        </button>
      </div>
    </div>
  );
};
