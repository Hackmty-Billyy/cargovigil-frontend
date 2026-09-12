import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';

export const TOTPVerificationModal: React.FC = () => {
  const { verifyTOTP, cancelMFA, error } = useAuth();
  const [code, setCode] = useState('');
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsSubmitting(true);
    try {
      await verifyTOTP(code.trim());
    } catch {
      // Handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-7 shadow-2xl ring-1 ring-white/10">
        {/* Glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Back button */}
        <button
          type="button"
          onClick={cancelMFA}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-4 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al inicio de sesión</span>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-3 text-indigo-400">
            {isRecoveryMode ? <KeyRound className="w-7 h-7" /> : <ShieldAlert className="w-7 h-7" />}
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {isRecoveryMode ? 'Código de Recuperación' : 'Verificación de Dos Pasos (2FA)'}
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            {isRecoveryMode
              ? 'Ingresa uno de tus códigos de emergencia de respaldo para acceder a tu cuenta.'
              : 'Introduce el código de 6 dígitos generado por tu aplicación de autenticación (Google Authenticator, Authy, etc.).'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2 text-center">
              {isRecoveryMode ? 'Código de Emergencia' : 'Código de 6 Dígitos'}
            </label>
            <input
              type="text"
              autoFocus
              maxLength={isRecoveryMode ? 32 : 8}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={isRecoveryMode ? 'XXXX-XXXX-XXXX' : '000 000'}
              className="w-full text-center tracking-widest text-xl font-mono py-3 bg-slate-950/80 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !code.trim()}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Verificar y Acceder</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle recovery mode */}
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRecoveryMode(!isRecoveryMode);
              setCode('');
            }}
            className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline transition"
          >
            {isRecoveryMode
              ? '← Usar código TOTP normal de 6 dígitos'
              : '¿No tienes acceso a tu app autenticadora? Usa un código de recuperación'}
          </button>
        </div>
      </div>
    </div>
  );
};
