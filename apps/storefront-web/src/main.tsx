import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/reference-app.css';
import { AppRouter } from './routes/app-router';

const root = document.getElementById('root');
if (!root) throw new Error('Root element missing');
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>,
);
