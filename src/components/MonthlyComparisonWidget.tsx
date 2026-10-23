import React, { useMemo } from 'react';
import { Scale, TrendingDown, TrendingUp } from 'lucide-react';
import { FinancialTransaction } from '../types/financial';
import { formatCurrency } from '../lib/formatters';

interface MonthlyComparisonWidgetProps {
  transactions: FinancialTransaction[];
  isPrivate?: boolean;
}

export const MonthlyComparisonWidget: React.FC<MonthlyComparisonWidgetProps> = ({
  transactions,
  isPrivate = false,
}) => {
  const comparison = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11

    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const curYm = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const prevYm = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`;

    const curTxs = transactions.filter((t) => t.transaction_date.startsWith(curYm));
    const prevTxs = transactions.filter((t) => t.transaction_date.startsWith(prevYm));

    const curIncome = curTxs.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0);
    const curExpense = curTxs.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0);

    const prevIncome = prevTxs.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0);
    const prevExpense = prevTxs.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0);

    const expenseDiff = prevExpense > 0 ? ((curExpense - prevExpense) / prevExpense) * 100 : 0;
    const incomeDiff = prevIncome > 0 ? ((curIncome - prevIncome) / prevIncome) * 100 : 0;

    const curMonthName = new Date(currentYear, currentMonth, 1).toLocaleDateString('pt-BR', { month: 'long' });
    const prevMonthName = new Date(prevYear, prevMonth, 1).toLocaleDateString('pt-BR', { month: 'long' });

    return {
      curIncome,
      curExpense,
      prevIncome,
      prevExpense,
      expenseDiff,
      incomeDiff,
      curMonthName,
      prevMonthName,
    };
  }, [transactions]);

  return (
    <div className="bg-dark-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gold-400/10 border border-gold-400/30 flex items-center justify-center text-gold-400 shrink-0">
            <Scale size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Comparativo Mensal
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                vs {comparison.prevMonthName}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Desempenho de {comparison.curMonthName} comparado ao mês passado
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Despesas Card */}
        <div className="p-4 rounded-xl bg-dark-950/70 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Despesas em {comparison.curMonthName}
            </span>
            {comparison.prevExpense > 0 && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  comparison.expenseDiff < 0
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : comparison.expenseDiff > 0
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {comparison.expenseDiff < 0 ? (
                  <>
                    <TrendingDown size={11} />
                    {Math.abs(Math.round(comparison.expenseDiff))}% (Economizou!)
                  </>
                ) : comparison.expenseDiff > 0 ? (
                  <>
                    <TrendingUp size={11} />
                    +{Math.round(comparison.expenseDiff)}% acima
                  </>
                ) : (
                  '0% variação'
                )}
              </span>
            )}
          </div>

          <div className="my-2">
            <span className="text-xl font-extrabold text-white">
              {isPrivate ? '••••••' : formatCurrency(comparison.curExpense)}
            </span>
          </div>

          <p className="text-[11px] text-slate-500">
            Mês anterior ({comparison.prevMonthName}):{' '}
            <span className="font-semibold text-slate-400">
              {isPrivate ? '••••••' : formatCurrency(comparison.prevExpense)}
            </span>
          </p>
        </div>

        {/* Receitas Card */}
        <div className="p-4 rounded-xl bg-dark-950/70 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Receitas em {comparison.curMonthName}
            </span>
            {comparison.prevIncome > 0 && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  comparison.incomeDiff >= 0
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}
              >
                {comparison.incomeDiff >= 0 ? (
                  <>
                    <TrendingUp size={11} />
                    +{Math.round(comparison.incomeDiff)}%
                  </>
                ) : (
                  <>
                    <TrendingDown size={11} />
                    {Math.round(comparison.incomeDiff)}%
                  </>
                )}
              </span>
            )}
          </div>

          <div className="my-2">
            <span className="text-xl font-extrabold text-emerald-400">
              {isPrivate ? '••••••' : formatCurrency(comparison.curIncome)}
            </span>
          </div>

          <p className="text-[11px] text-slate-500">
            Mês anterior ({comparison.prevMonthName}):{' '}
            <span className="font-semibold text-slate-400">
              {isPrivate ? '••••••' : formatCurrency(comparison.prevIncome)}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
