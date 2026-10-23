import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Coins, 
  Sparkles, 
  Award, 
  ArrowUpRight,
  Info,
  HelpCircle,
  Zap,
  Sprout,
  Rocket,
  Crown
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { formatCurrency, parseCurrencyInput } from '../lib/formatters';

interface CompoundInterestSimulatorProps {
  isPrivate?: boolean;
}

interface PresetPlan {
  id: string;
  name: string;
  icon: React.ElementType;
  initialAmount: number;
  monthlyDeposit: number;
  years: number;
  tag: string;
  description: string;
  activeBorder: string;
  badgeActive: string;
  iconActive: string;
}

const PRESETS: PresetPlan[] = [
  {
    id: 'iniciante',
    name: 'Iniciante',
    icon: Sprout,
    initialAmount: 100,
    monthlyDeposit: 100,
    years: 5,
    tag: '5 anos',
    description: 'R$ 100 inicial • R$ 100/mês',
    activeBorder: 'border-emerald-500/70 bg-gradient-to-br from-emerald-500/15 via-dark-900 to-dark-950 text-emerald-300 shadow-[0_0_20px_-3px_rgba(16,185,129,0.25)]',
    badgeActive: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    iconActive: 'bg-emerald-500/20 text-emerald-400',
  },
  {
    id: 'construtor',
    name: 'Construtor de Renda',
    icon: Rocket,
    initialAmount: 1000,
    monthlyDeposit: 500,
    years: 15,
    tag: '15 anos',
    description: 'R$ 1.000 inicial • R$ 500/mês',
    activeBorder: 'border-sky-500/70 bg-gradient-to-br from-sky-500/15 via-dark-900 to-dark-950 text-sky-300 shadow-[0_0_20px_-3px_rgba(14,165,233,0.25)]',
    badgeActive: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    iconActive: 'bg-sky-500/20 text-sky-400',
  },
  {
    id: 'liberdade',
    name: 'Liberdade Financeira',
    icon: Crown,
    initialAmount: 10000,
    monthlyDeposit: 2000,
    years: 25,
    tag: '25 anos',
    description: 'R$ 10.000 inicial • R$ 2.000/mês',
    activeBorder: 'border-gold-400/80 bg-gradient-to-br from-gold-400/20 via-dark-900 to-dark-950 text-gold-300 shadow-gold-glow',
    badgeActive: 'bg-gold-400/20 text-gold-300 border-gold-400/50',
    iconActive: 'bg-gold-400/20 text-gold-400',
  },
];

