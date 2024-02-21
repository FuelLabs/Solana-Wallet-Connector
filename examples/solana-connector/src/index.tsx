import React from 'react';
import ReactDOM from 'react-dom/client';
import { FuelProvider } from '@fuels/react';
import { SolanaWalletConnector } from '@fuels/wallet-connector-solana';

import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <FuelProvider
      fuelConfig={{ devMode: true, connectors: [new SolanaWalletConnector()] }}
    >
      <App />
    </FuelProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
