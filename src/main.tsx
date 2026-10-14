import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register the PWA service worker only in production builds — in the dev
// preview it intercepts live-reload connections and blanks the page.
if (import.meta.env.PROD) {
  registerSW({ immediate: true });
} else if ('serviceWorker' in navigator) {
  // Remove any stale worker left over from a previous preview session and
  // clear its caches so the dev preview always serves fresh code.
  navigator.serviceWorker.getRegistrations().then(regs => {
    for (const reg of regs) reg.unregister();
  });
  if (window.caches) {
    window.caches.keys().then(keys => {
      for (const key of keys) window.caches.delete(key);
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
