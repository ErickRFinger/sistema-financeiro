import React, { useState, useMemo } from 'react';
import { 
  Zap, 
  Snowflake, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Calendar, 
  PiggyBank, 
  CheckCircle2, 
  Info,
  DollarSign,
  TrendingDown,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { formatCurrency } from '../lib/formatters';

export interface DebtItem {
  id: string;
  name: string;
  balance: number;
  interestRate: number; // taxa % ao mês
  minPayment: number;
}

interface DebtSnowballSimulatorProps {
  isPrivate?: boolean;
}

const DEFAULT_DEBTS: DebtItem[] = [
  {
    id: 'debt-1',
    name: 'Cartão de Crédito Rotativo',
    balance: 2500,
    interestRate: 12.5,
    minPayment: 250
  },
  {
    id: 'debt-2',
    name: 'Empréstimo Pessoal',
    balance: 6000,
    interestRate: 4.2,
    minPayment: 380
  },
  {
    id: 'debt-3',
    name: 'Financiamento Veicular',
    balance: 18000,
    interestRate: 1.8,
    minPayment: 650
  }
];

export const DebtSnowballSimulator: React.FC<DebtSnowballSimulatorProps> = ({ isPrivate = false }) => {
  const [debts, setDebts] = useState<DebtItem[]>(() => {
    try {
      const saved = localStorage.getItem('aura_user_debts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_DEBTS;
  });

  const [strategy, setStrategy] = useState<'avalanche' | 'snowball'>('avalanche');
  const [extraPayment, setExtraPayment] = useState<number>(300);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formBalance, setFormBalance] = useState('');
  const [formInterest, setFormInterest] = useState('');
  const [formMinPayment, setFormMinPayment] = useState('');

  const saveDebts = (updatedDebts: DebtItem[]) => {
    setDebts(updatedDebts);
    try {
      localStorage.setItem('aura_user_debts', JSON.stringify(updatedDebts));
    } catch {}
  };

  const handleResetDefaults = () => {
    saveDebts(DEFAULT_DEBTS);
    setExtraPayment(300);
  };

  const handleAddDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const balance = parseFloat(formBalance);
    const interest = parseFloat(formInterest);
    const minPay = parseFloat(formMinPayment);

    if (!formName.trim() || isNaN(balance) || balance <= 0) return;

    const newDebt: DebtItem = {
      id: `debt-${Date.now()}`,
      name: formName.trim(),
      balance,
      interestRate: isNaN(interest) ? 0 : interest,
      minPayment: isNaN(minPay) || minPay <= 0 ? Math.max(50, balance * 0.05) : minPay
    };

    saveDebts([...debts, newDebt]);
    setFormName('');
    setFormBalance('');
    setFormInterest('');
    setFormMinPayment('');
    setShowAddForm(false);
  };

  const handleRemoveDebt = (id: string) => {
    saveDebts(debts.filter(d => d.id !== id));
  };

  // Resumo atual das dívidas
  const totalBalance = useMemo(() => debts.reduce((acc, d) => acc + d.balance, 0), [debts]);
  const totalMinPayment = useMemo(() => debts.reduce((acc, d) => acc + d.minPayment, 0), [debts]);

  // Simulação Matemática
  const simulation = useMemo(() => {
    if (debts.length === 0 || totalBalance <= 0) {
      return {
        strategyMonths: 0,
        strategyInterest: 0,
        baselineMonths: 0,
        baselineInterest: 0,
        savedInterest: 0,
        timeSavedMonths: 0,
        payoffDate: new Date(),
        sortedDebts: [] as (DebtItem & { priority: number })[]
      };
    }

    // Ordenação conforme estratégia
    const sorted = [...debts].sort((a, b) => {
      if (strategy === 'avalanche') {
        // Maior juros primeiro
        return b.interestRate - a.interestRate || b.balance - a.balance;
      } else {
        // Menor saldo primeiro (bola de neve)
        return a.balance - b.balance || b.interestRate - a.interestRate;
      }
    }).map((item, index) => ({ ...item, priority: index + 1 }));

    // Simulação com Estratégia + Aporte Extra
    const runSimulation = (useExtra: boolean, sortStrategy: 'avalanche' | 'snowball') => {
      // Clona lista
      const list = debts.map(d => ({ ...d }));
      let months = 0;
      let totalInterest = 0;
      const MAX_MONTHS = 360; // 30 anos teto de segurança

      while (list.some(d => d.balance > 0.01) && months < MAX_MONTHS) {
        months++;

        // 1. Aplica juros mensais a todas as dívidas ativas
        list.forEach(d => {
          if (d.balance > 0) {
            const monthlyInterest = d.balance * (d.interestRate / 100);
            totalInterest += monthlyInterest;
            d.balance += monthlyInterest;
          }
        });

        // 2. Separa pool de pagamentos
        let extraPool = useExtra ? extraPayment : 0;

        // Paga o mínimo de cada uma
        list.forEach(d => {
          if (d.balance > 0) {
            const pay = Math.min(d.balance, d.minPayment);
            d.balance -= pay;
            if (d.balance <= 0.01) {
              // Liberou o valor mínimo dessa dívida para bola de neve
              extraPool += d.minPayment;
            }
          }
        });

        // 3. Aplica o pool extra acumulado na dívida prioritária
        const activeDebts = list.filter(d => d.balance > 0.01);
        if (activeDebts.length > 0) {
          activeDebts.sort((a, b) => {
            if (sortStrategy === 'avalanche') {
              return b.interestRate - a.interestRate || b.balance - a.balance;
            } else {
              return a.balance - b.balance || b.interestRate - a.interestRate;
            }
          });

          for (const target of activeDebts) {
            if (extraPool <= 0) break;
            const canPay = Math.min(target.balance, extraPool);
            target.balance -= canPay;
            extraPool -= canPay;
          }
        }
      }

      return { months, totalInterest };
    };

    const strategyResult = runSimulation(true, strategy);
    const baselineResult = runSimulation(false, 'snowball');

    const savedInterest = Math.max(0, baselineResult.totalInterest - strategyResult.totalInterest);
    const timeSavedMonths = Math.max(0, baselineResult.months - strategyResult.months);

    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + strategyResult.months);

    return {
      strategyMonths: strategyResult.months,
      strategyInterest: strategyResult.totalInterest,
      baselineMonths: baselineResult.months,
      baselineInterest: baselineResult.totalInterest,
      savedInterest,
      timeSavedMonths,
      payoffDate,
      sortedDebts: sorted
    };
  }, [debts, strategy, extraPayment, totalBalance]);

  return (
    <div className="rounded-3xl bg-dark-900 border border-slate-800 shadow-dark-card p-5 sm:p-6 mb-8 text-white">
      {/* Header Executivo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-dark-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-gold-400/10 text-gold-400 border border-gold-400/20">
              <Zap size={20} className="animate-pulse" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Quitação Acelerada de Dívidas
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Estratégias matemáticas de amortização: elimine juros compostos negativos e antecipe sua liberdade financeira.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gold-400 text-dark-950 font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-gold-glow"
          >
            <Plus size={15} />
            <span>Adicionar Dívida</span>
          </button>
          <button
            onClick={handleResetDefaults}
            title="Restaurar simulação padrão"
            className="p-2 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-400 hover:text-slate-200 border border-dark-750 transition-all text-xs"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {/* Formulário de Adicionar Nova Dívida */}
      {showAddForm && (
        <form onSubmit={handleAddDebt} className="mt-5 p-4 rounded-2xl bg-dark-950 border border-gold-400/30 animate-in fade-in duration-200">
          <h4 className="text-xs font-bold text-gold-400 uppercase tracking-wider mb-3">Nova Dívida para o Radar</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Nome / Descrição</label>
              <input
                type="text"
                placeholder="Ex: Cartão Nubank"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-dark-750 text-white text-xs focus:border-gold-400 outline-none"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Saldo Devedor Atual (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Ex: 3500.00"
                value={formBalance}
                onChange={e => setFormBalance(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-dark-750 text-white text-xs focus:border-gold-400 outline-none"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Taxa de Juros Mensal (% a.m.)</label>
              <input
                type="number"
                step="0.1"
                placeholder="Ex: 8.5"
                value={formInterest}
                onChange={e => setFormInterest(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-dark-750 text-white text-xs focus:border-gold-400 outline-none"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Parcela Mínima Mensal (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Ex: 350.00"
                value={formMinPayment}
                onChange={e => setFormMinPayment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-dark-750 text-white text-xs focus:border-gold-400 outline-none"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-400 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-gold-400 text-dark-950 text-xs font-bold hover:brightness-110 shadow-gold-glow"
            >
              Salvar Dívida
            </button>
          </div>
        </form>
      )}

      {/* Controles de Estratégia & Slider de Aporte */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6">
        {/* Seletor de Estratégia */}
        <div className="lg:col-span-6 flex flex-col justify-between p-5 rounded-2xl bg-dark-950 border border-dark-800">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              1. Selecione a Estratégia de Pagamento
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStrategy('avalanche')}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  strategy === 'avalanche'
                    ? 'bg-gradient-to-br from-amber-500/20 to-dark-900 border-gold-400 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                    : 'bg-dark-900 border-dark-750 hover:border-dark-600 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Zap size={16} className={strategy === 'avalanche' ? 'text-gold-400' : 'text-slate-500'} />
                  <span className={`text-xs font-bold ${strategy === 'avalanche' ? 'text-white' : 'text-slate-300'}`}>
                    Método Avalanche
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Ataca primeiro a dívida com <strong>maior juros</strong>. Economiza o máximo de dinheiro.
                </p>
                {strategy === 'avalanche' && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-gold-400/20 text-gold-300 text-[9px] font-extrabold border border-gold-400/30">
                    Mais Econômico
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStrategy('snowball')}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  strategy === 'snowball'
                    ? 'bg-gradient-to-br from-cyan-500/20 to-dark-900 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    : 'bg-dark-900 border-dark-750 hover:border-dark-600 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Snowflake size={16} className={strategy === 'snowball' ? 'text-cyan-400' : 'text-slate-500'} />
                  <span className={`text-xs font-bold ${strategy === 'snowball' ? 'text-white' : 'text-slate-300'}`}>
                    Bola de Neve
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Ataca primeiro a dívida com <strong>menor saldo</strong>. Gera rápida vitória psicológica.
                </p>
                {strategy === 'snowball' && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-cyan-400/20 text-cyan-300 text-[9px] font-extrabold border border-cyan-400/30">
                    Psicológico
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-dark-850 flex items-center justify-between text-[11px] text-slate-400">
            <span>Dívidas Monitoradas: <strong className="text-white">{debts.length}</strong></span>
            <span>Mínimos Mensais Totais: <strong className="text-white">{isPrivate ? '••••••' : formatCurrency(totalMinPayment)}</strong></span>
          </div>
        </div>

        {/* Slider de Aporte Extra Mensal */}
        <div className="lg:col-span-6 p-5 rounded-2xl bg-dark-950 border border-dark-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                2. Aporte Extra Mensal de Amortização
              </span>
              <span className="text-base font-black text-gold-400 font-mono">
                +{isPrivate ? '••••••' : formatCurrency(extraPayment)}<span className="text-xs text-slate-400 font-normal">/mês</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-4">
              Quanto mais você aportar além do mínimo, mais rápida e exponencial se torna a eliminação dos juros.
            </p>
            <input
              type="range"
              min="0"
              max="2500"
              step="50"
              value={extraPayment}
              onChange={e => setExtraPayment(Number(e.target.value))}
              className="w-full h-2 bg-dark-800 rounded-lg appearance-none cursor-pointer accent-gold-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono">
              <span>R$ 0</span>
              <span>R$ 500</span>
              <span>R$ 1.000</span>
              <span>R$ 1.500</span>
              <span>R$ 2.500+</span>
            </div>
          </div>

          {/* Atalhos rápidos de aporte */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-dark-850">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Presets:</span>
            {[100, 300, 500, 1000].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setExtraPayment(val)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  extraPayment === val
                    ? 'bg-gold-400 text-dark-950'
                    : 'bg-dark-850 text-slate-400 hover:text-white border border-dark-750'
                }`}
              >
                +R$ {val}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cards de Métricas de Impacto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-dark-950 border border-dark-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Dívida Total</span>
          <div className="text-xl font-black text-rose-400">
            {isPrivate ? '••••••' : formatCurrency(totalBalance)}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Saldo consolidado</span>
        </div>

        <div className="p-4 rounded-2xl bg-dark-950 border border-dark-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Prazo para Zerar</span>
          <div className="text-xl font-black text-emerald-400 flex items-center gap-1.5">
            <span>{simulation.strategyMonths} meses</span>
          </div>
          <span className="text-[10px] text-emerald-500/80 mt-1 block">
            {simulation.timeSavedMonths > 0 ? `-${simulation.timeSavedMonths} meses antecipados` : 'Pagando no ritmo base'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-dark-950 border border-gold-400/20 bg-gold-400/5">
          <span className="text-[10px] font-bold text-gold-400 uppercase tracking-wider block mb-1">Economia em Juros</span>
          <div className="text-xl font-black text-gold-300">
            {isPrivate ? '••••••' : formatCurrency(simulation.savedInterest)}
          </div>
          <span className="text-[10px] text-gold-400/70 mt-1 block">Dinheiro salvo que ficaria no banco</span>
        </div>

        <div className="p-4 rounded-2xl bg-dark-950 border border-dark-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Data da Liberdade</span>
          <div className="text-xl font-black text-white capitalize">
            {simulation.payoffDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Zero dívidas ativas</span>
        </div>
      </div>

      {/* Lista e Prioridade das Dívidas */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 size={14} className="text-gold-400" />
            Ordem de Ataque ({strategy === 'avalanche' ? 'Avalanche: Maior Juros Primeiro' : 'Bola de Neve: Menor Saldo Primeiro'})
          </h4>
          <span className="text-[10px] text-slate-500">
            Foque o aporte extra na #1 até zerar, depois transfira o montante para a #2.
          </span>
        </div>

        {debts.length === 0 ? (
          <div className="py-8 text-center bg-dark-950 rounded-2xl border border-dark-800">
            <ShieldCheck size={32} className="text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-white">Parabéns! Nenhuma dívida cadastrada.</p>
            <p className="text-xs text-slate-400 mt-1">Sua renda está 100% disponível para investimentos e patrimônio.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {simulation.sortedDebts.map(debt => (
              <div
                key={debt.id}
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                  debt.priority === 1
                    ? 'bg-gradient-to-r from-dark-950 via-dark-900 to-dark-950 border-gold-400/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                    : 'bg-dark-950 border-dark-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                    debt.priority === 1
                      ? 'bg-gold-400 text-dark-950 shadow-gold-glow'
                      : 'bg-dark-850 text-slate-400 border border-dark-750'
                  }`}>
                    #{debt.priority}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{debt.name}</span>
                      {debt.priority === 1 && (
                        <span className="px-2 py-0.5 rounded-full bg-gold-400/20 text-gold-300 text-[9px] font-extrabold border border-gold-400/30">
                          🎯 Alvo Atual
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                      <span>Juros: <strong className="text-rose-400">{debt.interestRate}% a.m.</strong></span>
                      <span>Mínimo: <strong className="text-slate-300">{isPrivate ? '••••••' : formatCurrency(debt.minPayment)}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Saldo Restante</span>
                    <span className="text-sm font-black text-white">
                      {isPrivate ? '••••••' : formatCurrency(debt.balance)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleRemoveDebt(debt.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 transition-colors"
                    title="Remover ou marcar como quitada"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
