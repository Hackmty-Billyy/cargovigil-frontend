import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { BankAccount, CreateBankAccountPayload } from '../../types/treasury';
import {
  Landmark,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  X,
  Building,
} from 'lucide-react';

interface BankAccountsManagerProps {
  accounts: BankAccount[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const BankAccountsManager: React.FC<BankAccountsManagerProps> = ({
  accounts,
  isLoading,
  onRefresh,
}) => {
  const { accessToken } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [bankName, setBankName] = useState('');
  const [accountMask, setAccountMask] = useState('');
  const [currency, setCurrency] = useState<'MXN' | 'USD'>('MXN');
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [minBalance, setMinBalance] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);

  const formatCurrency = (val: number, curr: 'MXN' | 'USD' = 'MXN') =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: curr,
      maximumFractionDigits: 2,
    }).format(val);

  const handleOpenCreate = () => {
    setEditingAccount(null);
    setBankName('');
    setAccountMask('');
    setCurrency('MXN');
    setCurrentBalance(0);
    setMinBalance(0);
    setIsActive(true);
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleOpenEdit = (acc: BankAccount) => {
    setEditingAccount(acc);
    setBankName(acc.bank_name);
    setAccountMask(acc.account_number_mask);
    setCurrency(acc.currency);
    setCurrentBalance(acc.current_balance);
    setMinBalance(acc.minimum_required_balance);
    setIsActive(acc.is_active);
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    if (!bankName.trim()) {
      setErrorMsg('El nombre de la entidad bancaria es requerido.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const payload: CreateBankAccountPayload = {
        bank_name: bankName.trim(),
        account_number_mask: accountMask.trim() || '****0000',
        currency,
        current_balance: Number(currentBalance) || 0,
        minimum_required_balance: Number(minBalance) || 0,
        is_active: isActive,
      };

      if (editingAccount) {
        await api.updateBankAccount(accessToken, editingAccount.id, payload);
      } else {
        await api.createBankAccount(accessToken, payload);
      }

      setShowModal(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar cuenta bancaria');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!accessToken) return;
    if (!window.confirm(`¿Estás seguro de eliminar la cuenta "${name}"?`)) return;

    try {
      await api.deleteBankAccount(accessToken, id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar cuenta bancaria');
    }
  };

  const totalMXN = accounts
    .filter((a) => a.currency === 'MXN' && a.is_active)
    .reduce((sum, a) => sum + a.current_balance, 0);

  const totalUSD = accounts
    .filter((a) => a.currency === 'USD' && a.is_active)
    .reduce((sum, a) => sum + a.current_balance, 0);

  const totalReserveMXN = accounts
    .filter((a) => a.currency === 'MXN' && a.is_active)
    .reduce((sum, a) => sum + a.minimum_required_balance, 0);

  return (
    <div className="space-y-6">
      {/* Header with KPI cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Landmark className="w-5 h-5 text-[#776de8]" />
            Cuentas Bancarias & Posición de Tesorería
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Gestión multi-divisa y monitoreo de saldos en tiempo real para conciliación de flujo.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Cuenta Bancaria</span>
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-400">Total Disponible MXN</span>
          <div className="text-base font-bold font-mono text-emerald-400">{formatCurrency(totalMXN, 'MXN')}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-400">Total Disponible USD</span>
          <div className="text-base font-bold font-mono text-cyan-400">{formatCurrency(totalUSD, 'USD')}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-400">Reserva de Seguridad MXN</span>
          <div className="text-base font-bold font-mono text-[#bbb3ff]">{formatCurrency(totalReserveMXN, 'MXN')}</div>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => {
          const isUnderMin = acc.current_balance < acc.minimum_required_balance;

          return (
            <div
              key={acc.id}
              className={`relative rounded-2xl border p-5 shadow-lg backdrop-blur-md transition flex flex-col justify-between ${
                !acc.is_active
                  ? 'border-slate-800 bg-slate-900/30 opacity-60'
                  : isUnderMin
                  ? 'border-amber-800/60 bg-gray-800'
                  : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#776de8]/15 border border-[#776de8]/30 flex items-center justify-center text-[#bbb3ff]">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">
                        {acc.bank_name}
                      </h4>
                      <span className="text-xs font-mono text-slate-400">
                        {acc.account_number_mask}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        acc.currency === 'USD'
                          ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {acc.currency}
                    </span>
                    {acc.is_active ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400" title="Activa" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-500" title="Inactiva" />
                    )}
                  </div>
                </div>

                {/* Balances */}
                <div className="space-y-2 my-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Saldo Actual Disponible</span>
                    <span
                      className={`text-lg font-bold font-mono ${
                        isUnderMin ? 'text-amber-400' : 'text-white'
                      }`}
                    >
                      {formatCurrency(acc.current_balance, acc.currency)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/80">
                    <span className="text-slate-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Reserva Mínima:
                    </span>
                    <span className="font-mono text-slate-300 font-medium">
                      {formatCurrency(acc.minimum_required_balance, acc.currency)}
                    </span>
                  </div>
                </div>

                {isUnderMin && acc.is_active && (
                  <div className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-1.5 mb-2">
                    <span> Saldo inferior a la reserva de seguridad requerida</span>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <span className="text-[10px] text-slate-500 font-mono">
                  ID: {acc.id.slice(0, 8)}...
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(acc)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                    title="Editar cuenta"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(acc.id, acc.bank_name)}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition cursor-pointer"
                    title="Eliminar cuenta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {accounts.length === 0 && !isLoading && (
        <div className="py-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
          <Landmark className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-400">No hay cuentas bancarias registradas</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Registra tu primera cuenta bancaria para calibrar el motor de tesorería predictiva.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 px-4 py-2 rounded-xl bg-[#776de8] text-white font-semibold text-xs transition cursor-pointer"
          >
            Agregar Cuenta
          </button>
        </div>
      )}

      {/* Modal Crear / Editar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#776de8]/20 border border-[#776de8]/30 flex items-center justify-center text-[#bbb3ff]">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingAccount ? 'Editar Cuenta Bancaria' : 'Nueva Cuenta Bancaria'}
                </h3>
                <p className="text-xs text-slate-400">
                  Configuración de cuenta y balance para tesorería
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nombre del Banco / Entidad *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. BBVA Bancomer, Banorte, Santander"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#776de8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Máscara de Cuenta
                  </label>
                  <input
                    type="text"
                    placeholder="****4589"
                    value={accountMask}
                    onChange={(e) => setAccountMask(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#776de8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Divisa
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#776de8]"
                  >
                    <option value="MXN">MXN (Pesos)</option>
                    <option value="USD">USD (Dólares)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Saldo Actual
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={currentBalance}
                    onChange={(e) => setCurrentBalance(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-[#776de8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Reserva Mínima
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={minBalance}
                    onChange={(e) => setMinBalance(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-[#776de8]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-[#776de8] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="isActiveCheck" className="text-xs text-slate-300 cursor-pointer">
                  Cuenta Activa en Proyección de Flujo
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : editingAccount ? 'Actualizar Cuenta' : 'Crear Cuenta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
