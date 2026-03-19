import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/design-tokens.css';
import './styles/global.css';
import './styles/accessibility.css';
import './styles/mobile-best-practices.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);