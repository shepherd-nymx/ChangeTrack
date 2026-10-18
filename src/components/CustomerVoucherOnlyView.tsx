import React, { useState, useEffect, useRef } from 'react';
import { 
  Store, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Sun, 
  RefreshCw, 
  MessageSquare, 
  ExternalLink, 
  AlertTriangle,
  ArrowRight,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ChangeRecord, Shop } from '../types';
import { storage } from '../services/storage';
import { QrCodeDisplay } from './QrCodeDisplay';
import { 
  formatDateTime, 
  buildWhatsAppDirectLink, 
  generateRecordChangeMessage, 
  generateCollectedChangeMessage 
} from '../services/whatsapp';

interface CustomerVoucherOnlyViewProps {
  voucherId: string;
  shop: Shop;
  onExitToTill?: () => void;
}

export const CustomerVoucherOnlyView: React.FC<CustomerVoucherOnlyViewProps> = ({
  voucherId,
  shop,
  onExitToTill
}) => {
  // Read any URL query parameters for fallback if opened on a separate device without synced localStorage
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const paramAmount = urlParams ? parseFloat(urlParams.get('amt') || '0') : 0;
  const paramCurrency = urlParams?.get('cur') || shop.currencySymbol || '$';
  const paramShopName = urlParams?.get('shop') || shop.name;

  const [record, setRecord] = useState<ChangeRecord | null>(() => {
    return storage.getChangeRecordById(voucherId) || null;
  });

  const [copiedId, setCopiedId] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasCelebrated, setHasCelebrated] = useState(false);
  const prevStatusRef = useRef<string | null>(record?.status || null);

  // Poll for live status updates so that when the till operator scans and marks collected,
  // this customer screen immediately updates in real-time!
  useEffect(() => {
    const checkStatus = () => {
      const fresh = storage.getChangeRecordById(voucherId);
      if (fresh) {
        // If status just flipped to COLLECTED, fire confetti celebration
        if (prevStatusRef.current === 'OUTSTANDING' && fresh.status === 'COLLECTED' && !hasCelebrated) {
          try {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.5 }
            });
          } catch {}
          setHasCelebrated(true);
        }
        prevStatusRef.current = fresh.status;
        setRecord(fresh);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 1500);

    // Also listen to storage events across tabs
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key?.includes('change_records')) {
        checkStatus();
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [voucherId, hasCelebrated]);

  const handleCopyId = () => {
    const idToCopy = record?.id || voucherId;
    navigator.clipboard.writeText(idToCopy);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    const fresh = storage.getChangeRecordById(voucherId);
    if (fresh) setRecord(fresh);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const status = record?.status || 'OUTSTANDING';
  const amount = record ? record.amountOwed : paramAmount;
  const currency = shop.currencySymbol || paramCurrency || '$';
  const displayShopName = record?.shopName || shop.name || paramShopName;

  // Build WhatsApp message link for customer convenience
  const waConfig = storage.getWhatsAppConfig();
  const defaultCountryCode = waConfig.defaultCountryCode || '+263';
  const customerPhone = record?.customerPhone || '';
  const waMessage = record
    ? record.status === 'COLLECTED'
      ? generateCollectedChangeMessage(shop, record, 0)
      : generateRecordChangeMessage(shop, record)
    : '';
  const waLink = customerPhone ? buildWhatsAppDirectLink(customerPhone, waMessage, defaultCountryCode) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col items-center justify-between p-4 sm:p-6 selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Header */}
      <header className="w-full max-w-sm mx-auto flex items-center justify-between pt-2 pb-4">
        <div className="flex items-center gap-2.5">
          {shop.logoUrl ? (
            <img 
              src={shop.logoUrl} 
              alt={displayShopName} 
              className="w-9 h-9 rounded-xl object-contain bg-white p-1 shadow-md border border-slate-700" 
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
          )}
          <div>
            <h1 className="text-sm font-black tracking-tight text-white uppercase leading-tight">
              {displayShopName}
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              Digital Change Pass
            </p>
          </div>
        </div>

        <button
          onClick={handleManualRefresh}
          title="Refresh Live Status"
          className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-all border border-slate-700 active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </header>

      {/* Main Voucher Card */}
      <main className="w-full max-w-sm mx-auto my-auto">
        <div className="bg-white text-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 relative">
          
          {/* Status Ribbon Banner */}
          <div className={`px-4 py-3 text-center text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 ${
            status === 'OUTSTANDING'
              ? 'bg-amber-400 text-slate-950 shadow-inner'
              : status === 'COLLECTED'
              ? 'bg-emerald-500 text-white shadow-inner'
              : 'bg-rose-500 text-white'
          }`}>
            {status === 'OUTSTANDING' && (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-950"></span>
                </span>
                <span>Ready For Cash Collection</span>
              </>
            )}
            {status === 'COLLECTED' && (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Change Collected & Paid Out</span>
              </>
            )}
            {status === 'CANCELLED' && (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>Change Record Cancelled</span>
              </>
            )}
          </div>

          {/* Amount Due Callout */}
          <div className="p-6 text-center border-b border-dashed border-slate-200 bg-slate-50/70">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              {status === 'COLLECTED' ? 'Cash Paid Out' : 'Cash Change Due'}
            </span>
            <div className="text-4xl sm:text-5xl font-black text-slate-950 tracking-tight font-mono-num my-1">
              {currency}{amount.toFixed(2)}
            </div>

            {/* Change ID badge with copy action */}
            <div className="inline-flex items-center gap-1.5 mt-2 bg-slate-200/80 hover:bg-slate-300 text-slate-800 px-3 py-1 rounded-full text-xs font-mono font-bold transition-colors">
              <span>ID: {record?.id || voucherId}</span>
              <button
                onClick={handleCopyId}
                title="Copy Change ID"
                className="hover:text-emerald-700 ml-1"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            {copiedId && (
              <p className="text-[10px] text-emerald-600 font-bold mt-1 animate-in fade-in">
                Change ID copied to clipboard!
              </p>
            )}
          </div>

          {/* QR Code Presentation Box */}
          <div className="p-6 text-center space-y-4">
            <div className="relative inline-block mx-auto p-4 bg-slate-950 rounded-2xl shadow-inner border-2 border-slate-900">
              {/* Corner scan targeting brackets */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-400 rounded-tl-sm"></div>
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-400 rounded-tr-sm"></div>
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-400 rounded-bl-sm"></div>
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-400 rounded-br-sm"></div>

              {/* High contrast QR code */}
              <div className="bg-white p-2 rounded-xl">
                <QrCodeDisplay value={record?.id || voucherId} size={210} className="mx-auto" />
              </div>
            </div>

            {/* Instruction for cashier scanning */}
            <div className="space-y-1">
              <p className="text-xs font-black text-slate-900">
                {status === 'OUTSTANDING'
                  ? 'Show this QR code to the cashier to collect your cash'
                  : 'This QR code has been redeemed and verified'}
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                {status === 'OUTSTANDING'
                  ? 'The till operator will scan this screen to instantly dispense your cash change.'
                  : `Paid out in full on ${record?.collectedAt ? formatDateTime(record.collectedAt) : 'at till'}${record?.collectedByEmployeeName ? ` by ${record.collectedByEmployeeName}` : ''}.`}
              </p>
            </div>

            {/* Screen brightness hint */}
            {status === 'OUTSTANDING' && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 rounded-xl text-[11px] font-semibold border border-amber-200/80">
                <Sun className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Tip: Turn up phone brightness for faster scanning</span>
              </div>
            )}
          </div>

          {/* Details & Anti-Tamper Security Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-600 space-y-2">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Store:</span>
              <span className="font-bold text-slate-800">{displayShopName}</span>
            </div>
            {record?.createdAt && (
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">Issued On:</span>
                <span>{formatDateTime(record.createdAt)}</span>
              </div>
            )}
            {record?.customerPhone && (
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">Customer Phone:</span>
                <span className="font-mono">{record.customerPhone}</span>
              </div>
            )}

            {/* If Collected, show settlement details */}
            {status === 'COLLECTED' && (
              <div className="pt-2 border-t border-slate-200 text-emerald-800 font-bold space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span>Collected At:</span>
                  <span>{record?.collectedAt ? formatDateTime(record.collectedAt) : 'Settled'}</span>
                </div>
                {record?.collectedByEmployeeName && (
                  <div className="flex justify-between items-center text-[11px]">
                    <span>Cashier:</span>
                    <span>{record.collectedByEmployeeName}</span>
                  </div>
                )}
              </div>
            )}

            {/* Cryptographic verification stamp */}
            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>ChangeTrack Verified Ledger</span>
              </span>
              <span className="font-mono text-slate-400">
                {record?.checksum ? record.checksum.substring(0, 8) : 'SECURE'}
              </span>
            </div>
          </div>
        </div>

        {/* WhatsApp Direct Link if available */}
        {waLink && (
          <div className="mt-3 text-center">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors py-2 px-3 rounded-xl bg-slate-900 border border-slate-800"
            >
              <MessageSquare className="w-3.5 h-3.5 fill-emerald-400" />
              <span>Open in WhatsApp</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </main>

      {/* Footer: Discrete Staff Exit Option */}
      <footer className="w-full max-w-sm mx-auto pt-4 pb-2 text-center text-[11px] text-slate-500 space-y-1.5">
        <p>ChangeTrack Anti-Dispute Retail POS • Customer Pass</p>
        {onExitToTill && (
          <button
            onClick={onExitToTill}
            className="text-slate-400 hover:text-white underline text-[10px] transition-colors"
          >
            Store Operator? Return to Till Terminal
          </button>
        )}
      </footer>
    </div>
  );
};
