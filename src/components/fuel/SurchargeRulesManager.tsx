import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { SurchargeRule, CreateSurchargeRulePayload, UpdateSurchargeRulePayload } from '../../types/fuel';
import { FUEL_TYPE_COLORS } from '../../types/fuel';
import type { FuelType } from '../../types/fuel';
import {
  Percent,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  X,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface SurchargeRulesManagerProps {
  rules: SurchargeRule[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const SurchargeRulesManager: React.FC<SurchargeRulesManagerProps> = ({
  rules,
  isLoading,
  onRefresh,
}) => {
  const { accessToken } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<SurchargeRule | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form
  const [fuelType, setFuelType] = useState<FuelType>('diesel');
  const [region, setRegion] = useState('México - Noreste');
  const [baselinePrice, setBaselinePrice] = useState<number>(24.0);
  const [thresholdPct, setThresholdPct] = useState<number>(5);
  const [passThroughRate, setPassThroughRate] = useState<number>(80);
  const [isActive, setIsActive] = useState(true);

  const fmt = (v: number, dec = 2) => v?.toFixed(dec) ?? '0.00';

  const handleOpenCreate = () => {
    setEditingRule(null);
    setFuelType('diesel');
    setRegion('México - Noreste');
    setBaselinePrice(24.0);
    setThresholdPct(5);
    setPassThroughRate(80);
    setIsActive(true);
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleOpenEdit = (rule: SurchargeRule) => {
    setEditingRule(rule);
    setFuelType(rule.fuel_type);
    setRegion(rule.region);
    setBaselinePrice(rule.baseline_price);
    setThresholdPct(rule.threshold_percentage);
    setPassThroughRate(rule.pass_through_rate);
    setIsActive(rule.is_active);
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      if (editingRule) {
        const payload: UpdateSurchargeRulePayload = {
          fuel_type: fuelType,
          region,
          baseline_price: Number(baselinePrice),
          threshold_percentage: Number(thresholdPct),
          pass_through_rate: Number(passThroughRate),
          is_active: isActive,
        };
        await api.updateSurchargeRule(accessToken, editingRule.id, payload);
      } else {
        const payload: CreateSurchargeRulePayload = {
          fuel_type: fuelType,
          region,
          baseline_price: Number(baselinePrice),
          threshold_percentage: Number(thresholdPct),
          pass_through_rate: Number(passThroughRate),
        };
        await api.createSurchargeRule(accessToken, payload);
      }
      setShowModal(false);
      onRefresh();
    } catch (err: any) {
      if (err.message?.includes('409') || err.message?.toLowerCase().includes('duplicate') || err.message?.toLowerCase().includes('conflict')) {
        setErrorMsg('Ya existe una regla para este tipo de combustible y región. Solo se permite una regla por combinación.');
      } else {
        setErrorMsg(err.message || 'Error al guardar regla de recargo');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!accessToken) return;
    if (!window.confirm('¿Eliminar esta regla de recargo por combustible?')) return;
    try {
      await api.deleteSurchargeRule(accessToken, id);
      onRefresh();
    } catch (err: any) {
      window.alert(err.message || 'Error al eliminar regla');
    }
  };

  const handleRecalculate = async () => {
    if (!accessToken) return;
    try {
      setIsRecalculating(true);
      await api.recalculateSurcharges(accessToken);
      onRefresh();
    } catch (err: any) {
      window.alert(err.message || 'Error al recalcular recargos');
    } finally {
      setIsRecalculating(false);
    }
  };

  const activeRulesWithSurcharge = rules.filter(
    (r) => r.is_active && r.suggested_surcharge_percentage > 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Percent className="w-5 h-5 text-amber-400" />
            Reglas de Recargo por Combustible (BAF / Fuel Surcharge)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Define umbrales y tasas de traspaso. El motor calcula automáticamente el recargo sugerido cuando el precio supera el baseline.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRecalculate}
            disabled={isRecalculating}
            className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
            {isRecalculating ? 'Calculando...' : 'Recalcular Ahora'}
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-semibold flex items-center gap-1.5  transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nueva Regla
          </button>
        </div>
      </div>

      {/* Alert banner if any rules fired */}
      {activeRulesWithSurcharge.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-300">
              {activeRulesWithSurcharge.length} regla{activeRulesWithSurcharge.length > 1 ? 's' : ''} con recargo activo
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Los siguientes tipos de combustible superaron su umbral de tolerancia. Considera aplicar el recargo sugerido en las cotizaciones.
            </p>
          </div>
        </div>
      )}

      {/* Rules Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {rules.map((rule) => {
          const isUp = rule.price_variation_percentage > 0;
          const hasAlert = rule.suggested_surcharge_percentage > 0;

          return (
            <div
              key={rule.id}
              className={`rounded-2xl border p-5 shadow-lg backdrop-blur-md transition flex flex-col justify-between ${
                !rule.is_active
                  ? 'border-slate-800 bg-slate-900/30 opacity-60'
                  : hasAlert
                  ? 'border-amber-800/60 bg-gray-800'
                  : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xl shrink-0">
                      {rule.fuel_type === 'diesel' ? '' : rule.fuel_type === 'bunker_c' ? '' : rule.fuel_type === 'marine_gasoil' ? '' : ''}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${FUEL_TYPE_COLORS[rule.fuel_type]}`}>
                          {rule.fuel_type.replace('_', ' ')}
                        </span>
                        {rule.is_active ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Activa</span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">Inactiva</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">{rule.region}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleOpenEdit(rule)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer" title="Editar">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(rule.id)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition cursor-pointer" title="Eliminar">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Precio Baseline</span>
                    <span className="text-sm font-bold font-mono text-white">${fmt(rule.baseline_price)}/L</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Variación vs Baseline</span>
                    <span className={`text-sm font-bold font-mono flex items-center gap-1 ${isUp ? 'text-red-400' : 'text-emerald-400'}`}>
                      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {isUp ? '+' : ''}{fmt(rule.price_variation_percentage, 1)}%
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Umbral Disparo</span>
                    <span className="text-sm font-bold font-mono text-slate-300">{fmt(rule.threshold_percentage, 1)}%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Tasa de Traspaso</span>
                    <span className="text-sm font-bold font-mono text-slate-300">{fmt(rule.pass_through_rate, 0)}%</span>
                  </div>
                </div>

                {/* Suggested Surcharge */}
                {hasAlert ? (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">Recargo Sugerido</span>
                      <div className="text-xl font-bold font-mono text-amber-300 mt-0.5">
                        +{fmt(rule.suggested_surcharge_percentage, 2)}%
                      </div>
                    </div>
                    <AlertTriangle className="w-7 h-7 text-amber-400 opacity-50" />
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs text-emerald-300">
                      Sin recargo — precio dentro del umbral de tolerancia del {fmt(rule.threshold_percentage, 0)}%
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/60">
                <span className="text-[10px] text-slate-500 font-mono">
                  Calculado: {rule.last_calculated_at
                    ? new Date(rule.last_calculated_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
                    : 'Nunca'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {rules.length === 0 && !isLoading && (
        <div className="py-14 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
          <Percent className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-400">No hay reglas de recargo configuradas</p>
          <p className="text-xs text-slate-500 mt-1">Crea una regla para que el sistema calcule automáticamente los recargos por variación de combustible.</p>
          <button onClick={handleOpenCreate} className="mt-4 px-4 py-2 rounded-xl bg-amber-500/80 hover:bg-amber-500 text-white text-xs font-semibold transition cursor-pointer">
            Crear Primera Regla
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative">
            <button onClick={() => setShowModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer">
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingRule ? 'Editar Regla de Recargo' : 'Nueva Regla de Recargo (BAF)'}
                </h3>
                <p className="text-xs text-slate-400">Solo 1 regla por (empresa, combustible, región)</p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">{errorMsg}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Combustible *</label>
                  <select value={fuelType} onChange={(e) => setFuelType(e.target.value as FuelType)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500">
                    <option value="diesel"> Diésel</option>
                    <option value="bunker_c"> Bunker C</option>
                    <option value="marine_gasoil"> Marine Gas Oil</option>
                    <option value="jet_a1"> Jet A-1</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Región *</label>
                  <input
                    type="text" required value={region} onChange={(e) => setRegion(e.target.value)}
                    placeholder="México - Noreste"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Precio de Referencia Baseline ($/L o $/kg) *
                </label>
                <input
                  type="number" step="0.01" min="0" required value={baselinePrice}
                  onChange={(e) => setBaselinePrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">Precio acordado de contrato contra el que se mide la variación del mercado</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Umbral de Disparo (%)</label>
                  <input
                    type="number" step="0.1" min="0" max="100" required value={thresholdPct}
                    onChange={(e) => setThresholdPct(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">Si variación supera X%, aplica recargo</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tasa de Traspaso (%)</label>
                  <input
                    type="number" step="0.1" min="0" max="100" required value={passThroughRate}
                    onChange={(e) => setPassThroughRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">% de la variación que se cobra al cliente</p>
                </div>
              </div>

              {editingRule && (
                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    {isActive
                      ? <ToggleRight className="w-6 h-6 text-emerald-400" />
                      : <ToggleLeft className="w-6 h-6 text-slate-500" />}
                    <span className="text-xs text-slate-300">Regla {isActive ? 'Activa' : 'Inactiva'}</span>
                  </button>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50">
                  {isSubmitting ? 'Guardando...' : editingRule ? 'Actualizar' : 'Crear Regla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
