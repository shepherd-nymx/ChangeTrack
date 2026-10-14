import React, { useState, useEffect } from 'react';
import { 
  Search, 
  QrCode, 
  Phone, 
  Hash, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  User, 
  ArrowRight, 
  X, 
  ShieldCheck,
  RotateCcw,
  MessageSquare,
  Building2,
  Wallet,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ChangeRecord, Employee, Shop } from '../types';
import { storage } from '../services/storage';
import { QrScanner } from './QrScanner';
import { 
  formatDateTime, 
  buildWhatsAppDirectLink, 
  generateCollectedChangeMessage,
  generateMultiCollectMessage 
} from '../services/whatsapp';

interface VerificationModalProps {
  initialSearchQuery?: string;
  currentEmployee: Employee;
  shop: Shop;
  onClose: () => void;
  onRecordUpdated?: () => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  initialSearchQuery = '',
  currentEmployee,
  shop,
  onClose,
  onRecordUpdated
}) => {
  const [activeMethod, setActiveMethod] = useState<'ID' | 'PHONE' | 'QR'>('ID');
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedRecord, setSelectedRecord] = useState<ChangeRecord | null>(null);
  const [matchedPhoneRecords, setMatchedPhoneRecords] = useState<ChangeRecord[]>([]);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [collectionSuccess, setCollectionSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // WhatsApp Redirect info for collected change
  const [collectionWaLink, setCollectionWaLink] = useState<string | null>(null);
  const [collectionWaMessageText, setCollectionWaMessageText] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [showMessagePreview, setShowMessagePreview] = useState(false);

  // Admin reversal state
  const [showAdminReversal, setShowAdminReversal] = useState(false);
  const [reversalReason, setReversalReason] = useState('');
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);
  const [awaitingConfirmAll, setAwaitingConfirmAll] = useState(false);

  const waConfig = storage.getWhatsAppConfig();
  const defaultCountryCode = waConfig.defaultCountryCode || '+263';
  const currency = shop.currencySymbol || '$';

  useEffect(() => {
    if (initialSearchQuery) {
      handleSearch(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const handleSearch = (query: string) => {
    setErrorMessage(null);
    setCollectionSuccess(false);
    setSelectedRecord(null);
    setMatchedPhoneRecords([]);
    setCollectionWaLink(null);
    setCollectionWaMessageText(null);
    setAwaitingConfirm(false);
    setAwaitingConfirmAll(false);

    const clean = query.trim();
    if (!clean) return;

    if (activeMethod === 'ID' || clean.toUpperCase().startsWith('CT-') || clean.length <= 8) {
      // Look up by Change ID
      const record = storage.getChangeRecordById(clean);
      if (record) {
        setSelectedRecord(record);
      } else {
        setErrorMessage(`No change record found with ID "${clean.toUpperCase()}". Please verify the number on the customer's WhatsApp slip.`);
      }
    } else {
      // Look up by Phone
      const records = storage.searchRecordsByPhone(clean);
      if (records.length === 1) {
        setSelectedRecord(records[0]);
      } else if (records.length > 1) {
        setMatchedPhoneRecords(records);
      } else {
        setErrorMessage(`No change records found matching phone number "${clean}".`);
      }
    }
  };

  const handleQrScanned = (scannedData: string) => {
    setIsQrScannerOpen(false);
    let changeId = scannedData.trim();

    try {
      if (scannedData.startsWith('{')) {
        const parsed = JSON.parse(scannedData);
        if (parsed.id) changeId = parsed.id;
      }
    } catch {
      // Use raw string
    }

    setSearchQuery(changeId);
    setActiveMethod('ID');

    const record = storage.getChangeRecordById(changeId);
    if (record) {
      setSelectedRecord(record);
      setErrorMessage(null);
    } else {
      setErrorMessage(`QR code scanned ("${changeId}"), but no corresponding change record was found.`);
    }
  };

  // Helper to open direct WhatsApp redirect
  const openWhatsAppUrl = (url: string) => {
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.warn('Could not auto-open WhatsApp link:', err);
    }
  };

  // 1. Collect individual change record (two-step: first tap arms, second tap confirms)
  const handleConfirmCollection = async () => {
    if (!selectedRecord) return;
    if (!awaitingConfirm) {
      setAwaitingConfirm(true);
      return;
    }
    setAwaitingConfirm(false);
    setIsProcessing(true);
    setErrorMessage(null);

    const methodMap = {
      ID: 'CHANGE_ID' as const,
      PHONE: 'PHONE' as const,
      QR: 'QR_CODE' as const
    };

    const res = await storage.collectChange({
      changeId: selectedRecord.id,
      employee: currentEmployee,
      method: methodMap[activeMethod]
    });

    setIsProcessing(false);

    if (res.success && res.record) {
      setSelectedRecord(res.record);
      setCollectionSuccess(true);
      
      const link = res.waDirectLink || buildWhatsAppDirectLink(
        res.record.customerPhone,
        res.waMessageText || generateCollectedChangeMessage(shop, res.record, res.remainingCustomerBalance),
        defaultCountryCode
      );
      const text = res.waMessageText || generateCollectedChangeMessage(shop, res.record, res.remainingCustomerBalance);

      setCollectionWaLink(link);
      setCollectionWaMessageText(text);

      if (typeof onRecordUpdated === 'function') {
        onRecordUpdated();
      }

      // If auto-open is enabled in config, trigger redirect
      if (waConfig.autoOpenRedirectOnCollect && link) {
        openWhatsAppUrl(link);
      }

      // Celebrate with confetti
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Safe fallback
      }
    } else if (res.error === 'ALREADY_COLLECTED' && res.record) {
      setSelectedRecord(res.record);
      setErrorMessage('FRAUD PREVENTION: This change has ALREADY been collected!');
    } else {
      setErrorMessage('Unable to process collection. Please check record status.');
    }
  };

  // 2. Settle all accumulated customer change slips (two-step confirmation)
  const handleCollectAllForCustomer = async (phone: string) => {
    if (!phone) return;
    if (!awaitingConfirmAll) {
      setAwaitingConfirmAll(true);
      return;
    }
    setAwaitingConfirmAll(false);
    setIsProcessing(true);
    setErrorMessage(null);

    const res = await storage.collectFullCustomerBalance({
      phone,
      employee: currentEmployee,
      method: 'PHONE'
    });

    setIsProcessing(false);

    if (res.success) {
      setCollectionSuccess(true);
      
      if (res.waDirectLink && res.waMessageText) {
        setCollectionWaLink(res.waDirectLink);
        setCollectionWaMessageText(res.waMessageText);
      }

      if (typeof onRecordUpdated === 'function') {
        onRecordUpdated();
      }

      if (waConfig.autoOpenRedirectOnCollect && res.waDirectLink) {
        openWhatsAppUrl(res.waDirectLink);
      }

      try {
        confetti({
          particleCount: 65,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Safe fallback
      }

      // Refresh matched records to show updated collected state
      const updated = storage.searchRecordsByPhone(phone);
      setMatchedPhoneRecords(updated);
    } else {
      setErrorMessage(res.error || 'Unable to process full balance collection.');
    }
  };

  const handleAdminReversal = () => {
    if (!selectedRecord || !reversalReason.trim()) return;
    if (currentEmployee.role !== 'ADMIN') {
      setErrorMessage('Security Authorization Required: Only Shop Administrators can reverse a collection record.');
      return;
    }

    const res = storage.reverseCollection({
      changeId: selectedRecord.id,
      adminEmployee: currentEmployee,
      reason: reversalReason.trim()
    });

    if (res.success && res.record) {
      setSelectedRecord(res.record);
      setShowAdminReversal(false);
      setReversalReason('');
      setCollectionSuccess(false);
      setCollectionWaLink(null);
      setCollectionWaMessageText(null);
      if (typeof onRecordUpdated === 'function') {
        onRecordUpdated();
      }
      setErrorMessage(null);
    } else {
      setErrorMessage(res.error || 'Failed to reverse collection');
    }
  };

  const handleCopyConfirmationText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative surface-card w-full max-w-xl max-h-[85vh] overflow-y-auto rise-in">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-ink-900 text-white flex items-center justify-between border-b border-ink-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-500/20 text-brand-400 rounded-xl border border-brand-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold tracking-tight">Anti-Dispute Customer Verification</h2>
              <p className="text-[11px] sm:text-xs text-ink-400">Verify customer change entitlement before handing over cash</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-ink-400 hover:text-white hover:bg-ink-800 transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Method Tabs */}
        <div className="grid grid-cols-3 p-1.5 sm:p-2 bg-ink-100 border-b border-ink-200 text-xs font-semibold text-ink-600">
          <button
            onClick={() => {
              setActiveMethod('ID');
              setSelectedRecord(null);
              setCollectionSuccess(false);
              setCollectionWaLink(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl transition-all duration-200 min-h-[44px] ${
              activeMethod === 'ID'
                ? 'bg-white text-ink-900 shadow-xs border border-ink-200 font-bold'
                : 'hover:bg-ink-200/60'
            }`}
          >
            <Hash className="w-4 h-4 text-brand-600" />
            <span className="truncate">Change ID</span>
          </button>

          <button
            onClick={() => {
              setActiveMethod('PHONE');
              setSelectedRecord(null);
              setCollectionSuccess(false);
              setCollectionWaLink(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl transition-all duration-200 min-h-[44px] ${
              activeMethod === 'PHONE'
                ? 'bg-white text-ink-900 shadow-xs border border-ink-200 font-bold'
                : 'hover:bg-ink-200/60'
            }`}
          >
            <Phone className="w-4 h-4 text-brand-600" />
            <span className="truncate">Phone Lookup</span>
          </button>

          <button
            onClick={() => {
              setActiveMethod('QR');
              setIsQrScannerOpen(true);
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl transition-all duration-200 min-h-[44px] ${
              activeMethod === 'QR'
                ? 'bg-white text-ink-900 shadow-xs border border-ink-200 font-bold'
                : 'hover:bg-ink-200/60'
            }`}
          >
            <QrCode className="w-4 h-4 text-brand-600" />
            <span className="truncate">Scan QR</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 sm:p-5 border-b border-ink-100 bg-white">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSearch(searchQuery);
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={
                  activeMethod === 'ID'
                    ? 'Enter Change ID (e.g. CT-48291)'
                    : 'Enter customer phone number (e.g. 77 123 4567)'
                }
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-ink-200 rounded-xl text-xs sm:text-sm text-ink-900 font-medium placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all uppercase min-h-[44px]"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="px-4 sm:px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all duration-200 tap-scale shadow-xs min-h-[44px]"
            >
              Verify
            </button>
            <button
              type="button"
              onClick={() => setIsQrScannerOpen(true)}
              title="Open Camera QR Scanner"
              className="p-2.5 bg-brand-50 border border-brand-200 text-brand-700 hover:bg-brand-100 rounded-xl transition-all duration-200 tap-scale min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <QrCode className="w-5 h-5" />
            </button>
          </form>

          {/* Quick suggestions */}
          <div className="mt-2.5 flex items-center gap-2 text-xs text-ink-500 flex-wrap">
            <span className="font-semibold text-ink-600">Quick Demo Records:</span>
            {['CT-48291', 'CT-39104', 'CT-51820'].map(id => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setSearchQuery(id);
                  setActiveMethod('ID');
                  handleSearch(id);
                }}
                className="px-2 py-0.5 bg-ink-100 hover:bg-brand-50 hover:text-brand-700 border border-ink-200 rounded-lg font-mono text-[11px] font-semibold transition-all duration-200 tap-scale"
              >
                {id}
              </button>
            ))}
          </div>
        </div>

        {/* Results Area */}
        <div className="p-4 sm:p-6 bg-ink-50 min-h-[260px] max-h-[500px] overflow-y-auto">
          {errorMessage && (
            <div className="p-4 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Verification Notice</p>
                <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* If multiple records found for phone search */}
          {matchedPhoneRecords.length > 0 && !selectedRecord && (
            <div className="space-y-4">
              {(() => {
                const outstandingMatched = matchedPhoneRecords.filter(r => r.status === 'OUTSTANDING');
                const totalOutstandingMatchedAmount = Math.round(outstandingMatched.reduce((sum, r) => sum + r.amountOwed, 0) * 100) / 100;
                const customerPhoneForMatched = matchedPhoneRecords[0]?.customerPhone || searchQuery;
                const customerNameForMatched = matchedPhoneRecords.find(r => r.customerName)?.customerName || 'Valued Customer';

                return (
                  <div className="p-4 bg-amber-50/90 border-2 border-amber-300 rounded-2xl space-y-3 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-amber-600 text-white rounded-xl shrink-0 mt-0.5">
                          <Wallet className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                              Customer Cumulative Balance
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                              {outstandingMatched.length} Outstanding Slip(s)
                            </span>
                          </div>
                          <div className="text-2xl font-black text-ink-900 font-mono-num mt-0.5">
                            {currency}{totalOutstandingMatchedAmount.toFixed(2)}
                          </div>
                          <p className="text-[11px] text-amber-800">
                            Customer: <span className="font-semibold text-ink-900">{customerNameForMatched}</span> ({customerPhoneForMatched})
                          </p>
                        </div>
                      </div>

                      {outstandingMatched.length > 0 && (!awaitingConfirmAll ? (
                        <button
                          type="button"
                          onClick={() => handleCollectAllForCustomer(customerPhoneForMatched)}
                          disabled={isProcessing}
                          className="w-full sm:w-auto px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-black rounded-xl shadow-xs transition-all duration-200 tap-scale flex items-center justify-center gap-1.5 shrink-0 min-h-[44px]"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {isProcessing ? 'Processing...' : `Payout Full Balance (${currency}${totalOutstandingMatchedAmount.toFixed(2)})`}
                          </span>
                        </button>
                      ) : (
                        <div className="w-full sm:w-auto flex flex-col gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCollectAllForCustomer(customerPhoneForMatched)}
                            disabled={isProcessing}
                            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl shadow-xs transition-all duration-200 tap-scale flex items-center justify-center gap-1.5 min-h-[44px] animate-pulse"
                          >
                            <AlertTriangle className="w-4 h-4" />
                            <span>Sure? Tap again to payout {currency}{totalOutstandingMatchedAmount.toFixed(2)}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setAwaitingConfirmAll(false)}
                            className="px-4 py-1.5 bg-white hover:bg-ink-100 text-ink-700 text-[11px] font-bold rounded-xl border border-ink-200 transition-all duration-200 tap-scale"
                          >
                            Cancel
                          </button>
                        </div>
                      ))}
                    </div>

                    <p className="text-[11px] text-amber-800 bg-amber-100/60 p-2 rounded-lg">
                      Tip: Customer has multiple change slips. Settle all slips at once or select individual slips below.
                    </p>
                  </div>
                );
              })()}

              {/* Multi-Collect WhatsApp Send Callout Banner */}
              {collectionSuccess && collectionWaLink && (
                <div className="p-4 bg-brand-50 rounded-2xl border-2 border-brand-300 text-brand-900 space-y-3 shadow-xs rise-in">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-brand-600 text-white rounded-xl">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-extrabold text-sm text-brand-950">
                        Full Balance Payout Recorded!
                      </p>
                      <p className="text-xs text-brand-800">
                        Send the customer their settlement receipt via WhatsApp.
                      </p>
                    </div>
                  </div>

                  {/* WhatsApp Direct Link Button */}
                  <a
                    href={collectionWaLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all duration-200 tap-scale flex items-center justify-center gap-2 min-h-[44px] text-center"
                  >
                    <MessageSquare className="w-4 h-4 fill-white" />
                    <span>SEND VIA WHATSAPP (COLLECTION CONFIRMATION)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <div className="flex items-center justify-between text-[11px] text-brand-800">
                    <span>Chat opens pre-filled with customer number & message. Press Send.</span>
                    {collectionWaMessageText && (
                      <button
                        type="button"
                        onClick={() => handleCopyConfirmationText(collectionWaMessageText)}
                        className="font-bold text-brand-700 hover:text-brand-950 underline flex items-center gap-1 shrink-0 tap-scale transition-all duration-200"
                      >
                        {copiedMessage ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedMessage ? 'Copied!' : 'Copy Text'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              <p className="text-xs font-bold uppercase text-ink-500 tracking-wider">
                Individual Change Slips ({matchedPhoneRecords.length}):
              </p>
              <div className="space-y-2">
                {matchedPhoneRecords.map(rec => (
                  <div
                    key={rec.id}
                    onClick={() => {
                      setSelectedRecord(rec);
                      setAwaitingConfirm(false);
                      setCollectionSuccess(rec.status === 'COLLECTED');
                      if (rec.status === 'COLLECTED') {
                        const link = buildWhatsAppDirectLink(
                          rec.customerPhone,
                          generateCollectedChangeMessage(shop, rec, 0),
                          defaultCountryCode
                        );
                        setCollectionWaLink(link);
                        setCollectionWaMessageText(generateCollectedChangeMessage(shop, rec, 0));
                      }
                    }}
                    className="p-3.5 bg-white border border-ink-200 hover:border-brand-500 rounded-xl cursor-pointer shadow-xs hover:shadow-md transition-all duration-200 rise-in flex items-center justify-between min-h-[50px]"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-ink-900 text-sm">{rec.id}</span>
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
                      <p className="text-xs text-ink-500 mt-0.5">
                        Created {formatDateTime(rec.createdAt)} by {rec.cashierName}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-extrabold text-ink-900 font-mono-num">
                        {currency}{rec.amountOwed.toFixed(2)}
                      </span>
                      <p className="text-[11px] text-brand-600 font-semibold flex items-center justify-end gap-1">
                        Select <ArrowRight className="w-3 h-3" />
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Single Selected Record Verification View */}
          {selectedRecord && (
            <div className="space-y-4">
              {/* Back to list button if phone lookup */}
              {matchedPhoneRecords.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="text-xs text-brand-600 hover:text-brand-800 font-bold flex items-center gap-1 mb-1 transition-all duration-200"
                >
                  ← Back to customer's {matchedPhoneRecords.length} change slips
                </button>
              )}

              {/* CASE 1: OUTSTANDING CHANGE (Legitimate Claim) */}
              {selectedRecord.status === 'OUTSTANDING' && (
                <div className="rounded-2xl border-2 border-brand-400 bg-white p-5 shadow-lg relative overflow-hidden rise-in">
                  <div className="absolute top-0 right-0 bg-brand-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified Outstanding
                  </div>

                  <div className="mb-3">
                    <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">
                      CHANGE TO BE COLLECTED
                    </span>
                    <div className="mt-1 flex items-baseline justify-between">
                      <h3 className="text-3xl font-black text-ink-900 font-mono-num tracking-tight">
                        {currency}{selectedRecord.amountOwed.toFixed(2)}
                      </h3>
                      <span className="font-mono font-bold text-ink-700 bg-ink-100 px-2.5 py-1 rounded-lg text-sm">
                        {selectedRecord.id}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-3 my-3 border-y border-ink-100 text-xs">
                    <div>
                      <span className="text-ink-400">Customer:</span>
                      <p className="font-bold text-ink-800">{selectedRecord.customerName || 'Valued Customer'}</p>
                      <p className="font-mono text-ink-600 text-[11px]">{selectedRecord.customerPhone}</p>
                    </div>
                    <div>
                      <span className="text-ink-400">Created:</span>
                      <p className="font-semibold text-ink-700">{formatDateTime(selectedRecord.createdAt)}</p>
                      <p className="text-ink-500 text-[11px]">Till Cashier: {selectedRecord.cashierName}</p>
                    </div>
                    <div>
                      <span className="text-ink-400">Transaction ID:</span>
                      <p className="font-mono font-semibold text-ink-700">{selectedRecord.transactionId}</p>
                    </div>
                    <div>
                      <span className="text-ink-400">Shop Branch:</span>
                      <p className="font-semibold text-ink-700">{shop.name}</p>
                    </div>
                  </div>

                  {selectedRecord.notes && (
                    <p className="text-xs bg-amber-50 text-amber-900 p-2.5 rounded-lg border border-amber-200 mb-4">
                      <span className="font-bold">Cashier Note:</span> {selectedRecord.notes}
                    </p>
                  )}

                  {/* Primary Handover Action Button (two-step confirm) */}
                  {!awaitingConfirm ? (
                    <button
                      onClick={handleConfirmCollection}
                      disabled={isProcessing}
                      className="w-full py-3.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm rounded-xl shadow-md transition-all duration-200 tap-scale flex items-center justify-center gap-2 min-h-[48px]"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{isProcessing ? 'Processing Handover...' : 'CONFIRM CASH COLLECTION'}</span>
                    </button>
                  ) : (
                    <div className="w-full space-y-2">
                      <button
                        onClick={handleConfirmCollection}
                        disabled={isProcessing}
                        className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm rounded-xl shadow-md transition-all duration-200 tap-scale flex items-center justify-center gap-2 min-h-[48px] animate-pulse"
                      >
                        <AlertTriangle className="w-5 h-5" />
                        <span>ARE YOU SURE? TAP AGAIN TO HAND OVER {currency}{selectedRecord.amountOwed.toFixed(2)} CASH</span>
                      </button>
                      <button
                        onClick={() => setAwaitingConfirm(false)}
                        className="w-full py-2 px-4 bg-white hover:bg-ink-100 text-ink-700 text-xs font-bold rounded-xl border border-ink-200 transition-all duration-200 tap-scale min-h-[38px]"
                      >
                        No, go back
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* CASE 2: ALREADY COLLECTED (CRITICAL ANTI-FRAUD BANNER + SEND RECEIPT VIA WHATSAPP) */}
              {selectedRecord.status === 'COLLECTED' && (
                <div className="rounded-2xl border-2 border-brand-300 bg-white p-5 shadow-md space-y-4 rise-in">
                  {/* Top Status Banner */}
                  <div className="p-4 bg-brand-50 rounded-xl border border-brand-300 text-brand-900 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-brand-100 rounded-full text-brand-700 shrink-0">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-base text-brand-950 tracking-tight">
                            Change Collected ({currency}{selectedRecord.amountOwed.toFixed(2)})
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-brand-200 text-brand-900 uppercase tracking-wide">
                            Dispensed
                          </span>
                        </div>
                        <p className="text-xs text-brand-800 mt-1">
                          Cash was verified & dispensed. Open WhatsApp to send the customer their official ChangeTrack collection confirmation receipt.
                        </p>
                      </div>
                    </div>

                    {/* Prominent Send via WhatsApp Button */}
                    {(() => {
                      const confirmationText = collectionWaMessageText || generateCollectedChangeMessage(
                        shop, 
                        selectedRecord, 
                        0
                      );
                      const waLink = collectionWaLink || buildWhatsAppDirectLink(
                        selectedRecord.customerPhone,
                        confirmationText,
                        defaultCountryCode
                      );

                      return (
                        <div className="pt-2 border-t border-brand-200/80 space-y-2">
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all duration-200 tap-scale flex items-center justify-center gap-2 text-center min-h-[44px]"
                          >
                            <MessageSquare className="w-4 h-4 fill-white" />
                            <span>SEND VIA WHATSAPP (COLLECTION CONFIRMATION)</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <div className="flex items-center justify-between text-[11px] text-brand-800 pt-0.5">
                            <span>Pre-filled with customer number & message. Cashier only presses Send.</span>
                            <button
                              type="button"
                              onClick={() => handleCopyConfirmationText(confirmationText)}
                              className="font-bold text-brand-700 hover:text-brand-950 underline flex items-center gap-1 shrink-0 tap-scale transition-all duration-200"
                            >
                              {copiedMessage ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedMessage ? 'Copied!' : 'Copy Text'}</span>
                            </button>
                          </div>

                          {/* Preview toggle */}
                          <button
                            type="button"
                            onClick={() => setShowMessagePreview(!showMessagePreview)}
                            className="text-[11px] font-semibold text-brand-900 flex items-center gap-1 hover:underline pt-1 transition-all duration-200"
                          >
                            {showMessagePreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            <span>{showMessagePreview ? 'Hide message preview' : 'View collection confirmation text'}</span>
                          </button>

                          {showMessagePreview && (
                            <div className="p-3 bg-white rounded-xl border border-brand-200 text-ink-800 text-[11px] whitespace-pre-line font-sans leading-relaxed shadow-xs">
                              {confirmationText}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Audit Evidence Card */}
                  <div className="bg-ink-50 rounded-xl p-4 border border-ink-200 space-y-2 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-ink-200">
                      <span className="text-ink-500 font-medium">Amount Dispensed:</span>
                      <span className="text-lg font-black text-ink-900 font-mono-num">
                        {currency}{selectedRecord.amountOwed.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-ink-500">Change ID:</span>
                      <span className="font-mono font-bold text-ink-800">{selectedRecord.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-ink-500">Customer Phone:</span>
                      <span className="font-semibold text-ink-800">{selectedRecord.customerPhone}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-ink-500">Original Date Created:</span>
                      <span className="font-medium text-ink-700">{formatDateTime(selectedRecord.createdAt)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-ink-200">
                      <span className="font-bold text-ink-800">Collection Date & Time:</span>
                      <span className="font-bold text-ink-800">
                        {selectedRecord.collectedAt ? formatDateTime(selectedRecord.collectedAt) : 'Recorded'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-ink-800">Dispensing Till Cashier:</span>
                      <span className="font-bold text-ink-900 bg-white px-2 py-0.5 rounded border border-ink-300">
                        {selectedRecord.collectedByEmployeeName || 'Authorized Cashier'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-ink-500">Verification Method:</span>
                      <span className="font-medium text-ink-700">{selectedRecord.collectionMethod || 'TILL_VERIFIED'}</span>
                    </div>
                  </div>

                  {/* Admin Correction Override */}
                  {currentEmployee.role === 'ADMIN' && (
                    <div className="pt-2 border-t border-ink-200">
                      {!showAdminReversal ? (
                        <button
                          type="button"
                          onClick={() => setShowAdminReversal(true)}
                          className="text-xs text-ink-600 hover:text-ink-900 underline flex items-center gap-1 transition-all duration-200"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Shop Administrator: Correct or Reverse Collection</span>
                        </button>
                      ) : (
                        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
                          <p className="text-xs font-bold text-amber-900">
                            Administrative Reversal (Audit Log Required)
                          </p>
                          <textarea
                            value={reversalReason}
                            onChange={e => setReversalReason(e.target.value)}
                            placeholder="Mandatory reason for reversing collection (e.g. Cashier error, customer disputed identity)..."
                            className="w-full p-2 text-xs bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
                            rows={2}
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setShowAdminReversal(false)}
                              className="px-2.5 py-1 text-xs text-ink-600 hover:bg-amber-100 rounded-lg transition-all duration-200 tap-scale"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleAdminReversal}
                              disabled={!reversalReason.trim()}
                              className="px-3 py-1 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold rounded-lg transition-all duration-200 tap-scale"
                            >
                              Confirm Reversal
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* CASE 3: CANCELLED / VOIDED RECORD */}
              {selectedRecord.status === 'CANCELLED' && (
                <div className="rounded-2xl border-2 border-ink-300 bg-ink-100 p-5 space-y-3 rise-in">
                  <div className="flex items-center gap-2 text-ink-800 font-bold">
                    <ShieldAlert className="w-5 h-5" />
                    <span>CHANGE RECORD VOIDED / CANCELLED</span>
                  </div>
                  <p className="text-xs text-ink-600">
                    This change record was cancelled on{' '}
                    <span className="font-semibold">{selectedRecord.cancelledAt ? formatDateTime(selectedRecord.cancelledAt) : 'prior date'}</span>{' '}
                    by Admin <span className="font-semibold">{selectedRecord.cancelledByEmployeeName}</span>.
                  </p>
                  <p className="text-xs bg-white p-3 rounded-lg border border-ink-200">
                    <span className="font-bold text-ink-700">Reason:</span> {selectedRecord.cancellationReason || 'Coin handed over before departure.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {!selectedRecord && matchedPhoneRecords.length === 0 && !errorMessage && (
            <div className="flex flex-col items-center justify-center text-center py-10 text-ink-400 space-y-2">
              <ShieldCheck className="w-10 h-10 text-ink-300" />
              <p className="text-sm font-extrabold tracking-tight text-ink-600">Ready to Verify Customer Change</p>
              <p className="text-xs text-ink-400 max-w-xs">
                Scan the customer's QR code, search their Change ID, or enter their phone number to check their balance.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 bg-ink-100 border-t border-ink-200 flex justify-between items-center text-xs text-ink-500">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-brand-500 pulse-ring" />
            <span>Till Cashier: <strong className="text-ink-700">{currentEmployee.name}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-ink-100 text-ink-800 font-bold rounded-xl border border-ink-200 transition-all duration-200 tap-scale min-h-[38px]"
          >
            Done
          </button>
        </div>
      </div>

      {/* Camera QR Scanner Popup */}
      {isQrScannerOpen && (
        <QrScanner
          onScan={handleQrScanned}
          onClose={() => setIsQrScannerOpen(false)}
        />
      )}
    </div>
  );
};
