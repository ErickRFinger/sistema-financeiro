import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  PlusCircle, 
  ScanLine, 
  TrendingUp, 
  Wallet,
  Menu,
  X,
  ShieldCheck,
  CreditCard,
  User,
  UserPlus,
  Eye,
  EyeOff,
  Bell,
  Clock
} from 'lucide-react';
import { formatCurrency } from '../lib/formatters';
import { FinancialAccount } from '../types/financial';

interface NavbarProps {
  accounts: FinancialAccount[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewTransaction: (type?: 'expense' | 'income') => void;
  onOpenScanner: () => void;
  onOpenCFO?: () => void;
  onOpenMercadoPago?: () => void;
  onOpenAuth?: () => void;
  currentUser?: any;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  systemName?: string;
  isPrivate?: boolean;
  onTogglePrivacy?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  accounts,
  activeTab,
  setActiveTab,
  onOpenNewTransaction,
  onOpenScanner,
  onOpenCFO,
  onOpenMercadoPago,
  onOpenAuth,
  currentUser,
  mobileMenuOpen,
  setMobileMenuOpen,
  systemName = 'Aura Finance',
  isPrivate = false,
  onTogglePrivacy,
}) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Listener global da tecla 'P' para alternar Modo Privacidade
  useEffect(() => {
    if (!onTogglePrivacy) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignora quando estiver digitando em campos de texto/formulário
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Evita interceptar atalhos com modificadores (como Cmd+P ou Ctrl+P de impressão)
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (event.key === 'p' || event.key === 'P') {
        event.preventDefault();
        onTogglePrivacy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onTogglePrivacy]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationsOpen]);

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
              {isPrivate ? '••••••' : formatCurrency(totalBalance)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Privacy Toggle Button */}
          {onTogglePrivacy && (
            <button
              onClick={onTogglePrivacy}
              className={`p-2 px-2.5 rounded-xl border transition-all text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer ${
                isPrivate 
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' 
                  : 'bg-dark-900 border-dark-800 text-slate-400 hover:text-white hover:border-dark-700'
              }`}
              title={isPrivate ? 'Modo Privacidade Ativo: Clique ou pressione [P] para revelar valores' : 'Clique ou pressione [P] para ocultar saldos (Modo Privacidade)'}
              aria-label="Alternar Modo Privacidade (Tecla P)"
            >
              {isPrivate ? <EyeOff size={16} /> : <Eye size={16} />}
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-dark-950/80 border border-dark-800 text-slate-400 group-hover:text-slate-200 leading-none">
                [P]
              </span>
            </button>
          )}

          {/* Notifications Button & Floating Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setNotificationsOpen(prev => !prev)}
              className={`relative p-2 rounded-xl border transition-all text-xs font-bold flex items-center justify-center active:scale-95 cursor-pointer ${
                notificationsOpen
                  ? 'bg-gold-400/20 border-gold-400 text-gold-400 shadow-gold-glow'
                  : 'bg-dark-900 border-dark-800 text-slate-400 hover:text-white hover:border-dark-700'
              }`}
              title="Notificações e Alertas"
              aria-label="Abrir Notificações"
            >
              <Bell size={16} />
              {/* Badge Vermelho com Contador */}
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-black text-white flex items-center justify-center ring-2 ring-dark-950 animate-pulse">
                2
              </span>
            </button>

            {/* Dropdown Flutuante Black Obsidian & Gold */}
            {notificationsOpen && (
              <div className="absolute right-0 top-full mt-2.5 w-72 sm:w-80 md:w-96 rounded-2xl bg-dark-900/95 backdrop-blur-xl border border-gold-400/30 shadow-dark-card z-50 p-3.5 sm:p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                {/* Cabeçalho */}
                <div className="flex items-center justify-between pb-2.5 border-b border-dark-800">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gold-400/20 text-gold-400 flex items-center justify-center">
                      <Bell size={13} />
                    </div>
                    <span className="text-xs sm:text-sm font-extrabold text-white">
                      Notificações & Alertas
                    </span>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    2 novos
                  </span>
                </div>

                {/* Lista de Alertas Rápidos */}
                <div className="space-y-2">
                  {/* Alerta 1: Contas a Vencer */}
                  <div 
                    onClick={() => {
                      setActiveTab('statement');
                      setNotificationsOpen(false);
                    }}
                    className="p-3 rounded-xl bg-dark-950/80 border border-dark-800 hover:border-amber-500/40 hover:bg-dark-850/80 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Clock size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-white group-hover:text-gold-400 transition-colors">
                            Contas a Vencer
                          </span>
                          <span className="text-[9px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            Atenção
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                          Você tem contas com vencimento hoje ou nos próximos 3 dias.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Alerta 2: Fatura do Sistema */}
                  <div 
                    onClick={() => {
                      if (onOpenMercadoPago) onOpenMercadoPago();
                      else setActiveTab('invoices');
                      setNotificationsOpen(false);
                    }}
                    className="p-3 rounded-xl bg-dark-950/80 border border-dark-800 hover:border-gold-400/40 hover:bg-dark-850/80 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gold-400/15 text-gold-400 flex items-center justify-center shrink-0 mt-0.5">
                        <CreditCard size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-white group-hover:text-gold-400 transition-colors">
                            Fatura do Sistema
                          </span>
                          <span className="text-[9px] font-semibold text-gold-400 bg-gold-400/10 px-1.5 py-0.5 rounded border border-gold-400/20">
                            R$ 9,90/mês
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                          Mensalidade de R$ 9,90 com vencimento todo dia 10.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rodapé do Dropdown */}
                <div className="pt-2 border-t border-dark-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Avisos automáticos</span>
                  <button
                    type="button"
                    onClick={() => setNotificationsOpen(false)}
                    className="text-gold-400 hover:text-gold-300 font-bold transition-colors cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* CFO Button */}
          {onOpenCFO && (
            <button
              onClick={onOpenCFO}
              className="flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl bg-gold-400/10 border border-gold-400/40 text-gold-400 hover:bg-gold-400/20 transition-all text-xs sm:text-sm font-extrabold shadow-sm active:scale-95"
              title="Diagnóstico Estratégico com CFO Virtual"
            >
              <Zap size={16} className="fill-gold-400 text-gold-400" />
              <span className="hidden sm:inline">CFO Virtual</span>
            </button>
          )}

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
            <span className="hidden sm:inline">Novo Lançamento</span>
            <span className="sm:hidden">+</span>
          </button>

          {/* User / Auth Button */}
          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-dark-900 border border-dark-800 hover:border-gold-400/40 transition-colors"
              title={currentUser ? `Logado como ${currentUser.email}` : 'Criar Conta ou Entrar'}
            >
              <div className="w-7 h-7 rounded-lg bg-gold-400/20 text-gold-400 font-extrabold text-xs flex items-center justify-center">
                {currentUser?.email ? currentUser.email.substring(0, 2).toUpperCase() : <User size={15} />}
              </div>
              <span className="text-xs font-bold text-slate-200 hidden md:inline truncate max-w-[90px]">
                {currentUser ? (currentUser.user_metadata?.full_name?.split(' ')[0] || 'Usuário') : 'Entrar'}
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
