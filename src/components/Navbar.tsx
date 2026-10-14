import React from 'react';
import {
  Coins, MessageSquare, Scale, LayoutDashboard, Smartphone,
  ChevronDown, Lock, Unlock, LogOut, Store
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
  onSignOut: () => void;
}

type RoleView = NavbarProps['currentRoleView'];

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
  onLockOwnerDashboard,
  onSignOut
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

  const tabs: { view: RoleView; label: string; shortLabel: string; icon: React.ReactNode; activeClass: string }[] = [
    {
      view: 'CASHIER',
      label: 'Cashier Till',
      shortLabel: 'Till',
      icon: <Coins className="w-4 h-4" />,
      activeClass: 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
    },
    {
      view: 'ADMIN',
      label: 'Owner Console',
      shortLabel: 'Owner',
      icon: <LayoutDashboard className="w-4 h-4" />,
      activeClass: 'bg-ink-900 text-white shadow-sm shadow-ink-900/30'
    },
    {
      view: 'DISPUTES',
      label: 'Anti-Disputes',
      shortLabel: 'Disputes',
      icon: <Scale className="w-4 h-4" />,
      activeClass: 'bg-amber-500 text-ink-900 shadow-sm shadow-amber-500/30'
    },
    {
      view: 'CUSTOMER',
      label: 'Customer QR',
      shortLabel: 'QR',
      icon: <Smartphone className="w-4 h-4" />,
      activeClass: 'bg-ink-800 text-white shadow-sm shadow-ink-800/30'
    }
  ];

  const renderTab = (tab: (typeof tabs)[number]) => {
    const active = currentRoleView === tab.view;
    return (
      <button
        key={tab.view}
        onClick={tab.view === 'ADMIN' ? handleOwnerTabClick : () => setCurrentRoleView(tab.view)}
        className={`relative flex items-center gap-1.5 rounded-xl font-bold transition-all duration-200 min-h-[38px] py-2 px-3.5 xl:px-4 text-xs tap-scale ${
          active ? tab.activeClass : 'text-ink-500 hover:text-ink-900 hover:bg-ink-100'
        }`}
      >
        <span className={active ? '' : 'text-ink-400'}>{tab.icon}</span>
        <span className="hidden sm:inline">{tab.label}</span>
        <span className="sm:hidden">{tab.shortLabel}</span>
        {tab.view === 'ADMIN' && shop.isPasscodeRequired && (
          isOwnerUnlocked
            ? <Unlock className="w-3 h-3 text-brand-300" />
            : <Lock className="w-3 h-3 opacity-60" />
        )}
      </button>
    );
  };

  return (
    <header className="surface-glass sticky top-0 z-40 w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-3 w-full min-w-0">
          {/* Brand / Shop identity */}
          <button
            onClick={onOpenShopSettings}
            title="Click to edit shop name, logo and settings"
            className="flex items-center gap-2.5 min-w-0 group text-left"
          >
            {shop.logoUrl ? (
              <img
                src={shop.logoUrl}
                alt={shop.name}
                className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl object-contain bg-white border border-ink-200 p-0.5 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-sm shadow-brand-600/25 shrink-0 group-hover:scale-105 transition-transform duration-200">
                <Coins className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm lg:text-base tracking-tight text-ink-900 truncate max-w-[130px] sm:max-w-[180px]">
                  {shop.name}
                </span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-brand-50 text-brand-700 border border-brand-200 uppercase tracking-wide shrink-0">
                  {shop.branchName ? shop.branchName.toUpperCase() : 'Retail'}
                </span>
              </div>
              <p className="text-[10px] lg:text-[11px] text-ink-400 font-semibold hidden xl:block truncate max-w-[220px]">
                {shop.address || 'ChangeTrack Retail Till'}
              </p>
            </div>
          </button>

          {/* Desktop tabs */}
          <nav className="hidden lg:flex items-center gap-0.5 p-1 bg-ink-100/80 rounded-2xl border border-ink-200/70 shrink-0">
            {tabs.map(t => renderTab(t))}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs tap-scale">
              <span className="text-amber-600 font-bold">Owed</span>
              <span className="font-mono-num font-extrabold text-ink-900">
                {currency}{stats.totalOutstandingChange.toFixed(2)}
              </span>
            </div>

            {/* Operator switcher */}
            <div className="relative flex items-center shrink-0">
              <select
                value={currentEmployee.id}
                onChange={e => {
                  const emp = employees.find(x => x.id === e.target.value);
                  if (emp) setCurrentEmployee(emp);
                }}
                className="py-2 pl-2.5 pr-6 bg-white border border-ink-200 rounded-xl text-[11px] sm:text-xs font-bold text-ink-700 shadow-sm hover:border-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-500/40 appearance-none cursor-pointer max-w-[100px] sm:max-w-[140px] truncate transition-colors"
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-ink-400 absolute right-1.5 pointer-events-none" />
            </div>

            {/* Phone portal / sync */}
            <button
              onClick={onOpenPhonePortal}
              title={`Phone Portal: ${portalId} — click to configure cloud sync`}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-2 bg-white border border-ink-200 hover:border-brand-400 rounded-xl transition-all text-xs font-bold text-ink-600 hover:text-ink-900 shadow-sm tap-scale min-h-[36px]"
            >
              <span className="flex h-1.5 w-1.5 rounded-full bg-brand-500 pulse-ring" />
              <Smartphone className="w-3.5 h-3.5 text-brand-600" />
              <span className="hidden lg:inline font-mono text-[11px] text-ink-500">
                {portalId.replace('portal_', '#')}
              </span>
            </button>

            <PWAInstallButton variant="nav" />

            <button
              onClick={onOpenShopSettings}
              title="Shop Information, Logo & Owner Passcode"
              className="p-2 text-ink-400 hover:text-ink-900 hover:bg-ink-100 rounded-xl transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center shrink-0"
            >
              <Store className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenWhatsAppSettings}
              title="ChangeTrack WhatsApp Direct Settings"
              className="p-2 text-ink-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center shrink-0"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            {isOwnerUnlocked && shop.isPasscodeRequired && (
              <button
                onClick={onLockOwnerDashboard}
                title="Lock Owner Console Now"
                className="hidden sm:flex p-2 hover:bg-rose-50 text-ink-400 hover:text-rose-600 rounded-xl transition-colors min-h-[36px] min-w-[36px] items-center justify-center shrink-0"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onSignOut}
              title="Sign out of this shop account"
              className="flex items-center gap-1.5 px-2.5 py-2 bg-white border border-ink-200 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 text-ink-500 rounded-xl transition-all text-xs font-bold shadow-sm tap-scale min-h-[36px] shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Sign out</span>
            </button>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="lg:hidden pb-2.5 pt-0.5 overflow-x-auto no-scrollbar w-full">
          <nav className="flex items-center gap-0.5 p-1 bg-ink-100/80 rounded-2xl border border-ink-200/70 text-xs font-bold min-w-max">
            {tabs.map(t => renderTab(t))}
          </nav>
        </div>
      </div>
    </header>
  );
};
