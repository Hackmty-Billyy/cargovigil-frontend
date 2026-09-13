import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type {
  Expense,
  BankAccount,
  CreateExpensePayload,
  PayExpensePayload,
  ExpenseCategory,
} from '../../types/treasury';
import {
  Receipt,
  Plus,
  CreditCard,
  Trash2,
  CheckCircle2,
  Clock,
  Fuel,
  Wrench,
  Users,
  Shield,
  Anchor,
  Layers,
  X,
  Search,
  Filter,
} from 'lucide-react';

interface ExpensesManagerProps {
  expenses: Expense[];
  bankAccounts: BankAccount[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const ExpensesManager: React.FC<ExpensesManagerProps> = ({
  expenses,
  bankAccounts,
  isLoading,
  onRefresh,
}) => {
  const { accessToken } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [payingExpense, setPayingExpense] = useState<Expense | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Create Form State
  const [category, setCategory] = useState<ExpenseCategory>('fuel');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  // Payment Form State
  const [paymentBankAccountId, setPaymentBankAccountId] = useState('');

  const formatCurrency = (val: number, curr: 'MXN' | 'USD' = 'MXN') =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: curr,
      maximumFractionDigits: 2,
    }).format(val);

  const handleOpenCreate = () => {
    setCategory('fuel');
    setDescription('');
    setAmount(0);
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setDueDate(d.toISOString().split('T')[0]);
    setErrorMsg(null);
    setShowCreateModal(true);
  };

