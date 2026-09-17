import React, { useState } from 'react';
import { 
  Users, 
  X, 
  UserPlus, 
  ShieldCheck, 
  Key, 
  Check, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Search,
  UserCheck,
  UserX,
  Lock,
  RefreshCw
} from 'lucide-react';
import { Employee, Shop } from '../types';
import { storage } from '../services/storage';

interface EmployeesModalProps {
  shop: Shop;
  currentEmployee?: Employee;
  onClose: () => void;
  onEmployeesUpdated: (deletedEmployeeId?: string) => void;
}

export const EmployeesModal: React.FC<EmployeesModalProps> = ({
  shop,
  currentEmployee,
  onClose,
  onEmployeesUpdated
}) => {
  const [employees, setEmployees] = useState<Employee[]>(() => storage.getEmployees());
  const [searchTerm, setSearchTerm] = useState('');
  
  // Forms & state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New employee form state
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState<'CASHIER' | 'ADMIN'>('CASHIER');
  const [addPin, setAddPin] = useState('1111');
  const [showAddPin, setShowAddPin] = useState(false);

  // Edit employee form state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'CASHIER' | 'ADMIN'>('CASHIER');
  const [editPin, setEditPin] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [showEditPin, setShowEditPin] = useState(false);

  // PIN reveal state for the list items
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});

  const togglePinReveal = (id: string) => {
    setRevealedPins(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const clearNotifications = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleStartEdit = (emp: Employee) => {
    clearNotifications();
    setShowAddForm(false);
    setDeletingEmployee(null);
    setEditingEmployeeId(emp.id);
    setEditName(emp.name);
    setEditEmail(emp.email);
    setEditRole(emp.role);
    setEditPin(emp.pin);
    setEditActive(emp.active);
    setShowEditPin(false);
  };

  const handleCancelEdit = () => {
    setEditingEmployeeId(null);
    clearNotifications();
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    clearNotifications();

    if (!editingEmployeeId) return;

    if (!editName.trim() || !editEmail.trim() || !editPin.trim()) {
      setErrorMessage('Full name, email and PIN are required.');
      return;
    }

    if (editPin.trim().length < 4) {
      setErrorMessage('Till PIN must be at least 4 digits.');
      return;
    }

    const result = storage.updateEmployee(
      editingEmployeeId,
      {
        name: editName.trim(),
        email: editEmail.trim(),
        role: editRole,
        pin: editPin.trim(),
        active: editActive
      },
      currentEmployee
    );

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to update employee.');
      return;
    }

    const updated = storage.getEmployees();
    setEmployees(updated);
    setEditingEmployeeId(null);
    setSuccessMessage(
      editRole === 'ADMIN'
        ? `Administrator profile and store owner name updated to "${editName.trim()}".`
        : `Employee ${editName.trim()} was successfully updated.`
    );
    onEmployeesUpdated();
  };

  const handleConfirmDelete = () => {
    clearNotifications();
    if (!deletingEmployee) return;

    const result = storage.deleteEmployee(deletingEmployee.id, currentEmployee);

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to delete employee.');
      setDeletingEmployee(null);
      return;
    }

    const deletedId = deletingEmployee.id;
    const deletedName = deletingEmployee.name;
    const updated = storage.getEmployees();
    setEmployees(updated);
    setDeletingEmployee(null);
    setSuccessMessage(`Cashier/Operator ${deletedName} was deleted from till system.`);
    onEmployeesUpdated(deletedId);
  };

  const handleToggleActive = (emp: Employee) => {
    clearNotifications();
    const updated = storage.toggleEmployeeStatus(emp.id, currentEmployee);
    setEmployees(updated);
    onEmployeesUpdated();
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    clearNotifications();

    if (!addName.trim() || !addEmail.trim() || !addPin.trim()) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    if (addPin.trim().length < 4) {
      setErrorMessage('Till PIN must be at least 4 digits.');
      return;
    }

    const colors = [
      'bg-indigo-600', 
      'bg-emerald-600', 
      'bg-amber-600', 
      'bg-rose-600', 
      'bg-purple-600', 
      'bg-cyan-600', 
      'bg-blue-600'
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    storage.addEmployee({
      shopId: shop.id,
      name: addName.trim(),
      email: addEmail.trim(),
      role: addRole,
      pin: addPin.trim(),
      active: true,
      avatarColor: randomColor
    }, currentEmployee);

    setEmployees(storage.getEmployees());
    setShowAddForm(false);
    setAddName('');
    setAddEmail('');
    setAddPin('1111');
    setSuccessMessage(`New till operator ${addName.trim()} created.`);
    onEmployeesUpdated();
  };

  const filteredEmployees = employees.filter(emp => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      emp.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden my-6 border border-slate-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">Manage Cashiers & Till Operators</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Owner Console
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Add, edit permissions, change PINs, or revoke cashier till access
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts / Feedback */}
        {errorMessage && (
          <div className="px-6 py-3 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button 
              onClick={() => setErrorMessage(null)} 
              className="text-rose-600 hover:text-rose-900 font-bold px-1"
            >
              &times;
            </button>
          </div>
        )}

        {successMessage && (
          <div className="px-6 py-3 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button 
              onClick={() => setSuccessMessage(null)} 
              className="text-emerald-600 hover:text-emerald-900 font-bold px-1"
            >
              &times;
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
          
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search cashiers by name, email, or role..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            
            <button
              onClick={() => {
                clearNotifications();
                setEditingEmployeeId(null);
                setDeletingEmployee(null);
                setShowAddForm(!showAddForm);
              }}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>{showAddForm ? 'Close Add Form' : 'Add New Cashier'}</span>
            </button>
          </div>

          {/* ADD EMPLOYEE FORM */}
          {showAddForm && (
            <form onSubmit={handleAddEmployee} className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-2xl space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-indigo-600" />
                  <span>Create New Cashier / Till Operator</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={addName}
                    onChange={e => setAddName(e.target.value)}
                    placeholder="e.g. Kelvin Sibanda"
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email / Till Username</label>
                  <input
                    type="email"
                    required
                    value={addEmail}
                    onChange={e => setAddEmail(e.target.value)}
                    placeholder="kelvin@abctuckshop.co.zw"
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role & Permissions</label>
                  <select
                    value={addRole}
                    onChange={e => setAddRole(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="CASHIER">CASHIER (Till Access, Record & Verify Change)</option>
                    <option value="ADMIN">ADMIN (Full Console Control, Reversals, Settings)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>4-Digit Till Access PIN</span>
                    <button
                      type="button"
                      onClick={() => setShowAddPin(!showAddPin)}
                      className="text-[10px] text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      {showAddPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showAddPin ? 'Hide' : 'Show'}</span>
                    </button>
                  </label>
                  <input
                    type={showAddPin ? "text" : "password"}
                    maxLength={6}
                    required
                    value={addPin}
                    onChange={e => setAddPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="1234"
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono text-center tracking-widest font-bold text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-indigo-100">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-200 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors shadow-xs"
                >
                  Save Till Operator
                </button>
              </div>
            </form>
          )}

          {/* DELETE CONFIRMATION CARD / DIALOG */}
          {deletingEmployee && (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl space-y-3 text-xs animate-in fade-in duration-150">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-rose-100 text-rose-700 rounded-xl shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-rose-950 text-sm">
                    Confirm Deletion of {deletingEmployee.name}?
                  </h4>
                  <p className="text-rose-800 mt-1 leading-relaxed">
                    This operator ({deletingEmployee.role}, {deletingEmployee.email}) will be removed from till access immediately.
                    <span className="font-bold block mt-1">
                      Historical till receipts, change slips, and audit logs logged under this cashier are permanent and will not be erased.
                    </span>
                  </p>
                  {deletingEmployee.id === currentEmployee?.id && (
                    <div className="mt-2 p-2 bg-amber-100/80 border border-amber-300 rounded-lg text-amber-900 font-semibold text-[11px]">
                      Notice: You are currently active as this operator in the console session. Deleting will switch you to another admin account.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-rose-200">
                <button
                  type="button"
                  onClick={() => setDeletingEmployee(null)}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                >
                  Keep Operator
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Operator</span>
                </button>
              </div>
            </div>
          )}

          {/* EDIT EMPLOYEE FORM */}
          {editingEmployeeId && (
            <form onSubmit={handleSaveEdit} className="p-4 bg-slate-50 border-2 border-indigo-300 rounded-2xl space-y-3 text-xs shadow-xs animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-indigo-600" />
                  <span>Edit Cashier / Till Operator Details</span>
                </h4>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {editRole === 'ADMIN' ? 'Administrator / Store Owner Name' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    placeholder={editRole === 'ADMIN' ? 'e.g. Tariro Moyo' : 'e.g. Tendai Chikore'}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email / Till Username</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role</label>
                  <select
                    value={editRole}
                    onChange={e => setEditRole(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="CASHIER">CASHIER (Till Operator)</option>
                    <option value="ADMIN">ADMIN (Full Console Access)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Till PIN</span>
                    <button
                      type="button"
                      onClick={() => setShowEditPin(!showEditPin)}
                      className="text-[10px] text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      {showEditPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showEditPin ? 'Hide' : 'Show'}</span>
                    </button>
                  </label>
                  <input
                    type={showEditPin ? "text" : "password"}
                    maxLength={6}
                    required
                    value={editPin}
                    onChange={e => setEditPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono text-center tracking-widest font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={editActive ? 'ACTIVE' : 'SUSPENDED'}
                    onChange={e => setEditActive(e.target.value === 'ACTIVE')}
                    className={`w-full p-2 border rounded-xl text-xs font-bold ${
                      editActive 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                        : 'bg-rose-50 text-rose-800 border-rose-300'
                    }`}
                  >
                    <option value="ACTIVE">🟢 Active Access</option>
                    <option value="SUSPENDED">🔴 Suspended Access</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-200 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}

          {/* STAFF & CASHIER LIST */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider px-1">
              <span>Till Personnel ({filteredEmployees.length})</span>
              <span className="text-[11px] lowercase font-normal">Audit-tracked actions</span>
            </div>

            {filteredEmployees.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
                No cashiers or operators match your search filter.
              </div>
            ) : (
              filteredEmployees.map(emp => {
                const isCurrent = emp.id === currentEmployee?.id;
                const isEditing = emp.id === editingEmployeeId;
                const isRevealed = !!revealedPins[emp.id];

                return (
                  <div
                    key={emp.id}
                    className={`p-3.5 bg-white border rounded-2xl transition-all shadow-2xs ${
                      isEditing
                        ? 'border-indigo-500 ring-2 ring-indigo-100 bg-indigo-50/20'
                        : emp.active
                        ? 'border-slate-200 hover:border-slate-300'
                        : 'border-rose-200 bg-rose-50/30'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Avatar + Details */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-2xl ${emp.avatarColor || 'bg-slate-700'} text-white flex items-center justify-center font-black text-sm shrink-0 shadow-2xs`}>
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm truncate">{emp.name}</span>
                            <span
                              className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                                emp.role === 'ADMIN'
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {emp.role}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-900 text-white">
                                You
                              </span>
                            )}
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                emp.active
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {emp.active ? 'Active' : 'Suspended'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 text-slate-500 text-xs mt-1 flex-wrap">
                            <span className="truncate">{emp.email}</span>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1 font-mono text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                              <Key className="w-3 h-3 text-slate-400" />
                              <span>PIN: {isRevealed ? emp.pin : '••••'}</span>
                              <button
                                type="button"
                                onClick={() => togglePinReveal(emp.id)}
                                title={isRevealed ? 'Hide PIN' : 'Reveal PIN'}
                                className="text-slate-400 hover:text-slate-700 ml-1"
                              >
                                {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Action Buttons */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleStartEdit(emp)}
                          title="Edit operator name, role, PIN or permissions"
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 rounded-xl text-xs font-bold transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        {/* Toggle Active / Suspended Button */}
                        <button
                          onClick={() => handleToggleActive(emp)}
                          title={emp.active ? 'Suspend till access' : 'Activate till access'}
                          className={`px-2.5 py-1.5 rounded-xl font-bold text-xs border transition-colors ${
                            emp.active
                              ? 'bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-800 border-slate-200 hover:border-amber-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {emp.active ? 'Suspend' : 'Activate'}
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => {
                            clearNotifications();
                            setEditingEmployeeId(null);
                            setShowAddForm(false);
                            setDeletingEmployee(emp);
                          }}
                          title="Delete operator from shop"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Changes are recorded in the owner audit log</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
