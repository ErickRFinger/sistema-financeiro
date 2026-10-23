import React, { useState, useMemo } from 'react';
import {
  Target,
  Plus,
  X,
  Trash2,
  TrendingUp,
  ShieldCheck,
  Plane,
  Car
} from 'lucide-react';
import { formatCurrency } from '../lib/formatters';

export interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadlineDate?: string;
  category: 'emergency' | 'travel' | 'purchase' | 'investment';
  color: string;
}

interface FinancialGoalsWidgetProps {
  isPrivate?: boolean;
}

const STORAGE_KEY = 'aura_user_financial_goals';

const DEFAULT_GOALS: FinancialGoal[] = [
  {
    id: 'goal-1',
    title: 'Reserva de Emergência (6 Meses)',
    targetAmount: 30000,
    currentAmount: 18500,
    category: 'emergency',
    color: '#FACC15', // Gold
  },
  {
    id: 'goal-2',
    title: 'Viagem de Férias em Família',
    targetAmount: 8000,
    currentAmount: 5200,
    category: 'travel',
    color: '#06B6D4', // Cyan
  },
  {
    id: 'goal-3',
    title: 'Troca de Carro / Entrada',
    targetAmount: 45000,
    currentAmount: 12000,
    category: 'purchase',
    color: '#10B981', // Emerald
  },
];

// SVG Circular Progress Ring Component
const ProgressRing: React.FC<{
  percent: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  showBadge?: boolean;
}> = ({ percent, color, size = 64, strokeWidth = 5, showBadge = true }) => {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPercent = Math.min(100, Math.max(0, percent));
  const strokeDashoffset = circumference - (clampedPercent / 100) * circumference;
  const isGoalReached = percent >= 100;

  return (
    <div className="relative inline-flex flex-col items-center justify-center shrink-0">
      <div 
        className={`relative inline-flex items-center justify-center shrink-0 rounded-full transition-all duration-500 ${
          isGoalReached 
            ? 'animate-pulse shadow-gold-glow ring-2 ring-gold-400/50 bg-gold-400/10' 
            : ''
        }`} 
        style={{ 
          width: size, 
          height: size,
          filter: isGoalReached ? 'drop-shadow(0 0 8px rgba(250, 204, 21, 0.75))' : undefined,
        }}
      >
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isGoalReached ? '#FACC15' : color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <span className={`absolute text-[11px] font-black font-mono tracking-tighter ${
          isGoalReached ? 'text-gold-400 font-extrabold' : 'text-white'
        }`}>
          {clampedPercent}%
        </span>
      </div>

      {/* Badge de Celebração da Meta */}
      {isGoalReached && showBadge && (
        <span className="mt-1.5 inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/25 via-gold-400/30 to-yellow-500/25 text-gold-300 border border-gold-400/50 shadow-gold-glow animate-pulse whitespace-nowrap">
          🎉 Meta Atingida!
        </span>
      )}
    </div>
  );
};

