import React from 'react';
import {
  Truck,
  Shield,
  Radio,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  Check,
  ArrowRight,
  Activity,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

interface LandingPageProps {
  onOpenLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin }) => {
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

      {/* ── ABOUT / SOCIAL PROOF ── */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-gray-800 scroll-mt-14">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="space-y-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-medium bg-gray-800 text-gray-400 border border-gray-700 uppercase tracking-wide">
              Nosotros
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Confiado por más de <span className="text-blue-400">1,000+</span> empresas globales
            </h2>
            <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
              Operadores logísticos, supply chains y líderes fintech usan CargoVigil para proteger activos y eliminar fricción financiera.
            </p>
          </div>

          {/* Logos */}
          <div className="flex flex-wrap items-center gap-3">
            {['Evernote', 'Grammarly', 'HubSpot', 'Shopify', 'Spotify'].map((name) => (
              <div
                key={name}
                className="px-5 py-2.5 rounded-lg bg-gray-900 border border-gray-800 hover:border-gray-600 transition"
              >
                <span className="text-sm font-semibold text-gray-300">{name}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-800">
            {[
              { value: '99.9%', label: 'Uptime SLA' },
              { value: '<50ms', label: 'Latencia media' },
              { value: '1M+', label: 'Eventos diarios' },
              { value: 'AES-256', label: 'Cifrado en reposo' },
            ].map((stat) => (
              <div key={stat.label} className="space-y-1">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="services" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-gray-800 scroll-mt-14">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="space-y-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-medium bg-gray-800 text-gray-400 border border-gray-700 uppercase tracking-wide">
              Servicios
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Finanzas y vigilancia para el negocio moderno
            </h2>
            <p className="text-sm text-gray-400 max-w-xl leading-relaxed">
              Herramientas end-to-end diseñadas para operaciones logísticas de alto volumen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: Shield,
                title: 'Seguridad Fintech',
                desc: 'Hash Argon2id, segundo factor TOTP con AES-256-GCM y rotación de tokens contra robo de sesión.',
                color: 'text-blue-400',
                bg: 'bg-blue-900/20',
              },
              {
                icon: Radio,
                title: 'Telemetría en Tiempo Real',
                desc: 'Hypertables en TimescaleDB para análisis instantáneo de series temporales, sensores y rutas GPS.',
                color: 'text-cyan-400',
                bg: 'bg-cyan-900/20',
              },
              {
                icon: CheckCircle2,
                title: 'Gobernanza por Roles',
                desc: 'Permisos granulares e independientes para Administradores, Operadores de Flotas y Controladores Financieros.',
                color: 'text-emerald-400',
                bg: 'bg-emerald-900/20',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="p-5 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-600 transition space-y-3"
                >
                  <div className={`w-9 h-9 rounded-lg ${item.bg} ${item.color} flex items-center justify-center`}>
                    <Icon className="w-4.5 h-4.5 w-[18px]" />
                  </div>
                  <h3 className="font-semibold text-white text-sm">{item.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-gray-800 scroll-mt-14">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="space-y-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-medium bg-gray-800 text-gray-400 border border-gray-700 uppercase tracking-wide">
              Planes
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Precios simples y transparentes
            </h2>
            <p className="text-sm text-gray-400 max-w-xl leading-relaxed">
              Escala tus operaciones logísticas con planes adaptados a cualquier tamaño de flota.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Plan Starter */}
            <div className="p-5 rounded-xl bg-gray-900 border border-gray-800 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Starter</span>
                  <div className="text-3xl font-bold text-white mt-1">$29 <span className="text-sm font-normal text-gray-400">/ mes</span></div>
                  <p className="text-xs text-gray-400 mt-1">Para transportistas individuales y flotas pequeñas.</p>
                </div>
                <ul className="space-y-2 pt-3 border-t border-gray-800">
                  {['Hasta 10 activos en ruta', 'Telemetría GPS estándar', 'Autenticación 2FA'].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-gray-300">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={onOpenLogin}
                className="w-full py-2 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-xs font-semibold transition cursor-pointer"
              >
                Comenzar prueba
              </button>
            </div>

            {/* Plan Pro — highlighted */}
            <div className="p-5 rounded-xl bg-blue-600 border border-blue-500 space-y-5 flex flex-col justify-between relative">
              <div className="absolute -top-3 right-5 px-2.5 py-0.5 rounded-full bg-white text-blue-700 text-[10px] font-bold">
                POPULAR
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-semibold text-blue-200 uppercase tracking-wider">Enterprise Pro</span>
                  <div className="text-3xl font-bold text-white mt-1">$89 <span className="text-sm font-normal text-blue-200">/ mes</span></div>
                  <p className="text-xs text-blue-100 mt-1">Para empresas medianas con múltiples rutas concurrentes.</p>
                </div>
                <ul className="space-y-2 pt-3 border-t border-blue-500/50">
                  {['Flotas ilimitadas', 'Sensores IoT y Cadena de Frío', 'Soporte dedicado 24/7'].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-blue-100">
                      <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={onOpenLogin}
                className="w-full py-2 px-4 rounded-lg bg-white hover:bg-blue-50 text-blue-700 text-xs font-bold transition cursor-pointer"
              >
                Elegir Enterprise Pro
              </button>
            </div>

            {/* Plan Custom */}
            <div className="p-5 rounded-xl bg-gray-900 border border-gray-800 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Custom Fleet</span>
                  <div className="text-3xl font-bold text-white mt-1">Custom</div>
                  <p className="text-xs text-gray-400 mt-1">Infraestructura dedicada y gobernanza a medida.</p>
                </div>
                <ul className="space-y-2 pt-3 border-t border-gray-800">
                  {['Instancia TimescaleDB privada', 'API Gateway a medida', 'SLA de 99.99% garantizado'].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-gray-300">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={onOpenLogin}
                className="w-full py-2 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-xs font-semibold transition cursor-pointer"
              >
                Contactar ventas
              </button>
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
                {['home', 'about', 'services', 'pricing'].map((id) => (
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

          <div className="pt-6 text-center text-xs text-gray-600">
            &copy; {new Date().getFullYear()} CargoVigil Technologies. Todos los derechos reservados.
          </div>
        </div>
      </section>
    </div>
  );
};
