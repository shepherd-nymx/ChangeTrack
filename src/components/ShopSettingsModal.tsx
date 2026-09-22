import React, { useState, useRef } from 'react';
import { 
  Store, 
  Upload, 
  Trash2, 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  X, 
  Image as ImageIcon, 
  Sparkles, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Building2, 
  Phone, 
  MapPin, 
  DollarSign, 
  MessageSquare,
  AlertTriangle,
  Smartphone,
  Download,
  Wifi,
  UserCheck
} from 'lucide-react';
import { Shop } from '../types';
import { storage } from '../services/storage';
import { PWAInstallButton } from './PWAInstallButton';

interface ShopSettingsModalProps {
  shop: Shop;
  onClose: () => void;
  onShopUpdated: (updatedShop: Shop) => void;
}

// Sample presets for instant testing
const PRESET_LOGOS = [
  {
    name: 'Supermarket Cart',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="%2310b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>'
  },
  {
    name: 'Tuckshop Storefront',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="%234f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>'
  },
  {
    name: 'Gold Coin Badge',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="%23f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>'
  }
];

export const ShopSettingsModal: React.FC<ShopSettingsModalProps> = ({
  shop,
  onClose,
  onShopUpdated
}) => {
  const [name, setName] = useState(shop.name);
  const [branchName, setBranchName] = useState(shop.branchName || '');
  const [ownerName, setOwnerName] = useState(shop.ownerName || storage.getAdminName() || 'Tariro Moyo');
  const [phone, setPhone] = useState(shop.phone);
  const [address, setAddress] = useState(shop.address);
  const [currencySymbol, setCurrencySymbol] = useState(shop.currencySymbol || '$');
  const [currency, setCurrency] = useState(shop.currency || 'USD');
  const [whatsappNotice, setWhatsappNotice] = useState(shop.whatsappNotice);
  const [logoUrl, setLogoUrl] = useState(shop.logoUrl || '');
  
  // Security / Passcode State
  const [isPasscodeRequired, setIsPasscodeRequired] = useState(shop.isPasscodeRequired ?? true);
  const [ownerPasscode, setOwnerPasscode] = useState(shop.ownerPasscode || '1234');
  const [showPasscode, setShowPasscode] = useState(false);

  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'LOGO' | 'SECURITY' | 'INSTALL'>('IDENTITY');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    // Limit to 2MB to prevent localStorage overflow
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image size exceeds 2MB limit. Please select a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setLogoUrl(result);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Shop name is required.');
      return;
    }

    if (isPasscodeRequired && !ownerPasscode.trim()) {
      alert('Owner passcode cannot be blank when passcode protection is enabled.');
      return;
    }

    const updated: Shop = {
      ...shop,
      name: name.trim(),
      branchName: branchName.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      currency: currency.trim() || 'USD',
      currencySymbol: currencySymbol.trim() || '$',
      whatsappNotice: whatsappNotice.trim(),
      logoUrl: logoUrl.trim(),
      isPasscodeRequired,
      ownerPasscode: ownerPasscode.trim()
    };

    storage.updateShop(updated);
    onShopUpdated(updated);
    setSaveSuccess(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200 my-6">
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Shop Information & Owner Settings</h3>
              <p className="text-xs text-slate-400">Configure business identity, till receipt logo, and dashboard access passcode</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-100 px-6 text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab('IDENTITY')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'IDENTITY'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Store Profile & Till</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('LOGO')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'LOGO'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Shop Logo</span>
            {logoUrl && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SECURITY')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'SECURITY'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Owner Passcode</span>
            {isPasscodeRequired && (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono">
                Active
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('INSTALL')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'INSTALL'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Install App (PWA)</span>
            <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-bold">
              Ready
            </span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave}>
          <div className="p-6 max-h-[60vh] overflow-y-auto space-y-5">
            {/* TAB 1: IDENTITY */}
            {activeTab === 'IDENTITY' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Shop / Business Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. ABC Tuckshop & Supermarket"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Branch / Till Terminal
                    </label>
                    <input
                      type="text"
                      value={branchName}
                      onChange={e => setBranchName(e.target.value)}
                      placeholder="e.g. Main Terminal Till #1"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="p-3.5 bg-indigo-50/60 border border-indigo-200/80 rounded-2xl">
                  <label className="block text-xs font-bold text-indigo-950 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                    Administrator / Shop Owner Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={e => setOwnerName(e.target.value)}
                    placeholder="e.g. Tariro Moyo"
                    className="w-full px-3.5 py-2 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[11px] text-indigo-900/70 mt-1">
                    This is the designated primary Administrator name shown in the Owner Console, till approvals, and managerial audit logs.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      Store Telephone / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="e.g. +263 77 200 1122"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                      Currency Symbol & Code
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currencySymbol}
                        onChange={e => setCurrencySymbol(e.target.value)}
                        placeholder="$"
                        maxLength={4}
                        className="w-20 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                      <input
                        type="text"
                        value={currency}
                        onChange={e => setCurrency(e.target.value)}
                        placeholder="USD"
                        maxLength={5}
                        className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    Physical Store Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="e.g. 42 Market Way, Central Avenue"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                    Default WhatsApp & Receipt Notice
                  </label>
                  <textarea
                    rows={2}
                    value={whatsappNotice}
                    onChange={e => setWhatsappNotice(e.target.value)}
                    placeholder="Notice printed on receipt and included in WhatsApp change messages..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-[11px] font-bold text-slate-800">
                        Phone Portal ID: <span className="font-mono font-black text-emerald-700">{storage.getPortalId()}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        This phone's data in Supabase is strictly partitioned under this portal ID.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: LOGO */}
            {activeTab === 'LOGO' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center gap-5">
                  {/* Logo Preview */}
                  <div className="relative shrink-0">
                    <div className="w-24 h-24 rounded-2xl bg-white border-2 border-slate-300 shadow-sm flex items-center justify-center p-2 overflow-hidden">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt="Shop Logo Preview"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-center text-slate-400">
                          <Store className="w-8 h-8 mx-auto stroke-1" />
                          <span className="text-[10px] block mt-1 font-semibold">No Logo</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Logo Actions */}
                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <h4 className="text-sm font-bold text-slate-900">Custom Store Logo</h4>
                    <p className="text-xs text-slate-500">
                      Your logo will appear on the top navigation bar, printable thermal receipts, customer QR passes, and WhatsApp headers.
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Image</span>
                      </button>

                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove Logo</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {uploadError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Direct Image URL input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Or Enter Image Web URL
                  </label>
                  <input
                    type="url"
                    value={logoUrl.startsWith('data:') ? '' : logoUrl}
                    onChange={e => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                {/* Quick Presets for Demo */}
                <div>
                  <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Or Pick a Ready-to-Use Logo Preset:
                  </span>
                  <div className="grid grid-cols-3 gap-3">
                    {PRESET_LOGOS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setLogoUrl(preset.url)}
                        className={`p-3 rounded-2xl border-2 text-center transition-all bg-white hover:border-indigo-400 shadow-xs flex flex-col items-center gap-2 ${
                          logoUrl === preset.url ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-slate-200'
                        }`}
                      >
                        <div className="w-10 h-10 flex items-center justify-center">
                          <img src={preset.url} alt={preset.name} className="w-8 h-8 object-contain" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-700">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SECURITY & PASSCODE */}
            {activeTab === 'SECURITY' && (
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 bg-indigo-600 text-white rounded-xl shrink-0 mt-0.5">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-indigo-950">Owner Dashboard Passcode Protection</h4>
                        <p className="text-xs text-indigo-900/80 mt-0.5">
                          Require cashiers and staff to enter a secure passcode to access sales reports, customer ledgers, dispute reversals, and settings.
                        </p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                      <input
                        type="checkbox"
                        checked={isPasscodeRequired}
                        onChange={e => setIsPasscodeRequired(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>

                {isPasscodeRequired && (
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Authorized Owner Passcode
                    </label>
                    <div className="relative">
                      <input
                        type={showPasscode ? 'text' : 'password'}
                        value={ownerPasscode}
                        onChange={e => setOwnerPasscode(e.target.value)}
                        placeholder="e.g. 1234"
                        maxLength={12}
                        className="w-full px-3.5 py-3 pr-10 bg-slate-50 border border-slate-300 rounded-xl text-base font-mono font-black tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasscode(!showPasscode)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      >
                        {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span>Numeric PIN or alphanumeric (4-8 chars recommended)</span>
                      <button
                        type="button"
                        onClick={() => setOwnerPasscode('1234')}
                        className="text-indigo-600 hover:text-indigo-800 font-bold"
                      >
                        Set Demo: 1234
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: INSTALL (PWA) */}
            {activeTab === 'INSTALL' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-5 text-white border border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-md shrink-0">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-extrabold text-white">ChangeTrack Native App</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            PWA Ready
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5">
                          Install directly to your device desktop, tablet, or phone home screen.
                        </p>
                      </div>
                    </div>

                    <PWAInstallButton variant="hero" />
                  </div>
                </div>

                {/* Technical PWA Capabilities Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs mb-1">
                      <Wifi className="w-4 h-4 text-emerald-600" />
                      <span>Offline Till Operation</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Caches all assets & local sales history. Works even when the store network drops.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs mb-1">
                      <Smartphone className="w-4 h-4 text-indigo-600" />
                      <span>Standalone Window</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      No browser URL bar or unwanted tabs. Gives your cashier a clean, focused POS interface.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-2 text-amber-700 font-bold text-xs mb-1">
                      <Download className="w-4 h-4 text-amber-600" />
                      <span>Zero App Store Friction</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Instant installation without 100MB downloads. Updates automatically when new features deploy.
                    </p>
                  </div>
                </div>

                {/* Device-Specific Installation Instructions */}
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Device Guides</h5>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                      <p className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Chrome, Edge & Android
                      </p>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Click the <strong>Install App</strong> button above, or click the install icon in your browser address bar. On Android, select <em>Add to Home screen</em> from the browser menu.
                      </p>
                    </div>

                    <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                      <p className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        Apple iOS Safari (iPhone / iPad)
                      </p>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Open in Safari, tap the <strong>Share</strong> button (box with upward arrow), scroll down and tap <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saveSuccess ? 'Saved!' : 'Save Shop Information'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
