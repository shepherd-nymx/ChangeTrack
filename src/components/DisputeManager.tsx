import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  User, 
  Phone, 
  ArrowRight,
  MessageSquare,
  ShieldCheck,
  Calendar,
  History,
  Lock
} from 'lucide-react';
import { Dispute, Employee, Shop, AuditLog, Transaction, ChangeRecord } from '../types';
import { storage } from '../services/storage';
import { formatDateTime } from '../services/whatsapp';

interface DisputeManagerProps {
  currentEmployee: Employee;
  shop: Shop;
  onRefresh: () => void;
}

export const DisputeManager: React.FC<DisputeManagerProps> = ({
  currentEmployee,
  shop,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedId, setSearchedId] = useState<string | null>('TX-10293');
  const [showNewDisputeModal, setShowNewDisputeModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState<Dispute | null>(null);

  // New dispute form state
  const [newTxId, setNewTxId] = useState('');
  const [newChangeId, setNewChangeId] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newClaimAmount, setNewClaimAmount] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Resolve form
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionStatus, setResolutionStatus] = useState<'RESOLVED' | 'REJECTED'>('RESOLVED');

  const disputes = storage.getDisputes();
  const allLogs = storage.getAuditLogs();
  const allTransactions = storage.getTransactions();
  const allRecords = storage.getChangeRecords();
  const currency = shop.currencySymbol || '$';

  // Find relevant logs for the searched query (TX ID, Change ID, or Phone)
  const auditTrail = React.useMemo(() => {
    if (!searchedId) return [];
    const clean = searchedId.trim().toUpperCase();

    // Check if query matches transaction, change record, or dispute
    return allLogs.filter(log => {
      const matchEntity = log.entityId.toUpperCase().includes(clean);
      const matchDetails = log.details.toUpperCase().includes(clean);
      return matchEntity || matchDetails;
    });
  }, [searchedId, allLogs]);

  // Match corresponding transaction and change record
  const matchingTx = React.useMemo(() => {
    if (!searchedId) return null;
    const clean = searchedId.trim().toUpperCase();
    return allTransactions.find(t => 
      t.id.toUpperCase() === clean || 
      t.changeRecordId?.toUpperCase() === clean ||
      (t.customerPhone && t.customerPhone.includes(clean))
    ) || null;
  }, [searchedId, allTransactions]);

  const matchingRecord = React.useMemo(() => {
    if (!searchedId) return null;
    const clean = searchedId.trim().toUpperCase();
    return allRecords.find(r => 
      r.id.toUpperCase() === clean || 
      r.transactionId.toUpperCase() === clean ||
      r.customerPhone.includes(clean)
    ) || null;
  }, [searchedId, allRecords]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchedId(searchQuery.trim());
    }
  };

  const handleCreateDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTxId || !newCustomerPhone || !newClaimAmount) {
      alert('Please fill in Transaction ID, Customer Phone, and Claim Amount.');
      return;
    }

    storage.createDispute({
      transactionId: newTxId.trim().toUpperCase(),
      changeId: newChangeId.trim().toUpperCase() || undefined,
      customerPhone: newCustomerPhone.trim(),
      customerName: newCustomerName.trim() || undefined,
      claimedAmount: parseFloat(newClaimAmount) || 0,
      description: newDescription.trim() || 'Customer claims change was not dispensed or not recorded accurately.',
      employee: currentEmployee
    });

    setShowNewDisputeModal(false);
    setNewTxId('');
    setNewChangeId('');
    setNewCustomerPhone('');
    setNewCustomerName('');
    setNewClaimAmount('');
    setNewDescription('');
    onRefresh();
    alert('Dispute logged successfully. Complete audit trail is available for review.');
  };

  const handleResolveDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showResolveModal || !resolutionNotes.trim()) {
      alert('Please provide resolution notes explaining the decision.');
      return;
    }

    storage.resolveDispute(showResolveModal.id, currentEmployee, resolutionNotes.trim(), resolutionStatus);
    setShowResolveModal(null);
    setResolutionNotes('');
    onRefresh();
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5 sm:space-y-6">
      {/* Header Banner */}
      <div className="surface-card p-4 sm:p-6 rounded-2xl border border-ink-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 sm:p-3 bg-amber-500/10 text-amber-700 rounded-xl border border-amber-200 shrink-0">
            <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-ink-900">Anti-Dispute Investigation Center</h2>
              <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-lg bg-ink-100 border border-ink-200 text-ink-600 font-mono uppercase tracking-wide">
                TAMPER-RESISTANT
              </span>
            </div>
            <p className="text-xs text-ink-600">
              Instant digital audit trail verification to resolve customer claims with verifiable evidence.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowNewDisputeModal(true)}
            className="w-full sm:w-auto px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all duration-200 tap-scale shadow-xs flex items-center justify-center gap-2 min-h-[44px]"
          >
            <AlertTriangle className="w-4 h-4 text-amber-300" />
            <span>Log Customer Claim</span>
          </button>
        </div>
      </div>

      {/* Quick Search For Transaction Evidence */}
      <div className="surface-card p-4 sm:p-6 rounded-2xl border border-ink-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-ink-800 flex items-center gap-2">
            <Search className="w-4 h-4 text-brand-600" />
            <span>Search Transaction Audit Trail</span>
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-ink-500 flex-wrap">
            <span>Quick Case Samples:</span>
            {['TX-10293', 'CT-48291', 'CT-39104', 'TX-10288'].map(id => (
              <button
                key={id}
                onClick={() => {
                  setSearchQuery(id);
                  setSearchedId(id);
                }}
                className="px-2 py-0.5 font-mono text-[11px] font-bold bg-ink-100 hover:bg-brand-50 hover:text-brand-700 border border-ink-200 rounded-lg transition-all duration-200 tap-scale"
              >
                {id}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Enter Transaction ID (TX-10293), Change ID (CT-48291), or Customer Phone (+263771234567)..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-ink-200 rounded-xl text-xs font-semibold text-ink-900 placeholder-ink-400 focus:bg-white focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 focus:outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all duration-200 tap-scale shadow-xs"
          >
            Investigate
          </button>
        </form>

        {/* Evidence Findings Card */}
        {searchedId && (
          <div className="mt-4 pt-4 border-t border-ink-100 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-ink-700 uppercase tracking-wide">
                Investigation Results for: <strong className="font-mono text-brand-700">{searchedId}</strong>
              </span>
              <div className="flex items-center gap-2">
                {matchingRecord && (
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg uppercase tracking-wide ${
                      matchingRecord.status === 'OUTSTANDING'
                        ? 'bg-amber-100 text-amber-800'
                        : matchingRecord.status === 'COLLECTED'
                        ? 'bg-brand-100 text-brand-800'
                        : 'bg-ink-100 border border-ink-200 text-ink-600'
                    }`}
                  >
                    Status: {matchingRecord.status}
                  </span>
                )}
              </div>
            </div>

            {/* Quick summary strip */}
            {(matchingTx || matchingRecord) && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-ink-50 p-3.5 rounded-xl border border-ink-200 text-xs">
                <div>
                  <span className="text-ink-400 block text-[10px] uppercase">Transaction ID</span>
                  <span className="font-mono font-bold text-ink-800">{matchingTx?.id || matchingRecord?.transactionId || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-ink-400 block text-[10px] uppercase">Customer</span>
                  <span className="font-semibold text-ink-800">{matchingRecord?.customerName || matchingTx?.customerName || 'Customer'}</span>
                  <span className="text-[10px] text-ink-500 block">{matchingRecord?.customerPhone || matchingTx?.customerPhone}</span>
                </div>
                <div>
                  <span className="text-ink-400 block text-[10px] uppercase">Change Amount</span>
                  <span className="font-mono-num font-black text-ink-900 text-sm">
                    {currency}{(matchingRecord?.amountOwed || matchingTx?.changeOwed || 0).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-ink-400 block text-[10px] uppercase">Cashier Operator</span>
                  <span className="font-semibold text-ink-800">{matchingRecord?.cashierName || matchingTx?.cashierName}</span>
                </div>
              </div>
            )}

            {/* Complete Chronological Audit Trail (As requested in prompt) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-ink-800 uppercase tracking-wide flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-ink-500" />
                <span>Chronological Digital Audit Trail</span>
              </h4>

              {auditTrail.length > 0 ? (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-ink-200">
                  {auditTrail.map((log, index) => {
                    const d = new Date(log.timestamp);
                    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                    const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

                    const isCreated = log.action === 'TRANSACTION_CREATED' || log.action === 'CHANGE_RECORDED';
                    const isWa = log.action === 'WHATSAPP_SENT';
                    const isCollected = log.action === 'CHANGE_COLLECTED';
                    const isDispute = log.action === 'DISPUTE_OPENED' || log.action === 'DISPUTE_RESOLVED';

                    return (
                      <div key={log.id} className="relative group">
                        {/* Dot indicator */}
                        <div
                          className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-white shadow-xs ${
                            isCollected
                              ? 'bg-brand-500 ring-2 ring-brand-200'
                              : isWa
                              ? 'bg-brand-600 ring-2 ring-brand-200'
                              : isDispute
                              ? 'bg-amber-500 ring-2 ring-amber-200'
                              : 'bg-ink-600 ring-2 ring-ink-200'
                          }`}
                        />

                        <div className="bg-white p-3.5 rounded-xl border border-ink-200 shadow-xs space-y-1 rise-in">
                          <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-ink-900">{timeStr}</span>
                              <span className="text-[11px] text-ink-400">({dateStr})</span>
                              <span className="font-semibold text-ink-700">— {log.action.replace('_', ' ')}</span>
                            </div>
                            <span className="text-[10px] font-mono text-ink-500 bg-ink-100 px-1.5 py-0.5 rounded-lg">
                              Actor: {log.actorName} ({log.actorRole})
                            </span>
                          </div>
                          <p className="text-xs text-ink-600 font-sans leading-relaxed">
                            {log.details}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 bg-ink-50 border border-ink-200 rounded-xl text-center text-xs text-ink-500">
                  No audit logs specifically matched "{searchedId}". Try checking the general audit trail tab in the Admin Dashboard.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Active Customer Disputes Table */}
      <div className="surface-card p-6 rounded-2xl border border-ink-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-ink-900">Recorded Customer Inquiries & Disputes</h3>
          </div>
          <span className="text-xs text-ink-500">{disputes.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-ink-700">
            <thead className="bg-ink-50 text-ink-500 font-bold uppercase tracking-wide text-[10px] border-b border-ink-200">
              <tr>
                <th className="py-2.5 px-3">Dispute ID</th>
                <th className="py-2.5 px-3">Transaction / Change ID</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Claim Amount</th>
                <th className="py-2.5 px-3">Opened</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {disputes.map(disp => (
                <tr key={disp.id} className="hover:bg-ink-50/80 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-ink-900">{disp.id}</td>
                  <td className="py-3 px-3">
                    <div className="font-mono font-semibold text-ink-800">{disp.transactionId}</div>
                    {disp.changeId && <div className="text-[10px] font-mono text-ink-400">{disp.changeId}</div>}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-ink-800">{disp.customerName || 'Customer'}</div>
                    <div className="text-[10px] text-ink-500">{disp.customerPhone}</div>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-ink-900 font-mono-num">
                    {currency}{disp.claimedAmount.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-ink-500">
                    {new Date(disp.openedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wide ${
                        disp.status === 'OPEN'
                          ? 'bg-amber-100 text-amber-800'
                          : disp.status === 'INVESTIGATING'
                          ? 'bg-ink-100 border border-ink-200 text-ink-600'
                          : disp.status === 'RESOLVED'
                          ? 'bg-brand-100 text-brand-800'
                          : 'bg-ink-100 border border-ink-200 text-ink-600'
                      }`}
                    >
                      {disp.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right space-x-2">
                    <button
                      onClick={() => {
                        setSearchQuery(disp.transactionId);
                        setSearchedId(disp.transactionId);
                      }}
                      className="px-2 py-1 text-xs text-brand-600 hover:text-brand-800 font-semibold hover:underline transition-all duration-200"
                    >
                      View Trail
                    </button>
                    {disp.status !== 'RESOLVED' && (
                      <button
                        onClick={() => setShowResolveModal(disp)}
                        className="px-2.5 py-1 text-xs bg-ink-900 hover:bg-ink-800 text-white rounded-lg font-semibold transition-all duration-200 tap-scale"
                      >
                        Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Log New Customer Claim */}
      {showNewDisputeModal && (
        <div className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="surface-card w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 rise-in">
            <div className="flex items-center justify-between pb-3 border-b border-ink-100">
              <h3 className="font-extrabold tracking-tight text-ink-900 text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Log Customer Claim</span>
              </h3>
              <button
                onClick={() => setShowNewDisputeModal(false)}
                className="p-1.5 rounded-xl text-ink-400 hover:text-ink-600 hover:bg-ink-100 font-bold transition-all duration-200"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateDispute} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-ink-700 mb-1">Transaction ID (from till receipt)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TX-10293"
                  value={newTxId}
                  onChange={e => setNewTxId(e.target.value)}
                  className="w-full p-2.5 bg-white border border-ink-200 rounded-xl font-mono uppercase focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all min-h-[44px]"
                />
              </div>

              <div>
                <label className="block font-bold text-ink-700 mb-1">Change ID (Optional if known)</label>
                <input
                  type="text"
                  placeholder="e.g. CT-48291"
                  value={newChangeId}
                  onChange={e => setNewChangeId(e.target.value)}
                  className="w-full p-2.5 bg-white border border-ink-200 rounded-xl font-mono uppercase focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-ink-700 mb-1">Customer Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="+263 77..."
                    value={newCustomerPhone}
                    onChange={e => setNewCustomerPhone(e.target.value)}
                    className="w-full p-2.5 bg-white border border-ink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-ink-700 mb-1">Claimed Amount ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="2.50"
                    value={newClaimAmount}
                    onChange={e => setNewClaimAmount(e.target.value)}
                    className="w-full p-2.5 bg-white border border-ink-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-ink-700 mb-1">Customer Name (Optional)</label>
                <input
                  type="text"
                  placeholder="Customer name"
                  value={newCustomerName}
                  onChange={e => setNewCustomerName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-ink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all min-h-[44px]"
                />
              </div>

              <div>
                <label className="block font-bold text-ink-700 mb-1">Claim Description</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="e.g. Customer states change was not returned during lunch rush..."
                  className="w-full p-2.5 bg-white border border-ink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewDisputeModal(false)}
                  className="px-4 py-2 text-ink-600 hover:bg-ink-100 rounded-xl font-semibold transition-all duration-200 tap-scale"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-xs transition-all duration-200 tap-scale"
                >
                  Save Dispute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Resolve Dispute */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="surface-card w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 rise-in">
            <div className="flex items-center justify-between pb-3 border-b border-ink-100">
              <h3 className="font-extrabold tracking-tight text-ink-900 text-base">
                Resolve Inquiry {showResolveModal.id}
              </h3>
              <button onClick={() => setShowResolveModal(null)} className="p-1.5 rounded-xl text-ink-400 hover:text-ink-600 hover:bg-ink-100 font-bold transition-all duration-200">×</button>
            </div>

            <form onSubmit={handleResolveDispute} className="space-y-3 text-xs">
              <div className="p-3 bg-ink-50 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span className="text-ink-500">Transaction:</span>
                  <span className="font-mono font-bold">{showResolveModal.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500">Claim Amount:</span>
                  <span className="font-bold font-mono-num">{currency}{showResolveModal.claimedAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500">Customer:</span>
                  <span>{showResolveModal.customerPhone}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-ink-700 mb-1">Decision</label>
                <select
                  value={resolutionStatus}
                  onChange={e => setResolutionStatus(e.target.value as any)}
                  className="w-full p-2.5 bg-white border border-ink-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all min-h-[44px]"
                >
                  <option value="RESOLVED">RESOLVED (Audit verified, change confirmed / handed over)</option>
                  <option value="REJECTED">REJECTED (Audit proves change was already collected earlier)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-ink-700 mb-1">Resolution Notes (Recorded in audit trail)</label>
                <textarea
                  required
                  rows={3}
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  placeholder="Explain how dispute was resolved with the customer based on the audit timeline..."
                  className="w-full p-2.5 bg-white border border-ink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(null)}
                  className="px-4 py-2 text-ink-600 hover:bg-ink-100 rounded-xl font-semibold transition-all duration-200 tap-scale"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-xs transition-all duration-200 tap-scale"
                >
                  Confirm Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
