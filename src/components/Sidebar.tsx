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
  Wallet,
  Zap,
  CreditCard,
  UserCheck,
  ShieldCheck,
  ShoppingCart,
  PlayCircle,
  BookOpen
} from 'lucide-react';
import { FinancialAccount } from '../types/financial';
import { formatCurrency } from '../lib/formatters';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  accounts: FinancialAccount[];
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onOpenCFO?: () => void;
  onOpenMercadoPago?: () => void;
  onOpenAuth?: () => void;
  currentUser?: any;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  accounts,
  mobileOpen,
  setMobileOpen,
  onOpenCFO,
  onOpenMercadoPago,
  onOpenAuth,
  currentUser,
}) => {
  const isAdmin = Boolean(
    currentUser?.email === 'admin@aurafinance.com.br' || 
    currentUser?.user_metadata?.is_admin === true
  );

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tutorial', label: 'Como Usar & Vídeos', icon: PlayCircle, badge: 'Vídeo' },
    ...(isAdmin ? [{ id: 'saas_admin', label: 'Painel SaaS', icon: ShieldCheck, badge: 'Admin' }] : []),
    { id: 'cards', label: 'Cartões & Faturas', icon: CreditCard, badge: 'Novo' },
    { id: 'shopping_lists', label: 'Lista de Compras', icon: ShoppingCart, badge: 'Mercado' },
    { id: 'subscription_invoices', label: 'Faturas do Sistema', icon: Receipt, badge: 'R$ 9,90' },
    { id: 'cfo', label: 'CFO Virtual', icon: Zap, badge: 'IA', highlight: true, isAction: 'cfo' },
    { id: 'statement', label: 'Extrato de Gastos', icon: Receipt },
    { id: 'scanner', label: 'Scanner de NF', icon: ScanLine, badge: 'IA', highlight: true },
    { id: 'accounts', label: 'Contas & Carteiras', icon: Landmark },
    { id: 'investments', label: 'Investimentos', icon: TrendingUp },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const handleNavClick = (item: any) => {
    if (item.isAction === 'cfo' && onOpenCFO) {
      onOpenCFO();
    } else if (item.isAction === 'mp' && onOpenMercadoPago) {
      onOpenMercadoPago();
    } else {
      setActiveTab(item.id);
    }
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
        fixed top-0 bottom-0 left-0 z-50 w-72 h-full bg-dark-950 border-r border-dark-800 flex flex-col justify-between
        transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:z-30 md:h-auto
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Top Section */}
        <div className="p-5 flex flex-col gap-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-dark-800">
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
                  onClick={() => handleNavClick(item)}
                  className={`
                    w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all
                    ${isActive 
                      ? 'bg-gradient-to-r from-gold-500/15 to-transparent text-gold-400 border-l-4 border-gold-400 shadow-sm' 
                      : 'text-slate-400 hover:text-slate-100 hover:bg-dark-900/80 border-l-4 border-transparent'
                    }
                    ${item.highlight && !isActive ? 'text-amber-300/90' : ''}
                  `}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon size={19} className={isActive ? 'text-gold-400 shrink-0' : (item.highlight ? 'text-gold-400 shrink-0' : 'text-slate-400 shrink-0')} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  
                  {item.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold shrink-0 ${
                      item.highlight || item.id === 'tutorial'
                        ? 'bg-gold-400/15 text-gold-300 border-gold-400/30'
                        : 'bg-dark-800 text-slate-300 border-dark-750'
                    }`}>
                      {item.badge}
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
        <div 
          onClick={onOpenAuth}
          className="p-4 border-t border-dark-850 bg-dark-900/40 hover:bg-dark-900/80 cursor-pointer transition-colors"
          title="Clique para gerenciar login ou criar conta"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-dark-800 border border-gold-400/30 flex items-center justify-center text-gold-400 font-bold text-sm">
              {currentUser?.email ? currentUser.email.substring(0, 2).toUpperCase() : 'EF'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">
                {currentUser ? (currentUser.user_metadata?.full_name || currentUser.email) : 'Erick Finger'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {currentUser ? 'Supabase Auth • Ativo' : 'Criar Conta / Entrar'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
