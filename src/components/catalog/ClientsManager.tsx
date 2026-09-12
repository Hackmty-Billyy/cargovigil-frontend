import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { Client } from '../../types/company';
import {
  Users,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  AlertTriangle,
  Lock,
  Building,
  Calendar,
} from 'lucide-react';

export const ClientsManager: React.FC = () => {
  const { accessToken, user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const canWrite = user?.role_name === 'admin' || user?.role_name === 'operations';

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formName, setFormName] = useState('');
  const [formTaxId, setFormTaxId] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const normalizeClient = (raw: any): Client => ({
    id: raw.id || raw.ID || '',
    company_id: raw.company_id || raw.CompanyID || '',
    name: raw.name || raw.Name || 'Sin Nombre',
    tax_id: raw.tax_id !== undefined ? raw.tax_id : (raw.TaxID !== undefined ? raw.TaxID : null),
    is_active: raw.is_active !== undefined ? raw.is_active : (raw.IsActive !== undefined ? raw.IsActive : true),
    created_at: raw.created_at || raw.CreatedAt || new Date().toISOString(),
    updated_at: raw.updated_at || raw.UpdatedAt || new Date().toISOString(),
  });

  const fetchClients = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const rawList = await api.listClients(accessToken);
      const list = Array.isArray(rawList) ? rawList.map(normalizeClient) : [];
      setClients(list);
    } catch (err: any) {
      setError(err.message || 'Error al obtener catálogo de clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [accessToken]);

  const openCreateModal = () => {
    setEditingClient(null);
    setFormName('');
    setFormTaxId('');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (c: Client) => {
    setEditingClient(c);
    setFormName(c.name);
    setFormTaxId(c.tax_id || '');
    setFormIsActive(c.is_active);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !canWrite) return;
    try {
      setSubmitting(true);
      setError(null);
      const parsedTaxId = formTaxId.trim() ? formTaxId.trim().toUpperCase() : null;

      if (editingClient) {
        await api.updateClient(accessToken, editingClient.id, {
          name: formName.trim(),
          tax_id: parsedTaxId,
          is_active: formIsActive,
        });
      } else {
        await api.createClient(accessToken, {
          name: formName.trim(),
          tax_id: parsedTaxId,
        });
      }

      setIsModalOpen(false);
      await fetchClients();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el cliente');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!accessToken || !canWrite) return;
    if (!window.confirm(`¿Estás seguro de eliminar al cliente "${name}"?`)) return;

    try {
      setLoading(true);
      await api.deleteClient(accessToken, id);
      await fetchClients();
    } catch (err: any) {
      alert(`Error al eliminar cliente: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.tax_id && c.tax_id.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {!canWrite && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5">
          <Lock className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            <strong>Modo Solo Lectura:</strong> Tu rol de <strong>Finanzas</strong> tiene acceso de consulta a los clientes. Las altas y modificaciones están reservadas para Administración y Operaciones.
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-[#776de8]" />
            Catálogo de Clientes y Cuentas
          </h2>
          <p className="text-xs text-slate-400">
            Registro de contratistas, generadores de carga y destinatarios
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canWrite && (
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-[#776de8] hover:bg-[#6c61e4] text-white font-semibold text-xs shadow-lg shadow-[#776de8]/20 flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Cliente</span>
            </button>
          )}
          <button
            onClick={fetchClients}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            title="Refrescar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar cliente por razón social, nombre o RFC / Tax ID..."
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

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Cliente / Razón Social</th>
                <th className="py-3.5 px-4 font-semibold">RFC / Tax ID</th>
                <th className="py-3.5 px-4 font-semibold">Fecha de Registro</th>
                <th className="py-3.5 px-4 font-semibold text-center">Estado</th>
                {canWrite && <th className="py-3.5 px-4 font-semibold text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading && clients.length === 0 ? (
                <tr>
                  <td colSpan={canWrite ? 5 : 4} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#776de8]" />
                    Cargando clientes...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={canWrite ? 5 : 4} className="py-12 text-center text-slate-500">
                    No se encontraron clientes registrados.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5 font-medium text-white">
                        <div className="w-8 h-8 rounded-lg bg-[#776de8]/15 border border-[#776de8]/30 flex items-center justify-center text-[#bbb3ff]">
                          <Building className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white">{c.name}</div>
                          <span className="font-mono text-[10px] text-slate-500" title={c.id}>
                            ID: {c.id}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {c.tax_id ? (
                        <span className="font-mono text-xs text-[#bbb3ff] bg-slate-950 px-2 py-1 rounded border border-slate-800 font-semibold">
                          {c.tax_id}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px] italic">Sin RFC registrado</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(c.created_at).toLocaleDateString()}
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
                        {c.is_active ? 'Activo' : 'Inactivo'}
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
                            onClick={() => handleDelete(c.id, c.name)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
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
                  <Building className="w-5 h-5 text-[#776de8]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingClient ? 'Editar Cliente' : 'Registrar Cliente'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingClient ? 'Actualiza los datos fiscales del cliente' : 'Agrega una cuenta comercial al catálogo'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nombre o Razón Social
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Distribuidora Automotriz del Norte S.A. de C.V."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#776de8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  RFC / Tax ID (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. DAN190822K34"
                  value={formTaxId}
                  onChange={(e) => setFormTaxId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#776de8] font-mono uppercase"
                />
              </div>

              {editingClient && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActiveClientCheck"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-[#776de8] focus:ring-[#776de8]"
                  />
                  <label htmlFor="isActiveClientCheck" className="text-xs text-slate-300 font-medium cursor-pointer">
                    Cliente Activo / Habilitado para Contratos
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
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#776de8] hover:bg-[#6c61e4] disabled:opacity-50 transition shadow-lg shadow-[#776de8]/20 cursor-pointer"
                >
                  {submitting ? 'Guardando...' : editingClient ? 'Actualizar' : 'Guardar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
