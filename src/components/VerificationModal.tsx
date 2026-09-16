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
  Sparkles, 
  ShieldCheck,
  RotateCcw,
  MessageSquare,
  Building2,
  Wallet
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ChangeRecord, Employee, Shop } from '../types';
import { storage } from '../services/storage';
import { QrScanner } from './QrScanner';
import { formatDateTime, buildWhatsAppDirectLink } from '../services/whatsapp';

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

  // Admin reversal state
  const [showAdminReversal, setShowAdminReversal] = useState(false);
  const [reversalReason, setReversalReason] = useState('');

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

    const clean = query.trim();
    if (!clean) return;

    if (activeMethod === 'ID' || clean.toUpperCase().startsWith('CT-') || clean.length <= 8) {
      // Look up by Change ID
      const record = storage.getChangeRecordById(clean);
      if (record) {
        setSelectedRecord(record);
      } else {
        setErrorMessage(`No change record found with ID "${clean.toUpperCase()}". Please verify the number on the WhatsApp slip.`);
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

    // Check if it's a JSON payload
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

  const handleConfirmCollection = async () => {
    if (!selectedRecord) return;
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
      if (typeof onRecordUpdated === 'function') {
        onRecordUpdated();
      }

      // Celebrate with subtle confetti
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

  const handleCollectAllForCustomer = async (phone: string) => {
    if (!phone) return;
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
      if (typeof onRecordUpdated === 'function') {
        onRecordUpdated();
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
      alert('Only Shop Administrators can reverse a collection record.');
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
      if (typeof onRecordUpdated === 'function') {
        onRecordUpdated();
      }
      alert(`Record ${selectedRecord.id} successfully reverted to OUTSTANDING with audit entry.`);
    } else {
      alert(res.error || 'Failed to reverse collection');
    }
  };

  const currency = shop.currencySymbol || '$';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Anti-Dispute Customer Verification</h2>
              <p className="text-xs text-slate-400">Verify customer change entitlement before handing over cash</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Method Tabs */}
        <div className="grid grid-cols-3 p-2 bg-slate-100 border-b border-slate-200 text-xs font-semibold text-slate-600">
          <button
            onClick={() => {
              setActiveMethod('ID');
              setSelectedRecord(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg transition-all ${
              activeMethod === 'ID'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                : 'hover:bg-slate-200/60'
            }`}
          >
            <Hash className="w-4 h-4 text-emerald-600" />
            <span>Method 1: Change ID</span>
          </button>

          <button
            onClick={() => {
              setActiveMethod('PHONE');
              setSelectedRecord(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg transition-all ${
              activeMethod === 'PHONE'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                : 'hover:bg-slate-200/60'
            }`}
          >
            <Phone className="w-4 h-4 text-emerald-600" />
            <span>Method 2: Phone</span>
          </button>

          <button
            onClick={() => {
              setActiveMethod('QR');
              setIsQrScannerOpen(true);
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg transition-all ${
              activeMethod === 'QR'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                : 'hover:bg-slate-200/60'
            }`}
          >
            <QrCode className="w-4 h-4 text-indigo-600" />
            <span>Method 4: QR Code</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-5 border-b border-slate-100 bg-white">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSearch(searchQuery);
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={
                  activeMethod === 'ID'
                    ? 'Enter Change ID (e.g. CT-48291)'
                    : 'Enter customer phone number (e.g. +263 77 123 4567)'
                }
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all uppercase"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl transition-colors shadow-xs"
            >
              Verify
            </button>
            <button
              type="button"
              onClick={() => setIsQrScannerOpen(true)}
              title="Open Camera QR Scanner"
              className="p-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-xl transition-colors"
            >
              <QrCode className="w-5 h-5" />
            </button>
          </form>

          {/* Quick suggestions */}
          <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-600">Quick Demo Records:</span>
            {['CT-48291', 'CT-39104', 'CT-51820'].map(id => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setSearchQuery(id);
                  setActiveMethod('ID');
                  handleSearch(id);
                }}
                className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded font-mono text-[11px] font-semibold transition-colors"
              >
                {id}
              </button>
            ))}
          </div>
        </div>

        {/* Results Area */}
        <div className="p-6 bg-slate-50 min-h-[260px] max-h-[460px] overflow-y-auto">
          {errorMessage && (
            <div className="p-4 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
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
              {/* Customer Accumulated Balance Header */}
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
                          <div className="text-2xl font-black text-slate-900 font-mono-num mt-0.5">
                            {currency}{totalOutstandingMatchedAmount.toFixed(2)}
                          </div>
                          <p className="text-[11px] text-amber-800">
                            Customer: <span className="font-semibold text-slate-900">{customerNameForMatched}</span> ({customerPhoneForMatched})
                          </p>
                        </div>
                      </div>

                      {outstandingMatched.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleCollectAllForCustomer(customerPhoneForMatched)}
                          disabled={isProcessing}
                          className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {isProcessing ? 'Processing...' : `Payout Full Balance (${currency}${totalOutstandingMatchedAmount.toFixed(2)})`}
                          </span>
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-amber-800 bg-amber-100/60 p-2 rounded-lg">
                      💡 Customer has multiple change slips. You can collect each individual slip below or click <strong>Payout Full Balance</strong> to settle all slips at once. A WhatsApp receipt will confirm the settlement.
                    </p>
                  </div>
                );
              })()}

              {collectionSuccess && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-300 text-emerald-900 text-center space-y-1">
                  <div className="inline-flex p-2 bg-emerald-100 rounded-full text-emerald-700 mb-1">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-base">All Outstanding Change Collected Successfully!</p>
                  <p className="text-xs text-emerald-700">
                    Full customer balance cleared to {currency}0.00. WhatsApp confirmation has been dispatched.
                  </p>
                </div>
              )}

              <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                Individual Change Slips ({matchedPhoneRecords.length}):
              </p>
              <div className="space-y-2">
                {matchedPhoneRecords.map(rec => (
                  <div
                    key={rec.id}
                    onClick={() => setSelectedRecord(rec)}
                    className="p-3.5 bg-white border border-slate-200 hover:border-emerald-500 rounded-xl cursor-pointer shadow-xs hover:shadow-md transition-all flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">{rec.id}</span>
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
                      <p className="text-xs text-slate-500 mt-0.5">
                        Created {formatDateTime(rec.createdAt)} by {rec.cashierName}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-extrabold text-slate-900">
                        {currency}{rec.amountOwed.toFixed(2)}
                      </span>
                      <p className="text-[11px] text-emerald-600 font-semibold flex items-center justify-end gap-1">
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
              {/* CASE 1: OUTSTANDING CHANGE (Legitimate Claim) */}
              {selectedRecord.status === 'OUTSTANDING' && (
                <div className="rounded-2xl border-2 border-emerald-400 bg-white p-5 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified Outstanding
                  </div>

                  <div className="mb-3">
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                      CHANGE TO BE COLLECTED
                    </span>
                    <div className="mt-1 flex items-baseline justify-between">
                      <h3 className="text-3xl font-black text-slate-900 font-mono-num">
                        {currency}{selectedRecord.amountOwed.toFixed(2)}
                      </h3>
                      <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md text-sm">
                        {selectedRecord.id}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-3 my-3 border-y border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400">Customer:</span>
                      <p className="font-bold text-slate-800">{selectedRecord.customerName || 'Valued Customer'}</p>
                      <p className="font-mono text-slate-600 text-[11px]">{selectedRecord.customerPhone}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Created:</span>
                      <p className="font-semibold text-slate-700">{formatDateTime(selectedRecord.createdAt)}</p>
                      <p className="text-slate-500 text-[11px]">Till Cashier: {selectedRecord.cashierName}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Transaction ID:</span>
                      <p className="font-mono font-semibold text-slate-700">{selectedRecord.transactionId}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Shop Branch:</span>
                      <p className="font-semibold text-slate-700">{shop.name}</p>
                    </div>
                  </div>

                  {selectedRecord.notes && (
                    <p className="text-xs bg-amber-50 text-amber-900 p-2.5 rounded-lg border border-amber-200 mb-4">
                      <span className="font-bold">Cashier Note:</span> {selectedRecord.notes}
                    </p>
                  )}

                  {collectionSuccess ? (
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-300 text-emerald-900 text-center space-y-1">
                      <div className="inline-flex p-2 bg-emerald-100 rounded-full text-emerald-700 mb-1">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-base">Change Collected Successfully!</p>
                      <p className="text-xs text-emerald-700">
                        {currency}{selectedRecord.amountOwed.toFixed(2)} cash dispensed. Collection WhatsApp confirmation has been dispatched.
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={handleConfirmCollection}
                      disabled={isProcessing}
                      className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{isProcessing ? 'Processing Handover...' : 'CONFIRM CASH COLLECTION'}</span>
                    </button>
                  )}
                </div>
              )}

              {/* CASE 2: ALREADY COLLECTED (CRITICAL ANTI-FRAUD BANNER) */}
              {selectedRecord.status === 'COLLECTED' && (
                <div className="rounded-2xl border-2 border-rose-300 bg-rose-50/70 p-5 shadow-md space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-rose-100 text-rose-700 rounded-xl border border-rose-200 shrink-0">
                      <ShieldAlert className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-black text-rose-900 tracking-tight">
                          CHANGE ALREADY COLLECTED
                        </h4>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-rose-200 text-rose-800 uppercase">
                          Fraud Protected
                        </span>
                      </div>
                      <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                        This change record was already dispensed and marked collected. Double collection is strictly prohibited.
                      </p>
                    </div>
                  </div>

                  {/* Audit Evidence Card */}
                  <div className="bg-white rounded-xl p-4 border border-rose-200 space-y-2 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-slate-500">Amount:</span>
                      <span className="text-lg font-black text-slate-900 font-mono-num">
                        {currency}{selectedRecord.amountOwed.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Change ID:</span>
                      <span className="font-mono font-bold text-slate-800">{selectedRecord.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Customer Phone:</span>
                      <span className="font-semibold text-slate-800">{selectedRecord.customerPhone}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Original Date Created:</span>
                      <span className="font-medium text-slate-700">{formatDateTime(selectedRecord.createdAt)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <span className="font-bold text-rose-800">Collection Date & Time:</span>
                      <span className="font-bold text-rose-800">
                        {selectedRecord.collectedAt ? formatDateTime(selectedRecord.collectedAt) : 'Recorded'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-rose-800">Cashier Who Processed Collection:</span>
                      <span className="font-bold text-rose-900 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {selectedRecord.collectedByEmployeeName || 'Authorized Cashier'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Verification Method:</span>
                      <span className="font-medium text-slate-700">{selectedRecord.collectionMethod || 'TILL_VERIFIED'}</span>
                    </div>
                  </div>

                  {/* Neutral Dispute Statement */}
                  <div className="p-3 bg-white/80 rounded-xl border border-rose-100 text-xs text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-800">Shop Verification Record:</p>
                    <p className="text-[11px] leading-relaxed">
                      "Our system records indicate that your change of {currency}{selectedRecord.amountOwed.toFixed(2)} was collected on {selectedRecord.collectedAt ? formatDateTime(selectedRecord.collectedAt) : 'earlier date'}. If there is any discrepancy, please consult the store manager."
                    </p>
                  </div>

                  {/* Admin Correction Override */}
                  {currentEmployee.role === 'ADMIN' && (
                    <div className="pt-2 border-t border-rose-200">
                      {!showAdminReversal ? (
                        <button
                          type="button"
                          onClick={() => setShowAdminReversal(true)}
                          className="text-xs text-slate-600 hover:text-slate-900 underline flex items-center gap-1"
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
                            className="w-full p-2 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none"
                            rows={2}
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setShowAdminReversal(false)}
                              className="px-2.5 py-1 text-xs text-slate-600 hover:bg-amber-100 rounded"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleAdminReversal}
                              disabled={!reversalReason.trim()}
                              className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded"
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
                <div className="rounded-2xl border-2 border-slate-300 bg-slate-100 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-rose-800 font-bold">
                    <ShieldAlert className="w-5 h-5" />
                    <span>CHANGE RECORD VOIDED / CANCELLED</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    This change record was cancelled on{' '}
                    <span className="font-semibold">{selectedRecord.cancelledAt ? formatDateTime(selectedRecord.cancelledAt) : 'prior date'}</span>{' '}
                    by Admin <span className="font-semibold">{selectedRecord.cancelledByEmployeeName}</span>.
                  </p>
                  <p className="text-xs bg-white p-3 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-700">Reason:</span> {selectedRecord.cancellationReason || 'Coin handed over before departure.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {!selectedRecord && matchedPhoneRecords.length === 0 && !errorMessage && (
            <div className="flex flex-col items-center justify-center text-center py-10 text-slate-400 space-y-2">
              <ShieldCheck className="w-10 h-10 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">Ready to Verify Customer Change</p>
              <p className="text-xs text-slate-400 max-w-xs">
                Scan the customer's QR code, search their Change ID, or enter their phone number to check their balance.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span>Till Cashier: <strong className="text-slate-700">{currentEmployee.name}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-800 font-semibold rounded-lg border border-slate-300 transition-colors"
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
