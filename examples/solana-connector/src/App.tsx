import { useConnectUI, useDisconnect, useIsConnected } from '@fuels/react';
import './App.css';

function App() {
  const { connect, isConnecting } = useConnectUI();
  const { disconnect } = useDisconnect();
  const { isConnected } = useIsConnected();

  return (
    <div className="App">
      <button onClick={() => connect()}>
        {isConnecting ? 'Connecting' : 'Connect'}
      </button>
      {isConnected && <button onClick={() => disconnect()}>Disconnect</button>}
    </div>
  );
}

export default App;
