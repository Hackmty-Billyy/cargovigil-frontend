import React from 'react';
import { Truck, ArrowUpRight } from 'lucide-react';

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
    { id: 'about', label: 'About' },
    { id: 'services', label: 'Services' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'contact', label: 'Contact' },
  ];

  const handleNavClick = (id: string) => {
    setActiveSection(id);
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto backdrop-blur-md">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-2.5 cursor-pointer text-left"
        >
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg shadow-purple-900/20">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-white tracking-tight">CargoVigil</span>
        </button>

        {/* Center Navigation Pill Bar */}
        <nav className="hidden md:flex items-center p-1.5 rounded-full bg-white/15 backdrop-blur-xl border border-white/25 shadow-inner">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`px-5 py-2 text-xs font-semibold rounded-full transition-all duration-300 cursor-pointer ${
                activeSection === item.id
                  ? 'bg-[#776de8] text-white shadow-md font-bold'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenLogin}
            className="px-4 py-2 text-xs font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
          >
            Log in
          </button>
          <button
            onClick={onOpenLogin}
            className="px-5 py-2 text-xs font-semibold text-white bg-slate-950 hover:bg-slate-900 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 border border-white/10 flex items-center gap-1 cursor-pointer"
          >
            <span>Sign In</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
