import React, { useState } from 'react';
import { Download, Smartphone, Share2, PlusSquare, X } from 'lucide-react';
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
    return null;
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
            ? `flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all duration-200 tap-scale shrink-0 min-h-[34px] min-w-[34px] ${className}`
            : variant === 'hero'
            ? `flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 tap-scale ${className}`
            : `flex items-center gap-1 px-2 py-1 bg-ink-800 hover:bg-ink-700 text-ink-100 rounded-lg text-xs font-medium transition-all duration-200 tap-scale shrink-0 ${className}`
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
          className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowGuideModal(false)}
        >
          <div 
            className="surface-card w-full max-w-md rounded-2xl p-6 shadow-2xl border border-ink-200 text-ink-900 relative rise-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              id="close-pwa-guide-modal"
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 p-1.5 text-ink-400 hover:text-ink-600 hover:bg-ink-100 rounded-xl transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-md">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold tracking-tight text-ink-900">Install ChangeTrack</h3>
                <p className="text-xs text-ink-500">Fast till access & offline-ready POS</p>
              </div>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-xs text-ink-600 bg-ink-50 p-4 rounded-xl border border-ink-200">
                <p className="font-bold text-ink-800 text-sm mb-1">How to install on iPhone & iPad:</p>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <p className="pt-0.5">
                    Tap the <strong className="text-ink-900 inline-flex items-center gap-1"><Share2 className="w-3.5 h-3.5 text-brand-600" /> Share</strong> icon in your Safari toolbar at the bottom or top of your screen.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <p className="pt-0.5">
                    Scroll through the menu options and select <strong className="text-ink-900 inline-flex items-center gap-1"><PlusSquare className="w-3.5 h-3.5 text-brand-600" /> Add to Home Screen</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <p className="pt-0.5">
                    Tap <strong className="text-ink-900">Add</strong> in the top-right corner. ChangeTrack will launch as a full-screen native app!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-ink-600 bg-ink-50 p-4 rounded-xl border border-ink-200">
                <p className="font-bold text-ink-800 text-sm mb-1">Desktop & Android Installation:</p>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <p className="pt-0.5">
                    In <strong className="text-ink-900">Google Chrome or Edge</strong>, look for the <strong className="text-ink-900">Install icon (⊕ or computer with arrow)</strong> in the right side of the address bar.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <p className="pt-0.5">
                    Or click the browser menu (<strong>⋮</strong>), then select <strong className="text-ink-900">Install ChangeTrack...</strong> or <strong className="text-ink-900">Save and share &gt; Install as app</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <p className="pt-0.5">
                    Confirm <strong>Install</strong> to add ChangeTrack to your desktop, dock, or phone launcher.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-ink-100 flex items-center justify-between">
              <span className="text-[11px] text-ink-400">Works 100% offline & syncs locally</span>
              <button
                id="pwa-guide-modal-close-btn"
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 bg-ink-900 hover:bg-ink-800 text-white rounded-xl text-xs font-bold transition-all duration-200 tap-scale"
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
