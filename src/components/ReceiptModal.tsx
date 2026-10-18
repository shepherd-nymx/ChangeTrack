import React, { useState } from 'react';
import { 
  Printer, 
  X, 
  CheckCircle, 
  MessageSquare, 
  Copy, 
  Check, 
  ExternalLink,
  Store,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ChangeRecord, Transaction, Shop } from '../types';
import { QrCodeDisplay } from './QrCodeDisplay';
import { 
  buildWhatsAppDirectLink, 
  generateRecordChangeMessage, 
  formatDateTime 
} from '../services/whatsapp';
import { storage } from '../services/storage';

interface ReceiptModalProps {
  changeRecord?: ChangeRecord;
  transaction?: Transaction;
  shop: Shop;
  customMessageText?: string;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  changeRecord,
  transaction,
  shop,
  customMessageText,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const currency = shop.currencySymbol || '$';
  const phone = changeRecord?.customerPhone || transaction?.customerPhone || '';
  const amount = changeRecord ? changeRecord.amountOwed : (transaction?.changeOwed || 0);

  const waConfig = storage.getWhatsAppConfig();
  const defaultCountryCode = waConfig.defaultCountryCode || '+263';

  // Construct exact WhatsApp message
  const prefilledMessage = customMessageText || (changeRecord 
    ? generateRecordChangeMessage(
        shop, 
        changeRecord, 
        undefined, 
        undefined, 
        waConfig.customCollectionInstructions,
        waConfig.customCustomerAppUrl
      )
    : `*${shop.name}*\nTransaction Ref: ${transaction?.id}\nAmount: ${currency}${amount.toFixed(2)}`);

