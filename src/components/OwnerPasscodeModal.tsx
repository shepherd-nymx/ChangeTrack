import React, { useState, useEffect, useRef } from 'react';
import { Lock, KeyRound, X, Eye, EyeOff, ShieldAlert, CheckCircle2, ShieldCheck, Clock } from 'lucide-react';
import { Shop } from '../types';
import { storage } from '../services/storage';

interface OwnerPasscodeModalProps {
  shop: Shop;
  onSuccess: () => void;
  onClose: () => void;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60 seconds
const SESSION_LOCKOUT_KEY = 'changetrack_owner_lockout_until';
const SESSION_ATTEMPTS_KEY = 'changetrack_owner_failed_attempts';

export const OwnerPasscodeModal: React.FC<OwnerPasscodeModalProps> = ({
  shop,
  onSuccess,
  onClose
}) => {
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Rate-limiting and lockout state
  const [attempts, setAttempts] = useState<number>(() => {
    const saved = sessionStorage.getItem(SESSION_ATTEMPTS_KEY);
    return saved ? parseInt(saved, 10) || 0 : 0;
  });

  const [lockoutRemaining, setLockoutRemaining] = useState<number>(() => {
    const savedUntil = sessionStorage.getItem(SESSION_LOCKOUT_KEY);
    if (savedUntil) {
      const remainingMs = parseInt(savedUntil, 10) - Date.now();
      return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
    }
    return 0;
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const targetPasscode = shop.ownerPasscode || '1234';

  const isLockedOut = lockoutRemaining > 0;

  // Countdown timer effect
  useEffect(() => {
    if (!isLockedOut) {
      inputRef.current?.focus();
      return;
    }

    const timer = setInterval(() => {
      setLockoutRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          sessionStorage.removeItem(SESSION_LOCKOUT_KEY);
          sessionStorage.setItem(SESSION_ATTEMPTS_KEY, '0');
          setAttempts(0);
          setError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLockedOut]);

  const triggerLockout = () => {
    const lockoutUntilTime = Date.now() + LOCKOUT_DURATION_MS;
    sessionStorage.setItem(SESSION_LOCKOUT_KEY, lockoutUntilTime.toString());
    setLockoutRemaining(Math.ceil(LOCKOUT_DURATION_MS / 1000));
    setError(`Too many failed attempts. Security lockout active for 60 seconds.`);
    
    // Log security event in audit ledger
    storage.addAuditLog({
      shopId: shop.id,
      action: 'SECURITY_LOCKOUT',
      entityType: 'SECURITY',
      entityId: 'LOCKOUT-CONSOLE',
      actorId: 'system',
      actorName: 'Security Guard',
      actorRole: 'SYSTEM',
      details: `Owner console temporarily locked out for 60s after ${MAX_FAILED_ATTEMPTS} consecutive failed passcode attempts.`
    });
  };

  const handleVerify = (codeToVerify?: string) => {
    if (isLockedOut) return;

    const code = codeToVerify !== undefined ? codeToVerify : passcode;
    if (!code) {
      setError('Please enter the owner passcode.');
      return;
    }

    if (code === targetPasscode) {
      setError(null);
      sessionStorage.removeItem(SESSION_ATTEMPTS_KEY);
      sessionStorage.removeItem(SESSION_LOCKOUT_KEY);
      onSuccess();
    } else {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      sessionStorage.setItem(SESSION_ATTEMPTS_KEY, nextAttempts.toString());
      setPasscode('');

      // Record failed authentication in audit ledger
      storage.addAuditLog({
        shopId: shop.id,
        action: 'SECURITY_FAILED_AUTH',
        entityType: 'SECURITY',
        entityId: 'AUTH-FAIL',
        actorId: 'unknown',
        actorName: 'Unauthorized Attempt',
        actorRole: 'ANONYMOUS',
        details: `Failed owner passcode attempt (${nextAttempts}/${MAX_FAILED_ATTEMPTS}) recorded on terminal.`
      });

      if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
        triggerLockout();
      } else {
        const remainingAttempts = MAX_FAILED_ATTEMPTS - nextAttempts;
        setError(`Incorrect passcode. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining before lockout.`);
        inputRef.current?.focus();
      }
    }
  };

  const handleKeyPress = (num: string) => {
    if (isLockedOut) return;
    setError(null);
    if (passcode.length < 8) {
      const next = passcode + num;
      setPasscode(next);
      if (next.length === targetPasscode.length && next === targetPasscode) {
        setTimeout(() => {
          handleVerify(next);
        }, 120);
      }
    }
  };

  const handleBackspace = () => {
    if (isLockedOut) return;
    setError(null);
    setPasscode(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (isLockedOut) return;
    setError(null);
    setPasscode('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30 mb-2">
            <Lock className="w-6 h-6" />
          </div>

          <h3 className="text-lg font-black tracking-tight">Owner Console Security</h3>
          <p className="text-xs text-slate-400 mt-1">
            Protected with brute-force rate-limiting & tamper audit trail
          </p>
        </div>

        {/* Input Body */}
        <div className="p-6 space-y-4">
          {/* Lockout Warning Banner if active */}
          {isLockedOut ? (
            <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl text-center space-y-2">
              <div className="inline-flex p-2 bg-rose-100 rounded-xl text-rose-700">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800">
                Security Lockout Active
              </h4>
              <p className="text-xs text-rose-700 leading-relaxed">
                Too many failed attempts. Console locked for security.
              </p>
              <div className="text-2xl font-black font-mono text-rose-900">
                00:{lockoutRemaining.toString().padStart(2, '0')}
              </div>
            </div>
          ) : (
            <form
              onSubmit={e => {
                e.preventDefault();
                handleVerify();
              }}
              className="space-y-3"
            >
              <div className="relative">
                <input
                  ref={inputRef}
                  type={showPasscode ? 'text' : 'password'}
                  value={passcode}
                  onChange={e => {
                    setError(null);
                    setPasscode(e.target.value);
                  }}
                  placeholder="Enter Passcode"
                  maxLength={8}
                  disabled={isLockedOut}
                  className="w-full text-center text-2xl font-mono font-black tracking-widest py-3 px-10 bg-slate-50 border-2 border-slate-300 focus:border-indigo-600 rounded-2xl focus:outline-none transition-all shadow-inner disabled:bg-slate-100 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  disabled={isLockedOut}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 disabled:opacity-30"
                  tabIndex={-1}
                >
                  {showPasscode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {error && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Quick Touch Keypad for retail terminals */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeyPress(digit)}
                    disabled={isLockedOut}
                    className="py-3 bg-slate-100 hover:bg-indigo-50 active:bg-indigo-100 text-slate-800 hover:text-indigo-900 font-mono font-bold text-lg rounded-xl transition-all shadow-xs disabled:opacity-40"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isLockedOut}
                  className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all disabled:opacity-40"
                >
                  CLEAR
                </button>
                <button
                  type="button"
                  onClick={() => handleKeyPress('0')}
                  disabled={isLockedOut}
                  className="py-3 bg-slate-100 hover:bg-indigo-50 active:bg-indigo-100 text-slate-800 hover:text-indigo-900 font-mono font-bold text-lg rounded-xl transition-all shadow-xs disabled:opacity-40"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  disabled={isLockedOut}
                  className="py-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-bold rounded-xl transition-all disabled:opacity-40"
                >
                  ⌫ DEL
                </button>
              </div>

              <button
                type="submit"
                disabled={isLockedOut}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-extrabold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-3 disabled:bg-slate-400"
              >
                <KeyRound className="w-4 h-4" />
                <span>UNLOCK OWNER CONSOLE</span>
              </button>
            </form>
          )}

          {/* Secure Policy Notice */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 text-center pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Encrypted attempt logging & rate-limit lockout enforced</span>
          </div>
        </div>
      </div>
    </div>
  );
};
