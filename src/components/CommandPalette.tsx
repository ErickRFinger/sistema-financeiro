import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Folder,
  Zap,
  FolderOpen,
  FileText,
  CreditCard,
  Landmark,
  ScanLine,
  EyeOff,
  Eye,
  Bot,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { FinancialTransaction, TransactionType } from '../types/financial';
import { formatCurrency, formatDate } from '../lib/formatters';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewTransaction: (type?: TransactionType) => void;
  onOpenScanner: () => void;
  onOpenCFO?: () => void;
  onTogglePrivacy?: () => void;
  onOpenImporter?: () => void;
  transactions: FinancialTransaction[];
  onSelectTransaction: (tx: FinancialTransaction) => void;
  isPrivate?: boolean;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'navigation' | 'actions' | 'transactions';
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  activeTab: _activeTab,
  setActiveTab,
  onOpenNewTransaction,
  onOpenScanner,
  onOpenCFO,
  onTogglePrivacy,
  onOpenImporter,
  transactions,
  onSelectTransaction,
  isPrivate = false,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Define static navigation options
  const navigationOptions = useMemo<CommandItem[]>(() => [
    {
      id: 'nav-dashboard',
      title: 'Dashboard Geral',
      subtitle: 'Visão executiva, saldo, liquidez e metas',
      category: 'navigation',
      icon: <Zap className="w-4 h-4 text-yellow-400" />,
      action: () => {
        setActiveTab('dashboard');
        onClose();
      },
    },
    {
      id: 'nav-statement',
      title: 'Extrato & Lançamentos',
      subtitle: 'Histórico completo de entradas e saídas',
      category: 'navigation',
      icon: <FileText className="w-4 h-4 text-blue-400" />,
      action: () => {
        setActiveTab('statement');
        onClose();
      },
    },
    {
      id: 'nav-cards',
      title: 'Cartões de Crédito',
      subtitle: 'Faturas, limites e vencimentos',
      category: 'navigation',
      icon: <CreditCard className="w-4 h-4 text-purple-400" />,
      action: () => {
        setActiveTab('cards');
        onClose();
      },
    },
    {
      id: 'nav-accounts',
      title: 'Contas Bancárias',
      subtitle: 'Saldos em bancos e conciliação',
      category: 'navigation',
      icon: <Landmark className="w-4 h-4 text-emerald-400" />,
      action: () => {
        setActiveTab('accounts');
        onClose();
      },
    },
    {
      id: 'nav-investments',
      title: 'Investimentos & Quitação de Dívidas',
      subtitle: 'Simulador de juros compostos e método bola de neve',
      category: 'navigation',
      icon: <TrendingUp className="w-4 h-4 text-yellow-400" />,
      action: () => {
        setActiveTab('investments');
        onClose();
      },
    },
    {
      id: 'nav-shopping',
      title: 'Listas de Compras',
      subtitle: 'Planejamento e controle de mercado',
      category: 'navigation',
      icon: <Folder className="w-4 h-4 text-cyan-400" />,
      action: () => {
        setActiveTab('shopping');
        onClose();
      },
    },
    {
      id: 'nav-tutorials',
      title: 'Tutoriais & Central de Ajuda',
      subtitle: 'Vídeos explicativos e documentação',
      category: 'navigation',
      icon: <BookOpen className="w-4 h-4 text-amber-400" />,
      action: () => {
        setActiveTab('tutorial');
        onClose();
      },
    },
  ], [setActiveTab, onClose]);

  // Define static action options
  const actionOptions = useMemo<CommandItem[]>(() => [
    {
      id: 'act-new-expense',
      title: 'Nova Despesa',
      subtitle: 'Registrar saída de caixa ou débito',
      category: 'actions',
      shortcut: 'Despesa',
      icon: <TrendingDown className="w-4 h-4 text-rose-400" />,
      action: () => {
        onClose();
        onOpenNewTransaction('expense');
      },
    },
    {
      id: 'act-new-income',
      title: 'Nova Receita',
      subtitle: 'Registrar entrada de capital ou salário',
      category: 'actions',
      shortcut: 'Receita',
      icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onClose();
        onOpenNewTransaction('income');
      },
    },
    {
      id: 'act-import-statement',
      title: 'Importar Extrato Bancário (OFX / CSV)',
      subtitle: 'Leitura automática e conciliação de todos os bancos',
      category: 'actions',
      icon: <FolderOpen className="w-4 h-4 text-yellow-400" />,
      action: () => {
        onClose();
        if (onOpenImporter) {
          onOpenImporter();
        } else {
          setActiveTab('statement');
        }
      },
    },
    {
      id: 'act-scan-invoice',
      title: 'Escanear Fatura / Cupom com IA',
      subtitle: 'Leitura OCR inteligente de comprovantes e faturas',
      category: 'actions',
      icon: <ScanLine className="w-4 h-4 text-cyan-400" />,
      action: () => {
        onClose();
        onOpenScanner();
      },
    },
    {
      id: 'act-cfo-ai',
      title: 'Consultar CFO Virtual & IA',
      subtitle: 'Análise estratégica do seu patrimônio com inteligência artificial',
      category: 'actions',
      icon: <Bot className="w-4 h-4 text-purple-400" />,
      action: () => {
        onClose();
        if (onOpenCFO) onOpenCFO();
      },
    },
    {
      id: 'act-toggle-privacy',
      title: isPrivate ? 'Desativar Modo Privacidade' : 'Ativar Modo Privacidade',
      subtitle: isPrivate ? 'Revelar valores na tela' : 'Ocultar valores com ••••••',
      category: 'actions',
      shortcut: 'P',
      icon: isPrivate ? <Eye className="w-4 h-4 text-yellow-400" /> : <EyeOff className="w-4 h-4 text-slate-400" />,
      action: () => {
        onClose();
        if (onTogglePrivacy) onTogglePrivacy();
      },
    },
  ], [onClose, onOpenNewTransaction, onOpenImporter, setActiveTab, onOpenScanner, onOpenCFO, onTogglePrivacy, isPrivate]);

  // Filter transactions dynamically based on query
  const transactionOptions = useMemo<CommandItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    return transactions
      .filter((tx) => {
        const descMatch = (tx.title || '').toLowerCase().includes(q) || (tx.notes || '').toLowerCase().includes(q);
        const catMatch = (tx.category || '').toLowerCase().includes(q);
        const valMatch = String(tx.amount).includes(q);
        return descMatch || catMatch || valMatch;
      })
      .slice(0, 6)
      .map((tx) => ({
        id: `tx-${tx.id}`,
        title: tx.title || 'Lançamento sem título',
        subtitle: `${formatDate(tx.transaction_date)} • ${tx.category || 'Geral'}`,
        category: 'transactions' as const,
        shortcut: isPrivate ? '••••••' : formatCurrency(tx.amount),
        icon: tx.type === 'income' ? (
          <TrendingUp className="w-4 h-4 text-emerald-400" />
        ) : (
          <TrendingDown className="w-4 h-4 text-rose-400" />
        ),
        action: () => {
          onClose();
          onSelectTransaction(tx);
        },
      }));
  }, [query, transactions, isPrivate, onClose, onSelectTransaction]);

  // Combine and filter all items
  const filteredItems = useMemo<CommandItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [...actionOptions, ...navigationOptions];
    }

    const filteredNav = navigationOptions.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q))
    );

    const filteredAct = actionOptions.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q))
    );

    return [...transactionOptions, ...filteredAct, ...filteredNav];
  }, [query, actionOptions, navigationOptions, transactionOptions]);

  // Reset selected index when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems.length]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev <= 0 ? Math.max(0, filteredItems.length - 1) : prev - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector('[data-selected="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-2xl bg-[#0D1017] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-white/[0.02]">
          <Search className="w-5 h-5 text-yellow-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="O que você deseja fazer? Digite um comando ou busque gastos..."
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 rounded">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto p-2 space-y-1 divide-y divide-white/[0.04]">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center">
              <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-400">Nenhum comando ou transação encontrada.</p>
              <p className="text-xs text-slate-500 mt-1">Tente pesquisar por 'Despesa', 'Extrato' ou pelo nome de uma conta.</p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  data-selected={isSelected}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-yellow-500/10 text-white border-l-2 border-yellow-400 pl-3'
                      : 'text-slate-300 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-white/5 text-slate-400'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-semibold text-white truncate">
                        {item.title}
                      </div>
                      {item.subtitle && (
                        <div className="text-[11px] text-slate-400 truncate">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {item.shortcut && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                        {item.shortcut}
                      </span>
                    )}
                    {isSelected && (
                      <ArrowRight className="w-3.5 h-3.5 text-yellow-400" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with keyboard hints */}
        <div className="px-4 py-2.5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-white/5 border border-white/10 rounded text-slate-400">↑↓</kbd> Navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-white/5 border border-white/10 rounded text-slate-400">↵</kbd> Selecionar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-white/5 border border-white/10 rounded text-slate-400">esc</kbd> Fechar
            </span>
          </div>
          <span className="text-[10px] text-yellow-500/80 font-mono hidden sm:inline">
            Aura Spotlight ⌘K
          </span>
        </div>
      </div>
    </div>
  );
};
