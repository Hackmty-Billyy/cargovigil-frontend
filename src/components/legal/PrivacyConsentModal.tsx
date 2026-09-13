import React, { useState } from 'react';
import { Shield, Check, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PrivacyNoticeContent } from './PrivacyNoticeContent';
import { recordPrivacyNoticeAcceptance } from './privacyConsentStorage';

interface PrivacyConsentModalProps {
  userId: string;
  onAccept: () => void;
}

/**
 * Gate bloqueante que se muestra en el primer login de cada usuario (y de
 * nuevo si PRIVACY_NOTICE_LAST_UPDATED cambia). Exige DOS aceptaciones
 * separadas a propósito: la LFPDPPP permite consentimiento tácito para la
 * mayoría de las finalidades, pero exige consentimiento EXPRESO para datos
 * patrimoniales/financieros (las cuentas bancarias y saldos que Tesorería
 * maneja) — mezclar ambas casillas en una sola volvería tácito algo que la
 * ley pide expreso.
 */
export const PrivacyConsentModal: React.FC<PrivacyConsentModalProps> = ({ userId, onAccept }) => {
  const { logout } = useAuth();
  const [acceptedGeneral, setAcceptedGeneral] = useState(false);
  const [acceptedFinancial, setAcceptedFinancial] = useState(false);

  const canContinue = acceptedGeneral && acceptedFinancial;

  const handleAccept = () => {
    if (!canContinue) return;
    recordPrivacyNoticeAcceptance(userId);
    onAccept();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white border border-slate-100 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-4 shrink-0">
          <div className="inline-flex p-3.5 rounded-2xl bg-[#bbb3ff]/25 text-[#776de8] mb-3 shadow-inner">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Antes de continuar: Aviso de Privacidad
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            CargoVigil trata datos financieros de tu empresa (cuentas bancarias y saldos) para
            operar la tesorería predictiva. Necesitamos tu consentimiento antes de darte acceso.
          </p>
        </div>

        {/* Scrollable notice body */}
        <div className="flex-1 overflow-y-auto px-8 py-2 border-y border-slate-100">
          <PrivacyNoticeContent />
        </div>

        {/* Checkboxes + actions */}
        <div className="px-8 py-6 space-y-4 shrink-0 bg-slate-50">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <div
              onClick={() => setAcceptedGeneral((v) => !v)}
              className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center transition border shrink-0 ${
                acceptedGeneral ? 'bg-[#776de8] border-[#776de8]' : 'border-slate-400 bg-white'
              }`}
            >
              {acceptedGeneral && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
            </div>
            <span
              onClick={() => setAcceptedGeneral((v) => !v)}
              className="text-xs text-slate-700 leading-relaxed"
            >
              He leído y acepto el Aviso de Privacidad, incluyendo el tratamiento de mis datos
              de identificación y contacto para operar mi cuenta.
            </span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <div
              onClick={() => setAcceptedFinancial((v) => !v)}
              className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center transition border shrink-0 ${
                acceptedFinancial ? 'bg-[#776de8] border-[#776de8]' : 'border-slate-400 bg-white'
              }`}
            >
              {acceptedFinancial && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
            </div>
            <span
              onClick={() => setAcceptedFinancial((v) => !v)}
              className="text-xs text-slate-700 leading-relaxed"
            >
              <span className="font-semibold text-amber-600">Consentimiento expreso:</span> autorizo
              el tratamiento de los datos patrimoniales y financieros de mi empresa (cuentas
              bancarias, saldos, facturas y gastos) descritos en la sección 2 del aviso, necesarios
              para las funciones de Tesorería y Colchón de Contingencia.
            </span>
          </label>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => logout()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              No acepto, cerrar sesión
            </button>
            <button
              type="button"
              disabled={!canContinue}
              onClick={handleAccept}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#776de8] hover:bg-[#6c61e4] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              Aceptar y continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
