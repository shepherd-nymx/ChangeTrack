import React, { useState, useEffect, ErrorInfo, ReactNode } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Employee, Shop } from './types';
import { storage } from './services/storage';
import { Navbar } from './components/Navbar';
import { CashierTill } from './components/CashierTill';
import { AdminDashboard } from './components/AdminDashboard';
import { DisputeManager } from './components/DisputeManager';
import { CustomerClaimView } from './components/CustomerClaimView';
import { CustomerVoucherOnlyView } from './components/CustomerVoucherOnlyView';
import { WhatsAppSettingsModal } from './components/WhatsAppSettingsModal';
import { EmployeesModal } from './components/EmployeesModal';
import { ShopSettingsModal } from './components/ShopSettingsModal';
import { OwnerPasscodeModal } from './components/OwnerPasscodeModal';
import { PhonePortalModal } from './components/PhonePortalModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ShopAuthPage } from './components/ShopAuthPage';
import { TermsReacceptanceGate } from './components/TermsReacceptanceGate';
import { LegalViewerModal } from './legal/LegalViewerModal';
import { AdminPortalPage } from './components/AdminPortalPage';
import { shopAuth } from './services/shopAuth';
import { useOnlineStatus } from './hooks/useOnlineStatus';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

class AppErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private children: ReactNode;
  state: ErrorBoundaryState = { error: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.children = props.children;
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ChangeTrack] render crash:', error, info);
  }

  render() {
    if (this.state.error) {      return (
        <div className="min-h-screen w-full bg-ink-50 flex items-center justify-center p-6">
          <div className="surface-card max-w-md w-full p-8 text-center rise-in">
            <div className="w-12 h-12 mx-auto rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-extrabold text-ink-900 tracking-tight mb-1">Something went wrong</h1>
            <p className="text-sm text-ink-500 mb-5">The screen hit an unexpected error. Your data is safe on this device.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-sm tap-scale min-h-[44px]"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.children;
  }
}

export function App() {
  // Administration portal: reached by adding #admin-portal to the web address.
  const isAdminPortal = typeof window !== 'undefined' && window.location.hash === '#admin-portal';
  if (isAdminPortal) {
    return <AdminPortalPage />;
  }

  // Check if opened as customer-only digital voucher pass link
  const [customerVoucherId, setCustomerVoucherId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('pass') || params.get('voucher') || params.get('qr') || params.get('claim') || null;
  });

  // Auth gate: null = checking session, false = signed out, true = signed in
  const [authState, setAuthState] = useState<boolean | null>(null);
  // null = not checked, true = re-acceptance required, false = up to date
  const [termsAccepted, setTermsAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    shopAuth.getSessionUser().then(user => {
      if (!mounted) return;
      setAuthState(Boolean(user));
      if (user) {
        checkAcceptance();
      }
    });
    const unsub = shopAuth.onAuthChange((signedIn) => {
      if (mounted) {
        setAuthState(signedIn);
        if (signedIn) checkAcceptance();
      }
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const checkAcceptance = async () => {
    try {
      const latest = await shopAuth.getLatestAcceptance();
      if (latest === undefined) {
        // Check failed (offline / db error): fail open rather than locking users out.
        setTermsAccepted(false);
        return;
      }
      const { CURRENT_TERMS_VERSION, CURRENT_PRIVACY_VERSION } = await import('./legal/legalDocs');
      const current = latest !== null
        && latest.terms_version === CURRENT_TERMS_VERSION
        && latest.privacy_version === CURRENT_PRIVACY_VERSION;
      setTermsAccepted(current);
    } catch {
      setTermsAccepted(false);
    }
  };

  const handleSignOut = async () => {
    await shopAuth.signOut();
    setAuthState(false);
  };

  const [shop, setShop] = useState<Shop>(() => storage.getShop());
  const [employees, setEmployees] = useState<Employee[]>(() => storage.getEmployees());
  const [currentEmployee, setCurrentEmployee] = useState<Employee>(() => {
    const emps = storage.getEmployees();
    return emps[0] || {
      id: 'emp-1',
      shopId: 'shop-abc-01',
      name: 'Tariro Moyo',
      email: 'tariro@abctuckshop.com',
      role: 'ADMIN',
      pin: '1234',
      active: true,
      avatarColor: 'bg-emerald-600'
    };
  });

  const [currentRoleView, setCurrentRoleView] = useState<'CASHIER' | 'ADMIN' | 'DISPUTES' | 'CUSTOMER'>('CASHIER');
  const [refreshKey, setRefreshKey] = useState(0);

  // Push locally-queued entries to the cloud on load and whenever the device reconnects
  const isOnline = useOnlineStatus();
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(() => storage.getPendingSyncCount());
  useEffect(() => {
    if (!isOnline) return;
    let cancelled = false;
    storage.flushSyncQueue().then(pushed => {
      if (!cancelled) setPendingSyncCount(storage.getPendingSyncCount());
    });
    return () => {
      cancelled = true;
    };
  }, [isOnline, refreshKey]);

  // Security & Passcode state
  const [isOwnerUnlocked, setIsOwnerUnlocked] = useState<boolean>(() => !(storage.getShop().isPasscodeRequired));
  const [showOwnerPasscodeModal, setShowOwnerPasscodeModal] = useState(false);

  // Modals
  const [showWhatsAppSettings, setShowWhatsAppSettings] = useState(false);
  const [showEmployeesModal, setShowEmployeesModal] = useState(false);
  const [showShopSettings, setShowShopSettings] = useState(false);
  const [showPhonePortalModal, setShowPhonePortalModal] = useState(false);
  const [showLegalViewer, setShowLegalViewer] = useState(false);
  const [showAdminPortal, setShowAdminPortal] = useState(false);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    const updatedShop = storage.getShop();
    setShop(updatedShop);
    const updatedEmps = storage.getEmployees();
    setEmployees(updatedEmps);
    // Keep currentEmployee in sync with latest data, or fallback if deleted
    setCurrentEmployee(prev => {
      const fresh = updatedEmps.find(e => e.id === prev.id);
      return fresh || updatedEmps[0] || prev;
    });
  };

  const handleShopUpdated = (updatedShop: Shop) => {
    setShop(updatedShop);
    if (!updatedShop.isPasscodeRequired) {
      setIsOwnerUnlocked(true);
    }
    handleRefresh();
  };

  const handleRequireOwnerPasscode = () => {
    setShowOwnerPasscodeModal(true);
  };

  const handleOwnerUnlockSuccess = () => {
    setIsOwnerUnlocked(true);
    setShowOwnerPasscodeModal(false);
    setCurrentRoleView('ADMIN');
  };

  const handleLockOwnerDashboard = () => {
    setIsOwnerUnlocked(false);
    if (currentRoleView === 'ADMIN') {
      setCurrentRoleView('CASHIER');
    }
  };

  // If customer accessed their voucher link, give them access ONLY to their QR code pass
  if (customerVoucherId) {
    return (
      <CustomerVoucherOnlyView
        voucherId={customerVoucherId}
        shop={shop}
        onExitToTill={() => {
          setCustomerVoucherId(null);
          if (typeof window !== 'undefined') {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, '', cleanUrl);
          }
        }}
      />
    );
  }

  if (authState === null) {
    return (
      <div className="min-h-screen w-full bg-ink-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-300">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          <p className="text-sm font-semibold">Loading ChangeTrack…</p>
        </div>
      </div>
    );
  }

  if (authState === false) {
    return <ShopAuthPage onAuthed={() => setAuthState(true)} />;
  }

  if (termsAccepted === true) {
    return (
      <TermsReacceptanceGate
        onAccepted={() => setTermsAccepted(false)}
        onSignOut={handleSignOut}
      />
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-ink-50 text-ink-900 font-sans antialiased flex flex-col selection:bg-brand-500 selection:text-white">
      {/* PWA Install Banner */}
      <PWAInstallBanner />

      {/* Navigation Bar */}
      <Navbar
        currentRoleView={currentRoleView}
        setCurrentRoleView={setCurrentRoleView}
        currentEmployee={currentEmployee}
        setCurrentEmployee={setCurrentEmployee}
        shop={shop}
        onOpenWhatsAppSettings={() => setShowWhatsAppSettings(true)}
        onOpenEmployeesModal={() => setShowEmployeesModal(true)}
        onOpenShopSettings={() => setShowShopSettings(true)}
        onOpenPhonePortal={() => setShowPhonePortalModal(true)}
        isOwnerUnlocked={isOwnerUnlocked}
        onRequireOwnerPasscode={handleRequireOwnerPasscode}
        onLockOwnerDashboard={handleLockOwnerDashboard}
        onSignOut={handleSignOut}
      />

      {/* Main App Content Viewport */}
      <main className="flex-1 p-3 sm:p-5 lg:p-6 max-w-7xl w-full mx-auto min-w-0">
        {currentRoleView === 'CASHIER' && (
          <CashierTill
            key={`cashier-${refreshKey}`}
            currentEmployee={currentEmployee}
            shop={shop}
            pendingSyncCount={pendingSyncCount}
            onRecordCreated={handleRefresh}
            onTransactionComplete={handleRefresh}
          />
        )}

        {currentRoleView === 'ADMIN' && (
          <AdminDashboard
            key={`admin-${refreshKey}`}
            currentEmployee={currentEmployee}
            shop={shop}
            onRefresh={handleRefresh}
            onOpenWhatsAppSettings={() => setShowWhatsAppSettings(true)}
            onOpenEmployeesModal={() => setShowEmployeesModal(true)}
            onOpenShopSettings={() => setShowShopSettings(true)}
            onOpenPhonePortal={() => setShowPhonePortalModal(true)}
            onLockDashboard={handleLockOwnerDashboard}
          />
        )}

        {currentRoleView === 'DISPUTES' && (
          <DisputeManager
            key={`disputes-${refreshKey}`}
            currentEmployee={currentEmployee}
            shop={shop}
            onRefresh={handleRefresh}
          />
        )}

        {currentRoleView === 'CUSTOMER' && (
          <CustomerClaimView
            key={`customer-${refreshKey}`}
            shop={shop}
          />
        )}
      </main>

      {/* Global Modals */}
      {showWhatsAppSettings && (
        <WhatsAppSettingsModal
          shop={shop}
          onClose={() => setShowWhatsAppSettings(false)}
          onConfigUpdated={handleRefresh}
        />
      )}

      {showEmployeesModal && (
        <EmployeesModal
          shop={shop}
          currentEmployee={currentEmployee}
          onClose={() => setShowEmployeesModal(false)}
          onEmployeesUpdated={(deletedId) => {
            handleRefresh();
            if (deletedId && currentEmployee.id === deletedId) {
              const remaining = storage.getEmployees();
              if (remaining.length > 0) {
                setCurrentEmployee(remaining[0]);
              }
            }
          }}
        />
      )}

      {showShopSettings && (
        <ShopSettingsModal
          shop={shop}
          onClose={() => setShowShopSettings(false)}
          onShopUpdated={handleShopUpdated}
        />
      )}

      {showOwnerPasscodeModal && (
        <OwnerPasscodeModal
          shop={shop}
          onSuccess={handleOwnerUnlockSuccess}
          onClose={() => setShowOwnerPasscodeModal(false)}
        />
      )}

      {showPhonePortalModal && (
        <PhonePortalModal
          isOpen={showPhonePortalModal}
          onClose={() => setShowPhonePortalModal(false)}
          onDataChanged={handleRefresh}
        />
      )}

      {showLegalViewer && (
        <LegalViewerModal onClose={() => setShowLegalViewer(false)} />
      )}

      {showAdminPortal && (
        <div className="fixed inset-0 z-[200] overflow-y-auto bg-ink-950">
          <AdminPortalPage />
        </div>
      )}

      {/* App Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white/70 py-4 px-6 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">ChangeTrack Retail POS</span>
            <span>•</span>
            <span>Tamper-Resistant Change & Anti-Dispute Verification</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={() => setShowLegalViewer(true)} className="font-bold hover:text-brand-700 underline underline-offset-2 transition-colors">
              Legal & Policies
            </button>
            <button onClick={() => setShowAdminPortal(true)} className="font-semibold hover:text-slate-600 transition-colors">
              Admin Portal
            </button>
            <span>ChangeTrack — Powered by Future Pulse Investments</span>
          </div>
        </div>
      </footer>
      {/* Offline Connectivity Indicator */}
      <OfflineIndicator />
    </div>
  );
}

export default App;

export function AppWithBoundary() {
  return <AppErrorBoundary>{<App />}</AppErrorBoundary>;
}
