import React, { useState } from 'react';
import { Download, Smartphone, Share2, PlusSquare, CheckCircle2, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'nav' | 'hero' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'nav',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already running as an installed PWA in standalone mode, hide the install button
  if (isInstalled) {
    return (
      <div 
        id="pwa-installed-badge"
        className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold"
        title="Running in Standalone App Mode"
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>App Installed</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else {
      // If browser doesn't expose native beforeinstallprompt (e.g. iOS Safari, Firefox, or already prompted), show the quick visual guide
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        id="pwa-install-button"
        onClick={handleInstallClick}
        disabled={isInstalling}
        title="Install ChangeTrack as a standalone desktop or mobile app"
        className={
          variant === 'nav'
            ? `flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-95 shrink-0 min-h-[34px] min-w-[34px] ${className}`
            : variant === 'hero'
            ? `flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 ${className}`
            : `flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors shrink-0 ${className}`
        }
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        {variant === 'nav' ? (
          <span className="hidden sm:inline">
            {isInstalling ? 'Installing...' : (
              <>
                <span>Install</span>
                <span className="hidden xl:inline"> App</span>
              </>
            )}
          </span>
        ) : (
          <span>{isInstalling ? 'Installing...' : 'Install App'}</span>
        )}
      </button>

      {/* Guide Modal for iOS Safari / Manual Installation */}
      {showGuideModal && (
        <div 
          id="pwa-install-guide-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setShowGuideModal(false)}
        >
          <div 
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              id="close-pwa-guide-modal"
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-md">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Install ChangeTrack</h3>
                <p className="text-xs text-slate-500">Fast till access & offline-ready POS</p>
              </div>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-800 text-sm mb-1">How to install on iPhone & iPad:</p>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <p className="pt-0.5">
                    Tap the <strong className="text-slate-900 inline-flex items-center gap-1"><Share2 className="w-3.5 h-3.5 text-indigo-600" /> Share</strong> icon in your Safari toolbar at the bottom or top of your screen.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <p className="pt-0.5">
                    Scroll through the menu options and select <strong className="text-slate-900 inline-flex items-center gap-1"><PlusSquare className="w-3.5 h-3.5 text-indigo-600" /> Add to Home Screen</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <p className="pt-0.5">
                    Tap <strong className="text-slate-900">Add</strong> in the top-right corner. ChangeTrack will launch as a full-screen native app!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-800 text-sm mb-1">Desktop & Android Installation:</p>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <p className="pt-0.5">
                    In <strong className="text-slate-900">Google Chrome or Edge</strong>, look for the <strong className="text-slate-900">Install icon (⊕ or computer with arrow)</strong> in the right side of the address bar.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <p className="pt-0.5">
                    Or click the browser menu (<strong>⋮</strong>), then select <strong className="text-slate-900">Install ChangeTrack...</strong> or <strong className="text-slate-900">Save and share &gt; Install as app</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <p className="pt-0.5">
                    Confirm <strong>Install</strong> to add ChangeTrack to your desktop, dock, or phone launcher.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Works 100% offline & syncs locally</span>
              <button
                id="pwa-guide-modal-close-btn"
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
