import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Database, 
  CloudCheck, 
  CloudOff, 
  Copy, 
  Check, 
  RefreshCw, 
  UploadCloud, 
  DownloadCloud, 
  Link2, 
  RotateCcw, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  X,
  Lock
} from 'lucide-react';
import { storage } from '../services/storage';
import { supabaseService } from '../services/supabase';
import { PhonePortalProfile, SupabaseSyncConfig } from '../types';

interface PhonePortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged?: () => void;
}

export const PhonePortalModal: React.FC<PhonePortalModalProps> = ({
  isOpen,
  onClose,
  onDataChanged
}) => {
  const [profile, setProfile] = useState<PhonePortalProfile>(() => storage.getPhonePortalProfile());
  const [syncConfig, setSyncConfig] = useState<SupabaseSyncConfig>(() => supabaseService.getConfig());
  const [autoSync, setAutoSync] = useState(syncConfig.autoSync ?? true);

  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Switch portal state
  const [targetPortalId, setTargetPortalId] = useState('');
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const currentProfile = storage.getPhonePortalProfile();
      const currentConfig = supabaseService.getConfig();
      setProfile(currentProfile);
      setSyncConfig(currentConfig);
      setAutoSync(currentConfig.autoSync ?? true);
      setTestResult(null);
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfigured = supabaseService.isConfigured();

  const handleCopyPortalId = () => {
    navigator.clipboard.writeText(profile.portalId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleAutoSync = (checked: boolean) => {
    setAutoSync(checked);
    const updated = supabaseService.saveConfig({ autoSync: checked });
    setSyncConfig(updated);
    setStatusMessage({
      type: 'info',
      text: checked ? 'Real-time cloud sync enabled.' : 'Real-time cloud sync paused.'
    });
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await supabaseService.testConnection(profile.portalId);
      setTestResult(result);
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || 'Connection test failed.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handlePushAll = async () => {
    setIsPushing(true);
    setStatusMessage({ type: 'info', text: 'Syncing all local data to Supabase...' });
    try {
      const result = await storage.pushCurrentPortalToSupabase();
      if (result.success) {
        setStatusMessage({
          type: 'success',
          text: `Successfully synced ${result.pushedCount} records to Supabase under Portal: ${profile.portalId}`
        });
        setSyncConfig(supabaseService.getConfig());
      } else {
        setStatusMessage({
          type: 'error',
          text: result.error || 'Failed to push data to Supabase.'
        });
      }
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: e?.message || 'Push sync failed.' });
    } finally {
      setIsPushing(false);
    }
  };

  const handlePullAll = async () => {
    setIsPulling(true);
    setStatusMessage({ type: 'info', text: 'Pulling records from Supabase...' });
    try {
      const result = await storage.pullCurrentPortalFromSupabase();
      if (result.success) {
        setStatusMessage({
          type: 'success',
          text: `Pulled ${result.count || 0} cloud records isolated for Portal: ${profile.portalId}!`
        });
        setSyncConfig(supabaseService.getConfig());
        onDataChanged?.();
      } else {
        setStatusMessage({
          type: 'error',
          text: result.error || 'Failed to pull data from Supabase.'
        });
      }
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: e?.message || 'Pull sync failed.' });
    } finally {
      setIsPulling(false);
    }
  };

  const handleSwitchPortal = async () => {
    if (!targetPortalId.trim()) return;
    setStatusMessage({ type: 'info', text: `Switching to portal ${targetPortalId}...` });
    try {
      const res = await storage.switchPortal(targetPortalId.trim());
      setProfile(storage.getPhonePortalProfile());
      setShowSwitchConfirm(false);
      setTargetPortalId('');
      setStatusMessage({ type: 'success', text: res.message });
      onDataChanged?.();
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: e?.message || 'Failed to switch portal.' });
    }
  };

  const handleCreateNewPortal = () => {
    if (confirm('Create a brand new private portal for this phone? This will give this phone a fresh Portal ID and a clean till.')) {
      const newProf = storage.resetToNewPortal();
      setProfile(newProf);
      setStatusMessage({ type: 'success', text: `Created new isolated Portal: ${newProf.portalId}` });
      onDataChanged?.();
    }
  };

  const handleLoadDemoData = () => {
    if (confirm('Load sample change slips and transactions for this phone? Useful for testing the till features.')) {
      storage.loadDemoDataForThisPortal();
      setStatusMessage({ type: 'success', text: `Sample data loaded for ${profile.portalId}!` });
      onDataChanged?.();
    }
  };

  return (
    <div className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative surface-card w-full max-w-2xl rounded-2xl shadow-2xl border border-ink-200 overflow-hidden my-6 rise-in">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-ink-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-brand-500/20 text-brand-400 rounded-xl border border-brand-500/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Phone Portal & Cloud Sync</h2>
              <p className="text-xs text-ink-400">
                Each phone gets its own portal ID so data is strictly isolated in Supabase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-ink-400 hover:text-white rounded-xl hover:bg-ink-800 transition-all duration-200"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Status Alert Banner */}
          {statusMessage && (
            <div className={`p-3 rounded-xl border text-sm flex items-start space-x-2.5 ${
              statusMessage.type === 'success' 
                ? 'bg-brand-50 border-brand-200 text-brand-800' 
                : statusMessage.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-ink-100 border-ink-200 text-ink-700'
            }`}>
              {statusMessage.type === 'success' ? (
                <ShieldCheck className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <RefreshCw className="w-5 h-5 text-ink-600 shrink-0 mt-0.5 animate-spin" />
              )}
              <div className="flex-1 font-medium">{statusMessage.text}</div>
            </div>
          )}

          {/* 1. Phone Portal Identity Card */}
          <div className="p-4 rounded-xl bg-ink-50 border border-ink-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-brand-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wide text-ink-600">This Phone's Dedicated Portal</span>
              </div>
              <span className="text-xs bg-brand-100 text-brand-800 font-semibold px-2 py-0.5 rounded-lg uppercase tracking-wide">
                Isolated Partition
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-ink-200">
              <div>
                <div className="text-xs text-ink-500 font-medium">Portal ID (Your Supabase Partition Key)</div>
                <div className="text-lg font-bold font-mono text-ink-900 tracking-wide select-all">
                  {profile.portalId}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyPortalId}
                className="flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-ink-100 hover:bg-ink-200 text-ink-700 text-xs font-semibold rounded-xl border border-ink-200 transition-all duration-200 tap-scale"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-brand-600" />
                    <span className="text-brand-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-ink-500" />
                    <span>Copy Portal ID</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-ink-600 leading-relaxed">
              Every phone with ChangeTrack installed receives a unique Portal ID. All change records, customer balances, and sales data enter Supabase strictly tagged with <code className="font-mono font-semibold text-ink-800 bg-ink-200 px-1 py-0.5 rounded">{profile.portalId}</code>. No other phone can see or overwrite your data.
            </p>
          </div>

          {/* 2. Supabase Cloud Database Status (Zero Secrets in UI) */}
          <div className="border border-ink-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-brand-600" />
                <h3 className="text-sm font-bold text-ink-900">Cloud Database Sync (Supabase)</h3>
              </div>
              {isConfigured ? (
                <span className="flex items-center space-x-1 text-xs text-brand-700 font-semibold bg-brand-50 px-2.5 py-0.5 rounded-lg border border-brand-200">
                  <CloudCheck className="w-3.5 h-3.5" />
                  <span>Cloud Active</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-xs text-ink-600 font-semibold bg-ink-100 px-2.5 py-0.5 rounded-lg border border-ink-200">
                  <CloudOff className="w-3.5 h-3.5" />
                  <span>Local-First (Offline)</span>
                </span>
              )}
            </div>

            {/* Security notice card - no secrets shown */}
            <div className="p-3.5 bg-ink-50 rounded-xl border border-ink-200 space-y-2">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-ink-600 shrink-0" />
                <span className="text-xs font-bold text-ink-800">
                  {isConfigured ? 'Secured via Environment Configuration' : 'Local Storage Mode'}
                </span>
              </div>
              <p className="text-xs text-ink-600 leading-relaxed">
                {isConfigured ? (
                  <>Database credentials are loaded securely from environment variables. Secrets and API keys are never displayed or stored in client UI fields.</>
                ) : (
                  <>The app is currently using offline-first local persistence. To connect to Supabase, provide <code className="font-mono font-semibold text-ink-800 bg-ink-200 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> and <code className="font-mono font-semibold text-ink-800 bg-ink-200 px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code> in your environment settings.</>
                )}
              </p>
            </div>

            {/* Auto Sync Toggle */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-xs font-semibold text-ink-800">Auto-push in real-time</span>
                <p className="text-[11px] text-ink-500">Every change slip created or collected syncs to Supabase instantly</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => handleToggleAutoSync(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-ink-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-ink-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
              </label>
            </div>

            {/* Test Connection Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold rounded-xl border border-brand-200 transition-all duration-200 tap-scale disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Testing Cloud Connection...' : 'Test Cloud Connection'}</span>
              </button>
            </div>

            {/* Test Result Message */}
            {testResult && (
              <div className={`p-3 rounded-xl text-xs font-medium border ${
                testResult.success 
                  ? 'bg-brand-50 border-brand-200 text-brand-800' 
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {testResult.message}
              </div>
            )}

            {/* Cloud Sync Actions */}
            <div className="border-t border-ink-200 pt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handlePushAll}
                disabled={isPushing || !isConfigured}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all duration-200 tap-scale disabled:opacity-50"
              >
                <UploadCloud className={`w-4 h-4 ${isPushing ? 'animate-bounce' : ''}`} />
                <span>{isPushing ? 'Pushing Data...' : 'Push All to Cloud'}</span>
              </button>

              <button
                type="button"
                onClick={handlePullAll}
                disabled={isPulling || !isConfigured}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-ink-100 text-ink-800 text-xs font-semibold rounded-xl border border-ink-200 transition-all duration-200 tap-scale disabled:opacity-50"
              >
                <DownloadCloud className={`w-4 h-4 ${isPulling ? 'animate-bounce' : ''}`} />
                <span>{isPulling ? 'Pulling Data...' : 'Pull from Cloud'}</span>
              </button>
            </div>
          </div>

          {/* 3. Multi-Phone Till Pairing (Connect 2 phones to the same store) */}
          <div className="border border-ink-200 rounded-xl p-4 space-y-3 bg-ink-50/50">
            <div className="flex items-center space-x-2">
              <Link2 className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-bold text-ink-900">Multi-Phone Till Pairing (Optional)</h3>
            </div>
            <p className="text-xs text-ink-600">
              Want two phones in the same shop to share the same change records? Enter the Portal ID from Phone #1 below to link this phone to that till.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={targetPortalId}
                onChange={(e) => setTargetPortalId(e.target.value)}
                placeholder="e.g. portal_9k2a4x"
                className="flex-1 px-3 py-1.5 text-xs font-mono bg-white border border-ink-200 rounded-xl focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 outline-hidden transition-all"
              />
              <button
                type="button"
                onClick={() => setShowSwitchConfirm(true)}
                disabled={!targetPortalId.trim()}
                className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl transition-all duration-200 tap-scale disabled:opacity-50"
              >
                Connect Till
              </button>
            </div>

            {showSwitchConfirm && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-2">
                <p className="font-semibold text-amber-900">
                  Switch active portal to <span className="font-mono">{targetPortalId}</span>?
                </p>
                <p className="text-amber-800">
                  This phone will join that store till and sync data with that portal.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSwitchPortal}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-all duration-200 tap-scale"
                  >
                    Confirm Switch
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSwitchConfirm(false)}
                    className="px-3 py-1 bg-ink-100 hover:bg-ink-200 text-ink-700 rounded-lg font-medium transition-all duration-200 tap-scale"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. Reset or Demo Tools */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-ink-200">
            <button
              type="button"
              onClick={handleCreateNewPortal}
              className="flex items-center space-x-1.5 text-ink-600 hover:text-ink-900 py-1 font-medium transition-all duration-200"
            >
              <RotateCcw className="w-3.5 h-3.5 text-ink-500" />
              <span>Generate Fresh Private Portal</span>
            </button>

            <button
              type="button"
              onClick={handleLoadDemoData}
              className="flex items-center space-x-1.5 text-brand-600 hover:text-brand-800 py-1 font-semibold transition-all duration-200"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Sample Test Records</span>
            </button>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-ink-50 border-t border-ink-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-ink-900 hover:bg-ink-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all duration-200 tap-scale"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
