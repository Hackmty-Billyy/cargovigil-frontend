import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Truck,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  Check,
  Shield,
  Activity,
} from 'lucide-react';

interface LoginPageProps {
  onBackToHome: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onBackToHome }) => {
  const { login, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
    } catch {
      // Handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-950 flex flex-col lg:flex-row font-sans">
      {/* LEFT PANEL — brand/info sidebar */}
      <div className="lg:w-[45%] min-h-[280px] lg:min-h-screen bg-gray-900 border-b lg:border-b-0 lg:border-r border-gray-800 flex flex-col justify-between p-8 sm:p-10 lg:p-14">
        {/* Top */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base text-white tracking-tight">CargoVigil</span>
          </div>
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Inicio
          </button>
        </div>

        {/* Middle — headline */}
        <div className="my-auto py-10 space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-500">
            Logistics & Fintech Platform
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
            Bienvenido de vuelta
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
            Accede a tu panel de operaciones, telemetría en tiempo real y control financiero de flotas.
          </p>

          {/* Feature bullets */}
          <ul className="space-y-2.5 pt-4">
            {[
              { icon: Shield, text: 'Autenticación segura con TOTP 2FA' },
              { icon: Activity, text: 'Radar de operaciones en tiempo real' },
              { icon: Truck, text: 'Gestión multi-tenant de flotas' },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2.5 text-xs text-gray-400">
                <span className="w-5 h-5 rounded-md bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0">
                  <Icon className="w-3 h-3 text-blue-400" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom */}
        <div className="text-xs text-gray-600">
          &copy; {new Date().getFullYear()} CargoVigil Technologies
        </div>
      </div>

      {/* RIGHT PANEL — login form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-10 lg:px-16 py-14">
        <div className="w-full max-w-sm space-y-6">
          {/* Header */}
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-white tracking-tight">Iniciar sesión</h2>
            <p className="text-sm text-gray-400">Ingresa tus credenciales de acceso.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-400">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@empresa.mx"
                className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-400">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label
                onClick={() => setRememberMe(!rememberMe)}
                className="flex items-center gap-2 cursor-pointer select-none text-gray-400 hover:text-gray-200 transition"
              >
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center transition border ${
                    rememberMe ? 'bg-blue-600 border-blue-600' : 'border-gray-600 bg-transparent'
                  }`}
                >
                  {rememberMe && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                </div>
                <span>Recordar sesión</span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || !email.trim() || !password}
              className="w-full py-2.5 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Iniciar sesión</span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="pt-2 text-center text-xs text-gray-500">
            <span>¿No tienes cuenta? </span>
            <button
              type="button"
              onClick={onBackToHome}
              className="font-semibold text-blue-400 hover:text-blue-300 transition cursor-pointer"
            >
              Contáctanos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
