import React from 'react';
import { 
  ShieldCheck, 
  Coins, 
  Store, 
  UserCheck, 
  MessageSquare, 
  Users, 
  Scale, 
  LayoutDashboard, 
  Smartphone,
  ChevronDown,
  Sparkles,
  Lock,
  Unlock,
  KeyRound
} from 'lucide-react';
import { Employee, Shop, UserRole } from '../types';
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
  isOwnerUnlocked,
  onRequireOwnerPasscode,
  onLockOwnerDashboard
}) => {
  const employees = storage.getEmployees();
  const stats = storage.getDashboardStats();
  const currency = shop.currencySymbol || '$';

  const handleOwnerTabClick = () => {
    if (shop.isPasscodeRequired && !isOwnerUnlocked) {
      onRequireOwnerPasscode();
    } else {
      setCurrentRoleView('ADMIN');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Shop Info */}
          <div 
            onClick={onOpenShopSettings}
            title="Click to edit shop name, logo and settings"
            className="flex items-center gap-3 shrink-0 cursor-pointer group"
          >
            {shop.logoUrl ? (
              <img
                src={shop.logoUrl}
                alt={shop.name}
                className="w-10 h-10 rounded-xl object-contain bg-white border border-slate-700 p-0.5 shadow-md shrink-0 group-hover:ring-2 group-hover:ring-indigo-400 transition-all"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-105 transition-transform">
                <Coins className="w-6 h-6" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                  {shop.name}
                </span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {shop.branchName ? shop.branchName.toUpperCase() : 'RETAIL'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block truncate max-w-[200px]">
                {shop.address || 'ChangeTrack Retail Till'}
              </p>
            </div>
          </div>

          {/* Center Role / View Switcher Tabs */}
          <nav className="flex items-center p-1 bg-slate-800/90 rounded-xl border border-slate-700/80 text-xs font-bold">
            <button
              onClick={() => setCurrentRoleView('CASHIER')}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-all ${
                currentRoleView === 'CASHIER'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Cashier Till</span>
            </button>

            <button
              onClick={handleOwnerTabClick}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-all ${
                currentRoleView === 'ADMIN'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Owner Dashboard</span>
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
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-all ${
                currentRoleView === 'DISPUTES'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Anti-Dispute Trail</span>
              <span className="sm:hidden">Disputes</span>
            </button>

            <button
              onClick={() => setCurrentRoleView('CUSTOMER')}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-all ${
                currentRoleView === 'CUSTOMER'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Customer QR Pass</span>
              <span className="md:hidden">Customer</span>
            </button>
          </nav>

          {/* Right Operator Controls & Outstanding Summary */}
          <div className="flex items-center gap-2.5">
            {/* Quick Outstanding Pill */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs">
              <span className="text-amber-400 font-bold">Outstanding:</span>
              <span className="font-mono-num font-extrabold text-white">
                {currency}{stats.totalOutstandingChange.toFixed(2)}
              </span>
            </div>

            {/* Operator Switcher Dropdown */}
            <div className="relative flex items-center">
              <select
                value={currentEmployee.id}
                onChange={e => {
                  const emp = employees.find(x => x.id === e.target.value);
                  if (emp) setCurrentEmployee(emp);
                }}
                className="py-1.5 pl-2.5 pr-7 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer"
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
            </div>

            {/* PWA Install Button */}
            <PWAInstallButton variant="nav" />

            {/* Shop Settings & Logo Shortcut */}
            <button
              onClick={onOpenShopSettings}
              title="Shop Information, Logo & Owner Passcode"
              className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-xl transition-colors"
            >
              <Store className="w-4 h-4" />
            </button>

            {/* WhatsApp Integration Shortcut */}
            <button
              onClick={onOpenWhatsAppSettings}
              title="WhatsApp Cloud API Integration Settings"
              className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            {/* Quick Lock Button if unlocked and passcode active */}
            {isOwnerUnlocked && shop.isPasscodeRequired && (
              <button
                onClick={onLockOwnerDashboard}
                title="Lock Owner Console Now"
                className="px-2 py-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-800 rounded-xl transition-colors text-xs font-bold flex items-center gap-1"
              >
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden xl:inline text-[11px]">Lock</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
