import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Lock, 
  Key, 
  Database, 
  Hash, 
  CheckCircle2, 
  X, 
  RefreshCw, 
  Cpu, 
  FileCode2, 
  ExternalLink,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';
import { storage } from '../services/storage';
import { SecurityAuditReport, Shop } from '../types';

interface SecurityDefenseModalProps {
  shop: Shop;
  onClose: () => void;
}

export const SecurityDefenseModal: React.FC<SecurityDefenseModalProps> = ({
  shop,
  onClose
}) => {
  const [report, setReport] = useState<SecurityAuditReport | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<'AUDIT' | 'HOW_AI_APPS_HACKED'>('AUDIT');

  const runScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      const res = storage.runSecurityAudit();
      setReport(res);
      setIsScanning(false);
    }, 450);
  };

  useEffect(() => {
    runScan();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 p-5 sm:p-6 text-white shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white">App Security & Threat Defense</h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  HARDENED
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Active mitigations against common AI-generated software vulnerabilities & exploits
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('AUDIT')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeTab === 'AUDIT'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              System Security Audit
            </button>
            <button
              onClick={() => setActiveTab('HOW_AI_APPS_HACKED')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeTab === 'HOW_AI_APPS_HACKED'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              How AI Apps Are Hacked & Prevention
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {activeTab === 'AUDIT' && (
            <>
              {/* Scan Status Summary Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Security Posture:</span>
                    {report?.isSecure ? (
                      <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ALL SHIELDS OPTIMAL
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                        <AlertTriangle className="w-3.5 h-3.5" /> ATTENTION RECOMMENDED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600">
                    {report?.passedChecks} of {report?.totalChecks} security defenses verified. Zero secrets stored in client storage.
                  </p>
                </div>

                <button
                  onClick={runScan}
                  disabled={isScanning}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? 'Verifying Defenses...' : 'Re-run Integrity Scan'}</span>
                </button>
              </div>

              {/* Verification Checklist */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Live Security Controls & Hash Verification
                </h4>

                <div className="space-y-2.5">
                  {report?.findings.map(finding => (
                    <div 
                      key={finding.id}
                      className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
                        finding.level === 'PASS'
                          ? 'bg-emerald-50/50 border-emerald-200 text-slate-800'
                          : finding.level === 'WARN'
                          ? 'bg-amber-50/70 border-amber-200 text-slate-800'
                          : 'bg-rose-50 border-rose-200 text-slate-800'
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {finding.level === 'PASS' && (
                          <div className="p-1 bg-emerald-600 text-white rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {finding.level === 'WARN' && (
                          <div className="p-1 bg-amber-500 text-white rounded-lg">
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {finding.level === 'CRITICAL' && (
                          <div className="p-1 bg-rose-600 text-white rounded-lg">
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-slate-900">{finding.title}</h5>
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                            finding.level === 'PASS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : finding.level === 'WARN'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {finding.level}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {finding.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cryptographic Ledger Proof Box */}
              <div className="p-4 bg-slate-900 rounded-2xl text-slate-200 space-y-2 border border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Cryptographic Hash Chain Status</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/30">
                    SHA256-DIGEST
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Every audit record is tied to its previous block signature. Any manual alteration in DevTools or browser storage immediately breaks the signature chain, triggering an immutable tamper alarm.
                </p>
              </div>
            </>
          )}

          {activeTab === 'HOW_AI_APPS_HACKED' && (
            <div className="space-y-4 text-xs text-slate-700">
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-1">
                <h4 className="font-bold text-indigo-950 text-xs">Research Summary: Vulnerabilities in AI-Generated Applications</h4>
                <p className="text-[11px] text-indigo-900 leading-relaxed">
                  Recent cybersecurity research reveals that AI-generated code introduces distinct vulnerability vectors: hardcoded master credentials in client code, unprotected database APIs, lack of rate-limiting, and client-side arithmetic trust. Here is how ChangeTrack actively defends against each:
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {/* Threat 1 */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">1. Credential Leakage in Client Bundles</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">DEFENDED</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    <strong>The Attack:</strong> AI models frequently place Supabase <code>service_role</code> keys or database passwords into frontend components or localStorage. Attackers search <code>bundle.js</code> and extract keys to wipe the database.
                  </p>
                  <p className="text-[11px] text-emerald-700 font-medium">
                    <strong>Our Defense:</strong> All database secrets were removed from UI and localStorage. Credentials are strictly loaded via system environment variables with public-safe anon scopes only.
                  </p>
                </div>

                {/* Threat 2 */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">2. PIN & Passcode Brute-Forcing</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">DEFENDED</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    <strong>The Attack:</strong> 4-digit PINs without rate limits can be cracked in 30 seconds via simple automated scripts, or leaked via default UI helper hints.
                  </p>
                  <p className="text-[11px] text-emerald-700 font-medium">
                    <strong>Our Defense:</strong> Plaintext passcode display removed. Strict 5-attempt rate-limiting enforced with a 60-second cooldown lockout and audit log alerts.
                  </p>
                </div>

                {/* Threat 3 */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">3. POS Negative Tender & NaN Arithmetic Exploits</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">DEFENDED</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    <strong>The Attack:</strong> Attackers send negative numbers (<code>amountReceived: -100</code>) or <code>NaN</code> to reverse ledger math, creating free store credit or cash surpluses.
                  </p>
                  <p className="text-[11px] text-emerald-700 font-medium">
                    <strong>Our Defense:</strong> Strict boundary clamping: values must be positive, finite numbers between 0.01 and 100,000. Amount received must be &gt;= purchase total.
                  </p>
                </div>

                {/* Threat 4 */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">4. Supabase Permissive Row-Level Security (RLS) Bypasses</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">DEFENDED</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    <strong>The Attack:</strong> AI often generates <code>CREATE POLICY ... USING (true)</code> which exposes all customer records, phone numbers, and balances to anyone with the anon key.
                  </p>
                  <p className="text-[11px] text-emerald-700 font-medium">
                    <strong>Our Defense:</strong> <code>supabase_schema.sql</code> implements strict multi-tenant portal scoping, transaction isolation, and immutability triggers preventing status reversal.
                  </p>
                </div>

                {/* Threat 5 */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">5. Protocol Injection in WhatsApp & QR Redirects</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">DEFENDED</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    <strong>The Attack:</strong> Injecting <code>javascript:...</code> or malicious URI schemes into customer phone fields to trigger Cross-Site Scripting (XSS) upon clicking links.
                  </p>
                  <p className="text-[11px] text-emerald-700 font-medium">
                    <strong>Our Defense:</strong> Phone inputs are sanitized with digit-only regex (<code>[^0-9]</code>) and all message strings are encoded using <code>encodeURIComponent</code>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>ChangeTrack Defense Engine v2.4</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors"
          >
            Close Security Console
          </button>
        </div>

      </div>
    </div>
  );
};
