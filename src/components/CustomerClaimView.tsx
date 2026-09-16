import React, { useState } from 'react';
import { QrCode, Phone, CheckCircle, Clock, Store, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { ChangeRecord, Shop } from '../types';
import { storage } from '../services/storage';
import { QrCodeDisplay } from './QrCodeDisplay';
import { formatDateTime } from '../services/whatsapp';

interface CustomerClaimViewProps {
  shop: Shop;
}

export const CustomerClaimView: React.FC<CustomerClaimViewProps> = ({ shop }) => {
  const records = storage.getChangeRecords();
  const [selectedRecordId, setSelectedRecordId] = useState<string>('CT-48291');

  const currentRecord = records.find(r => r.id === selectedRecordId) || records[0];
  const currency = shop.currencySymbol || '$';

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Demo Switcher for Preview */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs flex items-center justify-between shadow-xs">
        <span className="font-semibold text-slate-500">Preview As Customer:</span>
        <select
          value={currentRecord?.id}
          onChange={e => setSelectedRecordId(e.target.value)}
          className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-800"
        >
          {records.map(r => (
            <option key={r.id} value={r.id}>
              {r.id} — {currency}{r.amountOwed.toFixed(2)} ({r.status})
            </option>
          ))}
        </select>
      </div>

      {/* Customer Mobile Digital Change Pass Card */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-xl overflow-hidden relative">
        {/* Pass Top Banner */}
        <div className="bg-slate-900 text-white p-6 text-center space-y-2 relative">
          {shop.logoUrl ? (
            <div className="flex justify-center mb-1">
              <img
                src={shop.logoUrl}
                alt={shop.name}
                className="w-12 h-12 rounded-2xl object-contain bg-white p-1 border border-slate-700 shadow-md"
              />
            </div>
          ) : (
            <div className="inline-flex p-2 bg-emerald-500/20 text-emerald-400 rounded-full mb-1">
              <Store className="w-5 h-5" />
            </div>
          )}
          <h2 className="text-lg font-black tracking-tight uppercase">{shop.name}</h2>
          <p className="text-xs text-slate-300">{shop.address}</p>

          <div className="pt-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                currentRecord?.status === 'OUTSTANDING'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : currentRecord?.status === 'COLLECTED'
                  ? 'bg-emerald-400 text-slate-950'
                  : 'bg-rose-400 text-slate-950'
              }`}
            >
              {currentRecord?.status === 'OUTSTANDING' && <Clock className="w-3.5 h-3.5" />}
              {currentRecord?.status === 'COLLECTED' && <CheckCircle className="w-3.5 h-3.5" />}
              <span>{currentRecord?.status}</span>
            </span>
          </div>
        </div>

        {/* Change Amount Callout */}
        <div className="p-6 text-center border-b border-dashed border-slate-200 bg-slate-50/50">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {currentRecord?.status === 'COLLECTED' ? 'Change Handed Over' : 'Change Balance Due'}
          </span>
          <div className="text-4xl font-black text-slate-900 font-mono-num mt-1">
            {currency}{currentRecord?.amountOwed.toFixed(2)}
          </div>
          <p className="text-xs font-mono font-bold text-slate-600 mt-1">
            Change ID: {currentRecord?.id}
          </p>
        </div>

        {/* QR Code Presentation Area */}
        <div className="p-6 text-center space-y-4">
          <div className="flex justify-center">
            {currentRecord && (
              <QrCodeDisplay value={currentRecord.id} size={200} />
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-800">
              Hold up this QR code to the cashier's scanner
            </p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              Or show your Change ID <strong className="font-mono text-slate-800">{currentRecord?.id}</strong> at any till checkout.
            </p>
          </div>
        </div>

        {/* Details Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-100 text-xs space-y-2 text-slate-600">
          <div className="flex justify-between">
            <span className="text-slate-400">Customer Phone:</span>
            <span className="font-mono font-bold text-slate-800">{currentRecord?.customerPhone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Date Recorded:</span>
            <span>{currentRecord ? formatDateTime(currentRecord.createdAt) : ''}</span>
          </div>
          {currentRecord?.status === 'COLLECTED' && currentRecord.collectedAt && (
            <div className="flex justify-between text-emerald-800 font-semibold pt-1 border-t border-slate-200">
              <span>Date Collected:</span>
              <span>{formatDateTime(currentRecord.collectedAt)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs text-indigo-900 space-y-1">
        <div className="flex items-center gap-1.5 font-bold">
          <ShieldCheck className="w-4 h-4 text-indigo-700" />
          <span>Customer Tamper Protection</span>
        </div>
        <p className="text-[11px] text-indigo-800 leading-relaxed">
          Your Change ID is secured in {shop.name}'s digital ledger. You can collect your change at any branch within 30 days.
        </p>
      </div>
    </div>
  );
};
