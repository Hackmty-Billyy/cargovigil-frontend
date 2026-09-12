import React from 'react';
import {
  Truck,
  Play,
  Search,
  Sliders,
  HelpCircle,
  Bell,
  Sparkles,
  TrendingUp,
  CreditCard,
  Wallet,
  PieChart,
  Shield,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  Radio,
  Check,
} from 'lucide-react';

interface LandingPageProps {
  onOpenLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin }) => {
  return (
    <div className="w-full text-slate-800">
      {/* 1. HOME / HERO SECTION */}
      <section id="home" className="relative overflow-hidden pt-8 pb-24 px-4 sm:px-6 lg:px-8 text-center bg-gradient-to-b from-[#776de8] via-[#8f85f3] to-[#bbb3ff]">
        {/* Soft Background Radial Lighting Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-white/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-10 w-96 h-96 bg-[#bbb3ff]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 right-10 w-96 h-96 bg-[#776de8]/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          {/* Tag Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-white shadow-sm">
            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-white text-[#776de8]">
              Fastest Way
            </span>
            <span className="text-xs font-medium tracking-wide">Manage Your Finances & Assets</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1]">
            Empowering You to Save <br />
            and Spend Wisely
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-white/90 max-w-2xl mx-auto leading-relaxed font-light">
            Perfect for Fintech and logistics platforms aiming to simplify complex financial tasks and asset surveillance for everyday users.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenLogin}
              className="px-6 py-3.5 rounded-full bg-white text-slate-900 font-bold text-sm shadow-xl hover:shadow-2xl hover:bg-slate-100 hover:scale-105 transition-all duration-200 flex items-center gap-2 cursor-pointer"
            >
              <span>Get Started Free</span>
              <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">
                ↗
              </div>
            </button>

            <button
              onClick={onOpenLogin}
              className="px-6 py-3.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-medium text-sm border border-white/30 flex items-center gap-2.5 transition-all duration-200 cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <Play className="w-3 h-3 fill-white text-white translate-x-0.5" />
              </div>
              <span>Watch Demo</span>
            </button>
          </div>
        </div>

        {/* HERO MOCKUP DASHBOARD WINDOW (Floating App Preview) */}
        <div className="relative z-20 max-w-5xl mx-auto mt-14 px-2 sm:px-4">
          <div className="rounded-3xl bg-slate-50/95 backdrop-blur-xl border border-white/50 p-4 sm:p-7 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] text-slate-800 text-left transition-transform duration-500 hover:-translate-y-1">
            {/* Dashboard Inner App Header */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-200/80 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#776de8] flex items-center justify-center text-white font-black text-sm">
                  CV
                </div>
                <span className="font-bold text-base text-slate-900 tracking-tight">CargoVigil</span>
                <span className="hidden sm:inline-block text-xs font-semibold text-slate-400 pl-3 border-l border-slate-200">
                  Dashboard
                </span>
              </div>

              {/* Search Bar */}
              <div className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100/90 border border-slate-200/80 text-slate-400 w-72 text-xs">
                <Search className="w-3.5 h-3.5" />
                <span>Search anything...</span>
              </div>

              {/* App Controls */}
              <div className="flex items-center gap-2.5 text-slate-400">
                <div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">
                  <Sliders className="w-4 h-4" />
                </div>
                <div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="w-7 h-7 rounded-full bg-[#bbb3ff]/40 text-[#776de8] font-bold text-xs flex items-center justify-center">
                    AD
                  </div>
                  <span className="hidden sm:inline text-xs font-semibold text-slate-700">Admin</span>
                </div>
              </div>
            </div>

            {/* Metric Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
              {/* Card 1 - Earnings */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/70 shadow-sm flex items-start justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-500">Earnings</span>
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">$5,567<span className="text-base text-slate-400">.00</span></div>
                  <span className="text-[11px] text-slate-400 mt-1 block">Last month: $4,545.00</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#776de8]/15 text-[#776de8]">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>

              {/* Card 2 - Spending */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/70 shadow-sm flex items-start justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-500">Spending</span>
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">$3,533<span className="text-base text-slate-400">.00</span></div>
                  <span className="text-[11px] text-slate-400 mt-1 block">Last month: $3,243.00</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              {/* Card 3 - Savings */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/70 shadow-sm flex items-start justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-500">Savings</span>
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">$2,324<span className="text-base text-slate-400">.00</span></div>
                  <span className="text-[11px] text-slate-400 mt-1 block">Last month: $2,232.00</span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Charts & Spending Overview Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Transactions Chart Preview */}
              <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200/70 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-500">Transactions Overview</span>
                    <div className="text-xl font-bold text-slate-900 mt-0.5">$4,235<span className="text-xs text-slate-400">.00</span></div>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#776de8]" /> Total Transaction</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300" /> Earning</span>
                  </div>
                </div>

                {/* Simulated Chart Bars */}
                <div className="h-32 flex items-end justify-between gap-2 pt-6 px-2 border-b border-slate-100">
                  {[
                    { h1: 40, h2: 30 },
                    { h1: 65, h2: 45 },
                    { h1: 50, h2: 35 },
                    { h1: 85, h2: 70, active: true, val: '$12,450' },
                    { h1: 45, h2: 30 },
                    { h1: 60, h2: 50 },
                    { h1: 75, h2: 60 },
                    { h1: 55, h2: 40 },
                  ].map((bar, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                      {bar.active && (
                        <div className="absolute -top-7 px-2 py-0.5 rounded bg-[#776de8] text-white text-[9px] font-bold shadow-md">
                          {bar.val}
                        </div>
                      )}
                      <div className="w-full max-w-[28px] flex items-end justify-center gap-1">
                        <div
                          style={{ height: `${bar.h1}%` }}
                          className={`w-3 rounded-t-md transition-all ${
                            bar.active ? 'bg-[#776de8]' : 'bg-[#776de8]/40'
                          }`}
                        />
                        <div
                          style={{ height: `${bar.h2}%` }}
                          className="w-3 rounded-t-md bg-slate-200"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spending Breakdown */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/70 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                      <PieChart className="w-3.5 h-3.5" /> Spending Overview
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">$24,678.20</div>
                  <span className="text-[11px] text-slate-400">From $30,000.00 target</span>

                  {/* Progress bars */}
                  <div className="w-full flex h-2 rounded-full overflow-hidden my-4 gap-1 bg-slate-100">
                    <div className="w-1/2 bg-[#776de8] rounded-full" />
                    <div className="w-1/4 bg-cyan-400 rounded-full" />
                    <div className="w-1/6 bg-amber-400 rounded-full" />
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#776de8]" /> Fleet Logistics</span>
                  <span className="font-semibold text-slate-700">$2,085.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ABOUT SECTION & SOCIAL PROOF */}
      <section id="about" className="bg-slate-50 py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-200 scroll-mt-20">
        <div className="max-w-6xl mx-auto space-y-12 text-center">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-[#776de8] text-xs font-bold">
              <span>About Us</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Trusted By More Than <span className="text-[#776de8]">1000+</span> Global Companies
            </h2>
            <p className="text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Leading logistics providers, supply chain operators, and fintech leaders rely on CargoVigil to protect assets and eliminate financial friction.
            </p>
          </div>

          {/* Logos Grid */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {[
              { name: 'Evernote', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200/60' },
              { name: 'grammarly', color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200/60' },
              { name: 'HubSpot', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200/60' },
              { name: 'shopify', color: 'text-lime-800', bg: 'bg-lime-50 border-lime-200/60' },
              { name: 'Spotify', color: 'text-emerald-800', bg: 'bg-emerald-50 border-emerald-200/60' },
            ].map((company) => (
              <div
                key={company.name}
                className={`px-7 py-3 rounded-2xl border ${company.bg} shadow-sm flex items-center gap-2 transition hover:scale-105`}
              >
                <span className={`font-bold text-base sm:text-lg tracking-tight ${company.color}`}>
                  {company.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. SERVICES SECTION */}
      <section id="services" className="py-24 px-4 sm:px-6 lg:px-8 bg-white text-center scroll-mt-20">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-purple-100 text-[#776de8] text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Powerful Features</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Finance & Surveillance for the Modern Business
            </h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto">
              Intelligent end-to-end tooling designed for high-volume logistical operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-7 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-[#776de8]/50 transition shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#776de8] text-white flex items-center justify-center shadow-md">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Fintech Grade Security</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Protección con hash Argon2id, segundo factor TOTP cifrado con AES-256-GCM y rotación de tokens contra robo de sesión.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-[#776de8]/50 transition shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#776de8] text-white flex items-center justify-center shadow-md">
                <Radio className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Real-time Telemetry</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Respaldado por hypertables en TimescaleDB para análisis instantáneo de series temporales, sensores y rutas GPS.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-[#776de8]/50 transition shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#776de8] text-white flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Role Governance</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Permisos granulares e independientes para Administradores, Operadores de Flotas y Controladores Financieros.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PRICING SECTION */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 border-t border-slate-200 scroll-mt-20">
        <div className="max-w-6xl mx-auto space-y-12 text-center">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-purple-100 text-[#776de8] text-xs font-bold">
              <span>Plans & Pricing</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Simple, Transparent Pricing
            </h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto">
              Escala tus operaciones logísticas con planes adaptados a cualquier tamaño de flota.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {/* Plan 1 */}
            <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Starter</span>
                <div className="text-3xl font-extrabold text-slate-900">$29<span className="text-xs text-slate-400 font-normal"> / mes</span></div>
                <p className="text-xs text-slate-500 leading-relaxed">Ideal para transportistas individuales y flotas pequeñas.</p>
                <ul className="space-y-2.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Hasta 10 activos en ruta</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Telemetría estándar GPS</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Autenticación segura 2FA</li>
                </ul>
              </div>
              <button
                onClick={onOpenLogin}
                className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold transition cursor-pointer"
              >
                Comenzar Prueba
              </button>
            </div>

            {/* Plan 2 - Featured */}
            <div className="p-7 rounded-3xl bg-gradient-to-b from-[#776de8] to-[#6054e2] text-white shadow-xl space-y-6 flex flex-col justify-between relative scale-105">
              <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-white text-[#776de8] text-[10px] font-extrabold shadow">
                POPULAR
              </div>
              <div className="space-y-4">
                <span className="text-xs font-bold text-white/80 uppercase tracking-wider">Enterprise Pro</span>
                <div className="text-3xl font-extrabold">$89<span className="text-xs text-white/70 font-normal"> / mes</span></div>
                <p className="text-xs text-white/80 leading-relaxed">Para empresas medianas con múltiples rutas concurrentes.</p>
                <ul className="space-y-2.5 text-xs text-white/90 pt-2 border-t border-white/20">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-300 shrink-0" /> Flotas ilimitadas</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-300 shrink-0" /> Sensores IoT & Cadena de Frío</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-300 shrink-0" /> Soporte dedicado 24/7</li>
                </ul>
              </div>
              <button
                onClick={onOpenLogin}
                className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-[#776de8] text-xs font-bold shadow-md transition cursor-pointer"
              >
                Elegir Enterprise Pro
              </button>
            </div>

            {/* Plan 3 */}
            <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Custom Fleet</span>
                <div className="text-3xl font-extrabold text-slate-900">Custom</div>
                <p className="text-xs text-slate-500 leading-relaxed">Infraestructura dedicada y gobernanza a medida.</p>
                <ul className="space-y-2.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Instancia TimescaleDB privada</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> API Gateway a medida</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> SLA de 99.99% garantizado</li>
                </ul>
              </div>
              <button
                onClick={onOpenLogin}
                className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold transition cursor-pointer"
              >
                Contactar Ventas
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CONTACT & FOOTER SECTION */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white scroll-mt-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#776de8] to-[#bbb3ff] flex items-center justify-center text-white font-bold">
                <Truck className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">CargoVigil</span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              La plataforma integral para vigilancia de activos logísticos, telemetría y seguridad de nivel fintech.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Navegación</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li><a href="#home" className="hover:text-white transition">Home</a></li>
              <li><a href="#about" className="hover:text-white transition">About</a></li>
              <li><a href="#services" className="hover:text-white transition">Services</a></li>
              <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Contacto</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-[#776de8]" /> soporte@cargovigil.test</li>
              <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-[#776de8]" /> +52 (81) 8000-0000</li>
              <li className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-[#776de8]" /> Monterrey, N.L., México</li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-10 mt-10 border-t border-slate-800 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} CargoVigil Technologies. Todos los derechos reservados.</p>
        </div>
      </section>
    </div>
  );
};
