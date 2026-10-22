import React from 'react';
import { 
  Zap, 
  PlusCircle, 
  ScanLine, 
  TrendingUp, 
  Wallet,
  Menu,
  X,
  ShieldCheck
} from 'lucide-react';
import { formatCurrency } from '../lib/formatters';
import { FinancialAccount } from '../types/financial';

interface NavbarProps {
  accounts: FinancialAccount[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewTransaction: (type?: 'expense' | 'income') => void;
  onOpenScanner: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  systemName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  accounts,
  activeTab,
  setActiveTab,
  onOpenNewTransaction,
  onOpenScanner,
  mobileMenuOpen,
  setMobileMenuOpen,
  systemName = 'Aura Finance',
}) => {
  const totalBalance = accounts.reduce((acc, a) => acc + (a.balance || 0), 0);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-dark-800 bg-dark-950/85 backdrop-blur-md px-4 sm:px-6 py-3.5 transition-all">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden p-2 rounded-lg bg-dark-900 border border-dark-800 text-slate-300 hover:text-gold-400 focus:outline-none"
            aria-label="Abrir Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div 
            onClick={() => setActiveTab('dashboard')} 
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-400 via-amber-500 to-yellow-600 flex items-center justify-center shadow-gold-glow group-hover:scale-105 transition-transform">
              <Zap size={22} className="text-dark-950 fill-dark-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white group-hover:text-gold-400 transition-colors">
                  {systemName.split(' ')[0]}
                </span>
                <span className="font-light text-lg sm:text-xl text-gold-400">
                  {systemName.split(' ').slice(1).join(' ') || 'PRO'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 -mt-1 hidden sm:block tracking-wider uppercase font-medium">
                Gestão Financeira & IA
              </p>
            </div>
          </div>
        </div>

        {/* Center / Balance Badge (Desktop & Tablet) */}
        <div className="hidden lg:flex items-center gap-3 bg-dark-900/90 border border-dark-800 rounded-full px-4 py-1.5 shadow-inner">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-400">Supabase Cloud:</span>
            <span className="text-xs text-emerald-400 font-medium">Ativo</span>
          </div>
          <div className="h-3 w-[1px] bg-dark-800" />
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <Wallet size={14} className="text-gold-400" />
            <span>Patrimônio:</span>
            <span className="text-gold-400 font-bold tracking-tight">
              {formatCurrency(totalBalance)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Scanner Button */}
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-xl bg-dark-900 border border-gold-400/40 text-gold-400 hover:bg-gold-400/10 hover:border-gold-400 transition-all text-xs sm:text-sm font-semibold shadow-sm active:scale-95"
            title="Escanear Nota Fiscal com IA"
          >
            <ScanLine size={17} className="animate-pulse" />
            <span className="hidden sm:inline">Escanear NF</span>
          </button>

          {/* New Transaction Button */}
          <button
            onClick={() => onOpenNewTransaction('expense')}
            className="flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-gold-400 to-amber-500 text-dark-950 font-bold hover:brightness-110 active:scale-95 transition-all text-xs sm:text-sm shadow-gold-glow"
          >
            <PlusCircle size={17} />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>
    </header>
  );
};
