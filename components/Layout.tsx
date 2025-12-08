import React from 'react';
import { Trophy, ShieldCheck, Crown, Activity } from 'lucide-react';
import { SectionType } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeSection: SectionType;
  onSectionChange: (section: SectionType) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeSection, onSectionChange }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                BetGuide AI
              </span>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={() => onSectionChange(SectionType.FREE)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeSection === SectionType.FREE
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <ShieldCheck size={16} />
                Free Tips
              </button>
              <button
                onClick={() => onSectionChange(SectionType.VIP)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeSection === SectionType.VIP
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Crown size={16} />
                VIP Lounge
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-600 text-xs">
            © {new Date().getFullYear()} BetGuide AI. Please gamble responsibly. 18+
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;