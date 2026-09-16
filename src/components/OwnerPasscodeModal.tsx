import React, { useState, useEffect, useRef } from 'react';
import { Lock, KeyRound, X, Eye, EyeOff, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';
import { Shop } from '../types';

interface OwnerPasscodeModalProps {
  shop: Shop;
  onSuccess: () => void;
  onClose: () => void;
}

export const OwnerPasscodeModal: React.FC<OwnerPasscodeModalProps> = ({
  shop,
  onSuccess,
  onClose
}) => {
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const targetPasscode = shop.ownerPasscode || '1234';

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleVerify = (codeToVerify?: string) => {
    const code = codeToVerify !== undefined ? codeToVerify : passcode;
    if (!code) {
      setError('Please enter the owner passcode.');
      return;
    }

    if (code === targetPasscode) {
      setError(null);
      onSuccess();
    } else {
      setError('Incorrect passcode. Please try again.');
      setAttempts(prev => prev + 1);
      setPasscode('');
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (num: string) => {
    setError(null);
    if (passcode.length < 8) {
      const next = passcode + num;
      setPasscode(next);
      // If code length matches target passcode length, auto-verify for smooth till experience
      if (next.length === targetPasscode.length && next === targetPasscode) {
        setTimeout(() => {
          onSuccess();
        }, 120);
      }
    }
  };

  const handleBackspace = () => {
    setError(null);
    setPasscode(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
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

          <h3 className="text-lg font-black tracking-tight">Owner Dashboard Security</h3>
          <p className="text-xs text-slate-400 mt-1">
            Enter authorized owner passcode to access administrative reports & settings
          </p>
        </div>

        {/* Input Body */}
        <div className="p-6 space-y-4">
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
                placeholder="Enter Passcode (e.g. 1234)"
                maxLength={8}
                className="w-full text-center text-2xl font-mono font-black tracking-widest py-3 px-10 bg-slate-50 border-2 border-slate-300 focus:border-indigo-600 rounded-2xl focus:outline-none transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                tabIndex={-1}
              >
                {showPasscode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2 animate-shake">
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
                  className="py-3 bg-slate-100 hover:bg-indigo-50 active:bg-indigo-100 text-slate-800 hover:text-indigo-900 font-mono font-bold text-lg rounded-xl transition-all shadow-xs"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all"
              >
                CLEAR
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                className="py-3 bg-slate-100 hover:bg-indigo-50 active:bg-indigo-100 text-slate-800 hover:text-indigo-900 font-mono font-bold text-lg rounded-xl transition-all shadow-xs"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="py-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-bold rounded-xl transition-all"
              >
                ⌫ DEL
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-extrabold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-3"
            >
              <KeyRound className="w-4 h-4" />
              <span>UNLOCK OWNER CONSOLE</span>
            </button>
          </form>

          {/* Demo Hint Banner */}
          <div className="p-2.5 bg-indigo-50/80 border border-indigo-200/60 rounded-xl text-[11px] text-indigo-900 text-center">
            Default owner passcode is <strong className="font-mono font-black">{targetPasscode}</strong>. You can change or remove this inside Shop Settings.
          </div>
        </div>
      </div>
    </div>
  );
};
