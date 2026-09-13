import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { Contract, Client } from '../../types/company';
import {
  FileText,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  AlertTriangle,
  Lock,
  Calendar,
  Building,
} from 'lucide-react';

export const ContractsManager: React.FC = () => {
  const { accessToken, user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const canWrite = user?.role_name === 'admin' || user?.role_name === 'operations';

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [formClientId, setFormClientId] = useState('');
  const [formReference, setFormReference] = useState('');
  const [formStartsOn, setFormStartsOn] = useState('');
  const [formEndsOn, setFormEndsOn] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const normalizeContract = (raw: any): Contract => ({
    id: raw.id || raw.ID || '',
    company_id: raw.company_id || raw.CompanyID || '',
    client_id: raw.client_id || raw.ClientID || '',
    reference: raw.reference || raw.Reference || '',
    starts_on: raw.starts_on !== undefined ? raw.starts_on : (raw.StartsOn !== undefined ? raw.StartsOn : null),
    ends_on: raw.ends_on !== undefined ? raw.ends_on : (raw.EndsOn !== undefined ? raw.EndsOn : null),
    is_active: raw.is_active !== undefined ? raw.is_active : (raw.IsActive !== undefined ? raw.IsActive : true),
    created_at: raw.created_at || raw.CreatedAt || new Date().toISOString(),
    updated_at: raw.updated_at || raw.UpdatedAt || new Date().toISOString(),
  });

  const normalizeClient = (raw: any): Client => ({
    id: raw.id || raw.ID || '',
    company_id: raw.company_id || raw.CompanyID || '',
    name: raw.name || raw.Name || 'Sin Nombre',
    tax_id: raw.tax_id !== undefined ? raw.tax_id : (raw.TaxID !== undefined ? raw.TaxID : null),
    is_active: raw.is_active !== undefined ? raw.is_active : (raw.IsActive !== undefined ? raw.IsActive : true),
    created_at: raw.created_at || raw.CreatedAt || new Date().toISOString(),
    updated_at: raw.updated_at || raw.UpdatedAt || new Date().toISOString(),
  });

  const fetchData = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const [rawContracts, rawClients] = await Promise.all([
        api.listContracts(accessToken),
        api.listClients(accessToken),
      ]);
      setContracts(Array.isArray(rawContracts) ? rawContracts.map(normalizeContract) : []);
      setClients(Array.isArray(rawClients) ? rawClients.map(normalizeClient) : []);
    } catch (err: any) {
      setError(err.message || 'Error al obtener contratos o clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [accessToken]);

  const openCreateModal = () => {
    setEditingContract(null);
    setFormClientId(clients.length > 0 ? clients[0].id : '');
    setFormReference('');
    setFormStartsOn('');
    setFormEndsOn('');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (c: Contract) => {
    setEditingContract(c);
    setFormClientId(c.client_id);
    setFormReference(c.reference);
    setFormStartsOn(c.starts_on ? c.starts_on.slice(0, 10) : '');
    setFormEndsOn(c.ends_on ? c.ends_on.slice(0, 10) : '');
    setFormIsActive(c.is_active);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !canWrite) return;
    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        client_id: formClientId,
        reference: formReference.trim(),
        starts_on: formStartsOn.trim() || null,
        ends_on: formEndsOn.trim() || null,
      };

      if (editingContract) {
        await api.updateContract(accessToken, editingContract.id, {
          ...payload,
          is_active: formIsActive,
        });
      } else {
        await api.createContract(accessToken, payload);
      }

      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el contrato');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, ref: string) => {
    if (!accessToken || !canWrite) return;
    if (!window.confirm(`¿Estás seguro de eliminar el contrato "${ref}"?`)) return;

    try {
      setLoading(true);
      await api.deleteContract(accessToken, id);
      await fetchData();
    } catch (err: any) {
      alert(`Error al eliminar contrato: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clientMap = new Map<string, string>();
  clients.forEach((c) => clientMap.set(c.id, c.name));

  const filtered = contracts.filter((c) => {
    const clientName = clientMap.get(c.client_id) || '';
    return (
      c.reference.toLowerCase().includes(search.toLowerCase()) ||
      clientName.toLowerCase().includes(search.toLowerCase())
    );
  });

  const activeContracts = contracts.filter((c) => c.is_active).length;

  return (
    <div className="space-y-6">
      {!canWrite && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5">
          <Lock className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            <strong>Modo Solo Lectura:</strong> Tu rol de <strong>Finanzas</strong> tiene acceso de consulta a los contratos. Las altas y modificaciones están reservadas para Administración y Operaciones.
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#776de8]" />
            Catálogo de Contratos y Acuerdos
          </h2>
          <p className="text-xs text-slate-400">
            Control de vigencias, folios de referencia y clientes asociados
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canWrite && (
            <button
              onClick={openCreateModal}
              disabled={clients.length === 0}
              className="px-4 py-2 rounded-xl bg-[#776de8] hover:bg-[#6c61e4] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs  flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Contrato</span>
            </button>
          )}
          <button
            onClick={fetchData}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            title="Refrescar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {clients.length === 0 && canWrite && (
        <div className="p-3.5 rounded-xl bg-[#776de8]/10 border border-[#776de8]/30 text-[#bbb3ff] text-xs flex items-center gap-2">
          <Building className="w-4 h-4 text-[#776de8] shrink-0" />
          <span>
            Aún no tienes clientes registrados. Ve a la pestaña <strong>Clientes</strong> para crear al menos uno antes de emitir un contrato.
          </span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400">Total Contratos</span>
          <div className="text-xl font-bold text-white mt-0.5">{contracts.length}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400">Contratos Activos</span>
          <div className="text-xl font-bold text-emerald-400 mt-0.5">{activeContracts}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400">Clientes con Contratos</span>
          <div className="text-xl font-bold text-[#bbb3ff] mt-0.5">
            {new Set(contracts.map((c) => c.client_id)).size}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar contrato por folio o cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#776de8]"
        />
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Contracts Table */}
      <div className="overflow-hidden rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Folio / Referencia</th>
                <th className="py-3.5 px-4 font-semibold">Cliente Asociado</th>
                <th className="py-3.5 px-4 font-semibold">Vigencia (Inicio - Fin)</th>
                <th className="py-3.5 px-4 font-semibold text-center">Estado</th>
                {canWrite && <th className="py-3.5 px-4 font-semibold text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading && contracts.length === 0 ? (
                <tr>
                  <td colSpan={canWrite ? 5 : 4} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#776de8]" />
                    Cargando contratos...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={canWrite ? 5 : 4} className="py-12 text-center text-slate-500">
                    No se encontraron contratos registrados.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const clientName = clientMap.get(c.client_id) || `Cliente (${c.client_id.slice(0, 8)}...)`;
                  const startsText = c.starts_on ? c.starts_on.slice(0, 10) : 'Sin inicio';
                  const endsText = c.ends_on ? c.ends_on.slice(0, 10) : 'Indefinido';

                  return (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 font-mono font-bold text-sm text-[#bbb3ff]">
                          <FileText className="w-4 h-4 text-[#776de8]" />
                          <span>{c.reference}</span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-500 block mt-0.5 truncate max-w-[140px]" title={c.id}>
                          ID: {c.id}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{clientName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{startsText}  {endsText}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            c.is_active
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {c.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {c.is_active ? 'Vigente' : 'Pausado'}
                        </span>
                      </td>
                      {canWrite && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(c)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                              title="Editar"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(c.id, c.reference)}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition cursor-pointer"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#776de8]/15 text-[#bbb3ff] border border-[#776de8]/30">
                  <FileText className="w-5 h-5 text-[#776de8]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingContract ? 'Editar Contrato' : 'Crear Nuevo Contrato'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingContract ? 'Modifica vigencias o folio' : 'Asigna un acuerdo a un cliente del catálogo'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-semibold cursor-pointer"
              >
                
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Cliente Titular
                </label>
                <select
                  required
                  value={formClientId}
                  onChange={(e) => setFormClientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#776de8]"
                >
                  {clients.length === 0 ? (
                    <option value="">No hay clientes registrados</option>
                  ) : (
                    clients.map((cl) => (
                      <option key={cl.id} value={cl.id}>
                        {cl.name} {cl.tax_id ? `(${cl.tax_id})` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Folio o Código de Referencia
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. CTR-2026-0089"
                  value={formReference}
                  onChange={(e) => setFormReference(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#776de8] font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Fecha Inicio (YYYY-MM-DD)
                  </label>
                  <input
                    type="date"
                    value={formStartsOn}
                    onChange={(e) => setFormStartsOn(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#776de8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Fecha Fin (YYYY-MM-DD)
                  </label>
                  <input
                    type="date"
                    value={formEndsOn}
                    onChange={(e) => setFormEndsOn(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#776de8]"
                  />
                </div>
              </div>

              {editingContract && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActiveContractCheck"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-[#776de8] focus:ring-[#776de8]"
                  />
                  <label htmlFor="isActiveContractCheck" className="text-xs text-slate-300 font-medium cursor-pointer">
                    Contrato Vigente / Activo
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formClientId}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#776de8] hover:bg-[#6c61e4] disabled:opacity-50 transition  cursor-pointer"
                >
                  {submitting ? 'Guardando...' : editingContract ? 'Actualizar' : 'Registrar Contrato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
