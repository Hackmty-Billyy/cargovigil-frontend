import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  ShieldCheck,
  X,
  Copy,
  Check,
  Download,
  Key,
  RefreshCw,
  AlertTriangle,
  QrCode,
} from 'lucide-react';

interface SecuritySettingsModalProps {
  onClose: () => void;
}

export const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({ onClose }) => {
  const { user, accessToken, refreshProfile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Enroll state
  const [secret, setSecret] = useState<string | null>(null);
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Start enrollment if not enabled
  useEffect(() => {
    if (user && !user.totp_enabled && accessToken && !secret) {
      handleStartEnroll();
    }
  }, [user, accessToken]);

  const handleStartEnroll = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.enrollTOTP(accessToken);
      setSecret(data.secret);
      setOtpauthUrl(data.otpauth_url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar enrolamiento 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !verifyCode.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.confirmTOTP(accessToken, verifyCode.trim());
      setRecoveryCodes(res.recovery_codes);
      setSuccess('¡Autenticación de dos factores activada con éxito!');
      await refreshProfile();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Código 2FA incorrecto. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateCodes = async () => {
    if (!accessToken) return;
    if (!window.confirm('¿Regenerar códigos de recuperación? Los códigos anteriores quedarán invalidados.')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.regenerateRecoveryCodes(accessToken);
      setRecoveryCodes(res.recovery_codes);
      setSuccess('Se han generado nuevos códigos de recuperación de emergencia.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al regenerar códigos de recuperación');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: 'key' | 'codes') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    }
  };

  const downloadCodes = () => {
    if (!recoveryCodes) return;
    const content = `CARGOVIGIL - CÓDIGOS DE RECUPERACIÓN DE EMERGENCIA (2FA)\nUsuario: ${user?.email}\nFecha: ${new Date().toLocaleString()}\n\n` +
      recoveryCodes.map((c, i) => `${i + 1}. ${c}`).join('\n') +
      `\n\nGuarda estos códigos en un lugar seguro. Cada código solo puede ser usado una vez.`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cargovigil-recovery-codes-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl ring-1 ring-white/10">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            {user?.totp_enabled ? <ShieldCheck className="w-6 h-6 text-emerald-400" /> : <QrCode className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Seguridad & Autenticación 2FA
            </h2>
            <p className="text-xs text-slate-400">
              Protección de credenciales y acceso a la plataforma
            </p>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* If 2FA is already enabled and no newly generated recovery codes being shown */}
        {user?.totp_enabled && !recoveryCodes && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-emerald-300">2FA está Activo</h4>
                <p className="text-xs text-slate-300 mt-1">
                  Tu cuenta está asegurada con un segundo factor TOTP cifrado con AES-256-GCM.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Códigos de Recuperación de Emergencia
              </h4>
              <p className="text-xs text-slate-400">
                Si perdiste tus códigos de respaldo o los usaste todos, puedes generar un nuevo conjunto de códigos seguros.
              </p>
              <button
                onClick={handleRegenerateCodes}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Regenerar Códigos de Emergencia</span>
              </button>
            </div>
          </div>
        )}

        {/* Display Recovery Codes Grid */}
        {recoveryCodes && (
          <div className="space-y-5 animate-fadeIn">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">¡Guarda estos códigos ahora!</p>
                <p className="text-slate-300 mt-1">
                  No podrás volver a verlos. Cada código sirve para acceder una sola vez si pierdes tu dispositivo autenticador.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-indigo-300 text-center">
              {recoveryCodes.map((c, idx) => (
                <div key={idx} className="p-2 bg-slate-900/90 rounded border border-slate-800/80">
                  {c}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(recoveryCodes.join('\n'), 'codes')}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 flex items-center justify-center gap-1.5 transition"
              >
                {copiedCodes ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCodes ? 'Copiados' : 'Copiar Todos'}</span>
              </button>

              <button
                onClick={downloadCodes}
                className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar (.txt)</span>
              </button>
            </div>
          </div>
        )}

        {/* Enrollment Flow (if 2FA is NOT enabled yet and no recovery codes shown) */}
        {!user?.totp_enabled && !recoveryCodes && (
          <div className="space-y-5">
            {otpauthUrl && (
              <div className="flex flex-col items-center justify-center p-5 bg-white rounded-2xl shadow-inner max-w-[220px] mx-auto">
                <QRCodeSVG value={otpauthUrl} size={180} level="M" />
                <span className="text-[10px] text-slate-600 font-mono mt-2">Escanea con tu App TOTP</span>
              </div>
            )}

            {secret && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Clave Secreta Manual:</span>
                  <button
                    onClick={() => copyToClipboard(secret, 'key')}
                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[11px]"
                  >
                    {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey ? 'Copiada' : 'Copiar'}</span>
                  </button>
                </div>
                <code className="text-xs font-mono text-indigo-300 break-all select-all block">
                  {secret}
                </code>
              </div>
            )}

            <form onSubmit={handleConfirmEnroll} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Ingresa el código de 6 dígitos para confirmar
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  placeholder="000000"
                  className="w-full text-center tracking-widest text-lg font-mono py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading || verifyCode.length < 6}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Key className="w-3.5 h-3.5" />
                    <span>Confirmar y Activar 2FA</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
