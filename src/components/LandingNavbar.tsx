import React from 'react';
import { Truck, ArrowRight } from 'lucide-react';

interface LandingNavbarProps {
  onOpenLogin: () => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  onOpenLogin,
  activeSection,
  setActiveSection,
}) => {
  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'Nosotros' },
    { id: 'services', label: 'Servicios' },
    { id: 'pricing', label: 'Planes' },
    { id: 'contact', label: 'Contacto' },
  ];

  const handleNavClick = (id: string) => {
    setActiveSection(id);
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-800 bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Truck className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base text-white tracking-tight">CargoVigil</span>
          <span className="hidden sm:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">
            Fintech v1.0
          </span>
        </button>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-0.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeSection === item.id
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenLogin}
            className="px-3.5 py-1.5 text-xs font-medium text-gray-300 hover:text-white transition cursor-pointer"
          >
            Iniciar sesión
          </button>
          <button
            onClick={onOpenLogin}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>Comenzar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
