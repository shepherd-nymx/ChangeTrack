import { useSyncExternalStore } from 'react';

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
let prompt: InstallPrompt | null = null;
let initialized = false;
let state = { isInstallable: false, isInstalled: false, isIOS: false };
const listeners = new Set<() => void>();
const publish = () => {
  state = { ...state, isInstallable: !!prompt };
  listeners.forEach(listener => listener());
};
export function initializePWAInstall() {
  if (initialized) return;
  initialized = true;
  const standalone = window.matchMedia('(display-mode: standalone)');
  const sync = () => {
    state.isInstalled = standalone.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    publish();
  };
  state.isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  sync();
  standalone.addEventListener('change', sync);
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    prompt = event as InstallPrompt;
    publish();
  });
  window.addEventListener('appinstalled', () => {
    prompt = null;
    state.isInstalled = true;
    publish();
  });
}
async function install() {
  const current = prompt;
  if (!current) return false;
  prompt = null; // Browser prompts are single use, including after dismissal.
  publish();
  try {
    await current.prompt();
    return (await current.userChoice).outcome === 'accepted';
  } catch {
    return false;
  }
}
export function usePWAInstall() {
  const snapshot = useSyncExternalStore(listener => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, () => state);
  return { ...snapshot, install };
}
