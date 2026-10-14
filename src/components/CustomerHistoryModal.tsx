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
  Coins,
  Wallet,
  History,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ChangeRecord, Transaction, Shop, Employee } from '../types';
import { storage } from '../services/storage';
import { 
  formatDateTime, 
  buildWhatsAppDirectLink, 
  generateRecordChangeMessage, 
  generateCollectedChangeMessage 
} from '../services/whatsapp';

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
  const [lastPayoutWaLink, setLastPayoutWaLink] = useState<string | null>(null);
  const [lastPayoutWaText, setLastPayoutWaText] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const allRecords = storage.getChangeRecords();
  const currency = shop.currencySymbol || '$';
  const waConfig = storage.getWhatsAppConfig();
  const defaultCountryCode = waConfig.defaultCountryCode || '+263';

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
      setLastPayoutWaLink(null);
      setLastPayoutWaText(null);
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
      setCollectSuccessMessage(`Successfully paid out ${currency}${res.totalAmountCollected.toFixed(2)} across ${res.collectedRecords.length} change slip(s).`);
      setLastPayoutWaLink(res.waDirectLink || null);
      setLastPayoutWaText(res.waMessageText || null);
      setRefreshKey(prev => prev + 1);

      if (waConfig.autoOpenRedirectOnCollect && res.waDirectLink) {
        window.open(res.waDirectLink, '_blank', 'noopener,noreferrer');
      }

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

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative surface-card w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-6 rise-in">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-ink-900 text-white flex items-center justify-between border-b border-ink-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-500/20 text-brand-400 rounded-xl border border-brand-500/30">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight">Customer Change & Balance Ledger</h3>
              <p className="text-[11px] sm:text-xs text-ink-400">Cumulative balance tracking & direct WhatsApp change slips</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-ink-400 hover:text-white hover:bg-ink-800 transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-ink-50 border-b border-ink-200">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                type="text"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                placeholder="Search WhatsApp phone number (e.g. 77 123 4567)..."
                className="w-full pl-10 pr-3 py-2.5 min-h-[44px] bg-white border border-ink-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 min-h-[44px] bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all duration-200 tap-scale shadow-xs"
            >
              Search
            </button>
          </form>

          {/* Preset test customer pills */}
          <div className="mt-2.5 flex items-center gap-2 text-xs text-ink-500 flex-wrap">
            <span>Recent Shoppers:</span>
            {['+263771234567', '+263719876543', '+263785551212'].map(p => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setPhoneNumber(p);
                  setSearchedPhone(p);
                  setCollectSuccessMessage(null);
                  setLastPayoutWaLink(null);
                  setLastPayoutWaText(null);
                }}
                className="px-2 py-1 bg-white hover:bg-brand-50 hover:text-brand-700 border border-ink-200 rounded-lg font-mono text-[11px] transition-all duration-200 tap-scale"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Success Alert with WhatsApp Button */}
        {collectSuccessMessage && (
          <div className="p-4 bg-brand-50 border-b border-brand-200 text-brand-900 text-xs font-medium space-y-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0" />
              <span className="font-bold text-sm">{collectSuccessMessage}</span>
            </div>

            {lastPayoutWaLink && (
              <div className="pt-2 flex items-center gap-2 flex-wrap">
                <a
                  href={lastPayoutWaLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-xs transition-all duration-200 tap-scale"
                >
                  <MessageSquare className="w-4 h-4 fill-white" />
                  <span>Send WhatsApp Settlement Receipt</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {lastPayoutWaText && (
                  <button
                    type="button"
                    onClick={() => handleCopyText(lastPayoutWaText)}
                    className="px-3 py-2 bg-white hover:bg-brand-100 text-brand-800 border border-brand-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all duration-200 tap-scale"
                  >
                    {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedText ? 'Copied' : 'Copy Text'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Customer Summary Metrics */}
        {searchedPhone && (
          <div className="p-4 sm:p-5 border-b border-ink-100 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-3">
              <div>
                <h4 className="text-base font-extrabold tracking-tight text-ink-900">{stats.customerName}</h4>
                <p className="text-xs font-mono text-ink-500">{searchedPhone}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {stats.totalOutstandingAmount > 0 && (
                  <button
                    onClick={handlePayoutAll}
                    disabled={isProcessingCollectAll}
                    className="px-3.5 py-2 min-h-[40px] bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all duration-200 tap-scale flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isProcessingCollectAll ? 'Paying...' : `Payout Balance (${currency}${stats.totalOutstandingAmount.toFixed(2)})`}</span>
                  </button>
                )}
                <span className="text-xs font-bold text-ink-600 bg-ink-100 px-2.5 py-1.5 rounded-lg">
                  {stats.totalRecords} event(s)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wide block">
                  Cumulative Owed
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-900 font-mono-num">
                  {currency}{stats.totalOutstandingAmount.toFixed(2)}
                </span>
                <span className="text-[10px] text-amber-700 block mt-0.5 font-medium">
                  {stats.outstandingCount} active change slip(s)
                </span>
              </div>

              <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-brand-800 tracking-wide block">
                  Lifetime Collected
                </span>
                <span className="text-xl sm:text-2xl font-black text-brand-900 font-mono-num">
                  {currency}{stats.totalCollectedAmount.toFixed(2)}
                </span>
                <span className="text-[10px] text-brand-700 block mt-0.5 font-medium">
                  {stats.collectedCount} collected change(s)
                </span>
              </div>

              <div className="p-3 bg-ink-50 border border-ink-200 rounded-xl col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold uppercase text-ink-500 tracking-wide block">
                  WhatsApp Direct
                </span>
                <span className="text-xs font-bold text-ink-800 flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3.5 h-3.5 text-brand-600" />
                  Direct Redirect Active
                </span>
                <span className="text-[10px] text-ink-400 block mt-0.5">
                  No Meta API credentials needed
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Selector: Slips vs Balance Ledger */}
        <div className="flex border-b border-ink-200 bg-ink-100 px-4 sm:px-5 text-xs font-bold text-ink-600">
          <button
            onClick={() => setActiveTab('SLIPS')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'SLIPS'
                ? 'border-brand-600 text-brand-700 bg-white'
                : 'border-transparent hover:text-ink-900'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Change Slips ({customerRecords.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('LEDGER')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'LEDGER'
                ? 'border-brand-600 text-brand-700 bg-white'
                : 'border-transparent hover:text-ink-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Balance Ledger & WhatsApp Audit ({customerLedger.length})</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-5 max-h-[380px] overflow-y-auto space-y-3 bg-ink-50">
          {activeTab === 'SLIPS' ? (
            customerRecords.length > 0 ? (
              <div className="space-y-2.5">
                {customerRecords.map(rec => {
                  const slipMessage = rec.status === 'COLLECTED'
                    ? generateCollectedChangeMessage(shop, rec, 0)
                    : generateRecordChangeMessage(shop, rec);
                  const slipWaLink = buildWhatsAppDirectLink(rec.customerPhone, slipMessage, defaultCountryCode);

                  return (
                    <div
                      key={rec.id}
                      className="p-3.5 bg-white border border-ink-200 rounded-xl shadow-xs hover:border-brand-400 transition-all duration-200 space-y-2 rise-in"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-ink-900 text-xs">{rec.id}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wide ${
                              rec.status === 'OUTSTANDING'
                                ? 'bg-amber-100 text-amber-800'
                                : rec.status === 'COLLECTED'
                                ? 'bg-brand-100 text-brand-800'
                                : 'bg-ink-100 border border-ink-200 text-ink-600'
                            }`}
                          >
                            {rec.status}
                          </span>
                        </div>
                        <span className="font-mono-num font-black text-ink-900 text-sm">
                          {currency}{rec.amountOwed.toFixed(2)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-ink-600 pt-1 border-t border-ink-100">
                        <div>
                          <span className="text-ink-400">Transaction: </span>
                          <span className="font-mono font-semibold">{rec.transactionId}</span>
                        </div>
                        <div>
                          <span className="text-ink-400">Created: </span>
                          <span>{formatDateTime(rec.createdAt)}</span>
                        </div>
                        <div>
                          <span className="text-ink-400">Cashier: </span>
                          <span>{rec.cashierName}</span>
                        </div>
                        <div>
                          {rec.status === 'COLLECTED' ? (
                            <div>
                              <span className="text-ink-400">Collected: </span>
                              <span className="font-semibold text-brand-700">
                                {rec.collectedAt ? formatDateTime(rec.collectedAt) : 'Yes'}
                              </span>
                            </div>
                          ) : rec.status === 'CANCELLED' ? (
                            <div>
                              <span className="text-ink-400">Cancelled by: </span>
                              <span className="text-rose-700 font-semibold">{rec.cancelledByEmployeeName}</span>
                            </div>
                          ) : (
                            <div className="text-amber-700 font-semibold flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Awaiting Collection</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Slip Action Bar with WhatsApp Redirect */}
                      <div className="pt-2 flex items-center justify-between border-t border-ink-100 text-xs flex-wrap gap-2">
                        <a
                          href={slipWaLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-700 hover:text-brand-900 font-bold flex items-center gap-1 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200 transition-all duration-200 tap-scale"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-brand-600" />
                          <span>{rec.status === 'COLLECTED' ? 'Resend Collection Receipt' : 'Open WhatsApp Slip'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        {rec.status === 'OUTSTANDING' && onSelectRecord && (
                          <button
                            onClick={() => {
                              onSelectRecord(rec.id);
                              onClose();
                            }}
                            className="text-xs text-brand-600 hover:text-brand-800 font-bold flex items-center gap-1 py-1 transition-all duration-200"
                          >
                            Verify & Collect <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-ink-400 text-xs">
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
                      className="p-3 bg-white border border-ink-200 rounded-xl text-xs space-y-1.5 shadow-xs rise-in"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {isCredit ? (
                            <span className="flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg uppercase tracking-wide">
                              <TrendingUp className="w-3 h-3" />
                              CHANGE ADDED
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-lg uppercase tracking-wide">
                              <TrendingDown className="w-3 h-3" />
                              CHANGE COLLECTED
                            </span>
                          )}
                          <span className="font-mono text-ink-500 text-[11px]">{entry.changeRecordId}</span>
                        </div>
                        <span className={`font-mono-num font-black text-sm ${isCredit ? 'text-amber-600' : 'text-brand-600'}`}>
                          {isCredit ? '+' : ''}{currency}{entry.amountChange.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-ink-500 pt-1 border-t border-ink-100">
                        <span>
                          Balance: <span className="font-mono text-ink-600 font-mono-num">{currency}{entry.previousBalance.toFixed(2)}</span> → <strong className="font-mono text-ink-900 font-mono-num">{currency}{entry.newBalance.toFixed(2)}</strong>
                        </span>
                        <span>{formatDateTime(entry.timestamp)}</span>
                      </div>

                      <div className="text-[11px] text-ink-500 flex items-center justify-between">
                        <span>Staff: {entry.actorName}</span>
                        <span className="text-[10px] text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded-lg font-medium uppercase tracking-wide">WhatsApp Sync Logged</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-ink-400 text-xs">
                No ledger balance movements recorded for this customer yet.
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-ink-100 border-t border-ink-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 min-h-[38px] bg-white hover:bg-ink-200 text-ink-800 font-bold text-xs rounded-xl border border-ink-200 transition-all duration-200 tap-scale"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
