import { useAccounts } from '@fuels/react';

import { AccountItem } from './AccountItem';

export const AccountItems = () => {
  const { accounts } = useAccounts();
  console.log(`accounts`, accounts);

  return (
    <div>
      <h3>Connected accounts</h3>
      {accounts.map((account) => (
        <AccountItem key={account} address={account} />
      ))}
    </div>
  );
};
