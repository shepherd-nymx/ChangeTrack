import React, { useState, useEffect } from 'react';
import { Employee, Shop } from './types';
import { storage } from './services/storage';
import { Navbar } from './components/Navbar';
import { CashierTill } from './components/CashierTill';
import { AdminDashboard } from './components/AdminDashboard';
import { DisputeManager } from './components/DisputeManager';
import { CustomerClaimView } from './components/CustomerClaimView';
import { WhatsAppSettingsModal } from './components/WhatsAppSettingsModal';
import { EmployeesModal } from './components/EmployeesModal';
import { ShopSettingsModal } from './components/ShopSettingsModal';
import { OwnerPasscodeModal } from './components/OwnerPasscodeModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { OfflineIndicator } from './components/OfflineIndicator';

export function App() {
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

  // Security & Passcode state
  const [isOwnerUnlocked, setIsOwnerUnlocked] = useState<boolean>(() => !(storage.getShop().isPasscodeRequired));
  const [showOwnerPasscodeModal, setShowOwnerPasscodeModal] = useState(false);

  // Modals
  const [showWhatsAppSettings, setShowWhatsAppSettings] = useState(false);
  const [showEmployeesModal, setShowEmployeesModal] = useState(false);
  const [showShopSettings, setShowShopSettings] = useState(false);

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

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-100 text-slate-900 font-sans antialiased flex flex-col selection:bg-indigo-500 selection:text-white">
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
        isOwnerUnlocked={isOwnerUnlocked}
        onRequireOwnerPasscode={handleRequireOwnerPasscode}
        onLockOwnerDashboard={handleLockOwnerDashboard}
      />

      {/* Main App Content Viewport */}
      <main className="flex-1 p-3 sm:p-5 lg:p-6 max-w-7xl w-full mx-auto min-w-0">
        {currentRoleView === 'CASHIER' && (
          <CashierTill
            key={`cashier-${refreshKey}`}
            currentEmployee={currentEmployee}
            shop={shop}
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

      {/* App Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white/70 py-4 px-6 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">ChangeTrack Retail POS</span>
            <span>•</span>
            <span>Tamper-Resistant Change & Anti-Dispute Verification</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Branch: {shop.branchName || 'Main Terminal'}</span>
            <span>WhatsApp Direct Redirect (No Meta API)</span>
            <span>Thermal 80mm ESC/POS Ready</span>
          </div>
        </div>
      </footer>
      {/* Offline Connectivity Indicator */}
      <OfflineIndicator />
    </div>
  );
}

export default App;
