import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  Coins, 
  Phone, 
  User, 
  CheckCircle, 
  BookmarkPlus, 
  ArrowRight, 
  QrCode, 
  Printer, 
  RotateCcw, 
  MessageSquare, 
  ShieldCheck, 
  AlertCircle, 
  Wallet,
  ExternalLink,
  Copy,
  Check,
  Split,
  Zap,
  Banknote,
  FileText
} from 'lucide-react';
import { Employee, Shop, ChangeRecord, Transaction, WhatsAppMessage } from '../types';
import { storage } from '../services/storage';
import { VerificationModal } from './VerificationModal';
import { ReceiptModal } from './ReceiptModal';

interface CashierTillProps {
  currentEmployee: Employee;
  shop: Shop;
  onRecordCreated?: () => void;
  onTransactionComplete?: () => void;
}

export const CashierTill: React.FC<CashierTillProps> = ({
  currentEmployee,
  shop,
  onRecordCreated,
  onTransactionComplete
}) => {
  const notifyChange = () => {
    if (typeof onRecordCreated === 'function') {
      onRecordCreated();
    }
    if (typeof onTransactionComplete === 'function') {
      onTransactionComplete();
    }
  };

  // Till Mode: 'SALE' = Standard transaction tender & change; 'DIRECT_CHANGE' = Directly record customer change
  const [tillMode, setTillMode] = useState<'SALE' | 'DIRECT_CHANGE'>('SALE');

  // Standard Sale Fields
  const [purchaseAmountStr, setPurchaseAmountStr] = useState<string>('');
  const [amountReceivedStr, setAmountReceivedStr] = useState<string>('');
  const [phoneCountryCode, setPhoneCountryCode] = useState<string>('+263');
  const [customerPhoneRaw, setCustomerPhoneRaw] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Partial / Split Change State (Cashier gives partial cash now, rest recorded to WhatsApp)
  const [isPartialActive, setIsPartialActive] = useState<boolean>(false);
  const [partialCashGivenStr, setPartialCashGivenStr] = useState<string>('');

  // Direct Change Registration State (When cashier directly registers change without entering a sale)
  const [directChangeAmountStr, setDirectChangeAmountStr] = useState<string>('');
  const [directNotes, setDirectNotes] = useState<string>('');

  // Modals & WhatsApp Redirect state
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [verificationInitialQuery, setVerificationInitialQuery] = useState('');
  const [completedRecord, setCompletedRecord] = useState<ChangeRecord | null>(null);
  const [completedTx, setCompletedTx] = useState<Transaction | null>(null);
  const [lastWaDirectLink, setLastWaDirectLink] = useState<string | null>(null);
  const [lastWaMessageText, setLastWaMessageText] = useState<string | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);

  const currency = shop.currencySymbol || '$';

  // Math for standard sale
  const purchaseAmount = parseFloat(purchaseAmountStr) || 0;
  const amountReceived = parseFloat(amountReceivedStr) || 0;

  const changeDue = useMemo(() => {
    if (amountReceived > purchaseAmount && purchaseAmount > 0) {
      return Math.round((amountReceived - purchaseAmount) * 100) / 100;
    }
    return 0;
  }, [purchaseAmount, amountReceived]);

  // Partial change calculations
  const partialCashGiven = parseFloat(partialCashGivenStr) || 0;

  const remainingPartialChangeOwed = useMemo(() => {
    if (!isPartialActive || partialCashGiven <= 0) return changeDue;
    const remaining = Math.round((changeDue - partialCashGiven) * 100) / 100;
    return Math.max(0, remaining);
  }, [changeDue, isPartialActive, partialCashGiven]);

  const isPartialCashExceeding = isPartialActive && partialCashGiven > changeDue;
  const isPartialCashExactMatch = isPartialActive && partialCashGiven === changeDue && changeDue > 0;

  // Direct change registration math
  const directChangeAmount = parseFloat(directChangeAmountStr) || 0;

  // Clean phone and customer lookup
  const cleanPhoneInput = useMemo(() => {
    return customerPhoneRaw.replace(/[^0-9]/g, '').replace(/^0+/, '');
  }, [customerPhoneRaw]);

  const fullPhoneClean = useMemo(() => {
    if (!cleanPhoneInput) return '';
    return `${phoneCountryCode}${cleanPhoneInput}`;
  }, [phoneCountryCode, cleanPhoneInput]);

  const existingCustomer = useMemo(() => {
    if (!fullPhoneClean || cleanPhoneInput.length < 5) return undefined;
    return storage.getCustomerByPhone(fullPhoneClean);
  }, [fullPhoneClean, cleanPhoneInput, toastMessage]);

  const isInvalidTender = amountReceived > 0 && purchaseAmount > 0 && amountReceived < purchaseAmount;

  // Handle quick cash tender buttons
  const handleQuickTender = (val: number) => {
    setAmountReceivedStr(val.toFixed(2));
  };

  const handleExactTender = () => {
    if (purchaseAmount > 0) {
      setAmountReceivedStr(purchaseAmount.toFixed(2));
    }
  };

  const handleClear = () => {
    setPurchaseAmountStr('');
    setAmountReceivedStr('');
    setCustomerPhoneRaw('');
    setCustomerName('');
    setNotes('');
    setPartialCashGivenStr('');
    setIsPartialActive(false);
    setDirectChangeAmountStr('');
    setDirectNotes('');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // 1. Give Full Change Now
  const handleGiveChangeNow = () => {
    if (purchaseAmount <= 0 || amountReceived < purchaseAmount || isNaN(purchaseAmount) || isNaN(amountReceived)) {
      showToast('Please enter a valid purchase amount and received cash tender.');
      return;
    }

    if (purchaseAmount > 100000 || amountReceived > 100000) {
      showToast('Amount exceeds maximum till limit ($100,000.00).');
      return;
    }

    const res = storage.processCashSaleGivenNow({
      purchaseTotal: purchaseAmount,
      amountReceived: amountReceived,
      employee: currentEmployee,
      customerPhone: customerPhoneRaw ? `${phoneCountryCode}${customerPhoneRaw.replace(/^0+/, '')}` : undefined,
      customerName: customerName.trim() || undefined,
      notes: notes.trim() || undefined
    });

    setCompletedTx(res.transaction);
    setCompletedRecord(null);
    setLastWaDirectLink(null);
    setLastWaMessageText(null);
    showToast(`Transaction ${res.transaction.id} completed. Cash change of ${currency}${changeDue.toFixed(2)} dispensed.`);
    handleClear();
    notifyChange();
  };

  // 2. Record Full Change - Generate ChangeTrack message and open WhatsApp directly
  const handleRecordChange = async () => {
    if (purchaseAmount <= 0 || changeDue <= 0 || isNaN(changeDue)) {
      showToast('Cannot record change: no change is owed for this sale.');
      return;
    }

    const cleanNumber = customerPhoneRaw.replace(/[^0-9]/g, '').replace(/^0+/, '');
    if (!cleanNumber || cleanNumber.length < 5 || cleanNumber.length > 15) {
      showToast("Please enter a valid customer phone number (5-15 digits) to record change.");
      return;
    }

    const fullPhone = `${phoneCountryCode}${cleanNumber}`;

    const res = await storage.processRecordChange({
      purchaseTotal: purchaseAmount,
      amountReceived: amountReceived,
      customerPhone: fullPhone,
      customerName: customerName.trim() || undefined,
      employee: currentEmployee,
      notes: notes.trim() || undefined
    });

    setCompletedTx(res.transaction);
    setCompletedRecord(res.changeRecord);
    setLastWaDirectLink(res.waDirectLink || null);
    setLastWaMessageText(res.waMessageText || null);
    setShowReceiptModal(true);

    // Safely open WhatsApp directly with pre-filled message
    if (res.waDirectLink) {
      try {
        window.open(res.waDirectLink, '_blank', 'noopener,noreferrer');
      } catch (err) {
        console.warn('Could not auto-open WhatsApp link:', err);
      }
    }

    showToast(`Change Record ${res.changeRecord.id} generated! WhatsApp opened with customer number & message.`);
    handleClear();
    notifyChange();
  };

  // 3. Record Partial Change (Cashier gives partial cash now, rest recorded as change)
  const handleRecordPartialChange = async () => {
    if (purchaseAmount <= 0 || changeDue <= 0 || isNaN(changeDue)) {
      showToast('Cannot record change: no change is due for this sale.');
      return;
    }

    if (partialCashGiven <= 0 || isNaN(partialCashGiven)) {
      showToast('Please enter the cash amount given to customer, or use standard "Record Change" for full change.');
      return;
    }

    if (partialCashGiven >= changeDue) {
      showToast(`The cash given (${currency}${partialCashGiven.toFixed(2)}) covers all change due (${currency}${changeDue.toFixed(2)}). Use "Give Change Now" instead.`);
      return;
    }

    const cleanNumber = customerPhoneRaw.replace(/[^0-9]/g, '').replace(/^0+/, '');
    if (!cleanNumber || cleanNumber.length < 5 || cleanNumber.length > 15) {
      showToast("Please enter a valid customer phone number (5-15 digits) to record remaining change.");
      return;
    }

    const fullPhone = `${phoneCountryCode}${cleanNumber}`;

    const res = await storage.processRecordChange({
      purchaseTotal: purchaseAmount,
      amountReceived: amountReceived,
      customerPhone: fullPhone,
      customerName: customerName.trim() || undefined,
      employee: currentEmployee,
      notes: notes.trim()
        ? `${notes.trim()} (Partial: ${currency}${partialCashGiven.toFixed(2)} cash given, ${currency}${remainingPartialChangeOwed.toFixed(2)} recorded)`
        : `Partial change: ${currency}${partialCashGiven.toFixed(2)} paid in cash, ${currency}${remainingPartialChangeOwed.toFixed(2)} recorded`,
      partialCashGivenNow: partialCashGiven
    });

    setCompletedTx(res.transaction);
    setCompletedRecord(res.changeRecord);
    setLastWaDirectLink(res.waDirectLink || null);
    setLastWaMessageText(res.waMessageText || null);
    setShowReceiptModal(true);

    if (res.waDirectLink) {
      try {
        window.open(res.waDirectLink, '_blank', 'noopener,noreferrer');
      } catch (err) {
        console.warn('Could not auto-open WhatsApp link:', err);
      }
    }

    showToast(`Partial change saved! Handed ${currency}${partialCashGiven.toFixed(2)} cash, recorded ${currency}${remainingPartialChangeOwed.toFixed(2)} to ${fullPhone}.`);
    handleClear();
    notifyChange();
  };

  // 4. Direct Register Change (Operator simply wants to register a person's change without a sale)
  const handleRegisterDirectChange = async () => {
    if (directChangeAmount <= 0 || isNaN(directChangeAmount)) {
      showToast('Please enter a valid change amount to register.');
      return;
    }

    if (directChangeAmount > 100000) {
      showToast('Direct change amount exceeds maximum limit ($100,000.00).');
      return;
    }

    const cleanNumber = customerPhoneRaw.replace(/[^0-9]/g, '').replace(/^0+/, '');
    if (!cleanNumber || cleanNumber.length < 5 || cleanNumber.length > 15) {
      showToast("Please enter a valid customer phone number (5-15 digits) to register change.");
      return;
    }

    const fullPhone = `${phoneCountryCode}${cleanNumber}`;

    const res = await storage.processDirectRegisterChange({
      customerPhone: fullPhone,
      customerName: customerName.trim() || undefined,
      amountOwed: directChangeAmount,
      employee: currentEmployee,
      notes: directNotes.trim() || 'Direct change registration'
    });

    setCompletedTx(res.transaction);
    setCompletedRecord(res.changeRecord);
    setLastWaDirectLink(res.waDirectLink || null);
    setLastWaMessageText(res.waMessageText || null);
    setShowReceiptModal(true);

    if (res.waDirectLink) {
      try {
        window.open(res.waDirectLink, '_blank', 'noopener,noreferrer');
      } catch (err) {
        console.warn('Could not auto-open WhatsApp link:', err);
      }
    }

    showToast(`Direct change of ${currency}${directChangeAmount.toFixed(2)} registered to ${fullPhone}! WhatsApp opened.`);
    handleClear();
    notifyChange();
  };

  const handleCopyLastMessage = () => {
    if (!lastWaMessageText) return;
    navigator.clipboard.writeText(lastWaMessageText);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 px-2 sm:px-0">
      {/* Till Header Status Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-ink-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-600 text-white rounded-xl shadow-xs">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-ink-900">Cashier POS Quick Till</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-800">
                LIVE TILL
              </span>
            </div>
            <p className="text-xs text-ink-500">
              Till Operator: <span className="font-semibold text-ink-700">{currentEmployee.name}</span> ({currentEmployee.role})
            </p>
          </div>
        </div>

        {/* Action Button: Quick Verify */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setVerificationInitialQuery('');
              setIsVerificationModalOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-brand-600 hover:bg-brand-700 active:scale-98 tap-scale text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verify & Collect</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center p-1.5 bg-ink-200/80 rounded-2xl gap-1 text-xs font-extrabold">
        <button
          onClick={() => setTillMode('SALE')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all ${
            tillMode === 'SALE'
              ? 'bg-white text-ink-900 shadow-sm tap-scale'
              : 'text-ink-600 hover:text-ink-900 hover:bg-white/50'
          }`}
        >
          <Coins className="w-4 h-4 text-brand-600" />
          <span>Sale & Tender Till</span>
          {changeDue > 0 && tillMode === 'SALE' && (
            <span className="ml-1 text-[10px] font-mono bg-brand-100 text-brand-800 px-1.5 py-0.2 rounded-full">
              {currency}{changeDue.toFixed(2)}
            </span>
          )}
        </button>

        <button
          onClick={() => setTillMode('DIRECT_CHANGE')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all ${
            tillMode === 'DIRECT_CHANGE'
              ? 'bg-white text-brand-900 shadow-sm'
              : 'text-ink-600 hover:text-ink-900 hover:bg-white/50'
          }`}
        >
          <Zap className="w-4 h-4 text-brand-600" />
          <span>Register Person's Change (Direct IOU)</span>
          <span className="hidden sm:inline-block text-[10px] font-normal bg-brand-100 text-brand-800 px-2 py-0.5 rounded-full">
            No sale needed
          </span>
        </button>
      </div>

      {/* WhatsApp Redirect Status Callout (When recent change record exists) */}
      {completedRecord && lastWaDirectLink && (
        <div className="p-4 bg-brand-50 border-2 border-brand-300 rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rise-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-600 text-white rounded-xl shadow-xs shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs sm:text-sm font-extrabold text-brand-900 uppercase tracking-wide">
                  WhatsApp Change Receipt Ready
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-200 text-brand-900">
                  {completedRecord.id}
                </span>
                {completedRecord.isPartialChange && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                    Partial Cash Paid: {currency}{(completedRecord.partialCashGivenNow || 0).toFixed(2)}
                  </span>
                )}
                {completedRecord.isDirectRegistration && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-200 text-brand-900">
                    Direct Registration
                  </span>
                )}
              </div>
              <p className="text-xs text-brand-800 mt-0.5">
                Customer: <span className="font-semibold">{completedRecord.customerPhone}</span> • Remaining Owed: <span className="font-mono font-bold">{currency}{completedRecord.amountOwed.toFixed(2)}</span>
              </p>
              <p className="text-[11px] text-brand-700">
                Customer number and message are pre-filled in WhatsApp. Cashier only needs to press <strong>Send</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <a
              href={lastWaDirectLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[42px] bg-brand-600 hover:bg-brand-700 text-white text-xs font-black rounded-xl shadow-sm transition-all"
            >
              <MessageSquare className="w-4 h-4 fill-white" />
              <span>Open WhatsApp</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              type="button"
              onClick={handleCopyLastMessage}
              className="px-3 py-2.5 min-h-[42px] bg-white hover:bg-brand-100 text-brand-800 border border-brand-300 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
              title="Copy WhatsApp Message"
            >
              {copiedMessage ? <Check className="w-3.5 h-3.5 text-brand-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedMessage ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowReceiptModal(true)}
              className="px-3 py-2.5 min-h-[42px] bg-ink-900 hover:bg-ink-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
              title="Print Receipt Slip"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Slip</span>
            </button>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toastMessage && (
        <div className="p-3 bg-brand-50 border border-brand-300 text-brand-900 rounded-xl text-xs font-semibold flex items-center justify-between rise-in">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-brand-700 font-bold p-1">×</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 1: SALE & TENDER REGISTER (With Partial Cash Change Capabilities) */}
      {/* ========================================================================= */}
      {tillMode === 'SALE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          {/* Left Column: Transaction Input (7 Cols) */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-5 bg-white p-4 sm:p-6 rounded-2xl border border-ink-200 shadow-xs rise-in">
            {/* Purchase Amount */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-600 mb-1.5">
                1. Purchase Total
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-ink-400">
                  {currency}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={purchaseAmountStr}
                  onChange={e => setPurchaseAmountStr(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 min-h-[50px] text-2xl font-black text-ink-900 font-mono-num bg-ink-50 border-2 border-ink-200 rounded-xl focus:bg-white focus:border-brand-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Amount Received / Tender */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-600">
                  2. Amount Received (Cash Tender)
                </label>
                {purchaseAmount > 0 && (
                  <button
                    type="button"
                    onClick={handleExactTender}
                    className="text-xs text-brand-600 font-bold hover:underline py-1 px-2 tap-scale"
                  >
                    Exact Amount ({currency}{purchaseAmount.toFixed(2)})
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-ink-400">
                  {currency}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amountReceivedStr}
                  onChange={e => setAmountReceivedStr(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 min-h-[50px] text-2xl font-black text-ink-900 font-mono-num bg-ink-50 border-2 border-ink-200 rounded-xl focus:bg-white focus:border-brand-500 focus:outline-none transition-all"
                />
              </div>

              {/* Quick Cash Tender Pills (Touch Friendly) */}
              <div className="mt-2.5 flex flex-wrap gap-1.5 sm:gap-2">
                <span className="text-[11px] font-semibold text-ink-400 self-center mr-1">Quick Bills:</span>
                {[1, 2, 5, 10, 20, 50, 100].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickTender(val)}
                    className="px-3.5 py-2 min-h-[40px] bg-ink-100 hover:bg-ink-200 active:scale-95 tap-scale text-ink-800 rounded-xl text-xs font-mono font-bold transition-colors"
                  >
                    {currency}{val}
                  </button>
                ))}
              </div>

              {isInvalidTender && (
                <p className="mt-2 text-xs text-rose-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Amount received is less than purchase total ({currency}{(purchaseAmount - amountReceived).toFixed(2)} remaining)
                </p>
              )}
            </div>

            {/* ========================================================= */}
            {/* PARTIAL CHANGE SECTION (Active when change is due) */}
            {/* ========================================================= */}
            {changeDue > 0 && (
              <div className="p-3.5 bg-amber-50/70 border-2 border-amber-300 rounded-2xl space-y-2.5 rise-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Split className="w-4 h-4 text-amber-700" />
                    <span className="text-xs font-extrabold text-amber-950 uppercase tracking-wide">
                      Partial Cash Change (Split Change)
                    </span>
                  </div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-amber-900 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isPartialActive}
                      onChange={e => {
                        setIsPartialActive(e.target.checked);
                        if (!e.target.checked) setPartialCashGivenStr('');
                      }}
                      className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 border-ink-300"
                    />
                    <span>Give partial cash now?</span>
                  </label>
                </div>

                <p className="text-[11px] text-amber-800 leading-tight">
                  Hand over part of the change in cash right now, and record the remaining balance to the customer's WhatsApp slip.
                </p>

                {isPartialActive && (
                  <div className="pt-2 border-t border-amber-200/80 space-y-2.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-amber-950 uppercase tracking-wider">
                          Cash Amount Given to Customer Now:
                        </label>
                        <span className="text-[10px] text-ink-500">
                          Total Due: {currency}{changeDue.toFixed(2)}
                        </span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-ink-400">
                          {currency}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={changeDue}
                          value={partialCashGivenStr}
                          onChange={e => setPartialCashGivenStr(e.target.value)}
                          placeholder="e.g. 5.00"
                          className="w-full pl-8 pr-3 py-2.5 text-lg font-black text-ink-900 font-mono-num bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    {/* Quick partial pills */}
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] font-semibold text-ink-500">Quick Cash Given:</span>
                      {[1, 2, 5, 10, 20].filter(val => val < changeDue).map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setPartialCashGivenStr(val.toFixed(2))}
                          className="px-2.5 py-1 text-[11px] font-mono font-bold bg-white hover:bg-amber-100 text-amber-900 rounded-lg border border-amber-300 transition-colors"
                        >
                          {currency}{val}
                        </button>
                      ))}
                      {changeDue > 1 && (
                        <button
                          type="button"
                          onClick={() => setPartialCashGivenStr((Math.floor(changeDue / 2)).toFixed(2))}
                          className="px-2.5 py-1 text-[11px] font-mono font-bold bg-white hover:bg-amber-100 text-amber-900 rounded-lg border border-amber-300 transition-colors"
                        >
                          Half ({currency}{Math.floor(changeDue / 2).toFixed(2)})
                        </button>
                      )}
                    </div>

                    {/* Live Split Calculation Card */}
                    <div className="p-2.5 bg-white rounded-xl border border-amber-200 grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-ink-400 block font-semibold">TOTAL CHANGE</span>
                        <span className="font-mono font-bold text-ink-700">{currency}{changeDue.toFixed(2)}</span>
                      </div>
                      <div className="border-x border-ink-100 px-1">
                        <span className="text-[10px] text-brand-700 block font-bold">CASH GIVEN NOW</span>
                        <span className="font-mono font-bold text-brand-600">
                          {currency}{partialCashGiven.toFixed(2)}
                        </span>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-1">
                        <span className="text-[10px] text-amber-800 block font-black">REMAINING OWED</span>
                        <span className="font-mono font-black text-amber-900 text-sm">
                          {currency}{remainingPartialChangeOwed.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {isPartialCashExceeding && (
                      <p className="text-xs text-rose-600 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Cash given cannot exceed the total change due ({currency}{changeDue.toFixed(2)}).
                      </p>
                    )}

                    {isPartialCashExactMatch && (
                      <p className="text-xs text-ink-600">
                        Cash given equals full change due. You can simply click <strong>"GIVE CHANGE NOW"</strong>.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Customer Details for Change Record */}
            <div className="pt-4 border-t border-ink-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-700">
                  3. Customer WhatsApp Number (For Recording Change)
                </span>
                <span className="text-[10px] text-brand-700 font-bold bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                  Direct WhatsApp
                </span>
              </div>

              {/* WhatsApp Phone Number Input */}
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-4 sm:col-span-3">
                  <select
                    value={phoneCountryCode}
                    onChange={e => setPhoneCountryCode(e.target.value)}
                    className="w-full py-3 px-2 bg-ink-50 border border-ink-300 rounded-xl text-xs font-bold text-ink-800 focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[46px]"
                  >
                    <option value="+263">ZW (+263)</option>
                    <option value="+27">ZA (+27)</option>
                    <option value="+254">KE (+254)</option>
                    <option value="+256">UG (+256)</option>
                    <option value="+260">ZM (+260)</option>
                    <option value="+258">MZ (+258)</option>
                    <option value="+267">BW (+267)</option>
                    <option value="+1">US/CA (+1)</option>
                    <option value="+44">UK (+44)</option>
                  </select>
                </div>
                <div className="col-span-8 sm:col-span-9 relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                  <input
                    type="tel"
                    value={customerPhoneRaw}
                    onChange={e => setCustomerPhoneRaw(e.target.value)}
                    placeholder="Customer WhatsApp Number (e.g. 77 123 4567)"
                    className="w-full pl-9 pr-3 py-3 min-h-[46px] bg-ink-50 border border-ink-300 rounded-xl text-xs sm:text-sm font-semibold text-ink-900 placeholder-ink-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Optional Name & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder={existingCustomer?.name ? existingCustomer.name : "Customer Name (Optional)"}
                    className="w-full pl-9 pr-3 py-2.5 min-h-[44px] bg-ink-50 border border-ink-300 rounded-xl text-xs text-ink-900 placeholder-ink-400 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Notes / items (Optional)"
                    className="w-full px-3 py-2.5 min-h-[44px] bg-ink-50 border border-ink-300 rounded-xl text-xs text-ink-900 placeholder-ink-400 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Customer Account & Existing Balance Banner */}
              {existingCustomer && (
                <div className="p-3 bg-brand-50/80 border border-brand-200 rounded-xl space-y-2 rise-in">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-brand-900">
                      <Wallet className="w-4 h-4 text-brand-600" />
                      <span>Customer Account: {existingCustomer.name || 'Valued Customer'}</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-brand-700 bg-white px-2 py-0.5 rounded border border-brand-200">
                      {existingCustomer.totalRecordsCount || 1} previous change(s)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-brand-200/60 text-xs">
                    <div>
                      <span className="text-ink-500 text-[11px] block">Current Owed Balance:</span>
                      <span className="font-mono font-bold text-ink-900 text-sm">
                        {currency}{(existingCustomer.totalBalanceOwed || 0).toFixed(2)}
                      </span>
                    </div>

                    {changeDue > 0 ? (
                      <div className="bg-brand-100/70 p-1.5 rounded-lg border border-brand-200 text-right">
                        <span className="text-brand-800 text-[10px] font-bold block uppercase tracking-wider">
                          New Cumulative Balance:
                        </span>
                        <span className="font-mono font-extrabold text-brand-900 text-sm">
                          {currency}{((existingCustomer.totalBalanceOwed || 0) + (isPartialActive && partialCashGiven > 0 ? remainingPartialChangeOwed : changeDue)).toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <div className="text-right">
                        <span className="text-ink-500 text-[11px] block">Lifetime Collected:</span>
                        <span className="font-mono font-semibold text-ink-700 text-xs">
                          {currency}{(existingCustomer.totalCollectedLifetime || 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-brand-800">
                    {changeDue > 0 ? (
                      <><strong>Auto-Accumulate:</strong> The change amount adds on top of their running balance. The WhatsApp message includes their updated cumulative total.</>
                    ) : (
                      <>Customer has uncollected change in record. Click Verify & Collect to hand over cash.</>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Change Display & Action Buttons (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4 min-w-0 rise-in">
            {/* Automatic Calculated Change Display Card */}
            <div className="bg-ink-900 text-white p-4 sm:p-6 rounded-2xl shadow-lg border border-ink-800 relative overflow-hidden flex flex-col justify-between min-h-[190px] sm:min-h-[220px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-ink-400">
                  Calculated Change
                </span>
                {changeDue > 0 && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    CHANGE OWED
                  </span>
                )}
              </div>

              <div className="my-auto py-2">
                <div className="text-4xl sm:text-5xl font-black font-mono-num tracking-tight text-white flex items-baseline">
                  <span className="text-3xl text-brand-400 mr-1">{currency}</span>
                  <span>{changeDue.toFixed(2)}</span>
                </div>
                <p className="text-xs text-ink-400 mt-2">
                  {amountReceived >= purchaseAmount && purchaseAmount > 0
                    ? `Customer paid ${currency}${amountReceived.toFixed(2)} on a ${currency}${purchaseAmount.toFixed(2)} order.`
                    : 'Awaiting purchase and cash tender values...'}
                </p>

                {/* Show breakdown if partial active */}
                {isPartialActive && partialCashGiven > 0 && partialCashGiven < changeDue && (
                  <div className="mt-2.5 p-2 bg-ink-800 rounded-xl border border-amber-500/40 text-xs space-y-1">
                    <div className="flex justify-between text-brand-400 font-bold">
                      <span>Cash Handed Over Now:</span>
                      <span className="font-mono">{currency}{partialCashGiven.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-amber-300 font-bold border-t border-ink-700 pt-1">
                      <span>Remaining Recorded to WhatsApp:</span>
                      <span className="font-mono">{currency}{remainingPartialChangeOwed.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Cumulative balance preview in change card if existing customer */}
                {existingCustomer && (existingCustomer.totalBalanceOwed || 0) > 0 && changeDue > 0 && (
                  <div className="mt-3 p-2.5 bg-ink-800/90 rounded-xl border border-ink-700/80 text-xs space-y-1">
                    <div className="flex justify-between text-ink-400 text-[11px]">
                      <span>Prior balance owed:</span>
                      <span className="font-mono text-ink-200">{currency}{(existingCustomer.totalBalanceOwed || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-ink-400 text-[11px]">
                      <span>+ New change to add:</span>
                      <span className="font-mono text-amber-400">
                        +{currency}{(isPartialActive && partialCashGiven > 0 ? remainingPartialChangeOwed : changeDue).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-brand-300 border-t border-ink-700 pt-1 text-xs">
                      <span>New Total Balance:</span>
                      <span className="font-mono">
                        {currency}{((existingCustomer.totalBalanceOwed || 0) + (isPartialActive && partialCashGiven > 0 ? remainingPartialChangeOwed : changeDue)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-ink-800 flex items-center justify-between text-xs text-ink-400">
                <span className="truncate max-w-[180px]">Shop: {shop.name}</span>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-ink-400 hover:text-white flex items-center gap-1 text-[11px] p-1 shrink-0 tap-scale"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            {isPartialActive && partialCashGiven > 0 && partialCashGiven < changeDue ? (
              // Specialized Partial Change Action
              <div className="space-y-2">
                <button
                  onClick={handleRecordPartialChange}
                  className="w-full p-4 rounded-2xl font-bold text-left shadow-md transition-all flex flex-col justify-between bg-amber-500 hover:bg-amber-600 active:scale-98 tap-scale text-white cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Split className="w-5 h-5 text-amber-100" />
                    <span className="text-[10px] font-mono uppercase bg-amber-700/50 px-2 py-0.5 rounded text-amber-100">
                      PARTIAL CASH + WHATSAPP
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-extrabold uppercase tracking-wide">
                      GIVE {currency}{partialCashGiven.toFixed(2)} CASH & RECORD {currency}{remainingPartialChangeOwed.toFixed(2)}
                    </h4>
                    <p className="text-[11px] opacity-95 mt-0.5">
                      Hands {currency}{partialCashGiven.toFixed(2)} cash to customer • Saves {currency}{remainingPartialChangeOwed.toFixed(2)} to their WhatsApp slip
                    </p>
                  </div>
                </button>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={handleGiveChangeNow}
                    className="p-2.5 rounded-xl border border-ink-300 hover:border-ink-400 hover:bg-ink-50 text-ink-700 font-bold text-center transition-all tap-scale"
                  >
                    Give Full Cash ({currency}{changeDue.toFixed(2)})
                  </button>
                  <button
                    onClick={handleRecordChange}
                    className="p-2.5 rounded-xl border border-ink-300 hover:border-ink-400 hover:bg-ink-50 text-ink-700 font-bold text-center transition-all tap-scale"
                  >
                    Record All ({currency}{changeDue.toFixed(2)})
                  </button>
                </div>
              </div>
            ) : (
              // Standard Dual Action Buttons
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 pt-1">
                {/* Action 1: Give Full Change Now */}
                <button
                  onClick={handleGiveChangeNow}
                  disabled={purchaseAmount <= 0 || amountReceived < purchaseAmount}
                  className={`p-3.5 sm:p-4 min-h-[80px] sm:min-h-[85px] rounded-2xl font-bold text-left shadow-sm transition-all flex flex-col justify-between ${
                    purchaseAmount > 0 && amountReceived >= purchaseAmount
                      ? 'bg-brand-600 hover:bg-brand-700 active:scale-98 tap-scale text-white cursor-pointer'
                      : 'bg-ink-100 text-ink-400 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <CheckCircle className="w-5 h-5 text-brand-200" />
                    <span className="text-[10px] font-mono uppercase bg-brand-800/40 px-2 py-0.5 rounded text-brand-100">
                      Instant Cash
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold uppercase tracking-wide">
                      GIVE CHANGE NOW
                    </h4>
                    <p className="text-[11px] opacity-90 mt-0.5">
                      Dispensed in cash right away
                    </p>
                  </div>
                </button>

                {/* Action 2: Record Change */}
                <button
                  onClick={handleRecordChange}
                  disabled={changeDue <= 0}
                  className={`p-3.5 sm:p-4 min-h-[80px] sm:min-h-[85px] rounded-2xl font-bold text-left shadow-sm transition-all flex flex-col justify-between ${
                    changeDue > 0
                      ? 'bg-amber-500 hover:bg-amber-600 active:scale-98 tap-scale text-white cursor-pointer'
                      : 'bg-ink-100 text-ink-400 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <BookmarkPlus className="w-5 h-5 text-amber-100" />
                    <span className="text-[10px] font-mono uppercase bg-amber-700/40 px-2 py-0.5 rounded text-amber-100">
                      WhatsApp
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold uppercase tracking-wide">
                      RECORD CHANGE
                    </h4>
                    <p className="text-[11px] opacity-90 mt-0.5">
                      Opens WhatsApp with pre-filled slip
                    </p>
                  </div>
                </button>
              </div>
            )}

            {/* Quick Info Box */}
            <div className="p-3 sm:p-3.5 bg-ink-100 rounded-xl text-xs text-ink-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-brand-600 shrink-0" />
                <span>Direct WhatsApp Redirect: No Meta API or tokens required.</span>
              </div>
              {completedRecord && (
                <button
                  onClick={() => setShowReceiptModal(true)}
                  className="text-brand-600 font-bold hover:underline flex items-center gap-1 shrink-0 tap-scale"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>View Slip</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: DIRECT CHANGE REGISTRATION (Operator registers person's change directly) */}
      {/* ========================================================================= */}
      {tillMode === 'DIRECT_CHANGE' && (
        <div className="bg-white p-5 sm:p-7 rounded-2xl border border-brand-200 shadow-sm space-y-6 rise-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-ink-100">
            <div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-brand-600" />
                <h3 className="text-base sm:text-lg font-black text-ink-900">
                  Direct Change & Credit Registration
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-brand-100 text-brand-800">
                  STANDALONE
                </span>
              </div>
              <p className="text-xs text-ink-500 mt-1">
                Quickly register change owed to a customer (e.g. leftover change from a bill, bottle return deposit, counter credit, or cash IOU) without entering a purchase total.
              </p>
            </div>

            <button
              onClick={() => setTillMode('SALE')}
              className="text-xs text-brand-600 hover:text-brand-800 font-bold flex items-center gap-1 tap-scale"
            >
              <span>Back to Sale Till</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step 1: Change Amount to Register */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                  1. Change Amount to Register
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-ink-400">
                    {currency}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={directChangeAmountStr}
                    onChange={e => setDirectChangeAmountStr(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-11 pr-4 py-3 min-h-[54px] text-3xl font-black text-ink-900 font-mono-num bg-ink-50 border-2 border-ink-300 rounded-xl focus:bg-white focus:border-brand-600 focus:outline-none transition-all"
                  />
                </div>

                {/* Quick Preset Buttons */}
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <span className="text-[11px] font-semibold text-ink-400 self-center mr-1">Presets:</span>
                  {[0.5, 1, 2, 5, 10, 20].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDirectChangeAmountStr(val.toFixed(2))}
                      className="px-3 py-1.5 min-h-[38px] bg-ink-100 hover:bg-brand-50 hover:text-brand-700 active:scale-95 tap-scale text-ink-800 rounded-xl text-xs font-mono font-bold border border-ink-200 transition-colors"
                    >
                      {currency}{val.toFixed(val < 1 ? 2 : 0)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference / Reason */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                  2. Reference / Reason (Optional)
                </label>
                <input
                  type="text"
                  value={directNotes}
                  onChange={e => setDirectNotes(e.target.value)}
                  placeholder="e.g. Leftover change from Bill, Bottle return, Counter credit"
                  className="w-full px-3.5 py-2.5 bg-ink-50 border border-ink-300 rounded-xl text-xs text-ink-900 placeholder-ink-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {['Leftover bill change', 'Bottle deposit return', 'Counter credit', 'Till swap change'].map(reason => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setDirectNotes(reason)}
                      className="text-[10px] font-semibold px-2 py-1 bg-ink-100 hover:bg-ink-200 text-ink-700 rounded-lg transition-all tap-scale"
                    >
                      +{reason}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 2: Customer WhatsApp Number */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                  3. Customer WhatsApp Number (Required)
                </label>
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-4">
                    <select
                      value={phoneCountryCode}
                      onChange={e => setPhoneCountryCode(e.target.value)}
                      className="w-full py-3 px-2 bg-ink-50 border border-ink-300 rounded-xl text-xs font-bold text-ink-800 focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[46px]"
                    >
                      <option value="+263">ZW (+263)</option>
                      <option value="+27">ZA (+27)</option>
                      <option value="+254">KE (+254)</option>
                      <option value="+256">UG (+256)</option>
                      <option value="+260">ZM (+260)</option>
                      <option value="+258">MZ (+258)</option>
                      <option value="+267">BW (+267)</option>
                      <option value="+1">US/CA (+1)</option>
                      <option value="+44">UK (+44)</option>
                    </select>
                  </div>
                  <div className="col-span-8 relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                    <input
                      type="tel"
                      value={customerPhoneRaw}
                      onChange={e => setCustomerPhoneRaw(e.target.value)}
                      placeholder="WhatsApp Phone (e.g. 77 123 4567)"
                      className="w-full pl-9 pr-3 py-3 min-h-[46px] bg-ink-50 border border-ink-300 rounded-xl text-xs sm:text-sm font-semibold text-ink-900 placeholder-ink-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                  4. Customer Name (Optional)
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder={existingCustomer?.name ? existingCustomer.name : "Customer Name"}
                    className="w-full pl-9 pr-3 py-2.5 min-h-[44px] bg-ink-50 border border-ink-300 rounded-xl text-xs text-ink-900 placeholder-ink-400 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Customer balance preview */}
              {existingCustomer && (
                <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl text-xs space-y-1.5">
                  <div className="flex justify-between items-center font-bold text-brand-900">
                    <span>{existingCustomer.name || 'Valued Customer'}</span>
                    <span className="font-mono text-brand-700">{existingCustomer.phone}</span>
                  </div>
                  <div className="flex justify-between text-ink-600">
                    <span>Current Owed Balance:</span>
                    <span className="font-mono font-bold text-ink-800">{currency}{(existingCustomer.totalBalanceOwed || 0).toFixed(2)}</span>
                  </div>
                  {directChangeAmount > 0 && (
                    <div className="flex justify-between font-bold text-brand-800 pt-1 border-t border-brand-200">
                      <span>Updated Total Balance:</span>
                      <span className="font-mono">{currency}{((existingCustomer.totalBalanceOwed || 0) + directChangeAmount).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Direct Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-ink-100">
            <div className="text-xs text-ink-500">
              Till Cashier: <strong className="text-ink-800">{currentEmployee.name}</strong> • Store: <strong className="text-ink-800">{shop.name}</strong>
            </div>

            <button
              onClick={handleRegisterDirectChange}
              disabled={directChangeAmount <= 0}
              className={`px-6 py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
                directChangeAmount > 0
                  ? 'bg-brand-600 hover:bg-brand-700 active:scale-98 tap-scale text-white cursor-pointer'
                  : 'bg-ink-200 text-ink-400 cursor-not-allowed'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>
                REGISTER {currency}{directChangeAmount.toFixed(2)} CHANGE & OPEN WHATSAPP
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {isVerificationModalOpen && (
        <VerificationModal
          initialSearchQuery={verificationInitialQuery}
          currentEmployee={currentEmployee}
          shop={shop}
          onClose={() => setIsVerificationModalOpen(false)}
          onRecordUpdated={notifyChange}
        />
      )}

      {showReceiptModal && (
        <ReceiptModal
          changeRecord={completedRecord || undefined}
          transaction={completedTx || undefined}
          shop={shop}
          customMessageText={lastWaMessageText || undefined}
          onClose={() => setShowReceiptModal(false)}
        />
      )}
    </div>
  );
};

