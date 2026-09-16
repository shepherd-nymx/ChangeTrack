import React from 'react';
import { Printer, X, CheckCircle, Share2, MessageSquare } from 'lucide-react';
import { ChangeRecord, Transaction, Shop } from '../types';
import { QrCodeDisplay } from './QrCodeDisplay';
import { buildWhatsAppDirectLink } from '../services/whatsapp';

interface ReceiptModalProps {
  changeRecord?: ChangeRecord;
  transaction?: Transaction;
  shop: Shop;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  changeRecord,
  transaction,
  shop,
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  const currency = shop.currencySymbol || '$';
  const phone = changeRecord?.customerPhone || transaction?.customerPhone || '';
  const amount = changeRecord ? changeRecord.amountOwed : (transaction?.changeOwed || 0);

  const directWaLink = phone && changeRecord 
    ? buildWhatsAppDirectLink(phone, `*${shop.name}*\nChange Slip: ${changeRecord.id}\nAmount: ${currency}${amount.toFixed(2)}\nStatus: ${changeRecord.status}`)
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden my-6">
        {/* Modal Top Bar (hidden on print) */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Change Slip / Till Receipt</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Thermal Receipt Card */}
        <div id="printable-receipt" className="p-6 text-slate-900 font-mono text-xs bg-white border-b border-dashed border-slate-300">
          {/* Header */}
          <div className="text-center space-y-1 pb-4 border-b border-dashed border-slate-300">
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
            {shop.branchName && <p className="text-[11px] text-slate-600">{shop.branchName}</p>}
            <p className="text-[10px] text-slate-500">{shop.address}</p>
            <p className="text-[10px] text-slate-500">Tel: {shop.phone}</p>
            <div className="pt-2 text-[10px] text-slate-400">
              {new Date(changeRecord?.createdAt || transaction?.createdAt || Date.now()).toLocaleString('en-GB', {
                dateStyle: 'medium',
                timeStyle: 'short'
              })}
            </div>
          </div>

          {/* Change Details */}
          <div className="py-4 space-y-2 border-b border-dashed border-slate-300">
            {transaction && (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction Ref:</span>
                  <span className="font-bold">{transaction.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Purchase Total:</span>
                  <span>{currency}{transaction.purchaseTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount Tendered:</span>
                  <span>{currency}{transaction.amountReceived.toFixed(2)}</span>
                </div>
              </div>
            )}

            {changeRecord && (
              <div className="pt-2 mt-2 border-t border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center text-sm font-black bg-amber-50 p-2 rounded border border-amber-200">
                  <span className="text-amber-900">OUTSTANDING CHANGE:</span>
                  <span className="text-amber-900 text-base">{currency}{changeRecord.amountOwed.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Change ID:</span>
                  <span className="font-bold text-slate-900 tracking-wider">{changeRecord.id}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Customer Phone:</span>
                  <span className="font-semibold">{changeRecord.customerPhone}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Cashier:</span>
                  <span>{changeRecord.cashierName}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-amber-700">{changeRecord.status}</span>
                </div>
              </div>
            )}
          </div>

          {/* QR Code Section */}
          {changeRecord && (
            <div className="py-4 text-center space-y-2">
              <p className="text-[10px] text-slate-600 font-sans font-medium">
                Scan QR or show Change ID when collecting change:
              </p>
              <div className="flex justify-center">
                <QrCodeDisplay value={changeRecord.id} size={140} />
              </div>
              <p className="text-[9px] text-slate-400 font-mono tracking-widest uppercase">
                ID: {changeRecord.id}
              </p>
            </div>
          )}

          {/* Footer Terms */}
          <div className="text-center pt-3 border-t border-dashed border-slate-300 space-y-1.5">
            <p className="text-[10px] text-slate-600 font-sans">
              Digital tamper-resistant verification powered by <span className="font-bold">ChangeTrack</span>
            </p>
            <p className="text-[9px] text-slate-500 italic">
              A WhatsApp confirmation has been dispatched. Please collect change within 30 days.
            </p>
            <p className="text-[10px] font-bold text-slate-700">*** THANK YOU FOR YOUR CUSTOM ***</p>
          </div>
        </div>

        {/* Action Buttons (Hidden on print) */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-2 print:hidden">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium text-xs shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Slip</span>
            </button>

            {directWaLink ? (
              <a
                href={directWaLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-xs shadow-xs transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            ) : (
              <button
                onClick={onClose}
                className="py-2.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-medium text-xs transition-colors"
              >
                Done
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-full py-2 text-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
