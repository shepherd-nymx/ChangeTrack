import React, { useState } from 'react';
import { ShieldCheck, FileText, Loader as Loader2 } from 'lucide-react';
import { shopAuth } from '../services/shopAuth';
import { CURRENT_TERMS_VERSION, CURRENT_PRIVACY_VERSION } from '../legal/legalDocs';
import { LegalViewerModal } from '../legal/LegalViewerModal';

interface TermsReacceptanceGateProps {
  onAccepted: () => void;
  onSignOut: () => void;
}

/**
 * Shown after sign-in when material terms changed and renewed acceptance is
 * required before the user reaches protected features. Also covers existing
 * users whose accounts predate acceptance records.
 */
export const TermsReacceptanceGate: React.FC<TermsReacceptanceGateProps> = ({ onAccepted, onSignOut }) => {
  const [agreed, setAgreed] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [legalViewerDoc, setLegalViewerDoc] = useState<string | null>(null);

  const handleAccept = async () => {
    setBusy(true);
    setError(null);
    const ok = await shopAuth.recordRenewedAcceptance(marketingOptIn);
    setBusy(false);
    if (!ok) {
      setError('We could not record your acceptance. Please check your connection and try again.');
      return;
    }
    onAccepted();
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-ink-900 via-ink-950 to-brand-900 flex items-center justify-center p-4 font-sans antialiased">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-10 rise-in">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-md shadow-brand-600/25">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Updated Terms</h1>
            <p className="text-xs text-slate-400 font-semibold">ChangeTrack — Powered by Future Pulse Investments</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          Our Terms and Conditions and Privacy Policy have changed since you last accepted them
          (or have not yet been recorded for your account). Please review the updated documents
          before continuing to your shop portal.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button
            onClick={() => setLegalViewerDoc('terms')}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-ink-700 hover:bg-slate-100 transition tap-scale"
          >
            <FileText className="w-4 h-4" /> Terms and Conditions
          </button>
          <button
            onClick={() => setLegalViewerDoc('privacy')}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-ink-700 hover:bg-slate-100 transition tap-scale"
          >
            <FileText className="w-4 h-4" /> Privacy Policy
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">{error}</div>
        )}

        <label className="mt-5 flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-emerald-600 shrink-0"
          />
          <span className="text-xs text-slate-600 leading-relaxed">
            I have read and agree to the updated Terms and Conditions (version {CURRENT_TERMS_VERSION}) and acknowledge the
            updated Privacy Policy (version {CURRENT_PRIVACY_VERSION}).
          </span>
        </label>

        <label className="mt-2.5 flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={marketingOptIn}
            onChange={e => setMarketingOptIn(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-emerald-600 shrink-0"
          />
          <span className="text-xs text-slate-600 leading-relaxed">(Optional) Send me occasional product news and updates.</span>
        </label>

        <button
          onClick={handleAccept}
          disabled={!agreed || busy}
          className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-md shadow-brand-600/25 transition disabled:opacity-60 disabled:cursor-not-allowed min-h-[48px] tap-scale"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          {busy ? 'Recording acceptance…' : 'Accept and continue'}
        </button>

        <button
          onClick={onSignOut}
          className="mt-3 w-full py-2.5 text-sm font-bold text-slate-400 hover:text-slate-600 transition"
        >
          Sign out instead
        </button>
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
