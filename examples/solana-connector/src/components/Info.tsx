import { useConnectUI, useIsConnected } from '@fuels/react';

export const Info = () => {
  const { isError, error } = useConnectUI();
  const { isConnected } = useIsConnected();

  return (
    <div className='Info'>
      {isConnected && (
        <>
          <p>
            The connected accounts below are the predicate account of Fuel for
            each of the connected Solana wallet accounts.
          </p>
          <p>
            You can use a Solana wallet account to send transactions from its
            corresponding predicate account.
          </p>
          <p>
            Additional accounts can be connected via the Solana wallet extension
          </p>
        </>
      )}
      {isError && <p className='Error'>{error?.message}</p>}
    </div>
  );
};
