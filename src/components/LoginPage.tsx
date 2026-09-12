import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Truck,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  Check,
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
    <div className="min-h-screen w-full bg-white flex flex-col lg:flex-row font-sans selection:bg-[#776de8] selection:text-white">
      {/* LEFT PANEL: Organic Wave Gradient Hero */}
      <div className="lg:w-1/2 relative min-h-[400px] lg:min-h-screen p-8 sm:p-12 lg:p-16 flex flex-col justify-between overflow-hidden bg-[#e0c3fc] text-white">
        {/* Abstract Fluid Background Shapes */}
        <div
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{
            background: `
              radial-gradient(circle at 100% 0%, #fbd07c 0%, #f7a072 25%, transparent 60%),
              radial-gradient(circle at 0% 100%, #fbd07c 0%, #f7a072 30%, transparent 60%),
              linear-gradient(135deg, #776de8 0%, #8c72f8 50%, #9f6ff8 100%)
            `,
          }}
        />

        {/* Fluid SVG Curves (Matching the reference wavy shapes) */}
        <svg
          className="absolute inset-0 w-full h-full object-cover opacity-90 pointer-events-none"
          viewBox="0 0 800 900"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Top Right Warm Wave */}
          <path
            d="M500 0C650 120 780 200 800 450C820 700 680 900 800 900L800 0L500 0Z"
            fill="url(#warmGradient1)"
            opacity="0.85"
          />
          {/* Bottom Left Warm Wave */}
          <path
            d="M0 550C150 580 320 680 300 900L0 900L0 550Z"
            fill="url(#warmGradient2)"
            opacity="0.85"
          />
          {/* Organic Purple Intermediary Wave */}
          <path
            d="M200 0C350 150 420 380 320 520C220 660 120 750 250 900L0 900L0 0L200 0Z"
            fill="url(#purpleWave)"
            opacity="0.9"
          />

          <defs>
            <linearGradient id="warmGradient1" x1="500" y1="0" x2="800" y2="600" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ffcca4" />
              <stop offset="0.6" stopColor="#f7a072" />
              <stop offset="1" stopColor="#8c72f8" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="warmGradient2" x1="0" y1="550" x2="300" y2="900" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ffcca4" />
              <stop offset="1" stopColor="#f7a072" />
            </linearGradient>
            <linearGradient id="purpleWave" x1="0" y1="0" x2="400" y2="900" gradientUnits="userSpaceOnUse">
              <stop stopColor="#776de8" />
              <stop offset="0.5" stopColor="#8257e6" />
              <stop offset="1" stopColor="#6e45e2" />
            </linearGradient>
          </defs>
        </svg>

        {/* Top Header: Logo & Back Button */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/25 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-lg">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white drop-shadow-sm">CargoVigil</span>
          </div>

          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 hover:text-white bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 transition cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Inicio</span>
          </button>
        </div>

        {/* Big Bold Welcome Back! Typography */}
        <div className="relative z-10 my-auto py-12">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-white tracking-tight leading-[0.95] drop-shadow-md">
            Welcome <br />
            Back!
          </h1>
        </div>

        {/* Empty bottom space to match the clean aesthetic */}
        <div className="relative z-10 hidden sm:block h-6" />
      </div>

      {/* RIGHT PANEL: Clean Minimalist Login Form */}
      <div className="lg:w-1/2 flex flex-col justify-center items-center px-6 sm:px-12 lg:px-20 xl:px-28 py-12">
        <div className="w-full max-w-md space-y-7">
          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Login
            </h2>
            <p className="text-sm text-slate-400 font-normal leading-relaxed">
              Welcome back! Please login to your account.
            </p>
          </div>

          {/* Error Notification */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* User Name / Email Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-400">
                User Name
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="username@gmail.com"
                className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#776de8]/30 focus:border-[#776de8] transition shadow-2xs"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-400">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full pl-4 pr-11 py-3.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#776de8]/30 focus:border-[#776de8] transition shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label
                onClick={() => setRememberMe(!rememberMe)}
                className="flex items-center gap-2 cursor-pointer select-none text-slate-600 font-medium"
              >
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                    rememberMe ? 'bg-[#776de8] text-white' : 'border border-slate-300 bg-white'
                  }`}
                >
                  {rememberMe && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
                <span>Remember Me</span>
              </label>

              <button
                type="button"
                onClick={onBackToHome}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !email.trim() || !password}
              className="w-full py-4 px-6 rounded-xl bg-[#776de8] hover:bg-[#685ddb] active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-[#776de8]/25 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Login</span>
              )}
            </button>
          </form>

          {/* Footer Signup / Return prompt */}
          <div className="pt-2 text-center text-xs text-slate-400">
            <span>New User? </span>
            <button
              type="button"
              onClick={onBackToHome}
              className="font-bold text-[#776de8] hover:underline cursor-pointer"
            >
              Signup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
