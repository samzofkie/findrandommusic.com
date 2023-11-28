import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.js';


const root = createRoot(document.getElementById('root'));
window.addEventListener('load', () => window.scroll(0,0));

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
