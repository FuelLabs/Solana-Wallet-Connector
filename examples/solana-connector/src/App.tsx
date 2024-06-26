import { useConnectUI, useIsConnected } from '@fuels/react';

import './styles/App.css';
import { ContractCounter } from './components/CounterContract';
import { COUNTER_CONTRACT_ID } from './config';
import { Connection } from './components/Connection';
import { Info } from './components/Info';
import { AccountItems } from './components/AccountItems';

function App() {
  const { isConnected } = useIsConnected();
  const { theme } = useConnectUI();

  return (
    <div className="App" data-theme={theme}>
      <Connection />
      <div>
        <Info />
        {isConnected && <AccountItems />}
        <ContractCounter />
        <div className='BottomInfo'>
          {isConnected && (
            <>
              <p>
                Counter contract address: <b>{COUNTER_CONTRACT_ID}</b>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
