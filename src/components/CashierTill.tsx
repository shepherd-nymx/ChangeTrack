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
  Check
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

  const [purchaseAmountStr, setPurchaseAmountStr] = useState<string>('');
  const [amountReceivedStr, setAmountReceivedStr] = useState<string>('');
  const [phoneCountryCode, setPhoneCountryCode] = useState<string>('+263');
  const [customerPhoneRaw, setCustomerPhoneRaw] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

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

  // Math
  const purchaseAmount = parseFloat(purchaseAmountStr) || 0;
  const amountReceived = parseFloat(amountReceivedStr) || 0;

  const changeDue = useMemo(() => {
    if (amountReceived > purchaseAmount && purchaseAmount > 0) {
      return Math.round((amountReceived - purchaseAmount) * 100) / 100;
    }
    return 0;
  }, [purchaseAmount, amountReceived]);

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
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // 1. Give Change Now
  const handleGiveChangeNow = () => {
    if (purchaseAmount <= 0 || amountReceived < purchaseAmount) {
      alert('Please enter valid purchase amount and received cash tender.');
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

  // 2. Record Change - Generate ChangeTrack message and open WhatsApp directly
  const handleRecordChange = async () => {
    if (purchaseAmount <= 0 || changeDue <= 0) {
      alert('Cannot record change: no change is owed for this sale.');
      return;
    }

    const cleanNumber = customerPhoneRaw.replace(/[^0-9]/g, '').replace(/^0+/, '');
    if (!cleanNumber || cleanNumber.length < 5) {
      alert("Please enter the customer's WhatsApp number to record change and generate their digital receipt.");
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

    // Open WhatsApp directly with pre-filled message
    if (res.waDirectLink) {
      window.open(res.waDirectLink, '_blank', 'noopener,noreferrer');
    }

    showToast(`Change Record ${res.changeRecord.id} generated! WhatsApp opened with customer number & message.`);
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">Cashier POS Quick Till</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                LIVE TILL
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Till Operator: <span className="font-semibold text-slate-700">{currentEmployee.name}</span> ({currentEmployee.role})
            </p>
          </div>
        </div>

        {/* Action Button: Quick Collect / Verify Customer Change */}
        <div className="w-full sm:w-auto">
          <button
            onClick={() => {
              setVerificationInitialQuery('');
              setIsVerificationModalOpen(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verify & Collect Customer Change</span>
          </button>
        </div>
      </div>

      {/* WhatsApp Redirect Status Callout (When recent change record exists) */}
      {completedRecord && lastWaDirectLink && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs sm:text-sm font-extrabold text-emerald-950 uppercase tracking-wide">
                  WhatsApp Change Receipt Ready
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                  {completedRecord.id}
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-0.5">
                Customer: <span className="font-semibold">{completedRecord.customerPhone}</span> • Amount: <span className="font-mono font-bold">{currency}{completedRecord.amountOwed.toFixed(2)}</span>
              </p>
              <p className="text-[11px] text-emerald-700">
                Customer number and message are pre-filled in WhatsApp. Cashier only needs to press <strong>Send</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <a
              href={lastWaDirectLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[42px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-sm transition-all"
            >
              <MessageSquare className="w-4 h-4 fill-white" />
              <span>Open WhatsApp</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              type="button"
              onClick={handleCopyLastMessage}
              className="px-3 py-2.5 min-h-[42px] bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
              title="Copy WhatsApp Message"
            >
              {copiedMessage ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedMessage ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowReceiptModal(true)}
              className="px-3 py-2.5 min-h-[42px] bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
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
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center justify-between animate-fade-in">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 font-bold p-1">×</button>
        </div>
      )}

      {/* Main Till Register Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Left Column: Transaction Input (7 Cols) */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-5 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
          {/* Purchase Amount */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              1. Purchase Total
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">
                {currency}
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={purchaseAmountStr}
                onChange={e => setPurchaseAmountStr(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 min-h-[50px] text-2xl font-black text-slate-900 font-mono-num bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Amount Received / Tender */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                2. Amount Received (Cash Tender)
              </label>
              {purchaseAmount > 0 && (
                <button
                  type="button"
                  onClick={handleExactTender}
                  className="text-xs text-emerald-600 font-bold hover:underline py-1 px-2"
                >
                  Exact Amount ({currency}{purchaseAmount.toFixed(2)})
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">
                {currency}
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amountReceivedStr}
                onChange={e => setAmountReceivedStr(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 min-h-[50px] text-2xl font-black text-slate-900 font-mono-num bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            {/* Quick Cash Tender Pills (Touch Friendly) */}
            <div className="mt-2.5 flex flex-wrap gap-1.5 sm:gap-2">
              <span className="text-[11px] font-semibold text-slate-400 self-center mr-1">Quick Bills:</span>
              {[1, 2, 5, 10, 20, 50, 100].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickTender(val)}
                  className="px-3.5 py-2 min-h-[40px] bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 rounded-xl text-xs font-mono font-bold transition-colors"
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

          {/* Customer Details for Change Record */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                3. Customer WhatsApp Number (For "Record Change")
              </span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Direct WhatsApp
              </span>
            </div>

            {/* WhatsApp Phone Number Input */}
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-4 sm:col-span-3">
                <select
                  value={phoneCountryCode}
                  onChange={e => setPhoneCountryCode(e.target.value)}
                  className="w-full py-3 px-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[46px]"
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
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={customerPhoneRaw}
                  onChange={e => setCustomerPhoneRaw(e.target.value)}
                  placeholder="Customer WhatsApp Number (e.g. 77 123 4567)"
                  className="w-full pl-9 pr-3 py-3 min-h-[46px] bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Optional Name & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder={existingCustomer?.name ? existingCustomer.name : "Customer Name (Optional)"}
                  className="w-full pl-9 pr-3 py-2.5 min-h-[44px] bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Notes / items (Optional)"
                  className="w-full px-3 py-2.5 min-h-[44px] bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Customer Account & Existing Balance Banner */}
            {existingCustomer && (
              <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-2 animate-fade-in">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                    <Wallet className="w-4 h-4 text-indigo-600" />
                    <span>Customer Account: {existingCustomer.name || 'Valued Customer'}</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                    {existingCustomer.totalRecordsCount || 1} previous change(s)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-indigo-200/60 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Current Owed Balance:</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {currency}{(existingCustomer.totalBalanceOwed || 0).toFixed(2)}
                    </span>
                  </div>

                  {changeDue > 0 ? (
                    <div className="bg-emerald-100/70 p-1.5 rounded-lg border border-emerald-200 text-right">
                      <span className="text-emerald-800 text-[10px] font-bold block uppercase tracking-wider">
                        New Cumulative Balance:
                      </span>
                      <span className="font-mono font-extrabold text-emerald-950 text-sm">
                        {currency}{((existingCustomer.totalBalanceOwed || 0) + changeDue).toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <div className="text-right">
                      <span className="text-slate-500 text-[11px] block">Lifetime Collected:</span>
                      <span className="font-mono font-semibold text-slate-700 text-xs">
                        {currency}{(existingCustomer.totalCollectedLifetime || 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-indigo-800">
                  {changeDue > 0 ? (
                    <>✨ <strong>Auto-Accumulate:</strong> This change adds on top of their running balance. The WhatsApp message will include their updated cumulative total.</>
                  ) : (
                    <>Customer has uncollected change in record. Click Verify & Collect to hand over cash.</>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Change Display & Dual Actions (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          {/* Automatic Calculated Change Display Card */}
          <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-lg border border-slate-800 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
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
                <span className="text-3xl text-emerald-400 mr-1">{currency}</span>
                <span>{changeDue.toFixed(2)}</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {amountReceived >= purchaseAmount && purchaseAmount > 0
                  ? `Customer paid ${currency}${amountReceived.toFixed(2)} on a ${currency}${purchaseAmount.toFixed(2)} order.`
                  : 'Awaiting purchase and cash tender values...'}
              </p>

              {/* Cumulative balance preview in change card if existing customer */}
              {existingCustomer && (existingCustomer.totalBalanceOwed || 0) > 0 && changeDue > 0 && (
                <div className="mt-3 p-2.5 bg-slate-800/90 rounded-xl border border-slate-700/80 text-xs space-y-1">
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Prior balance owed:</span>
                    <span className="font-mono text-slate-200">{currency}{(existingCustomer.totalBalanceOwed || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>+ This transaction change:</span>
                    <span className="font-mono text-amber-400">+{currency}{changeDue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-300 border-t border-slate-700 pt-1 text-xs">
                    <span>New Total Balance:</span>
                    <span className="font-mono">{currency}{((existingCustomer.totalBalanceOwed || 0) + changeDue).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Shop: {shop.name}</span>
              <button
                type="button"
                onClick={handleClear}
                className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] p-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Two Primary Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Action 1: Give Change Now */}
            <button
              onClick={handleGiveChangeNow}
              disabled={purchaseAmount <= 0 || amountReceived < purchaseAmount}
              className={`p-4 min-h-[85px] rounded-2xl font-bold text-left shadow-sm transition-all flex flex-col justify-between ${
                purchaseAmount > 0 && amountReceived >= purchaseAmount
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <CheckCircle className="w-5 h-5 text-emerald-200" />
                <span className="text-[10px] font-mono uppercase bg-emerald-800/40 px-2 py-0.5 rounded text-emerald-100">
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
              className={`p-4 min-h-[85px] rounded-2xl font-bold text-left shadow-sm transition-all flex flex-col justify-between ${
                changeDue > 0
                  ? 'bg-amber-500 hover:bg-amber-600 active:scale-98 text-white cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <BookmarkPlus className="w-5 h-5 text-amber-100" />
                <span className="text-[10px] font-mono uppercase bg-amber-700/40 px-2 py-0.5 rounded text-amber-100">
                  WhatsApp Redirect
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

          {/* Quick Info Box */}
          <div className="p-3.5 bg-slate-100 rounded-xl text-xs text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Direct WhatsApp Redirect: No Meta API, tokens or webhooks required.</span>
            </div>
            {completedRecord && (
              <button
                onClick={() => setShowReceiptModal(true)}
                className="text-indigo-600 font-bold hover:underline flex items-center gap-1 shrink-0"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>View Slip</span>
              </button>
            )}
          </div>
        </div>
      </div>

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
