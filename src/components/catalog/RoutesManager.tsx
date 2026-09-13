import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { Route } from '../../types/company';
import {
  MapPin,
  ArrowRight,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  AlertTriangle,
  Lock,
  Navigation,
} from 'lucide-react';

export const RoutesManager: React.FC = () => {
  const { accessToken, user } = useAuth();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const canWrite = user?.role_name === 'admin' || user?.role_name === 'operations';

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [formOrigin, setFormOrigin] = useState('');
  const [formDestination, setFormDestination] = useState('');
  const [formDistance, setFormDistance] = useState<string>('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const normalizeRoute = (raw: any): Route => ({
    id: raw.id || raw.ID || '',
    company_id: raw.company_id || raw.CompanyID || '',
    origin: raw.origin || raw.Origin || '',
    destination: raw.destination || raw.Destination || '',
    distance_km: raw.distance_km !== undefined ? raw.distance_km : (raw.DistanceKM !== undefined ? raw.DistanceKM : null),
    is_active: raw.is_active !== undefined ? raw.is_active : (raw.IsActive !== undefined ? raw.IsActive : true),
    created_at: raw.created_at || raw.CreatedAt || new Date().toISOString(),
    updated_at: raw.updated_at || raw.UpdatedAt || new Date().toISOString(),
  });

  const fetchRoutes = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const rawList = await api.listRoutes(accessToken);
      const list = Array.isArray(rawList) ? rawList.map(normalizeRoute) : [];
      setRoutes(list);
    } catch (err: any) {
      setError(err.message || 'Error al obtener catálogo de rutas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, [accessToken]);

  const openCreateModal = () => {
    setEditingRoute(null);
    setFormOrigin('');
    setFormDestination('');
    setFormDistance('');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (r: Route) => {
    setEditingRoute(r);
    setFormOrigin(r.origin);
    setFormDestination(r.destination);
    setFormDistance(r.distance_km ? String(r.distance_km) : '');
    setFormIsActive(r.is_active);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !canWrite) return;
    try {
      setSubmitting(true);
      setError(null);
      const parsedDist = formDistance.trim() ? parseFloat(formDistance) : null;

      if (editingRoute) {
        await api.updateRoute(accessToken, editingRoute.id, {
          origin: formOrigin.trim(),
          destination: formDestination.trim(),
          distance_km: parsedDist,
          is_active: formIsActive,
        });
      } else {
        await api.createRoute(accessToken, {
          origin: formOrigin.trim(),
          destination: formDestination.trim(),
          distance_km: parsedDist,
        });
      }

      setIsModalOpen(false);
      await fetchRoutes();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la ruta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!accessToken || !canWrite) return;
    if (!window.confirm(`¿Estás seguro de eliminar la ruta "${name}"?`)) return;

    try {
      setLoading(true);
      await api.deleteRoute(accessToken, id);
      await fetchRoutes();
    } catch (err: any) {
      alert(`Error al eliminar ruta: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filtered = routes.filter(
    (r) =>
      r.origin.toLowerCase().includes(search.toLowerCase()) ||
      r.destination.toLowerCase().includes(search.toLowerCase())
  );

  const totalKm = routes.reduce((acc, r) => acc + (r.distance_km || 0), 0);

  return (
    <div className="space-y-6">
      {!canWrite && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5">
          <Lock className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            <strong>Modo Solo Lectura:</strong> Tu rol de <strong>Finanzas</strong> tiene acceso de consulta a las rutas. Las modificaciones están reservadas para Administración y Operaciones.
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Navigation className="w-5 h-5 text-[#776de8]" />
            Catálogo de Rutas Logísticas
          </h2>
          <p className="text-xs text-slate-400">
            Definición de trayectos, distancias y corredores de transporte
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canWrite && (
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-[#776de8] hover:bg-[#6c61e4] text-white font-semibold text-xs  flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Ruta</span>
            </button>
          )}
          <button
            onClick={fetchRoutes}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            title="Refrescar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400">Total Rutas</span>
          <div className="text-xl font-bold text-white mt-0.5">{routes.length}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400">Kilometraje Total</span>
          <div className="text-xl font-bold text-emerald-400 mt-0.5">
            {totalKm.toLocaleString()} km
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400">Rutas Activas</span>
          <div className="text-xl font-bold text-[#bbb3ff] mt-0.5">
            {routes.filter((r) => r.is_active).length}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar por origen o destino..."
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

      {/* Routes Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading && routes.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#776de8]" />
            Cargando rutas...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-slate-500">
            No se encontraron rutas registradas.
          </div>
        ) : (
          filtered.map((r) => (
            <div
              key={r.id}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 text-sm font-bold text-white flex-wrap">
                    <span className="flex items-center gap-1 text-slate-200">
                      <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                      {r.origin}
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#776de8] shrink-0" />
                    <span className="flex items-center gap-1 text-white">
                      <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                      {r.destination}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                    {r.distance_km ? (
                      <span className="px-2 py-0.5 rounded-md bg-[#776de8]/10 text-[#bbb3ff] border border-[#776de8]/20 font-semibold text-[11px]">
                        {r.distance_km.toLocaleString()} km
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Distancia no especificada</span>
                    )}
                    <span className="font-mono text-[10px] text-slate-500 truncate max-w-[120px]" title={r.id}>
                      ID: {r.id}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      r.is_active
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {r.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {r.is_active ? 'Activa' : 'Pausada'}
                  </span>

                  {canWrite && (
                    <div className="flex items-center gap-1 ml-1">
                      <button
                        onClick={() => openEditModal(r)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(r.id, `${r.origin} -> ${r.destination}`)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#776de8]/15 text-[#bbb3ff] border border-[#776de8]/30">
                  <Navigation className="w-5 h-5 text-[#776de8]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingRoute ? 'Editar Ruta' : 'Crear Nueva Ruta'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingRoute ? 'Modifica el corredor de transporte' : 'Define origen, destino y kilometraje'}
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
                  Punto de Origen
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Puerto de Manzanillo, Colima"
                  value={formOrigin}
                  onChange={(e) => setFormOrigin(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#776de8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Punto de Destino
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Centro Logístico CDMX Norte"
                  value={formDestination}
                  onChange={(e) => setFormDestination(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#776de8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Distancia Estimada (KM) - Opcional
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Ej. 750"
                  value={formDistance}
                  onChange={(e) => setFormDistance(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#776de8]"
                />
              </div>

              {editingRoute && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActiveRouteCheck"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-[#776de8] focus:ring-[#776de8]"
                  />
                  <label htmlFor="isActiveRouteCheck" className="text-xs text-slate-300 font-medium cursor-pointer">
                    Ruta Activa / Habilitada
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
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#776de8] hover:bg-[#6c61e4] disabled:opacity-50 transition  cursor-pointer"
                >
                  {submitting ? 'Guardando...' : editingRoute ? 'Actualizar' : 'Crear Ruta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
