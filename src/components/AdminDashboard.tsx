import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  TrendingUp, 
  Download, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  ShieldCheck, 
  RotateCcw,
  Calendar,
  Layers,
  Phone,
  BarChart3,
  UserCheck,
  PlusCircle,
  Eye,
  Trash2,
  Lock,
  Store,
  MessageSquare,
  Edit3,
  Check,
  X
} from 'lucide-react';
import { Shop, Employee, ChangeRecord, Transaction, AuditLog, DashboardStats } from '../types';
import { storage } from '../services/storage';
import { 
  formatDateTime, 
  buildWhatsAppDirectLink, 
  generateRecordChangeMessage, 
  generateCollectedChangeMessage 
} from '../services/whatsapp';
import { VerificationModal } from './VerificationModal';
import { CustomerHistoryModal } from './CustomerHistoryModal';
import { ReceiptModal } from './ReceiptModal';

interface AdminDashboardProps {
  currentEmployee: Employee;
  shop: Shop;
  onRefresh: () => void;
  onOpenWhatsAppSettings: () => void;
  onOpenEmployeesModal: () => void;
  onOpenShopSettings: () => void;
  onLockDashboard?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentEmployee,
  shop,
  onRefresh,
  onOpenWhatsAppSettings,
  onOpenEmployeesModal,
  onOpenShopSettings,
  onLockDashboard
}) => {
  const [activeTab, setActiveTab] = useState<'RECORDS' | 'TRANSACTIONS' | 'AUDIT' | 'CHARTS'>('RECORDS');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OUTSTANDING' | 'COLLECTED' | 'CANCELLED'>('ALL');
  
  // Modals
  const [verifyRecordId, setVerifyRecordId] = useState<string | null>(null);
  const [historyPhone, setHistoryPhone] = useState<string | null>(null);
  const [selectedReceiptRecord, setSelectedReceiptRecord] = useState<ChangeRecord | null>(null);

  // Admin Cancel Modal
  const [cancellingRecord, setCancellingRecord] = useState<ChangeRecord | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Editable Admin Name State
  const currentAdminName = shop.ownerName || storage.getAdminName();
  const [isEditingAdminName, setIsEditingAdminName] = useState(false);
  const [adminNameInput, setAdminNameInput] = useState(currentAdminName);
  const [adminSaveFeedback, setAdminSaveFeedback] = useState<string | null>(null);

  // Sync adminNameInput when shop or currentEmployee changes
  React.useEffect(() => {
    if (!isEditingAdminName) {
      setAdminNameInput(shop.ownerName || storage.getAdminName());
    }
  }, [shop.ownerName, isEditingAdminName]);

  const handleSaveAdminName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = adminNameInput.trim();
    if (!clean) {
      alert('Administrator name cannot be blank.');
      return;
    }
    const res = storage.updateAdminName(clean, currentEmployee);
    if (res.success) {
      setIsEditingAdminName(false);
      setAdminSaveFeedback(`Admin name updated to "${clean}"`);
      setTimeout(() => setAdminSaveFeedback(null), 3500);
      onRefresh();
    } else {
      alert(res.error || 'Failed to update administrator name.');
    }
  };

  const stats: DashboardStats = storage.getDashboardStats();
  const allRecords = storage.getChangeRecords();
  const allTxs = storage.getTransactions();
  const allLogs = storage.getAuditLogs();
  const employees = storage.getEmployees();
  const currency = shop.currencySymbol || '$';

  // Filtered change records
  const filteredRecords = useMemo(() => {
    return allRecords.filter(r => {
      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const clean = searchTerm.trim().toLowerCase();
      const matchesSearch = !clean || 
        r.id.toLowerCase().includes(clean) ||
        r.customerPhone.toLowerCase().includes(clean) ||
        (r.customerName && r.customerName.toLowerCase().includes(clean)) ||
        r.cashierName.toLowerCase().includes(clean) ||
        r.transactionId.toLowerCase().includes(clean);
      return matchesStatus && matchesSearch;
    });
  }, [allRecords, statusFilter, searchTerm]);

  // Filtered transactions
  const filteredTxs = useMemo(() => {
    return allTxs.filter(t => {
      const clean = searchTerm.trim().toLowerCase();
      return !clean ||
        t.id.toLowerCase().includes(clean) ||
        t.cashierName.toLowerCase().includes(clean) ||
        (t.customerPhone && t.customerPhone.toLowerCase().includes(clean)) ||
        (t.changeRecordId && t.changeRecordId.toLowerCase().includes(clean));
    });
  }, [allTxs, searchTerm]);

  // Cashier performance analytics
  const cashierMetrics = useMemo(() => {
    return employees.map(emp => {
      const empTxs = allTxs.filter(t => t.cashierId === emp.id);
      const empCreatedRecords = allRecords.filter(r => r.cashierId === emp.id);
      const empCollectedRecords = allRecords.filter(r => r.collectedByEmployeeId === emp.id);
      const totalRecordedAmt = empCreatedRecords.reduce((sum, r) => sum + r.amountOwed, 0);
      const totalCollectedAmt = empCollectedRecords.reduce((sum, r) => sum + r.amountOwed, 0);
      return {
        ...emp,
        txCount: empTxs.length,
        recordsCreated: empCreatedRecords.length,
        recordedAmount: totalRecordedAmt,
        recordsCollected: empCollectedRecords.length,
        collectedAmount: totalCollectedAmt
      };
    });
  }, [employees, allTxs, allRecords]);

  // Export to CSV
  const handleExportCSV = (type: 'RECORDS' | 'TRANSACTIONS' | 'AUDIT') => {
    let csvContent = '';
    let filename = '';

    if (type === 'RECORDS') {
      filename = `ChangeTrack_ChangeRecords_${new Date().toISOString().split('T')[0]}.csv`;
      csvContent = 'Change_ID,Transaction_ID,Amount,Status,Customer_Phone,Customer_Name,Cashier_Created,Created_At,Collected_By,Collected_At,Collection_Method\n' +
        allRecords.map(r => 
          `"${r.id}","${r.transactionId}",${r.amountOwed},"${r.status}","${r.customerPhone}","${r.customerName || ''}","${r.cashierName}","${r.createdAt}","${r.collectedByEmployeeName || ''}","${r.collectedAt || ''}","${r.collectionMethod || ''}"`
        ).join('\n');
    } else if (type === 'TRANSACTIONS') {
      filename = `ChangeTrack_Transactions_${new Date().toISOString().split('T')[0]}.csv`;
      csvContent = 'Transaction_ID,Purchase_Total,Amount_Received,Change_Calculated,Change_Given_Now,Change_Owed,Cashier,Created_At,Customer_Phone\n' +
        allTxs.map(t =>
          `"${t.id}",${t.purchaseTotal},${t.amountReceived},${t.changeCalculated},${t.changeGivenNow},${t.changeOwed},"${t.cashierName}","${t.createdAt}","${t.customerPhone || ''}"`
        ).join('\n');
    } else {
      filename = `ChangeTrack_AuditLog_${new Date().toISOString().split('T')[0]}.csv`;
      csvContent = 'Timestamp,Action,Entity_Type,Entity_ID,Actor_Name,Actor_Role,Details\n' +
        allLogs.map(l =>
          `"${l.timestamp}","${l.action}","${l.entityType}","${l.entityId}","${l.actorName}","${l.actorRole}","${l.details.replace(/"/g, '""')}"`
        ).join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAdminConfirmCancel = () => {
    if (!cancellingRecord || !cancelReason.trim()) {
      alert('Please provide a mandatory reason for cancelling this change record.');
      return;
    }

    const res = storage.cancelChangeRecord({
      changeId: cancellingRecord.id,
      adminEmployee: currentEmployee,
      reason: cancelReason.trim()
    });

    if (res.success) {
      setCancellingRecord(null);
      setCancelReason('');
      onRefresh();
      alert(`Record ${cancellingRecord.id} has been marked CANCELLED with audit note.`);
    } else {
      alert(res.error || 'Cancellation failed');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {shop.logoUrl ? (
            <img
              src={shop.logoUrl}
              alt={shop.name}
              className="w-14 h-14 rounded-2xl object-contain bg-white border border-slate-200 p-1 shadow-xs shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Store className="w-7 h-7" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">{shop.name}</h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Admin & Owner Console
              </span>
            </div>
            
            {/* Administrator Name Display & Inline Quick Edit */}
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">Admin:</span>
                {isEditingAdminName ? (
                  <form onSubmit={handleSaveAdminName} className="flex items-center gap-1">
                    <input
                      type="text"
                      value={adminNameInput}
                      onChange={e => setAdminNameInput(e.target.value)}
                      placeholder="Admin Name"
                      className="px-2.5 py-0.5 text-xs font-bold bg-white border-2 border-indigo-500 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-xs"
                      autoFocus
                    />
                    <button
                      type="submit"
                      title="Save admin name"
                      className="p-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-2xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAdminNameInput(currentAdminName);
                        setIsEditingAdminName(false);
                      }}
                      title="Cancel"
                      className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span 
                      onClick={() => {
                        setAdminNameInput(currentAdminName);
                        setIsEditingAdminName(true);
                      }}
                      title="Click to edit Administrator name"
                      className="font-extrabold text-indigo-950 bg-indigo-50/80 hover:bg-indigo-100/90 border border-indigo-200/80 px-2 py-0.5 rounded-lg cursor-pointer transition-colors"
                    >
                      {currentAdminName}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAdminNameInput(currentAdminName);
                        setIsEditingAdminName(true);
                      }}
                      title="Edit Administrator Name"
                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span className="text-[10px] text-indigo-600 font-bold hidden sm:inline">Edit</span>
                    </button>
                  </div>
                )}
              </div>

              {adminSaveFeedback && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md animate-fade-in flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {adminSaveFeedback}
                </span>
              )}

              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="text-slate-500 text-[11px]">Branch: {shop.branchName || 'Main Till'}</span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="text-slate-500 text-[11px] truncate max-w-[220px]">{shop.address}</span>
            </div>
          </div>
        </div>

        {/* Global Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenShopSettings}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <Store className="w-4 h-4 text-indigo-600" />
            <span>Shop Info & Logo</span>
          </button>
          <button
            onClick={() => handleExportCSV('RECORDS')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenEmployeesModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            <Users className="w-4 h-4 text-slate-500" />
            <span>Manage Cashiers ({employees.length})</span>
          </button>
          <button
            onClick={onOpenWhatsAppSettings}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>WhatsApp Settings</span>
          </button>
          {onLockDashboard && shop.isPasscodeRequired && (
            <button
              onClick={onLockDashboard}
              title="Lock Owner Console to prevent unauthorized till access"
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold transition-colors"
            >
              <Lock className="w-4 h-4 text-rose-600" />
              <span>Lock Console</span>
            </button>
          )}
        </div>
      </div>

      {/* 6 Core Dashboard Metric KPI Cards (Prompt requirements) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-3.5">
        {/* 1. Today's Sales */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
            Today's Sales
          </span>
          <div className="my-2">
            <span className="text-2xl font-black text-slate-900 font-mono-num">
              {currency}{stats.todaySales.toFixed(2)}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            {stats.todayTransactionsCount} transactions today
          </span>
        </div>

        {/* 2. Outstanding Change */}
        <div className="bg-white p-4 rounded-2xl border-2 border-amber-300 shadow-xs flex flex-col justify-between bg-amber-50/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wider">
              Outstanding Change
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-black text-amber-950 font-mono-num">
              {currency}{stats.totalOutstandingChange.toFixed(2)}
            </span>
          </div>
          <span className="text-[10px] text-amber-800 font-medium">
            Shop debt owed to customers
          </span>
        </div>

        {/* 3. Change Collected Today */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider">
            Collected Today
          </span>
          <div className="my-2">
            <span className="text-2xl font-black text-emerald-900 font-mono-num">
              {currency}{stats.todayChangeCollected.toFixed(2)}
            </span>
          </div>
          <span className="text-[10px] text-emerald-700 font-medium">
            {stats.todayChangeCollectedCount} records handed over
          </span>
        </div>

        {/* 4. Number of Outstanding Records */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
            Outstanding Slips
          </span>
          <div className="my-2">
            <span className="text-2xl font-black text-slate-900 font-mono-num">
              {stats.totalOutstandingRecordsCount}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            Awaiting claim at till
          </span>
        </div>

        {/* 5. Active Disputes */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
            Active Disputes
          </span>
          <div className="my-2">
            <span className="text-2xl font-black text-slate-900 font-mono-num">
              {stats.activeDisputesCount}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            {stats.activeDisputesCount > 0 ? 'Review audit trail' : 'No open disputes'}
          </span>
        </div>

        {/* 6. Total Collected (All Time) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
            Total All-Time Settled
          </span>
          <div className="my-2">
            <span className="text-2xl font-black text-slate-900 font-mono-num">
              {currency}{stats.totalChangeCollectedAllTime.toFixed(2)}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            Total verified change
          </span>
        </div>
      </div>

      {/* Main Content Workspace with Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 px-4 sm:px-6 pt-3 bg-slate-50/50 gap-2">
          <div className="flex gap-1 overflow-x-auto text-xs font-bold no-scrollbar max-w-full pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('RECORDS')}
              className={`py-3 px-4 rounded-t-xl transition-all shrink-0 ${
                activeTab === 'RECORDS'
                  ? 'bg-white border-t-2 border-x border-slate-200 text-slate-900 font-extrabold -mb-[1px]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Change Records ({allRecords.length})
            </button>
            <button
              onClick={() => setActiveTab('TRANSACTIONS')}
              className={`py-3 px-4 rounded-t-xl transition-all shrink-0 ${
                activeTab === 'TRANSACTIONS'
                  ? 'bg-white border-t-2 border-x border-slate-200 text-slate-900 font-extrabold -mb-[1px]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Till Transactions ({allTxs.length})
            </button>
            <button
              onClick={() => setActiveTab('CHARTS')}
              className={`py-3 px-4 rounded-t-xl transition-all shrink-0 ${
                activeTab === 'CHARTS'
                  ? 'bg-white border-t-2 border-x border-slate-200 text-slate-900 font-extrabold -mb-[1px]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Daily Trends & Cashier Activity
            </button>
            <button
              onClick={() => setActiveTab('AUDIT')}
              className={`py-3 px-4 rounded-t-xl transition-all shrink-0 ${
                activeTab === 'AUDIT'
                  ? 'bg-white border-t-2 border-x border-slate-200 text-slate-900 font-extrabold -mb-[1px]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tamper-Resistant Audit Log ({allLogs.length})
            </button>
          </div>

          {/* Quick Search & Filter bar for tables */}
          {(activeTab === 'RECORDS' || activeTab === 'TRANSACTIONS') && (
            <div className="py-2 flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search phone, ID, name..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full sm:w-auto pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>

              {activeTab === 'RECORDS' && (
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="py-1.5 px-2 text-xs bg-white border border-slate-300 rounded-lg font-semibold text-slate-700 shrink-0"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="OUTSTANDING">🟠 OUTSTANDING</option>
                  <option value="COLLECTED">🟢 COLLECTED</option>
                  <option value="CANCELLED">🔴 CANCELLED</option>
                </select>
              )}
            </div>
          )}
        </div>

        {/* TAB 1: CHANGE RECORDS LEDGER */}
        {activeTab === 'RECORDS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Change ID</th>
                  <th className="py-3 px-4">Tx Ref</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Date Recorded</th>
                  <th className="py-3 px-4">Cashier (Created)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Collection / Cancel Details</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-black text-slate-900">{rec.id}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{rec.transactionId}</td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => setHistoryPhone(rec.customerPhone)}
                        className="text-left group"
                      >
                        <span className="font-bold text-slate-900 group-hover:text-indigo-600 block">
                          {rec.customerName || 'Customer'}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500 group-hover:underline">
                          {rec.customerPhone}
                        </span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-mono-num font-extrabold text-sm text-slate-900">
                      {currency}{rec.amountOwed.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {formatDateTime(rec.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {rec.cashierName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          rec.status === 'OUTSTANDING'
                            ? 'bg-amber-100 text-amber-800'
                            : rec.status === 'COLLECTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {rec.status === 'OUTSTANDING' && '🟠 '}
                        {rec.status === 'COLLECTED' && '🟢 '}
                        {rec.status === 'CANCELLED' && '🔴 '}
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {rec.status === 'COLLECTED' && rec.collectedAt && (
                        <div className="text-[11px]">
                          <span className="font-semibold text-emerald-800">Collected by {rec.collectedByEmployeeName}</span>
                          <div className="text-[10px] text-slate-400">{formatDateTime(rec.collectedAt)}</div>
                        </div>
                      )}
                      {rec.status === 'CANCELLED' && (
                        <div className="text-[11px] text-rose-700">
                          <span className="font-semibold">Voided by {rec.cancelledByEmployeeName}</span>
                          <div className="text-[10px] text-slate-500 italic">"{rec.cancellationReason}"</div>
                        </div>
                      )}
                      {rec.status === 'OUTSTANDING' && (
                        <span className="text-[11px] text-amber-700 italic">Awaiting collection</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      {/* WhatsApp Direct Chat Link */}
                      <a
                        href={buildWhatsAppDirectLink(
                          rec.customerPhone,
                          rec.status === 'COLLECTED'
                            ? generateCollectedChangeMessage(shop, rec, 0)
                            : generateRecordChangeMessage(shop, rec)
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={rec.status === 'COLLECTED' ? "Send Collection Confirmation via WhatsApp" : "Send Change Slip via WhatsApp"}
                        className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors inline-flex items-center"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>

                      <button
                        onClick={() => setSelectedReceiptRecord(rec)}
                        title="View & Print Slip"
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {rec.status === 'OUTSTANDING' && (
                        <>
                          <button
                            onClick={() => setVerifyRecordId(rec.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors"
                          >
                            Collect
                          </button>
                          {currentEmployee.role === 'ADMIN' && (
                            <button
                              onClick={() => setCancellingRecord(rec)}
                              title="Void / Cancel Record"
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: ALL TRANSACTIONS */}
        {activeTab === 'TRANSACTIONS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Purchase Total</th>
                  <th className="py-3 px-4">Amount Tendered</th>
                  <th className="py-3 px-4">Change Calculated</th>
                  <th className="py-3 px-4">Change Given Now</th>
                  <th className="py-3 px-4">Change Recorded</th>
                  <th className="py-3 px-4">Change ID</th>
                  <th className="py-3 px-4">Cashier</th>
                  <th className="py-3 px-4">Date / Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTxs.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{t.id}</td>
                    <td className="py-3.5 px-4 font-mono-num font-bold">{currency}{t.purchaseTotal.toFixed(2)}</td>
                    <td className="py-3.5 px-4 font-mono-num">{currency}{t.amountReceived.toFixed(2)}</td>
                    <td className="py-3.5 px-4 font-mono-num">{currency}{t.changeCalculated.toFixed(2)}</td>
                    <td className="py-3.5 px-4 font-mono-num text-emerald-700 font-semibold">{currency}{t.changeGivenNow.toFixed(2)}</td>
                    <td className="py-3.5 px-4 font-mono-num text-amber-700 font-bold">
                      {t.changeOwed > 0 ? `${currency}${t.changeOwed.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {t.changeRecordId ? (
                        <button
                          onClick={() => setVerifyRecordId(t.changeRecordId!)}
                          className="font-bold text-indigo-600 hover:underline"
                        >
                          {t.changeRecordId}
                        </button>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{t.cashierName}</td>
                    <td className="py-3.5 px-4 text-slate-500">{formatDateTime(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: CHARTS & CASHIER ACTIVITY */}
        {activeTab === 'CHARTS' && (
          <div className="p-6 space-y-6">
            {/* Cashier Activity Breakdown */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Cashier Till Activity & Change Records Created</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {cashierMetrics.map(emp => (
                  <div key={emp.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-9 h-9 rounded-xl ${emp.avatarColor || 'bg-slate-700'} text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs`}>
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 truncate leading-tight">{emp.name}</h4>
                          <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                            emp.role === 'ADMIN' ? 'text-indigo-700 bg-indigo-50' : 'text-emerald-700 bg-emerald-50'
                          }`}>
                            {emp.role}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span 
                          className={`w-2 h-2 rounded-full ${emp.active ? 'bg-emerald-500' : 'bg-rose-400'}`} 
                          title={emp.active ? 'Active' : 'Suspended'}
                        />
                        <button
                          onClick={onOpenEmployeesModal}
                          title={`Manage or edit ${emp.name}`}
                          className="px-2 py-1 bg-white hover:bg-indigo-50 text-indigo-700 hover:text-indigo-900 border border-slate-200 hover:border-indigo-300 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1 shadow-2xs"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Manage</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Till Sales:</span>
                        <span className="font-bold text-slate-800">{emp.txCount} txs</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Change Slips Created:</span>
                        <span className="font-bold text-amber-700">{emp.recordsCreated} slips ({currency}{emp.recordedAmount.toFixed(2)})</span>
                      </div>
                      <div className="col-span-2 pt-1">
                        <span className="text-slate-400 block text-[10px]">Change Disbursed & Collected:</span>
                        <span className="font-bold text-emerald-700">{emp.recordsCollected} records ({currency}{emp.collectedAmount.toFixed(2)})</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Trend Visualizer */}
            <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm">Outstanding vs. Collected Change Balance</h4>
                  <p className="text-xs text-slate-400">Total volume recorded and reconciled across all till shifts</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <span className="w-3 h-3 rounded-xs bg-amber-500" /> Outstanding ({currency}{stats.totalOutstandingChange.toFixed(2)})
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-3 h-3 rounded-xs bg-emerald-500" /> Settled ({currency}{stats.totalChangeCollectedAllTime.toFixed(2)})
                  </span>
                </div>
              </div>

              {/* Progress visual comparison bar */}
              <div className="space-y-1.5">
                <div className="h-4 bg-slate-800 rounded-full overflow-hidden flex">
                  <div 
                    style={{ 
                      width: `${(stats.totalChangeCollectedAllTime / (stats.totalChangeRecordedAllTime || 1)) * 100}%` 
                    }} 
                    className="bg-emerald-500 h-full transition-all duration-500" 
                    title="Collected"
                  />
                  <div 
                    style={{ 
                      width: `${(stats.totalOutstandingChange / (stats.totalChangeRecordedAllTime || 1)) * 100}%` 
                    }} 
                    className="bg-amber-500 h-full transition-all duration-500" 
                    title="Outstanding"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>Reconciled: {Math.round((stats.totalChangeCollectedAllTime / (stats.totalChangeRecordedAllTime || 1)) * 100)}%</span>
                  <span>Total Generated: {currency}{stats.totalChangeRecordedAllTime.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TAMPER-RESISTANT AUDIT LOG */}
        {activeTab === 'AUDIT' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-700" />
                  <span>Immutable Audit Ledger</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Permanent record of every cashier action, change issuance, WhatsApp notification, and collection event.
                </p>
              </div>
              <button
                onClick={() => handleExportCSV('AUDIT')}
                className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Audit CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Entity Ref</th>
                    <th className="py-2.5 px-3">Actor / Employee</th>
                    <th className="py-2.5 px-3">Tamper-Proof Audit Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {allLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-3 text-indigo-700 font-bold">
                        {log.entityId}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className="font-bold">{log.actorName}</span>{' '}
                        <span className="text-[10px] text-slate-400 font-mono">({log.actorRole})</span>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-600">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Verification Modal trigger */}
      {verifyRecordId && (
        <VerificationModal
          initialSearchQuery={verifyRecordId}
          currentEmployee={currentEmployee}
          shop={shop}
          onClose={() => setVerifyRecordId(null)}
          onRecordUpdated={onRefresh}
        />
      )}

      {/* Customer History Modal trigger */}
      {historyPhone && (
        <CustomerHistoryModal
          initialPhone={historyPhone}
          shop={shop}
          currentEmployee={currentEmployee}
          onClose={() => setHistoryPhone(null)}
          onSelectRecord={id => setVerifyRecordId(id)}
        />
      )}

      {/* Printable Receipt Modal */}
      {selectedReceiptRecord && (
        <ReceiptModal
          changeRecord={selectedReceiptRecord}
          shop={shop}
          onClose={() => setSelectedReceiptRecord(null)}
        />
      )}

      {/* Admin Cancellation Modal */}
      {cancellingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Void Change Record {cancellingRecord.id}</span>
              </h3>
              <button onClick={() => setCancellingRecord(null)} className="text-slate-400 font-bold">×</button>
            </div>

            <p className="text-xs text-slate-600">
              You are about to cancel outstanding change of <strong>{currency}{cancellingRecord.amountOwed.toFixed(2)}</strong> for {cancellingRecord.customerPhone}. This action will be permanently recorded in the audit log.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mandatory Reason for Cancellation
              </label>
              <textarea
                required
                rows={3}
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="e.g. Cashier located exact coins before customer departed..."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCancellingRecord(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAdminConfirmCancel}
                disabled={!cancelReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
