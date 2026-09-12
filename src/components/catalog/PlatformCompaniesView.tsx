import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { Company } from '../../types/company';
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Shield,
  Calendar,
} from 'lucide-react';

export const PlatformCompaniesView: React.FC = () => {
  const { accessToken } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('Password123!');
  const [submitting, setSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  const normalizeCompany = (raw: any): Company => ({
    id: raw.id || raw.ID || '',
    name: raw.name || raw.Name || 'Sin Nombre',
    is_active: raw.is_active !== undefined ? raw.is_active : (raw.IsActive !== undefined ? raw.IsActive : true),
    created_at: raw.created_at || raw.CreatedAt || new Date().toISOString(),
    updated_at: raw.updated_at || raw.UpdatedAt || new Date().toISOString(),
  });

  const fetchCompanies = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const rawList = await api.listCompanies(accessToken);
      const list = Array.isArray(rawList) ? rawList.map(normalizeCompany) : [];
      setCompanies(list);
    } catch (err: any) {
      setError(err.message || 'Error al obtener la lista de empresas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [accessToken]);

  const handleToggleActive = async (company: Company) => {
    if (!accessToken) return;
    const newStatus = !company.is_active;
    // Optimistic UI update
    setCompanies((prev) =>
      prev.map((c) => (c.id === company.id ? { ...c, is_active: newStatus } : c))
    );
    try {
      await api.setCompanyActive(accessToken, company.id, newStatus);
    } catch (err: any) {
      // Revert on error
      setCompanies((prev) =>
        prev.map((c) => (c.id === company.id ? { ...c, is_active: company.is_active } : c))
      );
      alert(`Error al actualizar estado: ${err.message}`);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    try {
      setSubmitting(true);
      setError(null);
      const res = await api.createCompany(accessToken, {
        company_name: formName.trim(),
        email: formEmail.trim(),
        password: formPassword,
      });

      setModalSuccess(
        `Empresa "${formName}" creada con éxito. Admin fundador: ${res.email}`
      );
      setFormName('');
      setFormEmail('');
      setFormPassword('Password123!');
      await fetchCompanies();
      setTimeout(() => {
        setIsModalOpen(false);
        setModalSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al crear la empresa');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = companies.filter((c) => {
    const name = c.name || '';
    const id = c.id || '';
    return (
      name.toLowerCase().includes(search.toLowerCase()) ||
      id.toLowerCase().includes(search.toLowerCase())
    );
  });

  const activeCount = companies.filter((c) => c.is_active).length;

  return (
    <div className="space-y-6">
      {/* Platform Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-[#776de8]/30 p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-[#776de8]/20 text-[#bbb3ff] border border-[#776de8]/40 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#776de8]" />
                Super Admin Staff
              </span>
              <span className="text-xs text-slate-400 font-medium">Control de Tenancy</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Gestión Global de Empresas
            </h2>
            <p className="text-xs text-slate-400 max-w-xl">
              Alta restringida y administración de empresas clientes con sus administradores fundadores. Cada empresa opera en aislamiento multi-tenant estricto.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#776de8] to-[#5b4fdf] hover:from-[#6c61e4] hover:to-[#5044d4] text-white font-semibold text-xs shadow-lg shadow-[#776de8]/25 flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Empresa</span>
            </button>
            <button
              onClick={fetchCompanies}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
              title="Refrescar"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-medium text-slate-400">Total Empresas</span>
          <div className="text-2xl font-bold text-white mt-1">{companies.length}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Empresas registradas en plataforma</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-medium text-slate-400">Empresas Activas</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{activeCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Operando catálogo y rutas</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-medium text-slate-400">Empresas Suspendidas</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            {companies.length - activeCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Acceso temporalmente pausado</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre o UUID de empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#776de8]"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
          {error}
        </div>
      )}

      {/* Companies List Table */}
      <div className="overflow-hidden rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Empresa</th>
                <th className="py-3.5 px-4 font-semibold">UUID / Tenant ID</th>
                <th className="py-3.5 px-4 font-semibold">Fecha de Alta</th>
                <th className="py-3.5 px-4 font-semibold text-center">Estado</th>
                <th className="py-3.5 px-4 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading && companies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#776de8]" />
                    Cargando empresas...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No se encontraron empresas con ese criterio.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#776de8]/15 border border-[#776de8]/30 flex items-center justify-center text-[#bbb3ff]">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">{c.name}</div>
                        <span className="text-[10px] text-slate-500">Tenant aislado</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                        <span>{c.id}</span>
                        <button
                          onClick={() => copyToClipboard(c.id)}
                          className="p-1 hover:text-white transition cursor-pointer"
                          title="Copiar UUID"
                        >
                          {copiedId === c.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                          c.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {c.is_active ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Activa
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" /> Inactiva
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleActive(c)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border ${
                          c.is_active
                            ? 'bg-slate-800 hover:bg-amber-500/10 hover:text-amber-300 hover:border-amber-500/30 text-slate-300 border-slate-700'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {c.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Company */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#776de8]/15 text-[#bbb3ff] border border-[#776de8]/30">
                  <Sparkles className="w-5 h-5 text-[#776de8]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Dar de Alta Nueva Empresa</h3>
                  <p className="text-xs text-slate-400">
                    Crea el tenant y su usuario administrador inicial
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

            {modalSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                {modalSuccess}
              </div>
            )}

            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nombre Comercial de la Empresa
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Logística Continental S.A."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#776de8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Correo del Admin Fundador
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@logistica.test"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#776de8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Contraseña Inicial del Admin
                </label>
                <input
                  type="text"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#776de8] font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Mínimo 8 caracteres (mayúscula, minúscula, número y símbolo).
                </p>
              </div>

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
                  {submitting ? 'Creando...' : 'Guardar y Activar Empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
