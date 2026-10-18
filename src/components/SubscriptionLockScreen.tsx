import React, { useState } from 'react';
import { Lock, KeyRound, Loader as Loader2, CircleAlert as AlertCircle, CheckCircle2, LogOut } from 'lucide-react';
import { subscriptionService, ShopSubscription } from '../services/subscription';

interface LockScreenProps {
  subscription: ShopSubscription | null;
  onReactivate: (newPeriodEnd: string) => void;
  onSignOut: () => void;
}

export const SubscriptionLockScreen: React.FC<LockScreenProps> = ({ subscription, onReactivate, onSignOut }) => {
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justRedeemed, setJustRedeemed] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    const result = await subscriptionService.redeemKey(trimmed);
    if (result.success && result.periodEnd) {
      setJustRedeemed(true);
      setTimeout(() => onReactivate(result.periodEnd!), 1200);
    } else {
      setError(result.error || 'That key could not be accepted.');
      setBusy(false);
    }
  };

  const fee = subscription ? `${subscription.currency} ${subscription.monthlyFee.toFixed(2)}` : null;
  const expiredOn = subscription ? new Date(subscription.periodEnd).toLocaleDateString() : null;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-ink-950 via-ink-900 to-slate-900 flex items-center justify-center p-4 font-sans antialiased">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-10 rise-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-md">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Subscription Ended</h1>
            <p className="text-xs text-slate-400 font-semibold">ChangeTrack — Powered by Future Pulse Investments</p>
          </div>
        </div>

        {justRedeemed ? (
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="font-semibold">Your subscription is active again. Opening your shop…</span>
          </div>
        ) : (
          <>
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700 leading-relaxed space-y-1.5">
              <p className="font-bold text-slate-900">Your monthly subscription period has ended{expiredOn ? ` on ${expiredOn}` : ''}.</p>
              <p>
                All app activity in your shop portal is paused. To continue using ChangeTrack, pay the monthly fee
                {fee ? <> of <span className="font-bold">{fee}</span></> : null} to the administrator — you will receive an
                activation key. Enter it below to reactivate.
              </p>
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700 rise-in">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={submit} className="mt-5 space-y-3">
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={key}
                  onChange={e => setKey(e.target.value.toUpperCase())}
                  placeholder="Enter activation key (e.g. CT-XXXX-XXXX-XXXX)"
                  autoFocus
                  className="w-full pl-9 pr-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold tracking-wider text-slate-900 placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white transition min-h-[50px]"
                />
              </div>
              <button
                type="submit"
                disabled={busy || !key.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed min-h-[48px] tap-scale"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                {busy ? 'Checking key…' : 'Reactivate subscription'}
              </button>
            </form>

            <button
              onClick={onSignOut}
              className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors min-h-[40px]"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out of this device
            </button>
          </>
        )}
      </div>
    </div>
  );
};
