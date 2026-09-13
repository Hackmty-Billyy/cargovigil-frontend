import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';
import { PrivacyNoticeContent } from './PrivacyNoticeContent';

interface PrivacyNoticePageProps {
  onBack: () => void;
}

/**
 * Página pública del aviso de privacidad — accesible sin sesión, desde el
 * footer del landing y del login. Debe poder consultarse ANTES de crear
 * cuenta o iniciar sesión, no solo quedar escondida detrás del modal de
 * consentimiento (ese es solo el punto donde se exige aceptarlo).
 */
export const PrivacyNoticePage: React.FC<PrivacyNoticePageProps> = ({ onBack }) => (
  <div className="min-h-screen w-full bg-gray-950 font-sans">
    <div className="max-w-3xl mx-auto px-6 sm:px-10 py-14">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition cursor-pointer mb-8"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Volver
      </button>

      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Aviso de Privacidad
        </h1>
      </div>
      <p className="text-sm text-gray-400 mb-10 max-w-xl">
        Cómo CargoVigil recaba, usa y protege tus datos personales, conforme a la Ley Federal
        de Protección de Datos Personales en Posesión de los Particulares.
      </p>

      <PrivacyNoticeContent />
    </div>
  </div>
);
