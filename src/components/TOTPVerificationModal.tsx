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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-white border border-slate-100 rounded-3xl p-8 shadow-2xl">
        {/* Glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#bbb3ff]/30 rounded-full blur-2xl pointer-events-none" />

        {/* Back button */}
        <button
          type="button"
          onClick={cancelMFA}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-4 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al inicio de sesión</span>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3.5 rounded-2xl bg-[#bbb3ff]/25 text-[#776de8] mb-3 shadow-inner">
            {isRecoveryMode ? <KeyRound className="w-7 h-7" /> : <ShieldAlert className="w-7 h-7" />}
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isRecoveryMode ? 'Código de Recuperación' : 'Verificación 2FA'}
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            {isRecoveryMode
              ? 'Ingresa uno de tus códigos de emergencia de respaldo para acceder a tu cuenta.'
              : 'Introduce el código de 6 dígitos generado por tu aplicación de autenticación (Google Authenticator, Authy, etc.).'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 text-center">
              {isRecoveryMode ? 'Código de Emergencia' : 'Código de 6 Dígitos'}
            </label>
            <input
              type="text"
              autoFocus
              maxLength={isRecoveryMode ? 32 : 8}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={isRecoveryMode ? 'XXXX-XXXX-XXXX' : '000 000'}
              className="w-full text-center tracking-widest text-xl font-mono py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#776de8]/30 focus:border-[#776de8] transition shadow-2xs"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !code.trim()}
            className="w-full py-4 px-6 rounded-xl bg-[#776de8] hover:bg-[#685ddb] text-white font-bold text-sm shadow-md shadow-[#776de8]/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
            className="text-xs text-[#776de8] hover:underline font-semibold transition cursor-pointer"
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
