import React, { useState } from 'react';
import { QrCode, Phone, CheckCircle, Clock, Store, ShieldCheck, Sparkles, AlertCircle, MessageSquare, ExternalLink } from 'lucide-react';
import { ChangeRecord, Shop } from '../types';
import { storage } from '../services/storage';
import { QrCodeDisplay } from './QrCodeDisplay';
import { formatDateTime, buildWhatsAppDirectLink, generateRecordChangeMessage, generateCollectedChangeMessage } from '../services/whatsapp';

interface CustomerClaimViewProps {
  shop: Shop;
}

export const CustomerClaimView: React.FC<CustomerClaimViewProps> = ({ shop }) => {
  const records = storage.getChangeRecords();
  const [selectedRecordId, setSelectedRecordId] = useState<string>('CT-48291');

  const currentRecord = records.find(r => r.id === selectedRecordId) || records[0];
  const currency = shop.currencySymbol || '$';
  const waConfig = storage.getWhatsAppConfig();
  const defaultCountryCode = waConfig.defaultCountryCode || '+263';

  const waMessage = currentRecord
    ? currentRecord.status === 'COLLECTED'
      ? generateCollectedChangeMessage(shop, currentRecord, 0)
      : generateRecordChangeMessage(shop, currentRecord)
    : '';

  const waLink = currentRecord
    ? buildWhatsAppDirectLink(currentRecord.customerPhone, waMessage, defaultCountryCode)
    : '#';

  return (
    <div className="w-full max-w-md mx-auto space-y-5 px-2 sm:px-0">
      {/* Demo Switcher for Preview */}
      <div className="surface-card p-3 rounded-2xl border border-ink-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <span className="font-semibold text-ink-500">Preview As Customer:</span>
        <select
          value={currentRecord?.id}
          onChange={e => setSelectedRecordId(e.target.value)}
          className="w-full sm:w-auto p-2 bg-white border border-ink-200 rounded-xl font-mono font-bold text-ink-800 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
        >
          {records.map(r => (
            <option key={r.id} value={r.id}>
              {r.id} — {currency}{r.amountOwed.toFixed(2)} ({r.status})
            </option>
          ))}
        </select>
      </div>

      {/* Customer Mobile Digital Change Pass Card */}
      <div className="surface-card rounded-3xl border-2 border-ink-200 shadow-xl overflow-hidden relative rise-in">
        {/* Pass Top Banner */}
        <div className="bg-ink-900 text-white p-6 text-center space-y-2 relative">
          {shop.logoUrl ? (
            <div className="flex justify-center mb-1">
              <img
                src={shop.logoUrl}
                alt={shop.name}
                className="w-12 h-12 rounded-2xl object-contain bg-white p-1 border border-ink-700 shadow-md"
              />
            </div>
          ) : (
            <div className="inline-flex p-2 bg-brand-500/20 text-brand-400 rounded-full mb-1">
              <Store className="w-5 h-5" />
            </div>
          )}
          <h2 className="text-lg font-black tracking-tight uppercase">{shop.name}</h2>
          <p className="text-xs text-ink-300">{shop.address}</p>

          <div className="pt-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wide ${
                currentRecord?.status === 'OUTSTANDING'
                  ? 'bg-amber-400 text-ink-950 shadow-md'
                  : currentRecord?.status === 'COLLECTED'
                  ? 'bg-brand-400 text-ink-950'
                  : 'bg-ink-300 text-ink-950'
              }`}
            >
              {currentRecord?.status === 'OUTSTANDING' && <Clock className="w-3.5 h-3.5" />}
              {currentRecord?.status === 'COLLECTED' && <CheckCircle className="w-3.5 h-3.5" />}
              <span>{currentRecord?.status}</span>
            </span>
          </div>
        </div>

        {/* Change Amount Callout */}
        <div className="p-6 text-center border-b border-dashed border-ink-200 bg-ink-50/50">
          <span className="text-xs font-bold uppercase tracking-wide text-ink-500">
            {currentRecord?.status === 'COLLECTED' ? 'Change Handed Over' : 'Change Balance Due'}
          </span>
          <div className="text-4xl font-black text-ink-900 font-mono-num mt-1 tracking-tight">
            {currency}{currentRecord?.amountOwed.toFixed(2)}
          </div>
          <p className="text-xs font-mono font-bold text-ink-600 mt-1">
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
            <p className="text-xs font-bold text-ink-800">
              Hold up this QR code to the cashier's scanner
            </p>
            <p className="text-[11px] text-ink-500 max-w-xs mx-auto">
              Or show your Change ID <strong className="font-mono text-ink-800">{currentRecord?.id}</strong> at any till checkout.
            </p>
          </div>

          {/* Direct WhatsApp View Button */}
          {currentRecord && (
            <div className="pt-2">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all duration-200 tap-scale flex items-center justify-center gap-2 min-h-[44px]"
              >
                <MessageSquare className="w-4 h-4 fill-white" />
                <span>
                  {currentRecord.status === 'COLLECTED' ? 'View WhatsApp Collection Receipt' : 'Open WhatsApp Change Slip'}
                </span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Details Footer */}
        <div className="p-5 bg-ink-50 border-t border-ink-100 text-xs space-y-2 text-ink-600">
          <div className="flex justify-between">
            <span className="text-ink-400">Customer Phone:</span>
            <span className="font-mono font-bold text-ink-800">{currentRecord?.customerPhone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-400">Date Recorded:</span>
            <span>{currentRecord ? formatDateTime(currentRecord.createdAt) : ''}</span>
          </div>
          {currentRecord?.status === 'COLLECTED' && currentRecord.collectedAt && (
            <div className="flex justify-between text-brand-800 font-semibold pt-1 border-t border-ink-200">
              <span>Date Collected:</span>
              <span>{formatDateTime(currentRecord.collectedAt)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-brand-50 border border-brand-200 rounded-2xl text-xs text-brand-900 space-y-1">
        <div className="flex items-center gap-1.5 font-bold">
          <ShieldCheck className="w-4 h-4 text-brand-700" />
          <span>Customer Anti-Loss Protection</span>
        </div>
        <p className="text-[11px] text-brand-800 leading-relaxed">
          Your Change ID is secured in {shop.name}'s digital ledger. You can collect your change at any branch anytime.
        </p>
      </div>
    </div>
  );
};
