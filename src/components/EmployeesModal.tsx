import React, { useState } from 'react';
import { Users, X, UserPlus, ShieldCheck, Key, Check, ToggleLeft, ToggleRight } from 'lucide-react';
import { Employee, Shop } from '../types';
import { storage } from '../services/storage';

interface EmployeesModalProps {
  shop: Shop;
  onClose: () => void;
  onEmployeesUpdated: () => void;
}

export const EmployeesModal: React.FC<EmployeesModalProps> = ({
  shop,
  onClose,
  onEmployeesUpdated
}) => {
  const [employees, setEmployees] = useState<Employee[]>(storage.getEmployees());
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'CASHIER' | 'ADMIN'>('CASHIER');
  const [pin, setPin] = useState('1111');

  const handleToggle = (id: string) => {
    const updated = storage.toggleEmployeeStatus(id);
    setEmployees(updated);
    onEmployeesUpdated();
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !pin.trim()) {
      alert('Please complete all fields.');
      return;
    }

    const colors = ['bg-indigo-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600', 'bg-purple-600'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    storage.addEmployee({
      shopId: shop.id,
      name: name.trim(),
      email: email.trim(),
      role: role,
      pin: pin.trim(),
      active: true,
      avatarColor: randomColor
    });

    setEmployees(storage.getEmployees());
    setShowAddForm(false);
    setName('');
    setEmail('');
    setPin('1111');
    onEmployeesUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Staff & Cashier Till Access</h3>
              <p className="text-xs text-slate-400">Manage cashier till operators and administrator roles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[480px] overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Active Shop Personnel ({employees.length})
            </span>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add New Cashier</span>
            </button>
          </div>

          {/* Add form */}
          {showAddForm && (
            <form onSubmit={handleAddEmployee} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
              <h4 className="font-bold text-slate-900">Add Cashier / Staff Member</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Kelvin Sibanda"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email / Username</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="kelvin@abctuckshop.com"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">System Role</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="CASHIER">CASHIER (Till & Verification Access)</option>
                    <option value="ADMIN">ADMIN (Full Shop Control & Reversals)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">4-Digit Till PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                    placeholder="1234"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-center tracking-widest font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold shadow-xs"
                >
                  Save Employee
                </button>
              </div>
            </form>
          )}

          {/* List */}
          <div className="space-y-2">
            {employees.map(emp => (
              <div
                key={emp.id}
                className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${emp.avatarColor} text-white flex items-center justify-center font-bold text-xs`}>
                    {emp.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{emp.name}</span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          emp.role === 'ADMIN'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {emp.role}
                      </span>
                    </div>
                    <span className="text-slate-500 text-[11px]">{emp.email} | Till PIN: ••••</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggle(emp.id)}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                      emp.active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {emp.active ? 'Active Till Access' : 'Suspended'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
