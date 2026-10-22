import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  ShieldCheck, 
  PieChart as PieIcon, 
  PlusCircle, 
  Coins, 
  ArrowUpRight,
  Trash2 
} from 'lucide-react';
import { FinancialInvestment, FinancialAccount } from '../types/financial';
import { formatCurrency, formatDate } from '../lib/formatters';
import { getInvestments, deleteInvestment } from '../lib/supabase';
import { InvestmentModal } from '../components/InvestmentModal';
import { CurrencyQuotesWidget } from '../components/CurrencyQuotesWidget';

interface InvestmentsPageProps {
  accounts: FinancialAccount[];
}

export const InvestmentsPage: React.FC<InvestmentsPageProps> = ({ accounts }) => {
  const [investments, setInvestments] = useState<FinancialInvestment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const data = await getInvestments();
    setInvestments(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Deseja remover o ativo "${name}" da carteira?`)) {
      await deleteInvestment(id);
      await loadData();
    }
  };

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
        onInvestmentCreated={async () => {
          await loadData();
        }}
      />
    </div>
  );
};
