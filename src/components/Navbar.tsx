import React from 'react';
import { 
  ShieldCheck, 
  Coins, 
  Store, 
  MessageSquare, 
  Scale, 
  LayoutDashboard, 
  Smartphone,
  ChevronDown,
  Lock,
  Unlock
} from 'lucide-react';
import { Employee, Shop } from '../types';
import { storage } from '../services/storage';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  currentRoleView: 'CASHIER' | 'ADMIN' | 'DISPUTES' | 'CUSTOMER';
  setCurrentRoleView: (view: 'CASHIER' | 'ADMIN' | 'DISPUTES' | 'CUSTOMER') => void;
  currentEmployee: Employee;
  setCurrentEmployee: (emp: Employee) => void;
  shop: Shop;
  onOpenWhatsAppSettings: () => void;
  onOpenEmployeesModal: () => void;
  onOpenShopSettings: () => void;
  onOpenPhonePortal: () => void;
  isOwnerUnlocked: boolean;
  onRequireOwnerPasscode: () => void;
  onLockOwnerDashboard: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoleView,
  setCurrentRoleView,
  currentEmployee,
  setCurrentEmployee,
  shop,
  onOpenWhatsAppSettings,
  onOpenEmployeesModal,
  onOpenShopSettings,
  onOpenPhonePortal,
  isOwnerUnlocked,
  onRequireOwnerPasscode,
  onLockOwnerDashboard
}) => {
  const employees = storage.getEmployees();
  const stats = storage.getDashboardStats();
  const portalId = storage.getPortalId();
  const currency = shop.currencySymbol || '$';

  const handleOwnerTabClick = () => {
    if (shop.isPasscodeRequired && !isOwnerUnlocked) {
      onRequireOwnerPasscode();
    } else {
      setCurrentRoleView('ADMIN');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md print:hidden w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 w-full">
        {/* Top Header Row */}
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-3 w-full min-w-0">
          {/* Logo & Shop Info */}
          <div 
            onClick={onOpenShopSettings}
            title="Click to edit shop name, logo and settings"
            className="flex items-center gap-2 sm:gap-2.5 shrink min-w-0 cursor-pointer group"
          >
            {shop.logoUrl ? (
              <img
                src={shop.logoUrl}
                alt={shop.name}
                className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-xl object-contain bg-white border border-slate-700 p-0.5 shadow-md shrink-0 group-hover:ring-2 group-hover:ring-indigo-400 transition-all"
              />
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-105 transition-transform">
                <Coins className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs sm:text-sm lg:text-base tracking-tight text-white group-hover:text-indigo-300 transition-colors truncate max-w-[110px] sm:max-w-[160px] lg:max-w-[190px]">
                  {shop.name}
                </span>
                <span className="text-[8px] sm:text-[9px] lg:text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  {shop.branchName ? shop.branchName.toUpperCase() : 'RETAIL'}
                </span>
              </div>
              <p className="text-[10px] lg:text-[11px] text-slate-400 hidden xl:block truncate max-w-[200px]">
                {shop.address || 'ChangeTrack Retail Till'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs (Shown only on lg+ screens, 1024px+) */}
          <nav className="hidden lg:flex items-center p-1 bg-slate-800/90 rounded-xl border border-slate-700/80 text-xs font-bold shrink-0">
            <button
              onClick={() => setCurrentRoleView('CASHIER')}
              className={`flex items-center gap-1.5 py-1.5 px-2.5 xl:px-3 rounded-lg transition-all min-h-[36px] ${
                currentRoleView === 'CASHIER'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Coins className="w-3.5 h-3.5 shrink-0" />
              <span><span className="hidden xl:inline">Cashier </span>Till</span>
            </button>

            <button
              onClick={handleOwnerTabClick}
              className={`flex items-center gap-1.5 py-1.5 px-2.5 xl:px-3 rounded-lg transition-all min-h-[36px] ${
                currentRoleView === 'ADMIN'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
              <span>Owner<span className="hidden xl:inline"> Console</span></span>
              {shop.isPasscodeRequired && (
                isOwnerUnlocked ? (
                  <Unlock className="w-3 h-3 text-emerald-400 shrink-0" title="Unlocked" />
                ) : (
                  <Lock className="w-3 h-3 text-slate-400 shrink-0" title="Passcode Protected" />
                )
              )}
            </button>

            <button
              onClick={() => setCurrentRoleView('DISPUTES')}
              className={`flex items-center gap-1.5 py-1.5 px-2.5 xl:px-3 rounded-lg transition-all min-h-[36px] ${
                currentRoleView === 'DISPUTES'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Scale className="w-3.5 h-3.5 shrink-0" />
              <span><span className="hidden xl:inline">Anti-</span>Disputes</span>
            </button>

            <button
              onClick={() => setCurrentRoleView('CUSTOMER')}
              className={`flex items-center gap-1.5 py-1.5 px-2.5 xl:px-3 rounded-lg transition-all min-h-[36px] ${
                currentRoleView === 'CUSTOMER'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Customer<span className="hidden xl:inline"> QR</span></span>
            </button>
          </nav>

          {/* Right Operator Controls & Settings */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Quick Outstanding Pill (Shown only on xl+ screens) */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs shrink-0">
              <span className="text-amber-400 font-bold">Owed:</span>
              <span className="font-mono-num font-extrabold text-white">
                {currency}{stats.totalOutstandingChange.toFixed(2)}
              </span>
            </div>

            {/* Operator Switcher Dropdown */}
            <div className="relative flex items-center shrink-0">
              <select
                value={currentEmployee.id}
                onChange={e => {
                  const emp = employees.find(x => x.id === e.target.value);
                  if (emp) setCurrentEmployee(emp);
                }}
                className="py-1.5 pl-2 pr-5 sm:pr-6 bg-slate-800 border border-slate-700 rounded-xl text-[11px] sm:text-xs font-semibold text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer max-w-[100px] sm:max-w-[130px] lg:max-w-[150px] truncate"
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 pointer-events-none" />
            </div>

            {/* Phone Portal & Supabase Sync Button */}
            <button
              onClick={onOpenPhonePortal}
              title={`Phone Portal: ${portalId} - Click to configure cloud sync`}
              className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-800 hover:bg-slate-700 hover:border-emerald-500/50 text-slate-200 border border-slate-700 rounded-xl transition-all text-xs font-semibold shrink-0 cursor-pointer"
            >
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline font-mono text-[11px] text-slate-300">
                {portalId.replace('portal_', '#')}
              </span>
            </button>

            {/* PWA Install Button */}
            <PWAInstallButton variant="nav" />

            {/* Shop Settings Shortcut */}
            <button
              onClick={onOpenShopSettings}
              title="Shop Information, Logo & Owner Passcode"
              className="p-1.5 sm:p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-xl transition-colors min-h-[34px] min-w-[34px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center shrink-0"
            >
              <Store className="w-4 h-4" />
            </button>

            {/* WhatsApp Direct Integration Settings Shortcut */}
            <button
              onClick={onOpenWhatsAppSettings}
              title="ChangeTrack WhatsApp Direct Settings"
              className="p-1.5 sm:p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition-colors min-h-[34px] min-w-[34px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center shrink-0"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            {/* Quick Lock Button if unlocked and passcode active */}
            {isOwnerUnlocked && shop.isPasscodeRequired && (
              <button
                onClick={onLockOwnerDashboard}
                title="Lock Owner Console Now"
                className="p-1.5 sm:px-2 sm:py-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-800 rounded-xl transition-colors text-xs font-bold flex items-center gap-1 min-h-[34px] sm:min-h-[36px] shrink-0"
              >
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden xl:inline text-[11px]">Lock</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-bar Navigation Tabs for Mobile & Tablets (Shown on < lg screens) */}
        <div className="lg:hidden pb-2.5 pt-0.5 overflow-x-auto no-scrollbar w-full">
          <nav className="flex items-center gap-1 p-1 bg-slate-800/90 rounded-xl border border-slate-700/80 text-xs font-bold min-w-max mx-auto sm:justify-center">
            <button
              onClick={() => setCurrentRoleView('CASHIER')}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-lg transition-all min-h-[44px] ${
                currentRoleView === 'CASHIER'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>Cashier Till</span>
            </button>

            <button
              onClick={handleOwnerTabClick}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-lg transition-all min-h-[44px] ${
                currentRoleView === 'ADMIN'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Owner Console</span>
              {shop.isPasscodeRequired && (
                isOwnerUnlocked ? (
                  <Unlock className="w-3 h-3 text-emerald-400 shrink-0" />
                ) : (
                  <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                )
              )}
            </button>

            <button
              onClick={() => setCurrentRoleView('DISPUTES')}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-lg transition-all min-h-[44px] ${
                currentRoleView === 'DISPUTES'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Disputes</span>
            </button>

            <button
              onClick={() => setCurrentRoleView('CUSTOMER')}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-lg transition-all min-h-[44px] ${
                currentRoleView === 'CUSTOMER'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Customer QR</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