export const FinancialGoalsWidget: React.FC<FinancialGoalsWidgetProps> = ({ isPrivate = false }) => {
  const [goals, setGoals] = useState<FinancialGoal[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_GOALS;
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeDepositId, setActiveDepositId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>('');

  // Form States
  const [formTitle, setFormTitle] = useState('');
  const [formTarget, setFormTarget] = useState('');
  const [formInitial, setFormInitial] = useState('');
  const [formCategory, setFormCategory] = useState<'emergency' | 'travel' | 'purchase' | 'investment'>('emergency');
  const [formColor, setFormColor] = useState('#FACC15');

  const saveGoals = (updated: FinancialGoal[]) => {
    setGoals(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(formTarget);
    const initial = parseFloat(formInitial) || 0;

    if (!formTitle.trim() || isNaN(target) || target <= 0) return;

    const newGoal: FinancialGoal = {
      id: `goal-${Date.now()}`,
      title: formTitle.trim(),
      targetAmount: target,
      currentAmount: Math.min(initial, target),
      category: formCategory,
      color: formColor,
    };

    saveGoals([...goals, newGoal]);
    setFormTitle('');
    setFormTarget('');
    setFormInitial('');
    setIsFormOpen(false);
  };

  const handleDeleteGoal = (id: string) => {
    saveGoals(goals.filter(g => g.id !== id));
  };

  const handleAportar = (goalId: string, amount: number) => {
    if (isNaN(amount) || amount <= 0) return;
    saveGoals(goals.map(g => {
      if (g.id === goalId) {
        const updatedCurrent = Math.min(g.targetAmount, g.currentAmount + amount);
        return { ...g, currentAmount: updatedCurrent };
      }
      return g;
    }));
    setActiveDepositId(null);
    setDepositAmount('');
  };

  // Métricas Consolidadas
  const totalTarget = useMemo(() => goals.reduce((acc, g) => acc + g.targetAmount, 0), [goals]);
  const totalAccumulated = useMemo(() => goals.reduce((acc, g) => acc + g.currentAmount, 0), [goals]);
  const overallPercent = totalTarget > 0 ? Math.round((totalAccumulated / totalTarget) * 100) : 0;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'emergency': return <ShieldCheck size={14} className="text-gold-400" />;
      case 'travel': return <Plane size={14} className="text-cyan-400" />;
      case 'purchase': return <Car size={14} className="text-emerald-400" />;
      default: return <TrendingUp size={14} className="text-purple-400" />;
    }
  };

  return (
    <div className="rounded-3xl bg-dark-900 border border-slate-800 shadow-dark-card p-5 sm:p-6 text-white mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-dark-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gold-400/10 text-gold-400 border border-gold-400/20">
            <Target size={20} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>Radar de Metas & Caixinhas</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-400/20 text-gold-400 font-extrabold border border-gold-400/30 font-mono">
                {overallPercent}% Concluído
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Acompanhamento visual de objetivos com anéis de progresso SVG e aportes rápidos
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gold-400 text-dark-950 font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-gold-glow self-start sm:self-auto"
        >
          {isFormOpen ? <X size={15} /> : <Plus size={15} />}
          <span>{isFormOpen ? 'Cancelar' : 'Nova Meta'}</span>
        </button>
      </div>

      {/* Formulário de Nova Meta */}
      {isFormOpen && (
        <form onSubmit={handleAddGoal} className="mt-4 p-4 rounded-2xl bg-dark-950 border border-gold-400/30 animate-in fade-in duration-200">
          <h4 className="text-xs font-bold text-gold-400 uppercase tracking-wider mb-3">Cadastrar Novo Objetivo</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Título do Objetivo</label>
              <input
                type="text"
                placeholder="Ex: Viagem Japão"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-dark-750 text-white text-xs focus:border-gold-400 outline-none"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Valor Alvo (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Ex: 15000"
                value={formTarget}
                onChange={e => setFormTarget(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-dark-750 text-white text-xs focus:border-gold-400 outline-none"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Saldo Já Acumulado (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Ex: 2500"
                value={formInitial}
                onChange={e => setFormInitial(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-dark-750 text-white text-xs focus:border-gold-400 outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Categoria & Cor</label>
              <div className="flex gap-2">
                <select
                  value={formCategory}
                  onChange={e => {
                    const cat = e.target.value as any;
                    setFormCategory(cat);
                    if (cat === 'emergency') setFormColor('#FACC15');
                    else if (cat === 'travel') setFormColor('#06B6D4');
                    else if (cat === 'purchase') setFormColor('#10B981');
                    else setFormColor('#A855F7');
                  }}
                  className="flex-1 px-3 py-2 rounded-xl bg-dark-900 border border-dark-750 text-white text-xs focus:border-gold-400 outline-none"
                >
                  <option value="emergency">Reserva / Emergência</option>
                  <option value="travel">Viagem / Férias</option>
                  <option value="purchase">Bens / Aquisições</option>
                  <option value="investment">Investimento Livre</option>
                </select>
                <input
                  type="color"
                  value={formColor}
                  onChange={e => setFormColor(e.target.value)}
                  className="w-9 h-9 rounded-xl bg-dark-900 border border-dark-750 p-1 cursor-pointer"
                  title="Cor do Anel"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-3 py-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-400 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-gold-400 text-dark-950 text-xs font-bold hover:brightness-110 shadow-gold-glow"
            >
              Salvar Meta
            </button>
          </div>
        </form>
      )}

      {/* Grid de Metas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
        {goals.map(goal => {
          const percent = goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0;
          const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
          const isDepositOpen = activeDepositId === goal.id;

          return (
            <div
              key={goal.id}
              className={`p-4 rounded-2xl bg-dark-950 border transition-all flex flex-col justify-between ${
                percent >= 100
                  ? 'border-gold-400/40 shadow-[0_0_15px_rgba(250,204,21,0.08)] bg-gradient-to-b from-dark-950 to-gold-950/15'
                  : 'border-dark-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Topo do Card */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg border transition-colors ${
                      percent >= 100 
                        ? 'bg-gold-400/15 border-gold-400/40 text-gold-400' 
                        : 'bg-dark-900 border-dark-800'
                    }`}>
                      {getCategoryIcon(goal.category)}
                    </div>
                    <span className="text-xs font-bold text-white truncate max-w-[150px]">
                      {goal.title}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="p-1 rounded text-slate-600 hover:text-rose-400 transition-colors"
                    title="Excluir meta"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Centro: Anel SVG e Valores */}
                <div className="flex items-center gap-4 my-2">
                  <ProgressRing percent={percent} color={goal.color} size={60} strokeWidth={5} />

                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Acumulado</span>
                    <span className="text-base font-black text-white font-mono">
                      {isPrivate ? '••••••' : formatCurrency(goal.currentAmount)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Meta: {isPrivate ? '••••••' : formatCurrency(goal.targetAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rodapé: Aporte Rápido */}
              <div className="mt-3 pt-3 border-t border-dark-850">
                {isDepositOpen ? (
                  <div className="space-y-2 animate-in fade-in duration-150">
                    <div className="flex gap-1.5">
                      {[100, 250, 500].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleAportar(goal.id, val)}
                          className="flex-1 py-1 rounded-lg bg-dark-900 hover:bg-gold-400/20 text-gold-300 border border-gold-400/30 text-[10px] font-bold transition-all"
                        >
                          +R$ {val}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        placeholder="Outro valor (R$)"
                        value={depositAmount}
                        onChange={e => setDepositAmount(e.target.value)}
                        className="flex-1 px-2.5 py-1 rounded-lg bg-dark-900 border border-dark-750 text-white text-xs font-mono outline-none focus:border-gold-400"
                      />
                      <button
                        onClick={() => handleAportar(goal.id, parseFloat(depositAmount))}
                        className="px-3 py-1 rounded-lg bg-gold-400 text-dark-950 font-bold text-xs hover:brightness-110 shadow-gold-glow"
                      >
                        Aportar
                      </button>
                      <button
                        onClick={() => { setActiveDepositId(null); setDepositAmount(''); }}
                        className="px-2 py-1 rounded-lg bg-dark-900 text-slate-400 hover:text-white text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-500">
                      {percent >= 100 ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          ✨ 100% Concluído
                        </span>
                      ) : (
                        <>Falta: <strong className="text-slate-300">{isPrivate ? '••••••' : formatCurrency(remaining)}</strong></>
                      )}
                    </span>
                    <button
                      onClick={() => setActiveDepositId(goal.id)}
                      className="flex items-center gap-1 text-[11px] font-bold text-gold-400 hover:text-gold-300 transition-colors"
                    >
                      <Plus size={12} />
                      <span>Aportar</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
