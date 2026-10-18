import React, { useState, useRef } from 'react';
import {
  ShieldCheck, Lock, Loader as Loader2, CircleAlert as AlertCircle,
  LogOut, Database, Activity, RefreshCw, KeyRound, DollarSign, Check, Ban, Copy
} from 'lucide-react';
import { supabaseService } from '../services/supabase';

const ADMIN_FUNCTION_URL = () => {
  const base = (supabaseService.getConfig().supabaseUrl || '').trim();
  return base ? `${base.replace(/\/+$/, '')}/functions/v1/admin-portal` : '';
};

interface ShopKey {
  key_code: string;
  fee_at_issue: number | null;
  status: 'PENDING' | 'CONFIRMED' | 'USED' | 'REVOKED';
  created_at: string;
  confirmed_at: string | null;
  used_at: string | null;
}

interface AdminShop {
  id: string;
  name: string;
  branch_name: string | null;
  owner_name: string | null;
  created_at: string;
  subscription: {
    monthly_fee: number;
    currency: string;
    period_start: string;
    period_end: string;
    updated_at: string;
  } | null;
  status: 'ACTIVE' | 'EXPIRING' | 'EXPIRED';
  days_left: number;
  keys: ShopKey[];
}

interface AdminPortalResponse {
  ok: boolean;
  generated_at: string;
  counts: Record<string, number>;
  recent_activity: Array<{
    timestamp: string;
    action: string;
    entity_type: string;
    entity_id: string;
    actor_name: string;
    actor_role: string;
    details: string;
  }>;
  shops?: AdminShop[];
  viewer: { email: string };
  error?: string;
}

const FRIENDLY_TABLE_NAMES: Record<string, string> = {
  shops: 'Shops (registered tills)',
  employees: 'Till staff accounts',
  customers: 'Customers',
  transactions: 'Register sales',
  change_records: 'Change slips',
  customer_balance_ledger: 'Balance ledger entries',
  change_collections: 'Collection events',
  whatsapp_messages: 'WhatsApp messages logged',
  audit_logs: 'Audit log entries',
  disputes: 'Disputes',
  welcome_emails: 'Welcome emails',
  legal_acceptances: 'Terms acceptances',
  shop_subscriptions: 'Shop subscriptions',
  activation_keys: 'Activation keys'
};

