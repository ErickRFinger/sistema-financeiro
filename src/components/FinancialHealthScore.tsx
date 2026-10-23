import React from 'react';
import {
  ShieldCheck,
  Activity,
} from 'lucide-react';

interface FinancialHealthScoreProps {
  income: number;
  expenses: number;
  transactionsCount: number;
  isPrivate?: boolean;
}

interface FinancialHealthScoreState {
  score: number;
  level: 'Excelente' | 'Bom' | 'Atenção' | 'Crítico';
  levelColor: 'text-emerald-400' | 'text-gold-400' | 'text-amber-400' | 'text-rose-400';
  barColor: 'bg-emerald-400' | 'bg-gold-400' | 'bg-amber-400' | 'bg-rose-400';
  tip: string;
  displayScore: string;
}

const calculateScore = ({
  income,
  expenses,
  transactionsCount,
}: FinancialHealthScoreProps): number => {
  let score = 500; // Base

  // Taxa de Poupança
  if (income > 0) {
    const savingsRate = (income - expenses) / income * 100;

    if (savingsRate > 30) {
      score += 250;
    } else if (savingsRate >= 10) {
      score += 150;
    }

    if (expenses > income) {
      score -= 200;
    }
  }

  // Volume de Controle
  if (transactionsCount >= 5) {
    score += 150;
  }

  if (transactionsCount === 0) {
    return 500; // sem dados suficientes
  }

  // Trava de Limites
  return Math.min(1000, Math.max(100, score));
};

const getLevelInfo = (score: number): {
  level: 'Excelente' | 'Bom' | 'Atenção' | 'Crítico';
  levelColor: 'text-emerald-400' | 'text-gold-400' | 'text-amber-400' | 'text-rose-400';
  barColor: 'bg-emerald-400' | 'bg-gold-400' | 'bg-amber-400' | 'bg-rose-400';
  tip: string;
} => {
  if (score >= 800) {
    return {
      level: 'Excelente',
      levelColor: 'text-emerald-400',
      barColor: 'bg-emerald-400',
      tip: 'Excelente controle! Considere investir os excedentes no Simulador de Juros Compostos.',
    };
  }
  if (score >= 600) {
    return {
      level: 'Bom',
      levelColor: 'text-gold-400',
      barColor: 'bg-gold-400',
      tip: 'Finanças sob controle. Tente cortar pequenos gastos para atingir 30% de poupança.',
    };
  }
  if (score >= 400) {
    return {
      level: 'Atenção',
      levelColor: 'text-amber-400',
      barColor: 'bg-amber-400',
      tip: 'Suas despesas estão próximas das receitas. Revise seus tetos de gastos no Dashboard.',
    };
  }
  return {
    level: 'Crítico',
    levelColor: 'text-rose-400',
    barColor: 'bg-rose-400',
    tip: 'Atenção: despesas superando os ganhos este mês. Evite novas dívidas.',
  };
};

export const FinancialHealthScore: React.FC<FinancialHealthScoreProps> = ({
  income,
  expenses,
  transactionsCount,
  isPrivate = false,
}) => {
  const score = calculateScore({ income, expenses, transactionsCount });
  const { level, levelColor, barColor, tip } = getLevelInfo(score);
  const displayScore = isPrivate ? '••• / 1000' : `${score} / 1000`;

  // Progress width percentage (0-100%)
  const progressPercent = (score / 1000) * 100;

  return (
    <div className="bg-dark-900 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <ShieldCheck
            className="w-5 h-5 text-gold-400 shrink-0"
            aria-label="Saúde Financeira"
          />
          <span className="text-sm font-medium text-slate-300">
            Score de Saúde Financeira
          </span>
        </div>
        {isPrivate && (
          <span className="text-xs text-slate-500 opacity-60">•••</span>
        )}
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Score</span>
          <span>{displayScore}</span>
        </div>

        <div className="w-full bg-dark-950 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-tl-xl ${barColor} transition-all duration-500 ease-in-out max-w-full`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm font-semibold mb-2">
        <span className={levelColor}>{level}</span>
        <span className="text-xs text-slate-400 font-mono">{isPrivate ? '••••' : `${Math.round(progressPercent)}%`}</span>
      </div>

      <div className="p-3 rounded-xl bg-dark-950/60 border border-slate-800/80">
        <p className={`text-xs ${levelColor} leading-relaxed font-medium`}>
          {tip}
        </p>
      </div>
    </div>
  );
};