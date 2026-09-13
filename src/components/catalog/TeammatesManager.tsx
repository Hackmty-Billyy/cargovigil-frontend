import React, { useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  UserPlus,
  ShieldCheck,
  Briefcase,
  DollarSign,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Users,
} from 'lucide-react';

export const TeammatesManager: React.FC = () => {
  const { accessToken, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password123!');
  const [role, setRole] = useState<'operations' | 'finance'>('operations');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isAdmin = user?.role_name === 'admin';

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !isAdmin) return;

    try {
      setSubmitting(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await api.inviteTeammate(accessToken, {
        email: email.trim(),
        password,
        role,
      });

      setSuccessMsg(
        `Usuario "${res.email}" creado exitosamente con el rol de "${res.role}". Ya puede iniciar sesión con la contraseña asignada.`
      );
      setEmail('');
      setPassword('Password123!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al registrar al miembro del equipo');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
        <Lock className="w-4 h-4 text-amber-400" />
        <span>Solo los administradores de la empresa pueden gestionar e invitar colaboradores.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Users className="w-5 h-5 text-[#776de8]" />
          Gestión del Equipo de la Empresa
        </h2>
        <p className="text-xs text-slate-400">
          Invita operadores y analistas financieros para colaborar dentro del espacio de tu empresa
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Invite Form */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#776de8]/15 text-[#bbb3ff] border border-[#776de8]/30">
              <UserPlus className="w-5 h-5 text-[#776de8]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Dar de Alta Colaborador</h3>
              <p className="text-xs text-slate-400">
                Se vinculará automáticamente a tu empresa ({user?.company_id})
              </p>
            </div>
          </div>

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                placeholder="operador@miempresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#776de8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Contraseña Temporal
              </label>
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#776de8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Rol Operativo Asignado
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('operations')}
                  className={`p-3.5 rounded-xl border flex flex-col items-start gap-1 transition cursor-pointer text-left ${
                    role === 'operations'
                      ? 'bg-[#776de8]/15 border-[#776de8] text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Briefcase className="w-4 h-4 text-[#776de8]" />
                    <span>Operaciones</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Lectura y escritura en todo el catálogo de flotas, rutas, clientes y contratos.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('finance')}
                  className={`p-3.5 rounded-xl border flex flex-col items-start gap-1 transition cursor-pointer text-left ${
                    role === 'finance'
                      ? 'bg-[#776de8]/15 border-[#776de8] text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>Finanzas</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Acceso de solo lectura para auditoría y consulta de costos y acuerdos.
                  </p>
                </button>
              </div>
            </div>

            <p className="text-[10.5px] text-slate-500 leading-relaxed">
              Se creará la cuenta con estos datos en nombre de esa persona. Al primer inicio de
              sesión se le pedirá aceptar el{' '}
              <span className="text-slate-400">Aviso de Privacidad</span> antes de darle acceso al
              panel.
            </p>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-[#776de8] hover:bg-[#6c61e4] disabled:opacity-50 transition  cursor-pointer"
              >
                {submitting ? 'Creando Usuario...' : 'Dar de Alta Colaborador'}
              </button>
            </div>
          </form>
        </div>

        {/* Roles Policy Overview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#776de8]" />
              Matriz de Permisos por Rol
            </h4>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                <span className="font-bold text-indigo-400">Administrador (Admin)</span>
                <p className="text-[11px] text-slate-400">
                  Control total del tenant, altas y modificaciones de catálogo, e invitación de nuevos colaboradores.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                <span className="font-bold text-[#bbb3ff]">Operaciones (Operations)</span>
                <p className="text-[11px] text-slate-400">
                  Gestión operativa diaria: creación y edición de vehículos, rutas de transporte, clientes y contratos.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                <span className="font-bold text-emerald-400">Finanzas (Finance)</span>
                <p className="text-[11px] text-slate-400">
                  Visualización y consulta segura. No tiene permisos de escritura en el catálogo (403 Forbidden).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