export const CompoundInterestSimulator: React.FC<CompoundInterestSimulatorProps> = ({
  isPrivate = false,
}) => {
  const [initialAmount, setInitialAmount] = useState<number>(5000);
  const [monthlyDeposit, setMonthlyDeposit] = useState<number>(800);
  const [years, setYears] = useState<number>(10);
  const [annualRate, setAnnualRate] = useState<number>(13.75); // Selic atual
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const animFrameRef = useRef<number | null>(null);

  // Limpeza do frame de animação ao desmontar componente
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const cancelAnimation = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setActivePreset(null);
  };

  const handleApplyPreset = (preset: PresetPlan) => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    setActivePreset(preset.id);

    const startInitial = initialAmount;
    const startMonthly = monthlyDeposit;
    const startYears = years;

    const targetInitial = preset.initialAmount;
    const targetMonthly = preset.monthlyDeposit;
    const targetYears = preset.years;

    const duration = 400; // ms de transição suave
    const startTime = performance.now();

    // Easing quadrático suave para aceleração e desaceleração natural
    const easeInOutQuad = (x: number): number =>
      x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutQuad(progress);

      const currentInit = Math.round(startInitial + (targetInitial - startInitial) * eased);
      const currentMonth = Math.round(startMonthly + (targetMonthly - startMonthly) * eased);
      const currentYr = Math.round(startYears + (targetYears - startYears) * eased);

      setInitialAmount(currentInit);
      setMonthlyDeposit(currentMonth);
      setYears(currentYr);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        setInitialAmount(targetInitial);
        setMonthlyDeposit(targetMonthly);
        setYears(targetYears);
        animFrameRef.current = null;
      }
    };

    animFrameRef.current = requestAnimationFrame(step);
  };

  // Cálculo da evolução mês a mês e ano a ano
  const { chartData, finalTotal, totalInvested, totalInterest, monthlyPassiveIncome } = useMemo(() => {
    const monthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
    const totalMonths = years * 12;

    let currentBalance = initialAmount;
    let accumulatedInvested = initialAmount;

    const data: Array<{
      year: string;
      totalInvestido: number;
      jurosAcumulados: number;
      patrimonioTotal: number;
    }> = [];

    // Ponto inicial Ano 0
    data.push({
      year: 'Início',
      totalInvestido: initialAmount,
      jurosAcumulados: 0,
      patrimonioTotal: initialAmount,
    });

    for (let m = 1; m <= totalMonths; m++) {
      currentBalance = currentBalance * (1 + monthlyRate) + monthlyDeposit;
      accumulatedInvested += monthlyDeposit;

      // Salva pontos anuais para o gráfico
      if (m % 12 === 0) {
        const yearNum = m / 12;
        const interestEarned = Math.max(0, currentBalance - accumulatedInvested);

        data.push({
          year: `${yearNum}º ano`,
          totalInvestido: Math.round(accumulatedInvested),
          jurosAcumulados: Math.round(interestEarned),
          patrimonioTotal: Math.round(currentBalance),
        });
      }
    }

    const finalInterest = Math.max(0, currentBalance - accumulatedInvested);
    // Renda passiva mensal estimada retirando rendimento conservador (~0.85% ao mês)
    const passiveIncome = currentBalance * 0.0085;

    return {
      chartData: data,
      finalTotal: currentBalance,
      totalInvested: accumulatedInvested,
      totalInterest: finalInterest,
      monthlyPassiveIncome: passiveIncome,
    };
  }, [initialAmount, monthlyDeposit, years, annualRate]);

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-dark-900 border border-dark-800 shadow-dark-card space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gold-400/20 to-amber-500/20 border border-gold-400/40 flex items-center justify-center text-gold-400 shadow-sm shrink-0">
            <Coins size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Simulador de Juros Compostos & Viver de Renda
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-gold-400/20 text-gold-300 font-extrabold border border-gold-400/30">
                Efeito Bola de Neve
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Projete seu patrimônio futuro e a renda passiva mensal gerada apenas pelos juros
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-950 border border-dark-800 text-[11px] text-slate-300 font-semibold self-start sm:self-auto">
          <Sparkles size={13} className="text-gold-400" />
          <span>Taxa Referencial Selic: <strong>13,75% a.a.</strong></span>
        </div>
      </div>

      {/* Quick Presets / Atalhos Rápidos */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-gold-400 animate-pulse" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Atalhos Rápidos (Presets)
            </span>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Clique em um perfil para simulação instantânea com animação suave
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isSelected = activePreset === preset.id || (
              initialAmount === preset.initialAmount &&
              monthlyDeposit === preset.monthlyDeposit &&
              years === preset.years
            );

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className={`group relative p-3 sm:p-3.5 rounded-2xl border text-left transition-all duration-300 active:scale-[0.98] cursor-pointer flex flex-col justify-between overflow-hidden ${
                  isSelected
                    ? preset.activeBorder
                    : 'bg-dark-950/80 hover:bg-dark-850/90 border-dark-800 hover:border-slate-700 text-slate-300 hover:shadow-md'
                }`}
              >
                {/* Subtle background glow effect if selected */}
                {isSelected && (
                  <div className="absolute -right-6 -bottom-6 w-20 h-20 rounded-full bg-gold-400/10 blur-xl pointer-events-none" />
                )}

                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 shrink-0 ${
                        isSelected ? preset.iconActive : 'bg-dark-800 text-slate-400 group-hover:text-gold-400'
                      }`}
                    >
                      <Icon size={15} />
                    </div>
                    <span className={`text-xs font-extrabold tracking-tight ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                      {preset.name}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors shrink-0 ${
                      isSelected
                        ? preset.badgeActive
                        : 'bg-dark-850 text-slate-400 border-dark-750'
                    }`}
                  >
                    {preset.tag}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>{preset.description}</span>
                  <ArrowUpRight
                    size={13}
                    className={`transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0 ${
                      isSelected ? 'text-gold-400' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sliders Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-dark-950 border border-dark-800">
        {/* Initial Amount */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-400">Aporte Inicial:</span>
            <span className="text-gold-400 font-extrabold">
              {isPrivate ? '••••••' : formatCurrency(initialAmount)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100000}
            step={100}
            value={initialAmount}
            onChange={(e) => {
              cancelAnimation();
              setInitialAmount(Number(e.target.value));
            }}
            className="w-full accent-gold-400 h-1.5 bg-dark-800 rounded-lg cursor-pointer transition-all"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>R$ 0</span>
            <span>R$ 100k</span>
          </div>
        </div>

        {/* Monthly Deposit */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-400">Aporte Mensal:</span>
            <span className="text-gold-400 font-extrabold">
              {isPrivate ? '••••••' : `${formatCurrency(monthlyDeposit)} / mês`}
            </span>
          </div>
          <input
            type="range"
            min={100}
            max={20000}
            step={100}
            value={monthlyDeposit}
            onChange={(e) => {
              cancelAnimation();
              setMonthlyDeposit(Number(e.target.value));
            }}
            className="w-full accent-gold-400 h-1.5 bg-dark-800 rounded-lg cursor-pointer transition-all"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>R$ 100</span>
            <span>R$ 20k/mês</span>
          </div>
        </div>

        {/* Years */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-400">Prazo (Tempo):</span>
            <span className="text-white font-extrabold">{years} {years === 1 ? 'ano' : 'anos'}</span>
          </div>
          <input
            type="range"
            min={1}
            max={35}
            step={1}
            value={years}
            onChange={(e) => {
              cancelAnimation();
              setYears(Number(e.target.value));
            }}
            className="w-full accent-gold-400 h-1.5 bg-dark-800 rounded-lg cursor-pointer transition-all"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>1 ano</span>
            <span>35 anos</span>
          </div>
        </div>

        {/* Annual Rate */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-400">Rentabilidade Anual:</span>
            <span className="text-emerald-400 font-extrabold">{annualRate.toFixed(2)}% a.a.</span>
          </div>
          <input
            type="range"
            min={6}
            max={20}
            step={0.25}
            value={annualRate}
            onChange={(e) => {
              cancelAnimation();
              setAnnualRate(Number(e.target.value));
            }}
            className="w-full accent-emerald-400 h-1.5 bg-dark-800 rounded-lg cursor-pointer transition-all"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>6% (Poupança)</span>
            <span>20% (Ações/FIIs)</span>
          </div>
        </div>
      </div>

      {/* KPI Results Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-dark-950 border border-dark-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Total Investido do Bolso
          </span>
          <p className="text-xl font-black text-slate-300">
            {isPrivate ? '••••••' : formatCurrency(totalInvested)}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">O que você guardou manualmente</p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
            Total Ganho em Juros (Lucro)
          </span>
          <p className="text-xl font-black text-emerald-400">
            {isPrivate ? '••••••' : `+ ${formatCurrency(totalInterest)}`}
          </p>
          <p className="text-[10px] text-emerald-300/80 mt-1">
            {totalInvested > 0 ? `${((totalInterest / totalInvested) * 100).toFixed(0)}% de ganho puro` : 'Rendimentos'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-gold-400/20 via-dark-950 to-dark-900 border border-gold-400/50 shadow-gold-glow">
          <span className="text-[11px] font-extrabold text-gold-400 uppercase tracking-wider block mb-1">
            Patrimônio Total Acumulado
          </span>
          <p className="text-2xl font-black text-white">
            {isPrivate ? '••••••' : formatCurrency(finalTotal)}
          </p>
          <p className="text-[10px] text-gold-300/80 mt-1">Montante líquido ao final do prazo</p>
        </div>

        <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30">
          <span className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider block mb-1">
            Renda Passiva Mensal (Viver de Renda)
          </span>
          <p className="text-xl font-black text-sky-300">
            {isPrivate ? '••••••' : `${formatCurrency(monthlyPassiveIncome)} / mês`}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Sem precisar trabalhar ou mexer no montante</p>
        </div>
      </div>

      {/* Chart: Growth curve */}
      <div className="p-4 rounded-2xl bg-dark-950 border border-dark-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp size={16} className="text-gold-400" />
            <span>Curva de Acumulação de Patrimônio no Tempo</span>
          </h4>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              <span>Investido</span>
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>Juros Compostos</span>
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorInvestido" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64748b" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#64748b" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="colorJuros" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="year" stroke="#475569" fontSize={11} tickLine={false} />
              <YAxis 
                stroke="#475569" 
                fontSize={11} 
                tickLine={false} 
                tickFormatter={(v) => v >= 1000000 ? `R$${(v/1000000).toFixed(1)}M` : `R$${(v/1000).toFixed(0)}k`} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0d1017', 
                  borderColor: '#232b3e', 
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px' 
                }}
                formatter={(val: any) => [formatCurrency(val), '']}
              />
              <Area type="monotone" dataKey="totalInvestido" name="Valor Investido" stroke="#64748b" strokeWidth={2} fill="url(#colorInvestido)" />
              <Area type="monotone" dataKey="jurosAcumulados" name="Juros Compostos (Lucro)" stroke="#10b981" strokeWidth={2.5} fill="url(#colorJuros)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
