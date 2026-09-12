import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Shield, AlertCircle, ArrowRight, X } from 'lucide-react';

interface LoginFormProps {
  onClose?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onClose }) => {
  const { login, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
      if (onClose) onClose();
    } catch {
      // Handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="relative rounded-3xl bg-white/95 border border-purple-100 p-8 shadow-2xl backdrop-blur-xl text-slate-800">
        {/* Close Button if modal */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-[#bbb3ff]/30 text-[#776de8] mb-3 shadow-inner">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">CargoVigil</h2>
          <p className="text-xs text-slate-500 mt-1">
            Ingresa tus credenciales para acceder a la plataforma
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@cargovigil.test"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#776de8] focus:border-[#776de8] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#776de8] focus:border-[#776de8] transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !email.trim() || !password}
            className="w-full mt-2 py-3 px-4 rounded-full bg-gradient-to-r from-[#776de8] to-[#6054e2] hover:from-[#6c61e4] hover:to-[#5448dc] text-white font-bold text-sm shadow-lg shadow-[#776de8]/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Iniciar Sesión</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Cuentas de prueba: <span className="font-mono text-[#776de8] font-semibold">admin@cargovigil.test</span> (Pass: <span className="font-mono">Password123!</span>)
          </p>
        </div>
      </div>
    </div>
  );
};
