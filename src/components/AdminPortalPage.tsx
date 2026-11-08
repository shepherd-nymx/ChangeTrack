import React, { useState } from 'react';
import {
  ShieldCheck, Lock, Loader as Loader2, CircleAlert as AlertCircle,
  LogOut, Database, Activity, RefreshCw
} from 'lucide-react';
import { supabaseService } from '../services/supabase';

const ADMIN_FUNCTION_URL = () => {
  const base = (supabaseService.getConfig().supabaseUrl || '').trim();
  return base ? `${base.replace(/\/+$/, '')}/functions/v1/admin-portal` : '';
};

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
  legal_acceptances: 'Terms acceptances'
};

export const AdminPortalPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AdminPortalResponse | null>(null);

  const unlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const url = ADMIN_FUNCTION_URL();
      if (!url) {
        setError('The server address is not configured. Please reload the app and try again.');
        return;
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'x-admin-email': email.trim(),
          'x-admin-password': password
        }
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) {
        setError(body.error === 'Access denied' ? 'Wrong email or password.' : (body.error || 'Access denied.'));
        return;
      }
      setData(body as AdminPortalResponse);
      setPassword('');
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  const refresh = async () => {
    if (!data) return;
    setBusy(true);
    setError(null);
    try {
      const url = ADMIN_FUNCTION_URL();
      if (!url) {
        setData(null);
        return;
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'x-admin-email': data.viewer.email,
          'x-admin-password': password
        }
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.ok) {
        setData(body as AdminPortalResponse);
      } else {
        setData(null);
      }
    } catch {
      setData(null);
    } finally {
      setBusy(false);
    }
  };

  const signOut = () => {
    setData(null);
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-ink-950 via-ink-900 to-slate-900 flex items-center justify-center p-4 font-sans antialiased">
      {!data ? (
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
            Restricted area. Sign in with an authorised administrator account to view database activity.
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
      ) : (
        <div className="w-full max-w-4xl space-y-6">
          {/* Header */}
          <div className="bg-white rounded-3xl shadow-xl p-5 sm:p-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-ink-900 flex items-center justify-center text-white shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-extrabold text-slate-900 tracking-tight truncate">Database Overview</h1>
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

          {/* Counts grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(data.counts).map(([table, count]) => (
              <div key={table} className="bg-white rounded-2xl shadow-lg p-4">
                <p className="text-2xl font-extrabold text-slate-900 font-mono-num">
                  {typeof count === 'number' && count >= 0 ? count.toLocaleString() : '—'}
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
