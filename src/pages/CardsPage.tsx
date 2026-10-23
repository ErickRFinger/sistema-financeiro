import React, { useState, useEffect } from 'react';
import { 
  CreditCard as CardIcon, 
  PlusCircle, 
  Sparkles, 
  ScanLine, 
  TrendingDown, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Edit3, 
  Layers, 
  Search,
  Check,
  Landmark,
  X
} from 'lucide-react';
import { CreditCard, CreditCardExpense, FinancialAccount } from '../types/financial';
import { formatCurrency } from '../lib/formatters';
import { CardModal } from '../components/CardModal';
import { CardExpenseModal } from '../components/CardExpenseModal';
import { CardInvoiceScannerModal } from '../components/CardInvoiceScannerModal';

interface CardsPageProps {
  cards: CreditCard[];
  cardExpenses: CreditCardExpense[];
  accounts: FinancialAccount[];
  onSaveCard: (card: Omit<CreditCard, 'id' | 'created_at'>) => void;
  onUpdateCard: (id: string, card: Partial<CreditCard>) => void;
  onDeleteCard: (id: string) => void;
  onAddCardExpense: (expense: Omit<CreditCardExpense, 'id' | 'created_at'>) => void;
  onDeleteCardExpense: (expenseId: string) => void;
  onPayInvoice: (cardId: string, accountId: string, amount: number) => void;
  onImportInvoiceExpenses: (cardId: string, expenses: Omit<CreditCardExpense, 'id' | 'created_at'>[]) => void;
}

const COLOR_THEMES: Record<string, { label: string; bg: string; border: string; text: string; glow: string }> = {
  black: {
    label: 'Obsidian Black',
    bg: 'from-dark-900 via-neutral-900 to-black',
    border: 'border-dark-700',
    text: 'text-slate-100',
    glow: 'shadow-dark-900/50',
  },
  gold: {
    label: 'Cyber Gold',
    bg: 'from-yellow-950 via-dark-900 to-amber-950',
    border: 'border-gold-400/50',
    text: 'text-gold-300',
    glow: 'shadow-gold-500/20',
  },
  purple: {
    label: 'Nu Purple',
    bg: 'from-purple-950 via-dark-950 to-violet-900',
    border: 'border-purple-500/40',
    text: 'text-purple-300',
    glow: 'shadow-purple-500/20',
  },
  orange: {
    label: 'Inter Orange',
    bg: 'from-orange-950 via-dark-900 to-amber-900',
    border: 'border-orange-500/40',
    text: 'text-orange-300',
    glow: 'shadow-orange-500/20',
  },
  blue: {
    label: 'Sapphire Blue',
    bg: 'from-blue-950 via-dark-950 to-cyan-950',
    border: 'border-blue-500/40',
    text: 'text-blue-300',
    glow: 'shadow-blue-500/20',
  },
  emerald: {
    label: 'Emerald Green',
    bg: 'from-emerald-950 via-dark-950 to-teal-950',
    border: 'border-emerald-500/40',
    text: 'text-emerald-300',
    glow: 'shadow-emerald-500/20',
  },
  rose: {
    label: 'Ruby Rose',
    bg: 'from-rose-950 via-dark-950 to-red-950',
    border: 'border-rose-500/40',
    text: 'text-rose-300',
    glow: 'shadow-rose-500/20',
  },
};

