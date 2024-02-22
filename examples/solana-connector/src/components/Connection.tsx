import { useConnectUI, useDisconnect, useIsConnected } from '@fuels/react';

export const Connection = () => {
  const { connect, isConnecting } = useConnectUI();
  const { disconnect } = useDisconnect();
  const { isConnected } = useIsConnected();

  return (
    <div>
      <button onClick={() => connect()}>
        {isConnecting ? 'Connecting...' : 'Connect'}
      </button>
      {isConnected && <button onClick={() => disconnect()}>Disconnect</button>}
    </div>
  );
};
