import React from 'react';
import { SectionType } from '../types';
import { Activity, ShieldCheck, Crown } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeSection: SectionType;
  onSectionChange: (section: SectionType) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeSection, onSectionChange }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col relative overflow-hidden selection:bg-emerald-500/30">
      
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 pointer-events-none -z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] mix-blend-screen opacity-40"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] mix-blend-screen opacity-30"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/70 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl shadow-lg border border-white/10">
                  <Activity className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-white leading-none">
                  BetGuide<span className="text-emerald-500">.AI</span>
                </span>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest ml-0.5">
                  Smart Predictions
                </span>
              </div>
            </div>
            
            {/* Section Switcher */}
            <div className="bg-slate-900/80 p-1.5 rounded-full border border-white/5 flex relative shadow-inner shadow-black/20">
               {/* Animated Background Pill */}
               <div 
                 className={`absolute top-1.5 bottom-1.5 rounded-full transition-all duration-300 ease-out shadow-lg ${
                   activeSection === SectionType.FREE 
                     ? 'left-1.5 w-[calc(50%-6px)] bg-slate-800 border border-white/5' 
                     : 'left-[50%] w-[calc(50%-6px)] bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950'
                 }`}
               ></div>

               <button
                onClick={() => onSectionChange(SectionType.FREE)}
                className={`relative z-10 flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-colors duration-300 ${
                  activeSection === SectionType.FREE ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <ShieldCheck size={16} className={activeSection === SectionType.FREE ? "text-emerald-400" : ""} />
                <span>Free</span>
              </button>
              
              <button
                onClick={() => onSectionChange(SectionType.VIP)}
                className={`relative z-10 flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-colors duration-300 ${
                  activeSection === SectionType.VIP ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Crown size={16} className={activeSection === SectionType.VIP ? "text-white" : ""} />
                <span>VIP</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-950 relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="text-slate-600 text-xs font-medium">
            © {new Date().getFullYear()} BetGuide AI. <span className="opacity-50">Predictions are for informational purposes only.</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;