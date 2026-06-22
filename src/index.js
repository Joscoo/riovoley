import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import './styles/design-tokens.css';
import './styles/tailwind.css';
import './styles/global.css';
import './styles/accessibility.css';

CapacitorUpdater.notifyAppReady();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

reportWebVitals((metric) => {
  if (process.env.REACT_APP_ENABLE_WEB_VITALS_LOG === 'true') {
    // eslint-disable-next-line no-console
    console.log('[web-vitals]', metric.name, Math.round(metric.value * 100) / 100, metric);
  }
});
