import { useConnectUI, useDisconnect, useIsConnected } from '@fuels/react';

export const Connection = () => {
  const { connect, isConnecting, theme, setTheme } = useConnectUI();
  const { disconnect } = useDisconnect();
  const { isConnected } = useIsConnected();
  const lightTheme = theme === "light";

  return (
    <div className='Actions'>
      <button onClick={() => connect()}>
        {isConnecting ? 'Connecting...' : 'Connect'}
      </button>
      {isConnected && <button onClick={() => disconnect()}>Disconnect</button>}
      <button onClick={() => setTheme(lightTheme ? 'dark' : 'light')}>
          {lightTheme ? '🌙' : '☀️'}
        </button>
    </div>
  );
};
