import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  ShieldCheck, 
  PieChart as PieIcon, 
  PlusCircle, 
  Coins, 
  ArrowUpRight,
  Trash2,
  Target,
  Award,
  Calendar,
  Edit3,
  Check,
  Sparkles
} from 'lucide-react';
import { FinancialInvestment, FinancialAccount } from '../types/financial';
import { formatCurrency, formatDate } from '../lib/formatters';
import { getInvestments, deleteInvestment } from '../lib/supabase';
import { InvestmentModal } from '../components/InvestmentModal';
import { CurrencyQuotesWidget } from '../components/CurrencyQuotesWidget';
import { CompoundInterestSimulator } from '../components/CompoundInterestSimulator';

interface InvestmentsPageProps {
  accounts: FinancialAccount[];
  currentUser?: any;
  isPrivate?: boolean;
}

export const InvestmentsPage: React.FC<InvestmentsPageProps> = ({ accounts, currentUser, isPrivate = false }) => {
  const [investments, setInvestments] = useState<FinancialInvestment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const userIsAdmin = Boolean(
      currentUser?.email === 'admin@aurafinance.com.br' || 
      currentUser?.user_metadata?.is_admin === true
    );
    const userKey = currentUser ? `aura_user_${currentUser.id}` : null;

    if (userKey) {
      const saved = localStorage.getItem(`${userKey}_investments`);
      if (saved) {
        setInvestments(JSON.parse(saved));
        setLoading(false);
        return;
      }
    }

    if (userIsAdmin) {
      const data = await getInvestments();
      setInvestments(data);
    } else {
      setInvestments([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Deseja remover o ativo "${name}" da carteira?`)) {
      const userKey = currentUser ? `aura_user_${currentUser.id}` : null;
      if (userKey) {
        const saved = localStorage.getItem(`${userKey}_investments`);
        if (saved) {
          const list: FinancialInvestment[] = JSON.parse(saved);
          const updated = list.filter(i => i.id !== id);
          localStorage.setItem(`${userKey}_investments`, JSON.stringify(updated));
        }
      }
      try {
        await deleteInvestment(id);
      } catch {
        // fallback
      }
      await loadData();
    }
  };

  const userKey = currentUser ? `aura_user_${currentUser.id}` : 'aura_guest';
  const [savingsGoal, setSavingsGoal] = useState<{ title: string; targetAmount: number; targetDate: string }>(() => {
    const saved = localStorage.getItem(`${userKey}_savings_goal`);
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      title: 'Reserva do Porquinho & Caixinha 100% CDI',
      targetAmount: 50000.00,
      targetDate: '2026-12-31'
    };
  });
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalTitleInput, setGoalTitleInput] = useState(savingsGoal.title);
  const [goalAmountInput, setGoalAmountInput] = useState(String(savingsGoal.targetAmount));
  const [goalDateInput, setGoalDateInput] = useState(savingsGoal.targetDate);

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const newGoal = {
      title: goalTitleInput.trim() || 'Minha Meta de Poupança',
      targetAmount: Number(goalAmountInput) > 0 ? Number(goalAmountInput) : 50000,
      targetDate: goalDateInput || '2026-12-31',
    };
    setSavingsGoal(newGoal);
    localStorage.setItem(`${userKey}_savings_goal`, JSON.stringify(newGoal));
    setIsEditingGoal(false);
  };

  const totalInvested = investments.reduce((acc, i) => acc + (i.current_amount || 0), 0);
  const totalInitial = investments.reduce((acc, i) => acc + (i.initial_amount || 0), 0);
  const totalGain = totalInvested - totalInitial;
  const yieldPercent = totalInitial > 0 ? ((totalGain / totalInitial) * 100).toFixed(2) : '0';

  const progressPercent = savingsGoal.targetAmount > 0 
    ? Math.min(100, Math.max(0, (totalInvested / savingsGoal.targetAmount) * 100)) 
    : 0;
  const remainingAmount = Math.max(0, savingsGoal.targetAmount - totalInvested);
  const monthlyYieldSelic = totalInvested * 0.0108; // ~1,08% ao mês líquido com Selic a 13,75% a.a.

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* Header */}
      <div className="p-5 sm:p-6 rounded-3xl bg-dark-900 border border-dark-800 shadow-dark-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Coins size={28} className="text-gold-400" />
            <span>Investimentos & Patrimônio</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Gestão de ativos, rendimento consolidado e alocação de capital
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-dark-950 border border-dark-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Aplicado</span>
            <span className="text-xl font-black text-gold-400">{formatCurrency(totalInvested)}</span>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-dark-950 border border-dark-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Rentabilidade</span>
            <span className={`text-xl font-black flex items-center gap-1 ${
              Number(yieldPercent) >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              <ArrowUpRight size={16} />
              +{yieldPercent}%
            </span>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-gold-400 to-amber-500 text-dark-950 font-extrabold text-xs sm:text-sm hover:brightness-110 active:scale-95 transition-all shadow-gold-glow"
          >
            <PlusCircle size={18} />
            <span>Novo Investimento</span>
          </button>
        </div>
      </div>

      {/* Real-time Market Quotes Widget */}
      <CurrencyQuotesWidget />

      {/* Savings Goal Card (Meta do Porquinho & Caixinhas) */}
      <div className="rounded-3xl bg-gradient-to-br from-dark-900 via-dark-950 to-dark-900 border border-gold-400/30 p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-gold-400/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gold-400/15 border border-gold-400/30 flex items-center justify-center text-gold-400 shrink-0">
              <Target size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">{savingsGoal.title}</h3>
                {progressPercent >= 100 ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase flex items-center gap-1 shadow-sm">
                    <Sparkles size={11} />
                    Meta Atingida!
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-gold-400/15 text-gold-300 border border-gold-400/30 text-[10px] font-bold">
                    Selic 13,75% a.a.
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Alvo: <span className="text-white font-bold">{formatCurrency(savingsGoal.targetAmount)}</span> até {savingsGoal.targetDate}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEditingGoal(!isEditingGoal)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-dark-850 hover:bg-dark-800 border border-dark-750 text-slate-300 hover:text-white text-xs font-semibold transition-all self-start sm:self-auto shrink-0"
          >
            <Edit3 size={13} className="text-gold-400" />
            <span>{isEditingGoal ? 'Cancelar Edição' : 'Ajustar Meta'}</span>
          </button>
        </div>

        {/* Edit Goal Inline Form */}
        {isEditingGoal && (
          <form onSubmit={handleSaveGoal} className="mb-5 p-4 rounded-2xl bg-dark-950 border border-dark-800 space-y-3">
            <p className="text-xs font-bold text-gold-400 uppercase tracking-wider">Configurar Nova Meta:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Título da Meta</label>
                <input
                  type="text"
                  value={goalTitleInput}
                  onChange={(e) => setGoalTitleInput(e.target.value)}
                  placeholder="Ex: Porquinho Reserva de Emergência"
                  className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-dark-800 text-xs text-white focus:outline-none focus:border-gold-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Valor Alvo (R$)</label>
                <input
                  type="number"
                  value={goalAmountInput}
                  onChange={(e) => setGoalAmountInput(e.target.value)}
                  placeholder="50000"
                  className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-dark-800 text-xs text-white focus:outline-none focus:border-gold-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Data Limite</label>
                <input
                  type="date"
                  value={goalDateInput}
                  onChange={(e) => setGoalDateInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-dark-800 text-xs text-white focus:outline-none focus:border-gold-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingGoal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-gold-400 text-dark-950 font-bold text-xs hover:brightness-110 shadow-sm"
              >
                Salvar Meta
              </button>
            </div>
          </form>
        )}

        {/* Progress Bar Container */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300">
              Progresso Acumulado: <strong className="text-gold-400">{formatCurrency(totalInvested)}</strong>
            </span>
            <span className="font-extrabold text-white text-sm">
              {progressPercent.toFixed(1)}%
            </span>
          </div>

          <div className="h-4 rounded-full bg-dark-950 border border-dark-800 overflow-hidden relative p-0.5">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-gold-400 to-yellow-300 transition-all duration-700 shadow-gold-glow"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Metric Insights Sub-grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-dark-800">
          <div className="p-3 rounded-xl bg-dark-950/60 border border-dark-850">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Falta para a Meta</span>
            <span className="text-sm sm:text-base font-extrabold text-white">
              {remainingAmount <= 0 ? '✓ Alvo Concluído!' : formatCurrency(remainingAmount)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-dark-950/60 border border-dark-850">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Rendimento Estimado (Selic 13,75%)</span>
            <span className="text-sm sm:text-base font-extrabold text-emerald-400">
              +{formatCurrency(monthlyYieldSelic)} <span className="text-[11px] text-slate-400 font-normal">/ mês</span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-dark-950/60 border border-dark-850">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Rendimento Anual Projetado</span>
            <span className="text-sm sm:text-base font-extrabold text-gold-400">
              +{formatCurrency(totalInvested * 0.1375)} <span className="text-[11px] text-slate-400 font-normal">/ ano</span>
            </span>
          </div>
        </div>
      </div>

      {/* Compound Interest & Financial Independence Simulator */}
      <CompoundInterestSimulator isPrivate={isPrivate} />

      {/* Investments List */}
      <div className="rounded-3xl bg-dark-900 border border-dark-800 shadow-dark-card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-extrabold text-white">Carteira de Ativos ({investments.length})</h3>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-xs text-gold-400 font-bold hover:underline"
          >
            + Adicionar
          </button>
        </div>

        {investments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {investments.map((inv) => {
              const gain = inv.current_amount - inv.initial_amount;
              const gainPercent = inv.initial_amount > 0 ? ((gain / inv.initial_amount) * 100).toFixed(1) : '0';

              return (
                <div
                  key={inv.id}
                  className="p-5 rounded-2xl bg-dark-950 border border-dark-800 hover:border-gold-400/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-300 truncate max-w-[150px]">{inv.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-dark-850 text-gold-400 text-[10px] font-bold border border-dark-750">
                          {inv.category}
                        </span>
                        <button
                          onClick={() => handleDelete(inv.id, inv.name)}
                          className="p-1 rounded-md text-slate-500 hover:text-rose-400 transition-colors"
                          title="Remover ativo"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="text-2xl font-black text-white mt-1">
                      {formatCurrency(inv.current_amount)}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-dark-850 flex items-center justify-between text-xs text-slate-400">
                    <span>Aporte Inicial: {formatCurrency(inv.initial_amount)}</span>
                    <span className={`font-bold ${gain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {gain >= 0 ? '+' : ''}{gainPercent}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center">
            <Coins size={36} className="text-gold-400/40 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-300">Nenhum investimento registrado</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Cadastre seus ativos em renda fixa, ações, FIIs ou criptomoedas para acompanhar rendimentos consolidados.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-gold-400 text-dark-950 font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-gold-glow"
            >
              + Adicionar Primeiro Ativo
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      <InvestmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        accounts={accounts}
        currentUser={currentUser}
        onInvestmentCreated={async () => {
          await loadData();
        }}
      />
    </div>
  );
};
