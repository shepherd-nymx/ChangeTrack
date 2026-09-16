import React, { useState, useMemo } from 'react';
import { 
  User, 
  Phone, 
  Search, 
  X, 
  ArrowRight, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  FileSpreadsheet,
  Coins,
  Wallet,
  History,
  CheckCircle2,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ChangeRecord, Transaction, Shop, Employee, CustomerBalanceLedgerEntry } from '../types';
import { storage } from '../services/storage';
import { formatDateTime } from '../services/whatsapp';

interface CustomerHistoryModalProps {
  initialPhone?: string;
  shop: Shop;
  currentEmployee: Employee;
  onClose: () => void;
  onSelectRecord?: (recordId: string) => void;
}

export const CustomerHistoryModal: React.FC<CustomerHistoryModalProps> = ({
  initialPhone = '',
  shop,
  currentEmployee,
  onClose,
  onSelectRecord
}) => {
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [searchedPhone, setSearchedPhone] = useState(initialPhone || '+263771234567');
  const [activeTab, setActiveTab] = useState<'SLIPS' | 'LEDGER'>('SLIPS');
  const [isProcessingCollectAll, setIsProcessingCollectAll] = useState(false);
  const [collectSuccessMessage, setCollectSuccessMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const allRecords = storage.getChangeRecords();
  const currency = shop.currencySymbol || '$';

  // Filter records for customer
  const customerRecords = useMemo(() => {
    if (!searchedPhone) return [];
    const clean = searchedPhone.replace(/[^0-9]/g, '');
    if (!clean) return [];
    return allRecords.filter(r => r.customerPhone.replace(/[^0-9]/g, '').includes(clean));
  }, [searchedPhone, allRecords, refreshKey]);

  // Customer profile & ledger
  const customerProfile = useMemo(() => {
    return storage.getCustomerByPhone(searchedPhone);
  }, [searchedPhone, refreshKey]);

  const customerLedger = useMemo(() => {
    return storage.getCustomerLedger(searchedPhone);
  }, [searchedPhone, refreshKey]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalRecords = customerRecords.length;
    const outstanding = customerRecords.filter(r => r.status === 'OUTSTANDING');
    const collected = customerRecords.filter(r => r.status === 'COLLECTED');

    const totalOutstandingAmount = outstanding.reduce((s, r) => s + r.amountOwed, 0);
    const totalCollectedAmount = collected.reduce((s, r) => s + r.amountOwed, 0);

    const customerName = customerProfile?.name || customerRecords.find(r => r.customerName)?.customerName || 'Valued Customer';

    return {
      totalRecords,
      outstandingCount: outstanding.length,
      collectedCount: collected.length,
      totalOutstandingAmount: customerProfile?.totalBalanceOwed ?? totalOutstandingAmount,
      totalCollectedAmount: customerProfile?.totalCollectedLifetime ?? totalCollectedAmount,
      customerName
    };
  }, [customerRecords, customerProfile]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.trim()) {
      setSearchedPhone(phoneNumber.trim());
      setCollectSuccessMessage(null);
    }
  };

  const handlePayoutAll = async () => {
    if (!searchedPhone || stats.totalOutstandingAmount <= 0) return;
    setIsProcessingCollectAll(true);
    setCollectSuccessMessage(null);

    const res = await storage.collectFullCustomerBalance({
      phone: searchedPhone,
      employee: currentEmployee,
      method: 'PHONE'
    });

    setIsProcessingCollectAll(false);

    if (res.success) {
      setCollectSuccessMessage(`Successfully paid out ${currency}${res.totalAmountCollected.toFixed(2)} across ${res.collectedRecords.length} change slip(s). Customer WhatsApp balance updated to ${currency}0.00.`);
      setRefreshKey(prev => prev + 1);
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    } else {
      alert(res.error || 'Unable to process payout.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Customer Change & Balance Ledger</h3>
              <p className="text-xs text-slate-400">Cumulative outstanding change balance & real-time WhatsApp updates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                placeholder="Search phone number (e.g. +263 77 123 4567)..."
                className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              Search
            </button>
          </form>

          {/* Preset test customer pills */}
          <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-500 flex-wrap">
            <span>Recent Shoppers:</span>
            {['+263771234567', '+263719876543', '+263785551212'].map(p => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setPhoneNumber(p);
                  setSearchedPhone(p);
                  setCollectSuccessMessage(null);
                }}
                className="px-2 py-0.5 bg-white hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded font-mono text-[11px] transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Success Alert */}
        {collectSuccessMessage && (
          <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{collectSuccessMessage}</span>
          </div>
        )}

        {/* Customer Summary Metrics */}
        {searchedPhone && (
          <div className="p-5 border-b border-slate-100 bg-white">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
              <div>
                <h4 className="text-base font-extrabold text-slate-900">{stats.customerName}</h4>
                <p className="text-xs font-mono text-slate-500">{searchedPhone}</p>
              </div>
              <div className="flex items-center gap-2">
                {stats.totalOutstandingAmount > 0 && (
                  <button
                    onClick={handlePayoutAll}
                    disabled={isProcessingCollectAll}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isProcessingCollectAll ? 'Paying...' : `Payout Balance (${currency}${stats.totalOutstandingAmount.toFixed(2)})`}</span>
                  </button>
                )}
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {stats.totalRecords} event(s)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wider block">
                  Cumulative Owed
                </span>
                <span className="text-2xl font-black text-amber-900 font-mono-num">
                  {currency}{stats.totalOutstandingAmount.toFixed(2)}
                </span>
                <span className="text-[10px] text-amber-700 block mt-0.5 font-medium">
                  {stats.outstandingCount} active change slip(s)
                </span>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider block">
                  Lifetime Collected
                </span>
                <span className="text-2xl font-black text-emerald-900 font-mono-num">
                  {currency}{stats.totalCollectedAmount.toFixed(2)}
                </span>
                <span className="text-[10px] text-emerald-700 block mt-0.5 font-medium">
                  {stats.collectedCount} collected change(s)
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                  WhatsApp Status
                </span>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Real-time Synced
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Receives balance alerts
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Selector: Slips vs Balance Ledger */}
        <div className="flex border-b border-slate-200 bg-slate-100 px-5 text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('SLIPS')}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'SLIPS'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Change Slips ({customerRecords.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('LEDGER')}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'LEDGER'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Balance Ledger & WhatsApp Audit ({customerLedger.length})</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 max-h-[380px] overflow-y-auto space-y-3 bg-slate-50">
          {activeTab === 'SLIPS' ? (
            customerRecords.length > 0 ? (
              <div className="space-y-2">
                {customerRecords.map(rec => (
                  <div
                    key={rec.id}
                    className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-indigo-400 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-xs">{rec.id}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            rec.status === 'OUTSTANDING'
                              ? 'bg-amber-100 text-amber-800'
                              : rec.status === 'COLLECTED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </div>
                      <span className="font-mono-num font-black text-slate-900 text-sm">
                        {currency}{rec.amountOwed.toFixed(2)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400">Transaction Ref: </span>
                        <span className="font-mono font-semibold">{rec.transactionId}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Created: </span>
                        <span>{formatDateTime(rec.createdAt)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Recorded By: </span>
                        <span>{rec.cashierName}</span>
                      </div>
                      <div>
                        {rec.status === 'COLLECTED' ? (
                          <div>
                            <span className="text-slate-400">Collected: </span>
                            <span className="font-semibold text-emerald-700">
                              {rec.collectedAt ? formatDateTime(rec.collectedAt) : 'Yes'} by {rec.collectedByEmployeeName}
                            </span>
                          </div>
                        ) : rec.status === 'CANCELLED' ? (
                          <div>
                            <span className="text-slate-400">Cancelled by: </span>
                            <span className="text-rose-700 font-semibold">{rec.cancelledByEmployeeName}</span>
                          </div>
                        ) : (
                          <div className="text-amber-700 font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Awaiting Customer Collection</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {rec.status === 'OUTSTANDING' && onSelectRecord && (
                      <div className="pt-1 flex justify-end">
                        <button
                          onClick={() => {
                            onSelectRecord(rec.id);
                            onClose();
                          }}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                        >
                          Verify & Collect This Slip <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No change records on file for this phone number.
              </div>
            )
          ) : (
            /* Balance Ledger View */
            customerLedger.length > 0 ? (
              <div className="space-y-2">
                {customerLedger.map(entry => {
                  const isCredit = entry.amountChange > 0;
                  return (
                    <div
                      key={entry.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1.5 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {isCredit ? (
                            <span className="flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                              <TrendingUp className="w-3 h-3" />
                              CHANGE ADDED
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              <TrendingDown className="w-3 h-3" />
                              CHANGE COLLECTED
                            </span>
                          )}
                          <span className="font-mono text-slate-500 text-[11px]">{entry.changeRecordId}</span>
                        </div>
                        <span className={`font-mono font-black text-sm ${isCredit ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {isCredit ? '+' : ''}{currency}{entry.amountChange.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        <span>
                          Balance: <span className="font-mono text-slate-600">{currency}{entry.previousBalance.toFixed(2)}</span> → <strong className="font-mono text-slate-900">{currency}{entry.newBalance.toFixed(2)}</strong>
                        </span>
                        <span>{formatDateTime(entry.timestamp)}</span>
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center justify-between">
                        <span>Staff: {entry.actorName}</span>
                        <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-medium">WhatsApp Updated</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No ledger balance movements recorded for this customer yet.
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
