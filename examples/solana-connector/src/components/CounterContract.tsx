import { useIsConnected } from '@fuels/react';
import { useGetCount } from '../hooks/useGetCount';

export const ContractCounter = () => {
  const { count, isLoading, isError, error } = useGetCount();
  const { isConnected, isFetching } = useIsConnected();

  return (
    <div className='Counter'>
      <h3>
        {isFetching ? "Loading..." : isLoading
          ? 'Loading count...'
          : !!count && isConnected
            ? `Count: ${count?.toString()}`
            : isError
              ? error as any
              : 'Connect wallet to get count'}
      </h3>
    </div>
  );
};
