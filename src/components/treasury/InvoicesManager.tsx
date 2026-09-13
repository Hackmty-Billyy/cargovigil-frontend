import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { Invoice, BankAccount, CreateInvoicePayload, RecordInvoicePaymentPayload } from '../../types/treasury';
import type { Client } from '../../types/company';
import {
  FileText,
  Plus,
  DollarSign,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Search,
  Filter,
} from 'lucide-react';

interface InvoicesManagerProps {
  invoices: Invoice[];
  clients: Client[];
  bankAccounts: BankAccount[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const InvoicesManager: React.FC<InvoicesManagerProps> = ({
  invoices,
  clients,
  bankAccounts,
  isLoading,
  onRefresh,
}) => {
  const { accessToken } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Create Form State
  const [clientId, setClientId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [totalAmount, setTotalAmount] = useState<number>(0);

  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentBankAccountId, setPaymentBankAccountId] = useState('');

  const formatCurrency = (val: number, curr: 'MXN' | 'USD' = 'MXN') =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: curr,
      maximumFractionDigits: 2,
    }).format(val);

  const getClientName = (cid: string) => {
    const client = clients.find((c) => c.id === cid);
    return client ? client.name : cid.slice(0, 8) + '...';
  };

  const handleOpenCreate = () => {
    setClientId(clients.length > 0 ? clients[0].id : '');
    setInvoiceNumber(`FAC-${Math.floor(1000 + Math.random() * 9000)}`);
    setIssueDate(new Date().toISOString().split('T')[0]);
    const d = new Date();
    d.setDate(d.getDate() + 15);
    setDueDate(d.toISOString().split('T')[0]);
    setTotalAmount(0);
    setErrorMsg(null);
    setShowCreateModal(true);
  };