  const handleOpenPay = (exp: Expense) => {
    setPayingExpense(exp);
    const defaultAcc =
      bankAccounts.find((b) => b.is_active && b.currency === 'MXN') || bankAccounts[0];
    setPaymentBankAccountId(defaultAcc ? defaultAcc.id : '');
    setErrorMsg(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    if (!description.trim()) {
      setErrorMsg('La descripción del gasto es obligatoria.');
      return;
    }
    if (amount <= 0) {
      setErrorMsg('El monto debe ser mayor a cero.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const payload: CreateExpensePayload = {
        category,
        description: description.trim(),
        amount: Number(amount),
        due_date: dueDate,
      };

      await api.createExpense(accessToken, payload);
      setShowCreateModal(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al crear gasto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !payingExpense) return;
    if (!paymentBankAccountId) {
      setErrorMsg('Selecciona la cuenta bancaria de donde saldrá el pago.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const payload: PayExpensePayload = {
        bank_account_id: paymentBankAccountId,
      };

      await api.markExpensePaid(accessToken, payingExpense.id, payload);
      setPayingExpense(null);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al liquidar gasto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, desc: string) => {
    if (!accessToken) return;
    if (!window.confirm(`¿Estás seguro de eliminar el gasto "${desc}"?`)) return;

    try {
      await api.deleteExpense(accessToken, id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar gasto');
    }
  };

  // Filtered list
  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch = exp.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || exp.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || exp.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // KPI Calculations
  const totalPending = expenses
    .filter((e) => e.status === 'pending')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalPaid = expenses
    .filter((e) => e.status === 'paid')
    .reduce((sum, e) => sum + e.amount, 0);

  const getCategoryInfo = (cat: string) => {
    switch (cat) {
      case 'fuel':
        return { label: 'Combustible', icon: Fuel, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
      case 'toll':
        return { label: 'Casetas / Peaje', icon: Layers, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
      case 'maintenance':
        return { label: 'Mantenimiento', icon: Wrench, color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' };
      case 'driver_payroll':
        return { label: 'Nómina Operadores', icon: Users, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
      case 'port_fees':
        return { label: 'Tasas Portuarias', icon: Anchor, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
      case 'insurance':
        return { label: 'Seguros / Pólizas', icon: Shield, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
      case 'contingency_reserve':
        // Generada por el módulo 2: no es un pagadero real, es liquidez
        // apartada para un viaje. Se distingue para no confundirla con un gasto.
        return { label: 'Colchón de Contingencia', icon: Layers, color: 'text-[#bbb3ff] bg-[#776de8]/15 border-[#776de8]/40' };
      default:
        return { label: 'Otros Gastos', icon: Receipt, color: 'text-slate-300 bg-slate-800 border-slate-700' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#776de8]" />
            Cuentas por Pagar (Gastos Operativos & Fijos)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Compromisos financieros programados (Diésel, Peajes, Mantenimiento) que impactan la liquidez futura.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Gasto Programado</span>
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" /> Total Pendiente por Pagar
          </span>
          <div className="text-lg font-bold font-mono text-amber-300 mt-1">
            {formatCurrency(totalPending)}
          </div>
          <span className="text-[10px] text-slate-500">Salidas de caja programadas</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Total Liquidado / Pagado
          </span>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
            {formatCurrency(totalPaid)}
          </div>
          <span className="text-[10px] text-slate-500">Egresos efectivos de cuentas</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-[#bbb3ff]" /> Total de Gastos
          </span>
          <div className="text-lg font-bold font-mono text-white mt-1">
            {expenses.length} Registros
          </div>
          <span className="text-[10px] text-slate-500">
            {expenses.filter((e) => e.status === 'pending').length} pendientes de pago
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por concepto o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#776de8]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#776de8]"
          >
            <option value="all">Todas las Categorías</option>
            <option value="fuel">Combustible / Diésel</option>
            <option value="toll">Casetas / Peajes</option>
            <option value="maintenance">Mantenimiento</option>
            <option value="driver_payroll">Nómina Operadores</option>
            <option value="port_fees">Tasas Portuarias</option>
            <option value="insurance">Seguros</option>
            <option value="contingency_reserve">Colchón de Contingencia</option>
            <option value="other">Otros</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#776de8]"
          >
            <option value="all">Todos los Estados</option>
            <option value="pending">Pendientes</option>
            <option value="paid">Pagados</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Concepto / Descripción</th>
              <th className="px-4 py-3">Fecha Vencimiento</th>
              <th className="px-4 py-3 text-right">Monto</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredExpenses.map((exp) => {
              const catInfo = getCategoryInfo(exp.category);
              const CatIcon = catInfo.icon;
              const isPending = exp.status === 'pending';

              return (
                <tr key={exp.id} className="hover:bg-slate-850/50 transition">
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${catInfo.color}`}
                    >
                      <CatIcon className="w-3 h-3" />
                      {catInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{exp.description}</div>
                    {exp.paid_date && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        Pagado el: {exp.paid_date}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-300">
                    {exp.due_date}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-white">
                    {formatCurrency(exp.amount)}
                  </td>
                  <td className="px-4 py-3">
                    {isPending ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-max">
                        <Clock className="w-3 h-3" /> Pendiente
                      </span>
                    ) : exp.status === 'paid' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-max">
                        <CheckCircle2 className="w-3 h-3" /> Pagado
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1 w-max">
                        Cancelado
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {isPending && (
                        <button
                          onClick={() => handleOpenPay(exp)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:from-[#6b61db] hover:to-[#7f74ea] text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        >
                          <CreditCard className="w-3 h-3" /> Pagar Gasto
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(exp.id, exp.description)}
                        className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition cursor-pointer"
                        title="Eliminar gasto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredExpenses.length === 0 && !isLoading && (
          <div className="py-12 text-center text-slate-500 text-xs">
            No se encontraron gastos con los filtros seleccionados.
          </div>
        )}
      </div>

      {/* Modal Nuevo Gasto */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#776de8]/20 border border-[#776de8]/30 flex items-center justify-center text-[#bbb3ff]">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Nuevo Gasto Programado</h3>
                <p className="text-xs text-slate-400">
                  Registra un compromiso o salida de caja futura
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Categoría del Gasto *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#776de8]"
                >
                  <option value="fuel"> Combustible / Diésel</option>
                  <option value="toll"> Casetas / Peajes</option>
                  <option value="maintenance"> Mantenimiento de Unidades</option>
                  <option value="driver_payroll"> Nómina Operadores</option>
                  <option value="port_fees"> Tasas Portuarias / Terminales</option>
                  <option value="insurance"> Seguros & Pólizas</option>
                  <option value="other"> Otros Gastos Administrativos</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Concepto / Descripción *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carga de Diésel 300L - Ruta MTY-CDMX"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#776de8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Monto ($ MXN) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono font-bold focus:outline-none focus:border-[#776de8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Fecha de Vencimiento *
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#776de8]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : 'Programar Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Liquidar / Pagar Gasto */}
      {payingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative">
            <button
              onClick={() => setPayingExpense(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#776de8]/20 border border-[#776de8]/30 flex items-center justify-center text-[#bbb3ff]">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Liquidar / Pagar Gasto</h3>
                <p className="text-xs text-slate-400">
                  Se debitará el monto del saldo bancario seleccionado
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handlePaySubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Concepto:</span>
                  <span className="font-semibold text-white">{payingExpense.description}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Fecha Vencimiento:</span>
                  <span className="font-mono text-slate-300">{payingExpense.due_date}</span>
                </div>
                <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                  <span>Monto a Debitar:</span>
                  <span className="font-mono text-amber-400 font-bold">
                    {formatCurrency(payingExpense.amount)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cuenta Bancaria de Origen (Pago) *
                </label>
                {bankAccounts.length === 0 ? (
                  <p className="text-xs text-amber-400">
                    No tienes cuentas bancarias registradas. Crea una primero en la pestaña Cuentas Bancarias.
                  </p>
                ) : (
                  <select
                    value={paymentBankAccountId}
                    onChange={(e) => setPaymentBankAccountId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#776de8]"
                  >
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bank_name} ({b.account_number_mask}) - Saldo: {formatCurrency(b.current_balance, b.currency)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPayingExpense(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || bankAccounts.length === 0}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Procesando...' : 'Confirmar Egreso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
