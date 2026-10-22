import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  ScanLine, 
  Landmark, 
  TrendingUp, 
  Settings,
  HelpCircle,
  ChevronRight,
  ShieldAlert,
  Wallet
} from 'lucide-react';
import { FinancialAccount } from '../types/financial';
import { formatCurrency } from '../lib/formatters';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  accounts: FinancialAccount[];
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  accounts,
  mobileOpen,
  setMobileOpen,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'statement', label: 'Extrato de Gastos', icon: Receipt, badge: 'Completo' },
    { id: 'scanner', label: 'Leitor de NF (IA)', icon: ScanLine, highlight: true },
    { id: 'accounts', label: 'Contas & Carteiras', icon: Landmark },
    { id: 'investments', label: 'Investimentos', icon: TrendingUp },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-72 bg-dark-950 border-r border-dark-800 flex flex-col justify-between
        transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:z-30
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Top Section */}
        <div className="p-5 flex flex-col gap-6">
          {/* Mobile Header Inside Drawer */}
          <div className="flex items-center justify-between md:hidden border-b border-dark-800 pb-3">
            <span className="text-gold-400 font-extrabold text-lg">MENU PRINCIPAL</span>
            <button 
              onClick={() => setMobileOpen(false)}
              className="text-slate-400 hover:text-white text-sm"
            >
              Fechar ✕
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-1">
              Navegação
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`
                    w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all
                    ${isActive 
                      ? 'bg-gradient-to-r from-gold-500/15 to-transparent text-gold-400 border-l-4 border-gold-400 shadow-sm' 
                      : 'text-slate-400 hover:text-slate-100 hover:bg-dark-900/80 border-l-4 border-transparent'
                    }
                    ${item.highlight && !isActive ? 'text-amber-300/90' : ''}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={19} className={isActive ? 'text-gold-400' : (item.highlight ? 'text-gold-400 animate-pulse' : 'text-slate-400')} />
                    <span>{item.label}</span>
                  </div>
                  
                  {item.badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-dark-800 text-slate-300 border border-dark-750">
                      {item.badge}
                    </span>
                  )}
                  {item.highlight && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-400/20 text-gold-300 border border-gold-400/30 font-semibold animate-pulse">
                      IA
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Connected Accounts Quick List */}
          <div className="flex flex-col gap-2 pt-2 border-t border-dark-850">
            <div className="flex items-center justify-between px-3">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Minhas Contas
              </p>
              <button 
                onClick={() => handleNavClick('accounts')}
                className="text-[11px] text-gold-400 hover:underline"
              >
                Gerenciar
              </button>
            </div>

            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
              {accounts.map((acc) => (
                <div 
                  key={acc.id}
                  onClick={() => handleNavClick('accounts')}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-dark-900/50 hover:bg-dark-900 border border-dark-850 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" 
                      style={{ backgroundColor: acc.color || '#facc15' }}
                    />
                    <span className="text-xs font-medium text-slate-300 truncate max-w-[110px]">
                      {acc.name}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-200">
                    {formatCurrency(acc.balance)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom User Card / Version */}
        <div className="p-4 border-t border-dark-850 bg-dark-900/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-dark-800 border border-gold-400/30 flex items-center justify-center text-gold-400 font-bold text-sm">
              EF
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">
                Erick Finger
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                Admin • Black & Gold SaaS
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
