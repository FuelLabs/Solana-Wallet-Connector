import { useGetCount } from '../hooks/useGetCount';

export const ContractCounter = () => {
  const { count, isLoading, isError, error } = useGetCount();

  return (
    <div>
      <h3>
        {isLoading
          ? 'Loading count...'
          : `Count: ${count?.toString() || (isError ? error : 'connect wallet to get count')}`}
      </h3>
    </div>
  );
};
