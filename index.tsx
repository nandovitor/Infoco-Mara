import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { MailProvider } from './contexts/MailContext';
import { ToastProvider } from './contexts/ToastContext';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ToastProvider>
      <DataProvider>
        <AuthProvider>
          <MailProvider>
            <App />
          </MailProvider>
        </AuthProvider>
      </DataProvider>
    </ToastProvider>
  </React.StrictMode>
);