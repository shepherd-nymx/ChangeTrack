import React, { useState } from 'react';
import { Coins, Mail, Lock, Store, Loader as Loader2, CircleAlert as AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { shopAuth } from '../services/shopAuth';
import { CURRENT_TERMS_VERSION, CURRENT_PRIVACY_VERSION } from '../legal/legalDocs';
import { LegalViewerModal } from '../legal/LegalViewerModal';

interface ShopAuthPageProps {
  onAuthed: () => void;
}

export const ShopAuthPage: React.FC<ShopAuthPageProps> = ({ onAuthed }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [shopName, setShopName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [legalViewerDoc, setLegalViewerDoc] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) return 'Please enter a valid email address.';
    if (password.length < 6) return 'Password must be at least 6 characters long.';
    if (mode === 'register') {
      if (!shopName.trim()) return 'Please enter your shop name.';
      if (password !== confirmPassword) return 'Passwords do not match.';
      if (!agreedToTerms) return 'Please read and accept the Terms of Service and Privacy Policy to continue.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    setBusy(true);
    try {
      if (mode === 'register') {
        const res = await shopAuth.signUpShop(shopName.trim(), email.trim(), password, marketingOptIn);
        if (!res.success) {
          setError(res.error || 'Could not create your shop account.');
          return;
        }
        if (res.needsVerification) {
          setNotice('Account created! Please check your email to confirm, then sign in.');
          setMode('login');
          return;
        }
        onAuthed();
      } else {
        const res = await shopAuth.signIn(email.trim(), password);
        if (!res.success) {
          setError(res.error || 'Could not sign you in.');
          return;
        }
        onAuthed();
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const inputBase =
    'w-full pl-10 pr-3 py-2.5 rounded-xl bg-ink-50 border border-ink-200 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 focus:bg-white transition min-h-[46px]';

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-ink-900 via-ink-950 to-brand-900 flex items-center justify-center p-4 font-sans antialiased">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
        {/* Brand panel */}
        <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-brand-600 via-brand-700 to-ink-950 p-10 text-white">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur">
                <Coins className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">ChangeTrack</h1>
                <p className="text-xs text-emerald-200 font-semibold tracking-wide uppercase">Retail Change Ledger</p>
              </div>
            </div>
            <p className="mt-8 text-emerald-50/90 leading-relaxed">
              Digital, tamper-resistant change tracking for your till. Record who is owed change,
              let them collect by phone, QR code or WhatsApp — with a full audit trail.
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              'Per-shop private portal — your data, only your account',
              'Customer multi-change balances that stack automatically',
              'WhatsApp confirmations and QR collection codes',
              'Immutable audit log with tamper detection'
            ].map(item => (
              <li key={item} className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 mt-0.5 text-emerald-300 shrink-0" />
                <span className="text-emerald-100/90">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Form panel */}
        <div className="bg-white p-6 sm:p-10 flex flex-col justify-center rise-in">
          <div className="lg:hidden flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-md shadow-brand-600/25">
              <Coins className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">ChangeTrack</h1>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {mode === 'login' ? 'Shop sign in' : 'Register your shop'}
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            {mode === 'login'
              ? 'Sign in to open your shop portal and manage customer change.'
              : 'Create a private portal for your shop in under a minute.'}
          </p>

          {error && (
            <div className="mt-5 flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700 rise-in">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {notice && (
            <div className="mt-5 flex items-start gap-2 rounded-xl bg-brand-50 border border-brand-200 p-3 text-sm text-brand-800 rise-in">
              <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            {mode === 'register' && (
              <div className="relative">
                <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={shopName}
                  onChange={e => setShopName(e.target.value)}
                  placeholder="Shop name (e.g. Harare Central Tuckshop)"
                  autoComplete="organization"
                  className={inputBase}
                />
              </div>
            )}

            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@shop.com"
                autoComplete="email"
                className={inputBase}
              />
            </div>

            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password (min. 6 characters)"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className={inputBase}
              />
            </div>

            {mode === 'register' && (
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  className={inputBase}
                />
              </div>
            )}

            {mode === 'register' && (
              <div className="space-y-2.5 pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={e => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-emerald-600 shrink-0"
                    required
                  />
                  <span className="text-xs text-slate-600 leading-relaxed">
                    I have read and agree to the{' '}
                    <button type="button" onClick={() => setLegalViewerDoc('terms')} className="font-bold text-brand-700 hover:text-brand-800 underline underline-offset-2">Terms of Service</button>
                    {' '}and acknowledge the{' '}
                    <button type="button" onClick={() => setLegalViewerDoc('privacy')} className="font-bold text-brand-700 hover:text-brand-800 underline underline-offset-2">Privacy Policy</button>
                    .
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={marketingOptIn}
                    onChange={e => setMarketingOptIn(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-emerald-600 shrink-0"
                  />
                  <span className="text-xs text-slate-600 leading-relaxed">
                    (Optional) Send me occasional product news and updates.
                  </span>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-sm font-bold shadow-md shadow-brand-600/25 hover:shadow-lg hover:shadow-brand-600/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed min-h-[48px] tap-scale"
            >
              {busy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {mode === 'login' ? 'Signing in…' : 'Creating your portal…'}
                </>
              ) : (
                <>
                  {mode === 'login' ? 'Sign in to portal' : 'Create shop portal'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-200 text-sm text-center">
            {mode === 'login' ? (
              <p className="text-slate-500">
                New to ChangeTrack?{' '}
                <button
                  onClick={() => { setMode('register'); setError(null); setNotice(null); }}
                  className="font-bold text-brand-700 hover:text-brand-800 underline underline-offset-2"
                >
                  Register your shop
                </button>
              </p>
            ) : (
              <p className="text-slate-500">
                Already have a shop account?{' '}
                <button
                  onClick={() => { setMode('login'); setError(null); setNotice(null); }}
                  className="font-bold text-brand-700 hover:text-brand-800 underline underline-offset-2"
                >
                  Sign in
                </button>
              </p>
            )}
            <p className="mt-3 text-xs text-slate-400">
              By using ChangeTrack you agree to our{' '}
              <button onClick={() => setLegalViewerDoc('terms')} className="underline underline-offset-2 hover:text-slate-600">Terms of Service</button>
              {' '}and{' '}
              <button onClick={() => setLegalViewerDoc('privacy')} className="underline underline-offset-2 hover:text-slate-600">Privacy Policy</button>.
            </p>
            <p className="mt-1 text-[11px] text-slate-400">ChangeTrack — Powered by Future Pulse Investments</p>
          </div>
        </div>
      </div>

      {legalViewerDoc && (
        <LegalViewerModal
          initialDocId={legalViewerDoc}
          onClose={() => setLegalViewerDoc(null)}
        />
      )}
    </div>
  );
};
