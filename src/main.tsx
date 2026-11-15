import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { AppWithBoundary } from './App.tsx';
import './index.css';
import { initializePWAInstall } from './hooks/usePWAInstall';
initializePWAInstall();

// Activate updates on the next launch, preserving unsaved till work.
if (import.meta.env.PROD) {
  registerSW({ immediate: true, onRegisterError: error => console.error('App offline setup failed:', error) });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppWithBoundary />
  </StrictMode>,
);