  const directWaLink = phone ? buildWhatsAppDirectLink(phone, prefilledMessage, defaultCountryCode) : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(prefilledMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative surface-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden my-6 rise-in">
        {/* Modal Top Bar (hidden on print) */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-ink-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-brand-400" />
            <span className="text-xs font-extrabold uppercase tracking-wide">Change Slip / Till Receipt</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-ink-400 hover:text-white hover:bg-ink-800 transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* WhatsApp Quick Action Banner (Top Callout) */}
        {changeRecord && directWaLink && (
          <div className="p-4 bg-brand-50 border-b border-brand-200 print:hidden space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-brand-600 text-white rounded-xl shadow-xs">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-brand-950 uppercase tracking-wide">
                    WhatsApp Redirect Ready
                  </h4>
                  <p className="text-[11px] text-brand-800">
                    To: <span className="font-mono font-bold">{changeRecord.customerPhone}</span>
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-brand-200/80 text-brand-900 uppercase tracking-wide">
                No Meta API
              </span>
            </div>

            {/* Prominent Direct WhatsApp Send Button */}
            <a
              href={directWaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all duration-200 tap-scale flex items-center justify-center gap-2 text-center"
            >
              <MessageSquare className="w-4 h-4 fill-white" />
              <span>OPEN WHATSAPP (SEND CHANGE RECEIPT)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <div className="flex items-center justify-between text-[11px] text-brand-800 pt-0.5">
              <span>Chat opens pre-filled with customer number & message. Press Send.</span>
              <button
                type="button"
                onClick={handleCopy}
                className="font-bold text-brand-700 hover:text-brand-950 underline flex items-center gap-1 shrink-0 tap-scale transition-all duration-200"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>

            {/* Toggle Preview of prefilled message */}
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-[11px] font-semibold text-brand-900 flex items-center gap-1 hover:underline transition-all duration-200"
            >
              {showPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span>{showPreview ? 'Hide message preview' : 'View pre-filled message text'}</span>
            </button>

            {showPreview && (
              <div className="p-3 bg-white rounded-xl border border-brand-200 text-ink-800 text-[11px] whitespace-pre-line font-sans leading-relaxed shadow-xs">
                {prefilledMessage}
              </div>
            )}
          </div>
        )}

        {/* Printable Thermal Receipt Card */}
        <div id="printable-receipt" className="p-6 text-ink-900 font-mono text-xs bg-white border-b border-dashed border-ink-300">
          {/* Header */}
          <div className="text-center space-y-1 pb-4 border-b border-dashed border-ink-300">
            {shop.logoUrl && (
              <div className="flex justify-center mb-2">
                <img
                  src={shop.logoUrl}
                  alt={shop.name}
                  className="h-12 w-auto max-w-[140px] object-contain"
                />
              </div>
            )}
            <h2 className="text-base font-black tracking-tight uppercase">{shop.name}</h2>
            {shop.branchName && <p className="text-[11px] text-ink-600">{shop.branchName}</p>}
            <p className="text-[10px] text-ink-500">{shop.address}</p>
            <p className="text-[10px] text-ink-500">Tel: {shop.phone}</p>
            <div className="pt-2 text-[10px] text-ink-400">
              {new Date(changeRecord?.createdAt || transaction?.createdAt || Date.now()).toLocaleString('en-GB', {
                dateStyle: 'medium',
                timeStyle: 'short'
              })}
            </div>
          </div>

          {/* Change Details */}
          <div className="py-4 space-y-2 border-b border-dashed border-ink-300">
            {transaction && (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-ink-500">Transaction Ref:</span>
                  <span className="font-bold">{transaction.id}</span>
                </div>
                {transaction.purchaseTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-ink-500">Purchase Total:</span>
                    <span className="font-mono-num">{currency}{transaction.purchaseTotal.toFixed(2)}</span>
                  </div>
                )}
                {transaction.amountReceived > 0 && (
                  <div className="flex justify-between">
                    <span className="text-ink-500">Amount Tendered:</span>
                    <span className="font-mono-num">{currency}{transaction.amountReceived.toFixed(2)}</span>
                  </div>
                )}
                {transaction.isPartialChange && transaction.changeGivenNow > 0 && (
                  <div className="flex justify-between text-brand-700 font-bold">
                    <span>Cash Given At Till:</span>
                    <span className="font-mono-num">{currency}{transaction.changeGivenNow.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {changeRecord && (
              <div className="pt-2 mt-2 border-t border-ink-200 space-y-1.5">
                {changeRecord.isPartialChange && changeRecord.partialCashGivenNow !== undefined && changeRecord.totalChangeCalculated !== undefined && (
                  <div className="p-2 bg-ink-50 rounded border border-ink-200 text-[11px] space-y-1 mb-1">
                    <div className="flex justify-between text-ink-600">
                      <span>Total Change Due:</span>
                      <span className="font-mono font-bold font-mono-num">{currency}{changeRecord.totalChangeCalculated.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-brand-700 font-bold">
                      <span>Cash Paid Now:</span>
                      <span className="font-mono font-mono-num">-{currency}{changeRecord.partialCashGivenNow.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm font-black bg-amber-50 p-2 rounded border border-amber-200">
                  <span className="text-amber-900">
                    {changeRecord.isPartialChange ? 'REMAINING CHANGE OWED:' : changeRecord.isDirectRegistration ? 'DIRECT CHANGE REGISTERED:' : 'OUTSTANDING CHANGE:'}
                  </span>
                  <span className="text-amber-900 text-base font-mono-num">{currency}{changeRecord.amountOwed.toFixed(2)}</span>
                </div>
                {changeRecord.isPartialChange && (
                  <div className="text-[10px] text-amber-800 font-semibold px-1">
                    * Partial cash was handed to customer. Remainder saved to ChangeTrack.
                  </div>
                )}
                {changeRecord.isDirectRegistration && (
                  <div className="text-[10px] text-ink-700 font-semibold px-1">
                    * Direct change registered without store purchase.
                  </div>
                )}
                <div className="flex justify-between text-[11px]">
                  <span className="text-ink-500">Change ID:</span>
                  <span className="font-bold text-ink-900 tracking-wider">{changeRecord.id}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-ink-500">Customer Phone:</span>
                  <span className="font-semibold">{changeRecord.customerPhone}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-ink-500">Cashier:</span>
                  <span>{changeRecord.cashierName}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-ink-500">Status:</span>
                  <span className="font-bold text-amber-700">{changeRecord.status}</span>
                </div>
              </div>
            )}
          </div>

          {/* QR Code Section */}
          {changeRecord && (
            <div className="py-4 text-center space-y-2">
              <p className="text-[10px] text-ink-600 font-sans font-medium">
                Scan QR or show Change ID when collecting change:
              </p>
              <div className="flex justify-center">
                <QrCodeDisplay value={changeRecord.id} size={140} />
              </div>
              <p className="text-[9px] text-ink-400 font-mono tracking-widest uppercase">
                ID: {changeRecord.id}
              </p>
            </div>
          )}

          {/* Footer Terms */}
          <div className="text-center pt-3 border-t border-dashed border-ink-300 space-y-1.5">
            <p className="text-[10px] text-ink-600 font-sans">
              Digital tamper-resistant verification powered by <span className="font-bold">ChangeTrack</span>
            </p>
            <p className="text-[9px] text-ink-500 italic">
              A WhatsApp change slip link has been prepared. Please collect change within 30 days.
            </p>
            <p className="text-[10px] font-bold text-ink-700">*** THANK YOU FOR YOUR CUSTOM ***</p>
          </div>
        </div>

        {/* Action Buttons (Hidden on print) */}
        <div className="p-4 bg-ink-50 border-t border-ink-100 flex flex-col gap-2 print:hidden">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 min-h-[44px] py-2.5 px-3 bg-ink-900 hover:bg-ink-800 text-white rounded-xl font-bold text-xs shadow-xs transition-all duration-200 tap-scale"
            >
              <Printer className="w-4 h-4" />
              <span>Print Slip</span>
            </button>

            <button
              onClick={onClose}
              className="min-h-[44px] py-2.5 px-3 bg-white hover:bg-ink-100 text-ink-800 border border-ink-200 rounded-xl font-bold text-xs transition-all duration-200 tap-scale text-center"
            >
              Done / Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
