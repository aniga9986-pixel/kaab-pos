import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { inject } from '@vercel/analytics';

// Initialize Vercel Analytics
inject();

// Safely filter out browser extension errors (like MetaMask's window.ethereum) in sandboxed iframes
if (typeof window !== 'undefined') {
  // Intercept Object.defineProperty to prevent extension-injected errors in sandboxed iframes
  try {
    const originalDefineProperty = Object.defineProperty;
    Object.defineProperty = function (obj, prop, descriptor) {
      try {
        return originalDefineProperty.call(Object, obj, prop, descriptor);
      } catch (err) {
        if (obj === window && (prop === 'ethereum' || prop === 'solana' || String(prop).includes('ethereum'))) {
          console.warn(`Prevented crash redefining non-configurable property "${String(prop)}" on window.`);
          return obj;
        }
        throw err;
      }
    };

    const originalDefineProperties = Object.defineProperties;
    Object.defineProperties = function (obj, properties) {
      try {
        return originalDefineProperties.call(Object, obj, properties);
      } catch (err) {
        if (obj === window) {
          console.warn('Prevented crash in defineProperties on window.');
          return obj;
        }
        throw err;
      }
    };
  } catch (e) {
    console.warn('Failed to setup Object.defineProperty interceptors:', e);
  }

  const handleError = (event: ErrorEvent) => {
    const message = event.message || (event.error && event.error.message) || '';
    if (
      message &&
      (message.includes('ethereum') ||
       message.includes('Cannot redefine property') ||
       message.includes('Extension') ||
       message.includes('metamask') ||
       message.includes('solana'))
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const handleRejection = (event: PromiseRejectionEvent) => {
    const message = (event.reason && event.reason.message) || '';
    if (
      message &&
      (message.includes('ethereum') ||
       message.includes('Cannot redefine property') ||
       message.includes('Extension') ||
       message.includes('metamask') ||
       message.includes('solana'))
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  window.addEventListener('error', handleError);
  window.addEventListener('unhandledrejection', handleRejection);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