export const CardsPage: React.FC<CardsPageProps> = ({
  cards,
  cardExpenses,
  accounts,
  onSaveCard,
  onUpdateCard,
  onDeleteCard,
  onAddCardExpense,
  onDeleteCardExpense,
  onPayInvoice,
  onImportInvoiceExpenses,
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string>(cards[0]?.id || '');
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPayInvoiceModalOpen, setIsPayInvoiceModalOpen] = useState(false);
  const [payAccountId, setPayAccountId] = useState<string>(accounts[0]?.id || '');

  useEffect(() => {
    if (!isPayInvoiceModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsPayInvoiceModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPayInvoiceModalOpen]);

  // Select first card if current is empty or deleted
  const activeCard = cards.find(c => c.id === selectedCardId) || cards[0];

  // Calculate expenses for active card
  const activeCardExpenses = cardExpenses.filter(e => e.card_id === activeCard?.id);
  const currentInvoiceTotal = activeCardExpenses.reduce((acc, e) => acc + e.amount, 0);
  const totalLimit = activeCard?.limit_total || 0;
  const availableLimit = Math.max(0, totalLimit - currentInvoiceTotal);
  const percentUsed = totalLimit > 0 ? Math.min(100, Math.round((currentInvoiceTotal / totalLimit) * 100)) : 0;

  // Filtered expenses
  const filteredExpenses = activeCardExpenses.filter(e => 
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeTheme = COLOR_THEMES[activeCard?.color || 'black'] || COLOR_THEMES.black;

  const handlePayInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCard || currentInvoiceTotal <= 0) return;
    onPayInvoice(activeCard.id, payAccountId, currentInvoiceTotal);
    setIsPayInvoiceModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <CardIcon className="text-gold-400" size={26} />
            <span>Controle de Cartões de Crédito</span>
          </h1>
          <p className="text-xs text-slate-400">
            Acompanhe limites, gastos, fechamentos de fatura e leitura automática de PDF por IA
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsScannerModalOpen(true)}
            disabled={cards.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-dark-900 border border-gold-400/40 text-gold-400 hover:bg-gold-400/10 text-xs font-bold transition-all shadow-sm disabled:opacity-40"
          >
            <ScanLine size={16} />
            <span>Ler Fatura (PDF / Foto)</span>
          </button>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            disabled={cards.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-dark-900 border border-dark-750 text-slate-200 hover:text-white text-xs font-bold transition-all disabled:opacity-40"
          >
            <PlusCircle size={16} />
            <span>Lançar Compra</span>
          </button>

          <button
            onClick={() => {
              setEditingCard(null);
              setIsCardModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-gold-400 to-amber-500 text-dark-950 font-black text-xs hover:brightness-110 transition-all shadow-gold-glow active:scale-95"
          >
            <CardIcon size={16} />
            <span>Novo Cartão</span>
          </button>
        </div>
      </div>

      {/* Empty State when 0 cards */}
      {cards.length === 0 ? (
        <div className="border border-dark-800 rounded-3xl bg-dark-900/40 p-12 text-center max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-3xl bg-gold-400/10 border border-gold-400/30 text-gold-400 flex items-center justify-center mx-auto mb-4 shadow-gold-glow">
            <CardIcon size={32} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Nenhum Cartão Cadastrado</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            Adicione seus cartões Nubank, Inter, BTG, Itaú, XP ou outros para controlar limites disponíveis, faturas e ler comprovantes em PDF.
          </p>
          <button
            onClick={() => {
              setEditingCard(null);
              setIsCardModalOpen(true);
            }}
            className="px-6 py-2.5 rounded-xl bg-gold-400 hover:bg-gold-300 text-dark-950 font-black text-xs transition-all shadow-gold-glow"
          >
            + Cadastrar Meu Primeiro Cartão
          </button>
        </div>
      ) : (
        <>
          {/* Cards Switcher Tabs */}
          {cards.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {cards.map((c) => {
                const isSelected = c.id === activeCard?.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCardId(c.id)}
                    className={`
                      px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap border
                      ${isSelected 
                        ? 'bg-dark-900 border-gold-400 text-gold-400 shadow-sm' 
                        : 'bg-dark-950/60 border-dark-800 text-slate-400 hover:text-slate-200'}
                    `}
                  >
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: c.color === 'gold' ? '#facc15' : c.color === 'purple' ? '#a855f7' : c.color === 'orange' ? '#f97316' : '#38bdf8' }}
                    />
                    <span>{c.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">•• {c.last_digits || '0000'}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Active Card Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* 3D Visual Card Preview */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className={`
                w-full max-w-[360px] h-[210px] rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between shadow-2xl border
                bg-gradient-to-br ${activeTheme.bg} ${activeTheme.border} ${activeTheme.glow}
                transition-all duration-300 hover:scale-[1.02]
              `}>
                {/* Holographic light reflection */}
                <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />

                {/* Top row */}
                <div className="flex items-center justify-between z-10">
                  <span className="text-xs font-black tracking-widest uppercase text-slate-200">
                    {activeCard.bank}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
                    {activeCard.card_brand?.toUpperCase() || 'MASTERCARD'}
                  </span>
                </div>

                {/* Chip & Contactless */}
                <div className="flex items-center gap-3 z-10 my-auto">
                  <div className="w-11 h-8 rounded-md bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-300 border border-amber-600/40 shadow-inner flex flex-col justify-center px-1">
                    <div className="h-[1px] bg-amber-800/40 my-0.5" />
                    <div className="h-[1px] bg-amber-800/40 my-0.5" />
                  </div>
                  <span className="text-slate-400 font-mono text-sm tracking-tighter">)))</span>
                </div>

                {/* Number & Details */}
                <div className="z-10">
                  <div className="text-slate-200 font-mono tracking-widest text-base drop-shadow-sm mb-2">
                    •••• •••• •••• {activeCard.last_digits || '4892'}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">Titular</p>
                      <p className="font-semibold text-slate-100 uppercase truncate max-w-[170px]">
                        {activeCard.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">Vencimento</p>
                      <p className="font-bold text-gold-400">
                        Dia {activeCard.due_day}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Action Links */}
              <div className="flex items-center gap-4 mt-3 text-xs">
                <button
                  onClick={() => {
                    setEditingCard(activeCard);
                    setIsCardModalOpen(true);
                  }}
                  className="text-slate-400 hover:text-gold-400 flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 size={13} />
                  <span>Editar Cartão</span>
                </button>
                <span className="text-dark-800">•</span>
                <button
                  onClick={() => {
                    if (confirm(`Deseja realmente excluir o cartão ${activeCard.name}?`)) {
                      onDeleteCard(activeCard.id);
                    }
                  }}
                  className="text-slate-400 hover:text-rose-400 flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 size={13} />
                  <span>Excluir Cartão</span>
                </button>
              </div>
            </div>

            {/* Metrics & Limit Bar */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Current Invoice */}
                <div className="p-4 rounded-2xl bg-dark-900 border border-dark-800">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Fatura Atual
                  </p>
                  <p className="text-xl font-black text-rose-400">
                    {formatCurrency(currentInvoiceTotal)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Fecha dia {activeCard.closing_day} • Vence dia {activeCard.due_day}
                  </p>
                </div>

                {/* Available Limit */}
                <div className="p-4 rounded-2xl bg-dark-900 border border-dark-800">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Limite Disponível
                  </p>
                  <p className="text-xl font-black text-emerald-400">
                    {formatCurrency(availableLimit)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Livre para novas compras
                  </p>
                </div>

                {/* Total Limit */}
                <div className="p-4 rounded-2xl bg-dark-900 border border-dark-800">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Limite Total
                  </p>
                  <p className="text-xl font-black text-slate-100">
                    {formatCurrency(totalLimit)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {percentUsed}% comprometido
                  </p>
                </div>
              </div>

              {/* Progress Bar of Limit */}
              <div className="p-4 rounded-2xl bg-dark-900/60 border border-dark-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Uso do Limite Total</span>
                  <span className={`font-bold ${percentUsed > 85 ? 'text-rose-400' : percentUsed > 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {percentUsed}% utilizado
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-dark-950 overflow-hidden border border-dark-800 p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      percentUsed > 85
                        ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                        : percentUsed > 50
                        ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    }`}
                    style={{ width: `${percentUsed}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Gasto: {formatCurrency(currentInvoiceTotal)}</span>
                  <span>Restante: {formatCurrency(availableLimit)}</span>
                </div>
              </div>

              {/* Quick Actions (Pagar Fatura) */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 border border-gold-400/20">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gold-400/10 border border-gold-400/30 text-gold-400 flex items-center justify-center">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Pagamento da Fatura</h4>
                    <p className="text-[10px] text-slate-400">
                      Pague a fatura debitando de uma conta bancária e libere o limite
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsPayInvoiceModalOpen(true)}
                  disabled={currentInvoiceTotal <= 0}
                  className="px-4 py-2 rounded-xl bg-gold-400 hover:bg-gold-300 text-dark-950 font-black text-xs transition-all shadow-gold-glow active:scale-95 disabled:opacity-40"
                >
                  Pagar Fatura ({formatCurrency(currentInvoiceTotal)})
                </button>
              </div>
            </div>
          </div>

          {/* Expenses Table for Active Card */}
          <div className="border border-dark-800 rounded-2xl bg-dark-900/50 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-dark-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-dark-950/60">
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-bold text-white">
                  Compras na Fatura de {activeCard.name}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-dark-800 text-slate-300 border border-dark-750">
                  {filteredExpenses.length} {filteredExpenses.length === 1 ? 'compra' : 'compras'}
                </span>
              </div>

              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar na fatura..."
                  className="w-full bg-dark-950 border border-dark-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-gold-400"
                />
              </div>
            </div>

            {filteredExpenses.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Nenhuma compra lançada nesta fatura. Use o botão <strong>"Lançar Compra"</strong> ou <strong>"Ler Fatura (PDF)"</strong> para adicionar gastos.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-dark-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-dark-800">
                    <tr>
                      <th className="p-3.5">Data</th>
                      <th className="p-3.5">Descrição</th>
                      <th className="p-3.5">Categoria</th>
                      <th className="p-3.5">Parcelas</th>
                      <th className="p-3.5 text-right">Valor</th>
                      <th className="p-3.5 text-center w-12">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-850">
                    {filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-dark-850/40 transition-colors">
                        <td className="p-3.5 whitespace-nowrap text-slate-400 font-mono">
                          {exp.date.split('-').reverse().join('/')}
                        </td>
                        <td className="p-3.5 font-semibold text-slate-200">
                          {exp.title}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-1 rounded-full bg-dark-800 border border-dark-750 text-slate-300 text-[10px]">
                            {exp.category}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-400">
                          {exp.installments_total && exp.installments_total > 1 ? (
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold text-[10px]">
                              {exp.installments_current || 1}/{exp.installments_total}x
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">À vista</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right font-bold text-amber-400 whitespace-nowrap">
                          {formatCurrency(exp.amount)}
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => onDeleteCardExpense(exp.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                            title="Remover despesa"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Pay Invoice Modal */}
      {isPayInvoiceModalOpen && activeCard && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPayInvoiceModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
        >
          <div className="relative w-full max-w-sm rounded-3xl bg-dark-900 border border-gold-400/30 shadow-2xl p-5 sm:p-6 my-6 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-dark-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Pagar Fatura do Cartão</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Valor: <strong className="text-rose-400">{formatCurrency(currentInvoiceTotal)}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPayInvoiceModalOpen(false)}
                title="Fechar janela (Esc)"
                aria-label="Fechar modal"
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-dark-800 active:scale-90 transition-all duration-150"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePayInvoiceSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Conta Bancária para Débito
                </label>
                <select
                  value={payAccountId}
                  onChange={(e) => setPayAccountId(e.target.value)}
                  className="w-full bg-dark-950 border border-dark-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-gold-400"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Saldo: {formatCurrency(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPayInvoiceModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gold-400 text-dark-950 font-black text-xs hover:bg-gold-300 active:scale-95 shadow-gold-glow transition-all"
                >
                  Confirmar Pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals */}
      <CardModal
        isOpen={isCardModalOpen}
        onClose={() => {
          setIsCardModalOpen(false);
          setEditingCard(null);
        }}
        initialCard={editingCard}
        onSave={(data) => {
          if (editingCard) {
            onUpdateCard(editingCard.id, data);
          } else {
            onSaveCard(data);
          }
        }}
      />

      <CardExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        cards={cards}
        selectedCardId={activeCard?.id}
        onSave={onAddCardExpense}
      />

      <CardInvoiceScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        cards={cards}
        selectedCardId={activeCard?.id}
        onImportExpenses={onImportInvoiceExpenses}
      />
    </div>
  );
};
