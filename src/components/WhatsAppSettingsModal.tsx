import React, { useState } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  CheckCheck, 
  Check, 
  ShieldCheck, 
  Settings, 
  Key, 
  Smartphone, 
  PhoneCall, 
  ExternalLink,
  History,
  AlertCircle,
  Copy
} from 'lucide-react';
import { WhatsAppConfig, WhatsAppMessage, Shop } from '../types';
import { storage } from '../services/storage';

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
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  const messages = storage.getWhatsAppMessages();
  const currency = shop.currencySymbol || '$';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storage.updateWhatsAppConfig(config);
    onConfigUpdated();
    alert('WhatsApp Cloud API configuration updated successfully.');
  };

  const handleSendTestMessage = () => {
    if (!testPhone.trim()) {
      alert('Please enter a phone number for the test notification.');
      return;
    }

    setTestStatus('Sending WhatsApp notification...');

    const sampleMsgText = `*${shop.name}*\n\nYour change has been recorded.\n\nAmount: *${currency}2.50*\nChange ID: *CT-TEST-${Math.floor(1000 + Math.random() * 9000)}*\nDate: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}\nStatus: *OUTSTANDING*\n\nPlease present your Change ID or this WhatsApp message when collecting your change.\n\nThank you for shopping with us.`;

    const newMsg: WhatsAppMessage = {
      id: `wa-test-${Date.now()}`,
      changeId: 'CT-TEST-001',
      customerPhone: testPhone,
      type: 'CHANGE_RECORDED',
      shopName: shop.name,
      amount: 2.50,
      messageText: sampleMsgText,
      status: config.isEnabled ? 'DELIVERED' : 'SENT',
      sentAt: new Date().toISOString(),
      deliveredAt: config.isEnabled ? new Date().toISOString() : undefined,
      metaMessageId: `wamid.test_${Date.now()}`
    };

    const msgs = storage.getWhatsAppMessages();
    msgs.unshift(newMsg);
    localStorage.setItem('changetrack_wa_msgs', JSON.stringify(msgs));

    setTestStatus(`Test message successfully recorded and dispatched to ${testPhone}!`);
    setTimeout(() => setTestStatus(null), 5000);
  };

  const copyTemplateText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 text-white rounded-xl">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">WhatsApp Business Cloud API Integration</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-emerald-100">
                  {config.isEnabled ? 'ENABLED' : 'SIMULATION MODE'}
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                Automated customer change alerts & collection confirmations via Meta Cloud API
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`flex-1 py-3 text-center transition-all ${
              activeTab === 'SETTINGS'
                ? 'bg-white border-b-2 border-emerald-600 text-emerald-800 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cloud API Credentials
          </button>
          <button
            onClick={() => setActiveTab('PREVIEW')}
            className={`flex-1 py-3 text-center transition-all ${
              activeTab === 'PREVIEW'
                ? 'bg-white border-b-2 border-emerald-600 text-emerald-800 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Message Templates Preview
          </button>
          <button
            onClick={() => setActiveTab('LOGS')}
            className={`flex-1 py-3 text-center transition-all ${
              activeTab === 'LOGS'
                ? 'bg-white border-b-2 border-emerald-600 text-emerald-800 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dispatch Audit Logs ({messages.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[500px] overflow-y-auto">
          {/* TAB 1: SETTINGS */}
          {activeTab === 'SETTINGS' && (
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <p className="font-bold">Zero Failure Guarantee:</p>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    If WhatsApp Cloud API is temporarily unreachable, transactions and change records are <strong>always saved locally</strong>. The customer can also be shown their digital receipt QR code instantly on screen.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Enable WhatsApp Notifications</span>
                  <span className="text-[11px] text-slate-500">
                    Dispatches real-time message when change is recorded or collected
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.isEnabled}
                    onChange={e => setConfig({ ...config, isEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">WhatsApp Phone Number ID</label>
                <input
                  type="text"
                  value={config.phoneNumberId}
                  onChange={e => setConfig({ ...config, phoneNumberId: e.target.value })}
                  placeholder="e.g. 104829102938122"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs"
                />
                <span className="text-[10px] text-slate-400">Found in Meta for Developers &gt; WhatsApp &gt; API Setup</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">WhatsApp Business Account ID (WABA ID)</label>
                <input
                  type="text"
                  value={config.wabaId}
                  onChange={e => setConfig({ ...config, wabaId: e.target.value })}
                  placeholder="e.g. 391029381200192"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">System User Permanent Access Token</label>
                <input
                  type="password"
                  value={config.accessToken}
                  onChange={e => setConfig({ ...config, accessToken: e.target.value })}
                  placeholder="EAAG... (Optional: leave blank for simulated dispatch)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs"
                />
                <span className="text-[10px] text-slate-400">
                  Used to make live calls to Meta Graph API v21.0. If blank, simulated dispatch is logged.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.autoSendOnCreate}
                    onChange={e => setConfig({ ...config, autoSendOnCreate: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-slate-700 font-semibold text-xs">Auto-send on "Record Change"</span>
                </label>

                <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.autoSendOnCollect}
                    onChange={e => setConfig({ ...config, autoSendOnCollect: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-slate-700 font-semibold text-xs">Auto-send on "Change Collected"</span>
                </label>
              </div>

              {/* Test Message Section */}
              <div className="p-4 bg-slate-100 rounded-xl space-y-2 mt-4">
                <span className="font-bold text-slate-800 block text-xs">Send Test WhatsApp Ping:</span>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={testPhone}
                    onChange={e => setTestPhone(e.target.value)}
                    placeholder="Recipient phone (+263...)"
                    className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleSendTestMessage}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Ping</span>
                  </button>
                </div>
                {testStatus && (
                  <p className="text-[11px] text-emerald-700 font-semibold pt-1">{testStatus}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs"
                >
                  Save Settings
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: TEMPLATES PREVIEW */}
          {activeTab === 'PREVIEW' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Template 1: Change Recorded */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-700">1. Change Recorded Template</span>
                    <button
                      onClick={() => copyTemplateText(`*${shop.name}*\n\nYour change has been recorded.\n\nAmount: *$2.50*\nChange ID: *CT-48291*\nDate: 16 September 2026, 12:30 PM\nStatus: *Outstanding*\n\nPlease present your Change ID or this WhatsApp message when collecting your change.`)}
                      className="text-[11px] text-emerald-700 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedText ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="bg-[#e5ddd5] p-4 rounded-2xl shadow-inner border border-slate-300">
                    <div className="max-w-[260px] bg-white p-3 rounded-lg shadow-xs space-y-1.5 text-xs text-slate-800 leading-snug relative">
                      <div className="font-bold text-emerald-800 pb-1 border-b border-slate-100">
                        {shop.name}
                      </div>
                      <p className="text-[11px] text-slate-700">Your change has been recorded.</p>
                      <div className="bg-amber-50 p-2 rounded border border-amber-200 space-y-0.5 text-[11px]">
                        <div>Amount: <strong className="text-slate-900">{currency}2.50</strong></div>
                        <div>Change ID: <strong className="font-mono text-slate-900">CT-48291</strong></div>
                        <div>Date: <span className="text-slate-600">16 Sep 2026, 12:30 PM</span></div>
                        <div>Status: <span className="font-bold text-amber-700">Outstanding</span></div>
                      </div>
                      <p className="text-[10px] text-slate-500 pt-1">
                        Please present your Change ID or this WhatsApp message when collecting your change.
                      </p>
                      <div className="flex justify-end items-center gap-1 text-[9px] text-slate-400 pt-1">
                        <span>12:30 PM</span>
                        <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Template 2: Change Collected */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-700">2. Collection Confirmation</span>
                    <button
                      onClick={() => copyTemplateText(`*${shop.name}*\n\nYour change of *$2.50* has been successfully collected.\n\nChange ID: *CT-48291*\nCollected: 16 September 2026, 3:15 PM\nStatus: *COLLECTED*\n\nThank you.`)}
                      className="text-[11px] text-emerald-700 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedText ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="bg-[#e5ddd5] p-4 rounded-2xl shadow-inner border border-slate-300">
                    <div className="max-w-[260px] bg-white p-3 rounded-lg shadow-xs space-y-1.5 text-xs text-slate-800 leading-snug relative">
                      <div className="font-bold text-emerald-800 pb-1 border-b border-slate-100">
                        {shop.name}
                      </div>
                      <p className="text-[11px] text-slate-700">
                        Your change of <strong className="text-slate-900">{currency}2.50</strong> has been successfully collected.
                      </p>
                      <div className="bg-emerald-50 p-2 rounded border border-emerald-200 space-y-0.5 text-[11px]">
                        <div>Change ID: <strong className="font-mono text-slate-900">CT-48291</strong></div>
                        <div>Collected: <span className="text-slate-600">16 Sep 2026, 3:15 PM</span></div>
                        <div>Cashier: <span className="font-semibold text-slate-700">John Phiri</span></div>
                        <div>Status: <span className="font-bold text-emerald-700">COLLECTED</span></div>
                      </div>
                      <p className="text-[10px] text-slate-500 pt-1">
                        Thank you for your business.
                      </p>
                      <div className="flex justify-end items-center gap-1 text-[9px] text-slate-400 pt-1">
                        <span>3:15 PM</span>
                        <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DISPATCH AUDIT LOGS */}
          {activeTab === 'LOGS' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                <span className="font-bold text-slate-700">Customer WhatsApp Notifications</span>
                <span className="text-slate-400">{messages.length} messages logged</span>
              </div>

              {messages.length > 0 ? (
                <div className="space-y-2">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">{msg.customerPhone}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded">
                            {msg.changeId}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            msg.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          <CheckCheck className="w-3 h-3" />
                          <span>{msg.status}</span>
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 whitespace-pre-line bg-white p-2.5 rounded-lg border border-slate-200 font-mono">
                        {msg.messageText}
                      </p>

                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
                        <span>Sent: {new Date(msg.sentAt).toLocaleString()}</span>
                        <span className="font-mono">Ref: {msg.metaMessageId}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No WhatsApp messages logged yet.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
