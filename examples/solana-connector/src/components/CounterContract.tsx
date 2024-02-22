import { useGetCount } from '../hooks/useGetCount';

export const ContractCounter = () => {
  const { count, isLoading } = useGetCount();

  return (
    <div>
      <h3>{isLoading ? 'Loading count...' : `Count: ${count?.toString() || 0}`}</h3>
    </div>
  );
};
