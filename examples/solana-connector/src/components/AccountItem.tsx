import { useBalance } from '@fuels/react';
import { DEFAULT_AMOUNT } from '../config';
import { useTransfer } from '../hooks/useTransfer';
import { useIncrement } from '../hooks/useIncrement';

type AccountItemProps = {
  address: string;
};

export const AccountItem = ({ address }: AccountItemProps) => {
  const { balance } = useBalance({ address });
  const transfer = useTransfer(address);
  const increment = useIncrement(address);

  const hasBalance = balance && balance.gte(DEFAULT_AMOUNT);

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
          onClick={() => increment.mutate()}
          disabled={increment.isLoading || !balance?.gt(0)}
        >
          {increment.isLoading
            ? 'Incrementing...'
            : 'Increment the counter on the contract'}
        </button>
        <button
          onClick={() => transfer.mutate()}
          disabled={transfer.isLoading || !hasBalance}
        >
          {transfer.isLoading
            ? 'Transferring...'
            : `Transfer ${DEFAULT_AMOUNT.format()} ETH`}
        </button>
      </div>
    </div>
  );
};
