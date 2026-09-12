import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { Vehicle, VehicleType } from '../../types/company';
import {
  Truck,
  Ship,
  Plane,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  AlertTriangle,
  Lock,
} from 'lucide-react';

export const VehiclesManager: React.FC = () => {
  const { accessToken, user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Can the current user write? (admin + operations = yes, finance = read-only)
  const canWrite = user?.role_name === 'admin' || user?.role_name === 'operations';

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formType, setFormType] = useState<VehicleType>('truck');
  const [formIdentifier, setFormIdentifier] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const normalizeVehicle = (raw: any): Vehicle => ({
    id: raw.id || raw.ID || '',
    company_id: raw.company_id || raw.CompanyID || '',
    type: (raw.type || raw.Type || 'truck').toLowerCase() as VehicleType,
    identifier: raw.identifier || raw.Identifier || '',
    is_active: raw.is_active !== undefined ? raw.is_active : (raw.IsActive !== undefined ? raw.IsActive : true),
    created_at: raw.created_at || raw.CreatedAt || new Date().toISOString(),
    updated_at: raw.updated_at || raw.UpdatedAt || new Date().toISOString(),
  });

  const fetchVehicles = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const rawList = await api.listVehicles(accessToken);
      const list = Array.isArray(rawList) ? rawList.map(normalizeVehicle) : [];
      setVehicles(list);
    } catch (err: any) {
      setError(err.message || 'Error al obtener catálogo de vehículos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [accessToken]);

  const openCreateModal = () => {
    setEditingVehicle(null);
    setFormType('truck');
    setFormIdentifier('');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (v: Vehicle) => {
    setEditingVehicle(v);
    setFormType(v.type);
    setFormIdentifier(v.identifier);
    setFormIsActive(v.is_active);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !canWrite) return;
    try {
      setSubmitting(true);
      setError(null);

      if (editingVehicle) {
        await api.updateVehicle(accessToken, editingVehicle.id, {
          type: formType,
          identifier: formIdentifier.trim(),
          is_active: formIsActive,
        });
      } else {
        await api.createVehicle(accessToken, {
          type: formType,
          identifier: formIdentifier.trim(),
        });
      }

      setIsModalOpen(false);
      await fetchVehicles();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el vehículo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, identifier: string) => {
    if (!accessToken || !canWrite) return;
    if (!window.confirm(`¿Estás seguro de eliminar el vehículo "${identifier}"?`)) return;

    try {
      setLoading(true);
      await api.deleteVehicle(accessToken, id);
      await fetchVehicles();
    } catch (err: any) {
      alert(`Error al eliminar vehículo: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filtered = vehicles.filter((v) => {
    const matchesSearch = v.identifier.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || v.type === filterType;
    return matchesSearch && matchesType;
  });

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'ship':
        return <Ship className="w-4 h-4 text-cyan-400" />;
      case 'plane':
        return <Plane className="w-4 h-4 text-purple-400" />;
      case 'truck':
      default:
        return <Truck className="w-4 h-4 text-[#776de8]" />;
    }
  };

  const getVehicleTypeName = (type: string) => {
    switch (type) {
      case 'ship':
        return 'Barco / Buque';
      case 'plane':
        return 'Avión de Carga';
      case 'truck':
      default:
        return 'Camión / Tracto';
    }
  };

  const trucksCount = vehicles.filter((v) => v.type === 'truck').length;
  const shipsCount = vehicles.filter((v) => v.type === 'ship').length;
  const planesCount = vehicles.filter((v) => v.type === 'plane').length;

  return (
    <div className="space-y-6">
      {/* Read-Only Notice for Finance */}
      {!canWrite && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5">
          <Lock className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            <strong>Modo Solo Lectura:</strong> Tu rol de <strong>Finanzas</strong> tiene acceso de consulta al catálogo de flotas. Las altas, modificaciones y bajas están reservadas para Administración y Operaciones.
          </span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#776de8]" />
            Catálogo de Flotas y Vehículos
          </h2>
          <p className="text-xs text-slate-400">
            Registro y control de unidades de transporte asignadas a la empresa
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canWrite && (
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-[#776de8] hover:bg-[#6c61e4] text-white font-semibold text-xs shadow-lg shadow-[#776de8]/20 flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Vehículo</span>
            </button>
          )}
          <button
            onClick={fetchVehicles}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            title="Refrescar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400">Total Unidades</span>
          <div className="text-xl font-bold text-white mt-0.5">{vehicles.length}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <Truck className="w-3.5 h-3.5 text-[#776de8]" /> Camiones
          </span>
          <div className="text-xl font-bold text-white mt-0.5">{trucksCount}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <Ship className="w-3.5 h-3.5 text-cyan-400" /> Barcos
          </span>
          <div className="text-xl font-bold text-white mt-0.5">{shipsCount}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <Plane className="w-3.5 h-3.5 text-purple-400" /> Aviones
          </span>
          <div className="text-xl font-bold text-white mt-0.5">{planesCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por placa, matrícula o identificador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#776de8]"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'truck', label: 'Camiones' },
            { id: 'ship', label: 'Barcos' },
            { id: 'plane', label: 'Aviones' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${
                filterType === tab.id
                  ? 'bg-[#776de8] text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Vehicles Table */}
      <div className="overflow-hidden rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Tipo</th>
                <th className="py-3.5 px-4 font-semibold">Identificador / Placa</th>
                <th className="py-3.5 px-4 font-semibold">ID Unidad</th>
                <th className="py-3.5 px-4 font-semibold text-center">Estado</th>
                {canWrite && <th className="py-3.5 px-4 font-semibold text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading && vehicles.length === 0 ? (
                <tr>
                  <td colSpan={canWrite ? 5 : 4} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#776de8]" />
                    Cargando vehículos...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={canWrite ? 5 : 4} className="py-12 text-center text-slate-500">
                    No se encontraron vehículos registrados.
                  </td>
                </tr>
              ) : (
                filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 font-medium text-white">
                        <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700">
                          {getVehicleIcon(v.type)}
                        </div>
                        <span>{getVehicleTypeName(v.type)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-sm text-[#bbb3ff] bg-[#776de8]/10 px-2.5 py-1 rounded-md border border-[#776de8]/25">
                        {v.identifier}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 truncate max-w-[140px]" title={v.id}>
                      {v.id}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          v.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {v.is_active ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Operativo
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" /> Inactivo
                          </>
                        )}
                      </span>
                    </td>
                    {canWrite && (
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(v)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(v.id, v.identifier)}
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

      {/* Modal: Create or Edit Vehicle */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#776de8]/15 text-[#bbb3ff] border border-[#776de8]/30">
                  <Truck className="w-5 h-5 text-[#776de8]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingVehicle ? 'Editar Vehículo' : 'Registrar Nuevo Vehículo'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingVehicle ? 'Modifica los datos de la unidad' : 'Asocia una nueva unidad a tu flota'}
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
                  Tipo de Vehículo
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'truck', label: 'Camión', icon: Truck },
                    { type: 'ship', label: 'Barco', icon: Ship },
                    { type: 'plane', label: 'Avión', icon: Plane },
                  ].map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        type="button"
                        key={opt.type}
                        onClick={() => setFormType(opt.type as VehicleType)}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold transition cursor-pointer ${
                          formType === opt.type
                            ? 'bg-[#776de8]/20 border-[#776de8] text-white shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Identificador / Placa / Matrícula
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. TRK-4892-NL o C-VIGIL-01"
                  value={formIdentifier}
                  onChange={(e) => setFormIdentifier(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#776de8] font-mono uppercase"
                />
              </div>

              {editingVehicle && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-[#776de8] focus:ring-[#776de8]"
                  />
                  <label htmlFor="isActiveCheck" className="text-xs text-slate-300 font-medium cursor-pointer">
                    Vehículo Operativo / Activo
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
                  {submitting ? 'Guardando...' : editingVehicle ? 'Actualizar' : 'Registrar Unidad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
