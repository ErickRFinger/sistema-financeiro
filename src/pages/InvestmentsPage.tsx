import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  ShieldCheck, 
  PieChart as PieIcon, 
  PlusCircle, 
  Coins, 
  ArrowUpRight 
} from 'lucide-react';
import { FinancialInvestment, FinancialAccount } from '../types/financial';
import { formatCurrency, formatDate } from '../lib/formatters';
import { getInvestments } from '../lib/supabase';

interface InvestmentsPageProps {
  accounts: FinancialAccount[];
}

export const InvestmentsPage: React.FC<InvestmentsPageProps> = ({ accounts }) => {
  const [investments, setInvestments] = useState<FinancialInvestment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getInvestments();
      setInvestments(data);
      setLoading(false);
    }
    load();
  }, []);

  const totalInvested = investments.reduce((acc, i) => acc + (i.current_amount || 0), 0);
  const totalInitial = investments.reduce((acc, i) => acc + (i.initial_amount || 0), 0);
  const totalGain = totalInvested - totalInitial;
  const yieldPercent = totalInitial > 0 ? ((totalGain / totalInitial) * 100).toFixed(2) : '0';

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

        <div className="flex items-center gap-4">
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
        </div>
      </div>

      {/* Investments List */}
      <div className="rounded-3xl bg-dark-900 border border-dark-800 shadow-dark-card p-5 sm:p-6">
        <h3 className="text-base font-extrabold text-white mb-4">Carteira de Ativos</h3>

        {investments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {investments.map((inv) => {
              const gain = inv.current_amount - inv.initial_amount;
              const gainPercent = inv.initial_amount > 0 ? ((gain / inv.initial_amount) * 100).toFixed(1) : '0';

              return (
                <div
                  key={inv.id}
                  className="p-5 rounded-2xl bg-dark-950 border border-dark-800 hover:border-gold-400/40 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-300">{inv.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-dark-850 text-gold-400 text-[10px] font-bold border border-dark-750">
                      {inv.category}
                    </span>
                  </div>

                  <div className="text-2xl font-black text-white mt-1">
                    {formatCurrency(inv.current_amount)}
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
            <p className="text-xs text-slate-500 mt-1">
              Os investimentos sincronizados com a tabela `financial_investments` aparecerão aqui.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