  const handleOpenPayment = (inv: Invoice) => {
    setPayingInvoice(inv);
    const pending = inv.total_amount - inv.paid_amount;
    setPaymentAmount(pending > 0 ? pending : inv.total_amount);
    const defaultAcc = bankAccounts.find((b) => b.is_active && b.currency === 'MXN') || bankAccounts[0];
    setPaymentBankAccountId(defaultAcc ? defaultAcc.id : '');
    setErrorMsg(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    if (!clientId) {
      setErrorMsg('Selecciona un cliente para emitir la factura.');
      return;
    }
    if (totalAmount <= 0) {
      setErrorMsg('El monto total debe ser mayor a cero.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const payload: CreateInvoicePayload = {
        client_id: clientId,
        invoice_number: invoiceNumber.trim(),
        issue_date: issueDate,
        due_date: dueDate,
        adjusted_due_date: dueDate,
        total_amount: Number(totalAmount),
      };

      await api.createInvoice(accessToken, payload);
      setShowCreateModal(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al emitir factura');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !payingInvoice) return;
    if (paymentAmount <= 0) {
      setErrorMsg('El monto del cobro debe ser mayor a cero.');
      return;
    }
    if (!paymentBankAccountId) {
      setErrorMsg('Selecciona la cuenta bancaria donde ingresó el dinero.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const payload: RecordInvoicePaymentPayload = {
        amount: Number(paymentAmount),
        bank_account_id: paymentBankAccountId,
      };

      await api.recordInvoicePayment(accessToken, payingInvoice.id, payload);
      setPayingInvoice(null);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al registrar pago de factura');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, num: string) => {
    if (!accessToken) return;
    if (!window.confirm(`¿Estás seguro de eliminar la factura "${num}"?`)) return;

    try {
      await api.deleteInvoice(accessToken, id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar factura');
    }
  };

  // Filtered list
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getClientName(inv.client_id).toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // KPI calculations
  const totalReceivable = invoices
    .filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
    .reduce((sum, i) => sum + (i.total_amount - i.paid_amount), 0);

  const totalCollected = invoices.reduce((sum, i) => sum + i.paid_amount, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-max">
            <CheckCircle2 className="w-3 h-3" /> Pagada
          </span>
        );
      case 'partially_paid':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 w-max">
            <Clock className="w-3 h-3" /> Pago Parcial
          </span>
        );
      case 'overdue':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/40 flex items-center gap-1 w-max">
            <AlertCircle className="w-3 h-3" /> Vencida
          </span>
        );
      case 'issued':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-max">
            <Clock className="w-3 h-3" /> Emitida
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1 w-max">
            Cancelada
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1 w-max">
            Borrador
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#776de8]" />
            Cuentas por Cobrar (Facturación de Fletes)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Registro de facturas a clientes con fecha estimada de cobro para alimentar el flujo de caja proyectado.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Factura</span>
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-cyan-400" /> Total Pendiente por Cobrar
          </span>
          <div className="text-lg font-bold font-mono text-cyan-300 mt-1">
            {formatCurrency(totalReceivable)}
          </div>
          <span className="text-[10px] text-slate-500">Impacta positivamente la proyección</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Total Cobrado Real
          </span>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
            {formatCurrency(totalCollected)}
          </div>
          <span className="text-[10px] text-slate-500">Ingresado en cuentas bancarias</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#bbb3ff]" /> Total de Facturas
          </span>
          <div className="text-lg font-bold font-mono text-white mt-1">
            {invoices.length} Registros
          </div>
          <span className="text-[10px] text-slate-500">
            {invoices.filter((i) => i.status === 'paid').length} liquidadas
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por folio o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#776de8]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#776de8]"
          >
            <option value="all">Todos los Estados</option>
            <option value="issued">Emitidas</option>
            <option value="partially_paid">Parcialmente Pagadas</option>
            <option value="paid">Pagadas</option>
            <option value="overdue">Vencidas</option>
            <option value="draft">Borrador</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Folio</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Fecha Emisión</th>
              <th className="px-4 py-3">Fecha Vencimiento</th>
              <th className="px-4 py-3 text-right">Monto Total</th>
              <th className="px-4 py-3 text-right">Cobrado</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredInvoices.map((inv) => {
              const isPaid = inv.status === 'paid';

              return (
                <tr key={inv.id} className="hover:bg-slate-850/50 transition">
                  <td className="px-4 py-3 font-mono font-bold text-white">
                    {inv.invoice_number}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-200">
                      {getClientName(inv.client_id)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400">
                    {inv.issue_date}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-300">
                    {inv.adjusted_due_date || inv.due_date}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-white">
                    {formatCurrency(inv.total_amount)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-400">
                    {formatCurrency(inv.paid_amount)}
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(inv.status)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {!isPaid && (
                        <button
                          onClick={() => handleOpenPayment(inv)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        >
                          <DollarSign className="w-3 h-3" /> Registrar Cobro
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(inv.id, inv.invoice_number)}
                        className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition cursor-pointer"
                        title="Eliminar factura"
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

        {filteredInvoices.length === 0 && !isLoading && (
          <div className="py-12 text-center text-slate-500 text-xs">
            No se encontraron facturas con los filtros seleccionados.
          </div>
        )}
      </div>

      {/* Modal Emitir Factura */}
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
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Nueva Factura por Cobrar</h3>
                <p className="text-xs text-slate-400">
                  Registra un derecho de cobro a un cliente
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
                  Cliente Receptor *
                </label>
                {clients.length === 0 ? (
                  <p className="text-xs text-amber-400">
                    No tienes clientes en el catálogo. Crea un cliente primero en la pestaña Clientes.
                  </p>
                ) : (
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#776de8]"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.tax_id ? `(${c.tax_id})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Folio / Identificador de Factura *
                </label>
                <input
                  type="text"
                  required
                  placeholder="FAC-2026-001"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-[#776de8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Fecha de Emisión
                  </label>
                  <input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#776de8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Fecha de Cobro Estimada
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

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Monto Total ($ MXN) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  placeholder="0.00"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono font-bold focus:outline-none focus:border-[#776de8]"
                />
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
                  disabled={isSubmitting || clients.length === 0}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : 'Crear Factura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Cobro */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative">
            <button
              onClick={() => setPayingInvoice(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Registrar Ingreso / Cobro</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Factura: {payingInvoice.invoice_number}
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Monto Total de Factura:</span>
                  <span className="font-mono text-white font-bold">{formatCurrency(payingInvoice.total_amount)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Monto Ya Cobrado:</span>
                  <span className="font-mono text-emerald-400">{formatCurrency(payingInvoice.paid_amount)}</span>
                </div>
                <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                  <span>Saldo Pendiente:</span>
                  <span className="font-mono text-cyan-300 font-bold">
                    {formatCurrency(payingInvoice.total_amount - payingInvoice.paid_amount)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Monto a Cobrar ($ MXN) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={payingInvoice.total_amount - payingInvoice.paid_amount}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cuenta Bancaria Receptora *
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
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
                  onClick={() => setPayingInvoice(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || bankAccounts.length === 0}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/25 transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Procesando...' : 'Confirmar Cobro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
