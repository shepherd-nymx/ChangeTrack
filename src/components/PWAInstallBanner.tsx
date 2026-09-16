import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallButton } from './PWAInstallButton';

export const PWAInstallBanner: React.FC = () => {
  const { isInstalled } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    // Only show if not installed and not dismissed previously in this session
    const dismissed = sessionStorage.getItem('changetrack_pwa_banner_dismissed');
    if (!dismissed && !isInstalled) {
      setIsDismissed(false);
    }
  }, [isInstalled]);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('changetrack_pwa_banner_dismissed', 'true');
  };

  if (isInstalled || isDismissed) {
    return null;
  }

  return (
    <div
      id="pwa-install-banner"
      className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-indigo-800/40 text-white px-4 py-2.5 print:hidden transition-all duration-300 shadow-sm"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Install ChangeTrack App</span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-300 hidden sm:block">
              Add to your device for 1-click till opening, fullscreen mode, and full offline slip verification.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <PWAInstallButton variant="nav" />
          <button
            id="dismiss-pwa-banner"
            onClick={handleDismiss}
            title="Dismiss notice"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
