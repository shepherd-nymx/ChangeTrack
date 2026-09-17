import React, { useState } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  CheckCheck, 
  Check, 
  ShieldCheck, 
  ExternalLink,
  Copy,
  Sliders,
  Smartphone,
  Info
} from 'lucide-react';
import { WhatsAppConfig, WhatsAppMessage, Shop, ChangeRecord } from '../types';
import { storage } from '../services/storage';
import { buildWhatsAppDirectLink, generateRecordChangeMessage, generateCollectedChangeMessage } from '../services/whatsapp';

interface WhatsAppSettingsModalProps {
  shop: Shop;
  onClose: () => void;
  onConfigUpdated: () => void;
}

export const WhatsAppSettingsModal: React.FC<WhatsAppSettingsModalProps> = ({
  shop,
  onClose,
  onConfigUpdated
}) => {
  const [config, setConfig] = useState<WhatsAppConfig>(storage.getWhatsAppConfig());
  const [activeTab, setActiveTab] = useState<'SETTINGS' | 'PREVIEW' | 'LOGS'>('SETTINGS');
  const [testPhone, setTestPhone] = useState('+263771234567');
  const [copiedText, setCopiedText] = useState(false);

  const messages = storage.getWhatsAppMessages();
  const currency = shop.currencySymbol || '$';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storage.updateWhatsAppConfig(config);
    onConfigUpdated();
    alert('WhatsApp direct redirect preferences updated successfully.');
  };

  const copyTemplateText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Sample test record for previewing the direct WhatsApp redirect
  const sampleRecord: ChangeRecord = {
    id: 'CT-48291',
    shopId: shop.id,
    shopName: shop.name,
    transactionId: 'TX-90214',
    amountOwed: 2.50,
    customerPhone: testPhone || '+263771234567',
    customerName: 'Tinashe Moyo',
    cashierId: 'emp-1',
    cashierName: 'Blessing Ndlovu',
    createdAt: new Date().toISOString(),
    status: 'OUTSTANDING',
    qrCodePayload: JSON.stringify({ id: 'CT-48291', amount: 2.50, phone: testPhone || '+263771234567' })
  };

  const sampleRecordMessage = generateRecordChangeMessage(shop, sampleRecord);
  const sampleCollectedMessage = generateCollectedChangeMessage(shop, {
    ...sampleRecord,
    status: 'COLLECTED' as const,
    collectedAt: new Date().toISOString(),
    collectedByEmployeeName: 'Blessing Ndlovu'
  }, 0);

  const sampleTestUrl = buildWhatsAppDirectLink(
    testPhone,
    sampleRecordMessage,
    config.defaultCountryCode || '+263'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden my-3 sm:my-6">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 text-white rounded-xl shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold">ChangeTrack WhatsApp Direct Redirect</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-emerald-100 uppercase">
                  Zero Meta API
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-emerald-100">
                Direct WhatsApp link dispatch with pre-filled message — cashier only presses Send
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`flex-1 py-3 text-center transition-all min-h-[44px] ${
              activeTab === 'SETTINGS'
                ? 'bg-white border-b-2 border-emerald-600 text-emerald-800 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Redirect Preferences
          </button>
          <button
            onClick={() => setActiveTab('PREVIEW')}
            className={`flex-1 py-3 text-center transition-all min-h-[44px] ${
              activeTab === 'PREVIEW'
                ? 'bg-white border-b-2 border-emerald-600 text-emerald-800 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Message Templates Preview
          </button>
          <button
            onClick={() => setActiveTab('LOGS')}
            className={`flex-1 py-3 text-center transition-all min-h-[44px] ${
              activeTab === 'LOGS'
                ? 'bg-white border-b-2 border-emerald-600 text-emerald-800 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            WhatsApp Logs ({messages.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 max-h-[500px] overflow-y-auto">
          {/* TAB 1: REDIRECT PREFERENCES */}
          {activeTab === 'SETTINGS' && (
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed space-y-1">
                  <p className="font-extrabold text-sm">No Meta API, Tokens, or Webhooks Needed:</p>
                  <p className="text-[11px] text-emerald-800">
                    ChangeTrack generates secure <code>wa.me</code> direct links with the customer's phone number and the pre-filled message (Shop name, Change amount, Change ID, date/time, and collection instructions).
                  </p>
                  <p className="text-[11px] text-emerald-800 font-semibold">
                    The cashier is redirected directly to WhatsApp and only needs to press <strong>Send</strong>.
                  </p>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Default Country Code (for phone numbers entered without country code)
                </label>
                <input
                  type="text"
                  value={config.defaultCountryCode || '+263'}
                  onChange={e => setConfig({ ...config, defaultCountryCode: e.target.value })}
                  placeholder="+263"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400">
                  Examples: +263 (Zimbabwe), +27 (South Africa), +254 (Kenya), +1 (US), +44 (UK)
                </span>
              </div>

              <div className="space-y-2.5 pt-2">
                <label className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">
                      Auto-open WhatsApp on "Record Change"
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Instantly opens WhatsApp in a new tab when cashier clicks "RECORD CHANGE"
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.autoOpenRedirectOnCreate}
                    onChange={e => setConfig({ ...config, autoOpenRedirectOnCreate: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">
                      Auto-open WhatsApp on "Confirm Collection"
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Instantly launches WhatsApp collection confirmation when cash change is handed over
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.autoOpenRedirectOnCollect}
                    onChange={e => setConfig({ ...config, autoOpenRedirectOnCollect: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                </label>
              </div>

              {/* Live Test Direct Link Sandbox */}
              <div className="p-4 bg-slate-100 rounded-2xl space-y-3 mt-4 border border-slate-200">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-800 text-xs">Test WhatsApp Direct Redirect</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Enter a number to test opening WhatsApp with a sample pre-filled change slip:
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="tel"
                    value={testPhone}
                    onChange={e => setTestPhone(e.target.value)}
                    placeholder="Recipient phone (+263...)"
                    className="flex-1 p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                  />
                  <a
                    href={sampleTestUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors min-h-[40px]"
                  >
                    <MessageSquare className="w-3.5 h-3.5 fill-white" />
                    <span>Open WhatsApp Test Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-xs min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs min-h-[40px]"
                >
                  Save Settings
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: TEMPLATES PREVIEW */}
          {activeTab === 'PREVIEW' && (
            <div className="space-y-6">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-950 text-xs flex items-start gap-2">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  These pre-filled templates automatically open in WhatsApp containing the required Shop name, Change amount, unique Change ID, date/time, and collection instructions.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Template 1: Change Recorded */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-700">1. Change Recorded Slip</span>
                    <button
                      onClick={() => copyTemplateText(sampleRecordMessage)}
                      className="text-[11px] text-emerald-700 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedText ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="bg-[#e5ddd5] p-4 rounded-2xl shadow-inner border border-slate-300">
                    <div className="bg-white p-3.5 rounded-xl shadow-xs space-y-2 text-xs text-slate-800 leading-snug whitespace-pre-line font-sans">
                      {sampleRecordMessage}
                    </div>
                  </div>
                </div>

                {/* Template 2: Change Collected */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-700">2. Collection Confirmation</span>
                    <button
                      onClick={() => copyTemplateText(sampleCollectedMessage)}
                      className="text-[11px] text-emerald-700 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedText ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="bg-[#e5ddd5] p-4 rounded-2xl shadow-inner border border-slate-300">
                    <div className="bg-white p-3.5 rounded-xl shadow-xs space-y-2 text-xs text-slate-800 leading-snug whitespace-pre-line font-sans">
                      {sampleCollectedMessage}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT LOGS */}
          {activeTab === 'LOGS' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                <span className="font-bold text-slate-700">ChangeTrack WhatsApp Redirect Logs</span>
                <span className="text-slate-400">{messages.length} total logged</span>
              </div>

              {messages.length > 0 ? (
                <div className="space-y-2.5">
                  {messages.map(msg => {
                    const waLink = buildWhatsAppDirectLink(
                      msg.customerPhone,
                      msg.messageText,
                      config.defaultCountryCode || '+263'
                    );

                    return (
                      <div
                        key={msg.id}
                        className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">{msg.customerPhone}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                              {msg.changeId}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <CheckCheck className="w-3 h-3" />
                            <span>{msg.status}</span>
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 whitespace-pre-line bg-white p-2.5 rounded-lg border border-slate-200 font-mono">
                          {msg.messageText}
                        </p>

                        <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
                          <span>Logged: {new Date(msg.sentAt).toLocaleString()}</span>
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 text-[11px]"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Re-open in WhatsApp</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No WhatsApp messages logged yet. They will appear here once change is recorded or collected.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors shadow-xs min-h-[40px]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
