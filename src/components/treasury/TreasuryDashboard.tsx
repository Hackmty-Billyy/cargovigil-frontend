import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type {
  BankAccount,
  Invoice,
  Expense,
  CashAlert,
  CashFlowProjection,
} from '../../types/treasury';
import type { Client } from '../../types/company';
import { LiquidityAlertsBanner } from './LiquidityAlertsBanner';
import { CashFlowForecastChart } from './CashFlowForecastChart';
import { BankAccountsManager } from './BankAccountsManager';
import { InvoicesManager } from './InvoicesManager';
import { ExpensesManager } from './ExpensesManager';
import {
  TrendingUp,
  Landmark,
  FileText,
  Receipt,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const TreasuryDashboard: React.FC = () => {
  const { accessToken } = useAuth();

  // Active Subtab
  const [activeSubTab, setActiveSubTab] = useState<'forecast' | 'accounts' | 'invoices' | 'expenses'>('forecast');
  const [forecastDays, setForecastDays] = useState<number>(30);

  // Data States
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projections, setProjections] = useState<CashFlowProjection[]>([]);
  const [alerts, setAlerts] = useState<CashAlert[]>([]);

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    if (!accessToken) return;
    try {
      setIsLoading(true);
      setErrorMsg(null);

      const [accs, invs, exps, cls, fcast, alrts] = await Promise.all([
        api.listBankAccounts(accessToken).catch(() => []),
        api.listInvoices(accessToken).catch(() => []),
        api.listExpenses(accessToken).catch(() => []),
        api.listClients(accessToken).catch(() => []),
        api.getForecast(accessToken, forecastDays).catch(() => []),
        api.listAlerts(accessToken, false).catch(() => []),
      ]);

      setBankAccounts(accs);
      setInvoices(invs);
      setExpenses(exps);
      setClients(cls);
      setProjections(fcast);
      setAlerts(alrts);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al cargar datos de tesorería');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, forecastDays]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const formatCurrency = (val: number, curr: 'MXN' | 'USD' = 'MXN') =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: curr,
      maximumFractionDigits: 0,
    }).format(val);

  // Aggregations
  const totalBalanceMXN = bankAccounts
    .filter((a) => a.currency === 'MXN' && a.is_active)
    .reduce((sum, a) => sum + a.current_balance, 0);

  const totalBalanceUSD = bankAccounts
    .filter((a) => a.currency === 'USD' && a.is_active)
    .reduce((sum, a) => sum + a.current_balance, 0);

  const totalMinReserveMXN = bankAccounts
    .filter((a) => a.currency === 'MXN' && a.is_active)
    .reduce((sum, a) => sum + a.minimum_required_balance, 0);

  const totalReceivable = invoices
    .filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
    .reduce((sum, i) => sum + (i.total_amount - i.paid_amount), 0);

  const totalPayable = expenses
    .filter((e) => e.status === 'pending')
    .reduce((sum, e) => sum + e.amount, 0);

  // Daily burn rate & Runway approximation
  const pending30dExpenses = expenses
    .filter((e) => e.status === 'pending')
    .reduce((sum, e) => sum + e.amount, 0);
  const avgDailyBurn = pending30dExpenses > 0 ? pending30dExpenses / 30 : 1;
  const daysOfRunway = Math.min(Math.floor(totalBalanceMXN / (avgDailyBurn || 1)), 999);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner with Module 1 Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-md bg-[#776de8]/20 text-[#bbb3ff] border border-[#776de8]/40 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Módulo 1 — Finanzas Predictivas
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Horizonte {forecastDays} Días • Runway estimado ~{daysOfRunway}d
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Tesorería Predictiva & Gestión de Liquidez
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Simulador financiero integral que proyecta flujos de efectivo, previene quiebres de caja por combustible/peajes y optimiza cobros a clientes.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center">
            <button
              onClick={fetchAllData}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sincronizar Datos</span>
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Global Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Posición Consolidada (MXN)</span>
            <Landmark className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {formatCurrency(totalBalanceMXN, 'MXN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {totalBalanceUSD > 0
              ? `+ ${formatCurrency(totalBalanceUSD, 'USD')} en cuentas USD`
              : `${bankAccounts.filter((a) => a.currency === 'MXN' && a.is_active).length} cuentas bancarias activas`}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Colchón de Reserva Mínima</span>
            <ShieldCheck className="w-4 h-4 text-[#bbb3ff]" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {formatCurrency(totalMinReserveMXN, 'MXN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Capital protegido no comprometible
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Cuentas por Cobrar (Facturas)</span>
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-300">
            {formatCurrency(totalReceivable, 'MXN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Entradas proyectadas a 30 días
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Cuentas por Pagar (Gastos)</span>
            <Receipt className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-300">
            {formatCurrency(totalPayable, 'MXN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Salidas programadas pendientes
          </p>
        </div>
      </div>

      {/* Liquidity Alerts Banner Section */}
      <LiquidityAlertsBanner
        alerts={alerts}
        isLoading={isLoading}
        onRefresh={fetchAllData}
      />

      {/* Treasury Sub-Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('forecast')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeSubTab === 'forecast'
              ? 'bg-[#776de8] text-white shadow-lg shadow-[#776de8]/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Curva de Flujo (Forecast {forecastDays}d)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('accounts')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeSubTab === 'accounts'
              ? 'bg-[#776de8] text-white shadow-lg shadow-[#776de8]/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>Cuentas Bancarias ({bankAccounts.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('invoices')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeSubTab === 'invoices'
              ? 'bg-[#776de8] text-white shadow-lg shadow-[#776de8]/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Cuentas por Cobrar ({invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('expenses')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeSubTab === 'expenses'
              ? 'bg-[#776de8] text-white shadow-lg shadow-[#776de8]/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Cuentas por Pagar ({expenses.length})</span>
        </button>
      </div>

      {/* Subtab Content Panels */}
      <div className="transition-all duration-200">
        {activeSubTab === 'forecast' && (
          <CashFlowForecastChart
            projections={projections}
            minReserveAmount={totalMinReserveMXN}
            currentBalanceTotal={totalBalanceMXN}
            days={forecastDays}
            onDaysChange={(d) => setForecastDays(d)}
            isLoading={isLoading}
            onRefresh={fetchAllData}
          />
        )}

        {activeSubTab === 'accounts' && (
          <BankAccountsManager
            accounts={bankAccounts}
            isLoading={isLoading}
            onRefresh={fetchAllData}
          />
        )}

        {activeSubTab === 'invoices' && (
          <InvoicesManager
            invoices={invoices}
            clients={clients}
            bankAccounts={bankAccounts}
            isLoading={isLoading}
            onRefresh={fetchAllData}
          />
        )}

        {activeSubTab === 'expenses' && (
          <ExpensesManager
            expenses={expenses}
            bankAccounts={bankAccounts}
            isLoading={isLoading}
            onRefresh={fetchAllData}
          />
        )}
      </div>
    </div>
  );
};
