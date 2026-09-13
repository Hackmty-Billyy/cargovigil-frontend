import React from 'react';
import {
  Truck,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Activity,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

interface LandingPageProps {
  onOpenLogin: () => void;
  onOpenPrivacy: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin, onOpenPrivacy }) => {
  return (
    <div className="w-full bg-gray-950 text-gray-100">

      {/* ── HERO ── */}
      <section id="home" className="border-b border-gray-800 pt-20 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 border border-blue-800/50 text-blue-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Plataforma activa — Logistics &amp; Fintech
          </div>

          {/* Headline */}
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1]">
              Gestión logística y financiera para flotas modernas
            </h1>
            <p className="text-base text-gray-400 leading-relaxed max-w-xl">
              Telemetría en tiempo real, control de rutas, tesorería y gobernanza de activos — todo en un panel unificado de nivel fintech.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenLogin}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm inline-flex items-center gap-2 transition cursor-pointer"
            >
              <span>Acceder al sistema</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenLogin}
              className="px-5 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 font-medium text-sm transition cursor-pointer"
            >
              Ver demo
            </button>
          </div>

          {/* App Preview — dark dashboard mockup */}
          <div className="mt-12 rounded-xl bg-gray-900 border border-gray-800 overflow-hidden">
            {/* Mock navbar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
                  <Truck className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs font-bold text-white">CargoVigil</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">Dashboard</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-600/20 border border-blue-800/50 flex items-center justify-center text-[9px] font-bold text-blue-400">AD</div>
                <span className="text-[11px] text-gray-400">admin@empresa.mx</span>
              </div>
            </div>

            {/* Mock metric cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5">
              {[
                { label: 'Fletes activos', value: '$124,500', sub: '8 en tránsito', icon: DollarSign, color: 'text-blue-400', bg: 'bg-blue-900/20' },
                { label: 'En movimiento', value: '8', sub: 'Unidades activas', icon: Activity, color: 'text-cyan-400', bg: 'bg-cyan-900/20' },
                { label: 'Fricciones', value: '1', sub: 'Atención requerida', icon: TrendingUp, color: 'text-red-400', bg: 'bg-red-900/20' },
                { label: 'Completados', value: '23', sub: 'POD cerrados', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-900/20' },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="p-3.5 rounded-lg bg-gray-800 border border-gray-700 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-gray-400">{card.label}</span>
                      <span className={`p-1 rounded-md ${card.bg} ${card.color}`}>
                        <Icon className="w-3 h-3" />
                      </span>
                    </div>
                    <div className={`text-lg font-bold ${card.color}`}>{card.value}</div>
                    <div className="text-[10px] text-gray-500">{card.sub}</div>
                  </div>
                );
              })}
            </div>

            {/* Mock table row */}
            <div className="px-5 pb-5">
              <div className="rounded-lg border border-gray-700 overflow-hidden">
                <div className="bg-gray-800/50 px-4 py-2 border-b border-gray-700">
                  <span className="text-[11px] font-semibold text-gray-300">Viajes Activos de la Empresa</span>
                </div>
                <div className="divide-y divide-gray-800">
                  {[
                    { code: 'CV-2024-001', route: 'Monterrey → CDMX', status: 'in_transit', pct: 62 },
                    { code: 'CV-2024-002', route: 'Guadalajara → Tijuana', status: 'stuck', pct: 34 },
                    { code: 'CV-2024-003', route: 'CDMX → Veracruz', status: 'completed', pct: 100 },
                  ].map((row) => (
                    <div key={row.code} className="flex items-center justify-between px-4 py-2.5 text-[11px]">
                      <span className="font-mono text-white font-semibold">{row.code}</span>
                      <span className="text-gray-400 hidden sm:inline">{row.route}</span>
                      <div className="flex items-center gap-2.5">
                        <div className="w-14 bg-gray-700 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${row.status === 'stuck' ? 'bg-red-500' : row.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                            style={{ width: `${row.pct}%` }}
                          />
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${
                          row.status === 'stuck' ? 'bg-red-900/40 text-red-300' :
                          row.status === 'completed' ? 'bg-emerald-900/40 text-emerald-300' :
                          'bg-blue-900/40 text-blue-300'
                        }`}>
                          {row.status === 'stuck' ? 'Fricción' : row.status === 'completed' ? 'Entregado' : 'En ruta'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* ── CONTACT / FOOTER ── */}
      <section id="contact" className="py-16 px-4 sm:px-6 lg:px-8 scroll-mt-14">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-gray-800">
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Truck className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-base text-white tracking-tight">CargoVigil</span>
              </div>
              <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                La plataforma integral para vigilancia de activos logísticos, telemetría y seguridad de nivel fintech.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Navegación</h4>
              <ul className="space-y-2 text-xs text-gray-400">
                {['home'].map((id) => (
                  <li key={id}>
                    <a href={`#${id}`} className="hover:text-white transition capitalize">{id}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Contacto</h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  soporte@cargovigil.test
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  +52 (81) 8000-0000
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  Monterrey, N.L., México
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 text-center text-xs text-gray-600 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3">
            <span>&copy; {new Date().getFullYear()} CargoVigil Technologies. Todos los derechos reservados.</span>
            <button
              type="button"
              onClick={onOpenPrivacy}
              className="text-gray-500 hover:text-gray-300 transition cursor-pointer underline underline-offset-2"
            >
              Aviso de Privacidad
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