const STATUS_STYLES: Record<AdminShop['status'], { label: string; cls: string }> = {
  ACTIVE: { label: 'Active', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  EXPIRING: { label: 'Expiring soon', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  EXPIRED: { label: 'Expired', cls: 'bg-rose-50 text-rose-700 border-rose-200' }
};

const KEY_STATUS_STYLES: Record<ShopKey['status'], string> = {
  PENDING: 'bg-slate-100 text-slate-600',
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  USED: 'bg-slate-100 text-slate-400',
  REVOKED: 'bg-rose-100 text-rose-600'
};

export const AdminPortalPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const passwordRef = useRef<string>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [data, setData] = useState<AdminPortalResponse | null>(null);
  const [feeDrafts, setFeeDrafts] = useState<Record<string, string>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const callAdmin = async (body: Record<string, unknown>, pwd: string) => {
    const url = ADMIN_FUNCTION_URL();
    if (!url) throw new Error('The server address is not configured. Please reload the app and try again.');
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'x-admin-email': (body.viewerEmail as string) || email.trim(),
        'x-admin-password': pwd
      },
      body: body.viewerEmail ? JSON.stringify({ action: body.action, ...(['shop_id', 'fee', 'currency', 'key_code', 'days'] as const).reduce((acc, k) => {
        if (body[k] !== undefined) acc[k] = body[k];
        return acc;
      }, {} as Record<string, unknown>) }) : undefined
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.error) throw new Error(json.error || `Request failed (${res.status})`);
    return json;
  };

  const unlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = await callAdmin({ action: 'overview' }, password);
      passwordRef.current = password;
      setData(body as AdminPortalResponse);
      setPassword('');
    } catch (err: any) {
      setError(err?.message === 'Access denied' ? 'Wrong email or password.' : (err?.message || 'Could not reach the server.'));
    } finally {
      setBusy(false);
    }
  };

  const refresh = async () => {
    if (!data) return;
    setBusy(true);
    setError(null);
    try {
      const body = await callAdmin({ action: 'overview', viewerEmail: data.viewer.email }, passwordRef.current);
      setData(body as AdminPortalResponse);
    } catch {
      setData(null);
      passwordRef.current = '';
    } finally {
      setBusy(false);
    }
  };

  const runAction = async (action: string, extra: Record<string, unknown>, successMsg: string) => {
    if (!data) return;
    setBusy(true);
    setError(null);
    setActionMsg(null);
    try {
      const body = await callAdmin({ action, viewerEmail: data.viewer.email, ...extra }, passwordRef.current);
      setActionMsg(successMsg);
      const fresh = await callAdmin({ action: 'overview', viewerEmail: data.viewer.email }, passwordRef.current);
      setData(fresh as AdminPortalResponse);
      if (action === 'generate_key' && body.key_code) {
        try {
          await navigator.clipboard.writeText(body.key_code);
          setCopiedKey(body.key_code);
          setTimeout(() => setCopiedKey(null), 2500);
        } catch { /* clipboard unavailable — code still shown in list */ }
      }
    } catch (err: any) {
      setError(err?.message || 'The action failed.');
    } finally {
      setBusy(false);
    }
  };

  const signOut = () => {
    setData(null);
    setEmail('');
    setPassword('');
    passwordRef.current = '';
    setActionMsg(null);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-ink-950 via-ink-900 to-slate-900 py-8 px-4 font-sans antialiased">
      {!data ? (
        <div className="min-h-screen w-full flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-10 rise-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-ink-900 flex items-center justify-center text-white shadow-md">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Administration Portal</h1>
                <p className="text-xs text-slate-400 font-semibold">ChangeTrack — Powered by Future Pulse Investments</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Restricted area. Sign in with an authorised administrator account to manage shops and subscriptions.
            </p>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700 rise-in">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={unlock} className="mt-6 space-y-4">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Administrator email"
                autoComplete="email"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/40 focus:bg-white transition min-h-[46px]"
              />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/40 focus:bg-white transition min-h-[46px]"
              />
              <button
                type="submit"
                disabled={busy}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-ink-900 hover:bg-ink-800 text-white text-sm font-bold shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed min-h-[48px] tap-scale"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {busy ? 'Checking…' : 'Unlock portal'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-3xl shadow-xl p-5 sm:p-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-ink-900 flex items-center justify-center text-white shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-extrabold text-slate-900 tracking-tight truncate">Shop & Subscription Management</h1>
                <p className="text-[11px] text-slate-400 font-semibold truncate">
                  Signed in as {data.viewer.email} — generated {new Date(data.generated_at).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={refresh}
                disabled={busy}
                title="Refresh"
                className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={signOut}
                title="Lock portal"
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded-xl transition-all text-xs font-bold tap-scale"
              >
                <LogOut className="w-3.5 h-3.5" /> Lock
              </button>
            </div>
          </div>

          {/* Feedback banners */}
          {error && (
            <div className="flex items-start gap-2 rounded-2xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700 rise-in">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {actionMsg && (
            <div className="flex items-start gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700 rise-in">
              <Check className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{actionMsg}</span>
            </div>
          )}

          {/* Subscriptions */}
          <div className="bg-white rounded-3xl shadow-xl p-5 sm:p-6">
            <div className="flex items-center gap-2.5 mb-1">
              <KeyRound className="w-4 h-4 text-slate-500" />
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Shop Subscriptions</h2>
            </div>
            <p className="text-xs text-slate-400 font-semibold mb-4">
              Set each shop's monthly fee, then generate a renewal key and confirm it. Only confirmed keys work, and each works once.
            </p>

            {(!data.shops || data.shops.length === 0) ? (
              <p className="text-sm text-slate-400 py-6 text-center">No shops registered yet.</p>
            ) : (
              <ul className="space-y-4">
                {data.shops.map(shop => {
                  const st = STATUS_STYLES[shop.status];
                  const draft = feeDrafts[shop.id] ?? (shop.subscription ? String(shop.subscription.monthly_fee) : '0');
                  const pendingKeys = shop.keys.filter(k => k.status === 'PENDING');
                  return (
                    <li key={shop.id} className="border border-slate-200 rounded-2xl p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{shop.name}</p>
                          <p className="text-[11px] text-slate-400 truncate">
                            Owner: {shop.owner_name || '—'} · Registered {new Date(shop.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2.5 py-1 rounded-full border text-[11px] font-bold ${st.cls}`}>{st.label}</span>
                          {shop.subscription && (
                            <span className="text-[11px] text-slate-500 font-semibold">
                              {shop.status === 'EXPIRED'
                                ? `expired ${new Date(shop.subscription.period_end).toLocaleDateString()}`
                                : `${shop.days_left} day${shop.days_left === 1 ? '' : 's'} left · ends ${new Date(shop.subscription.period_end).toLocaleDateString()}`}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Fee */}
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
                          <DollarSign className="w-4 h-4 text-slate-400 shrink-0" />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={draft}
                            onChange={e => setFeeDrafts(prev => ({ ...prev, [shop.id]: e.target.value }))}
                            placeholder="Monthly fee"
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500/40 focus:bg-white transition min-h-[40px]"
                          />
                        </div>
                        <button
                          onClick={() => runAction('set_fee', { shop_id: shop.id, fee: Number(draft) }, `Monthly fee for ${shop.name} set to ${draft}.`)}
                          disabled={busy}
                          className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold transition disabled:opacity-50 min-h-[40px] tap-scale"
                        >
                          Save fee
                        </button>
                        <button
                          onClick={() => runAction('generate_key', { shop_id: shop.id }, `A new key was generated for ${shop.name}. Confirm it to make it usable.`)}
                          disabled={busy}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:border-slate-500 text-slate-700 text-xs font-bold transition disabled:opacity-50 min-h-[40px] tap-scale"
                        >
                          <KeyRound className="w-3.5 h-3.5" /> Generate key
                        </button>
                      </div>

                      {/* Keys */}
                      {shop.keys.length > 0 && (
                        <div className="space-y-1.5">
                          {[...shop.keys].reverse().map(k => (
                            <div key={k.key_code} className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 rounded-xl px-3 py-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <code className="text-xs font-bold text-slate-800 tracking-wider">{k.key_code}</code>
                                {copiedKey === k.key_code && (
                                  <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                                    <Copy className="w-3 h-3" /> copied
                                  </span>
                                )}
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${KEY_STATUS_STYLES[k.status]}`}>{k.status}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {k.status === 'PENDING' && (
                                  <button
                                    onClick={() => runAction('confirm_key', { key_code: k.key_code }, `Key ${k.key_code} confirmed — it is now active for ${shop.name}.`)}
                                    disabled={busy}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition disabled:opacity-50 tap-scale"
                                  >
                                    <Check className="w-3 h-3" /> Confirm
                                  </button>
                                )}
                                {k.status === 'CONFIRMED' && (
                                  <button
                                    onClick={() => runAction('revoke_key', { key_code: k.key_code }, `Key ${k.key_code} revoked.`)}
                                    disabled={busy}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-[11px] font-bold transition disabled:opacity-50 tap-scale"
                                  >
                                    <Ban className="w-3 h-3" /> Revoke
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                          {pendingKeys.length > 0 && (
                            <p className="text-[11px] text-amber-600 font-semibold">
                              Share the key code with the shop, then press Confirm to activate it.
                            </p>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Counts grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(data.counts).map(([table, count]) => (
              <div key={table} className="bg-white rounded-2xl shadow-lg p-4">
                <p className="text-2xl font-extrabold text-slate-900 font-mono-num">
                  {Number(count) < 0 ? '—' : Number(count).toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5 leading-snug">
                  {FRIENDLY_TABLE_NAMES[table] ?? table}
                </p>
              </div>
            ))}
          </div>

          {/* Recent activity */}
          <div className="bg-white rounded-3xl shadow-xl p-5 sm:p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <Activity className="w-4 h-4 text-slate-500" />
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Recent Activity</h2>
              <span className="text-[11px] text-slate-400 font-semibold">latest 25 events</span>
            </div>

            {data.recent_activity.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No audit events recorded yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.recent_activity.map((ev, i) => (
                  <li key={i} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{ev.action}</p>
                        <p className="text-xs text-slate-400 truncate">
                          {ev.entity_type} · {ev.entity_id} · by {ev.actor_name} ({ev.actor_role})
                        </p>
                        {ev.details && (
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{ev.details}</p>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-300 font-semibold whitespace-nowrap shrink-0">
                        {new Date(ev.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
