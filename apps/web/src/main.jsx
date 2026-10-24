import React from 'react';
import { createRoot } from 'react-dom/client';
import '@carbon/styles/css/styles.css';
import Workspace from './Workspace.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Workspace />
  </React.StrictMode>,
);
