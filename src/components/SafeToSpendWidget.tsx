import React, { useState, useRef, useEffect } from 'react';
import { Wallet, ShieldCheck, AlertCircle, HelpCircle, Calculator } from 'lucide-react';
import { FinancialTransaction } from '../types/financial';
import { formatCurrency } from '../lib/formatters';

interface SafeToSpendWidgetProps {
  accounts: { balance: number }[];
  transactions: FinancialTransaction[];
  isPrivate?: boolean;
}

export const SafeToSpendWidget: React.FC<SafeToSpendWidgetProps> = ({
  accounts,
  transactions,
  isPrivate = false,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Fecha o tooltip ao clicar fora (especialmente útil em telas touch/mobile)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTooltip]);

  // Dias restantes no mês atual
  const now = new Date();
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = lastDayOfMonth - now.getDate();
  const daysRemainingSafe = daysRemaining > 0 ? daysRemaining : 1;

  // Saldo disponível consolidado (soma dos saldos das contas)
  const totalBalance = accounts.reduce((acc, a) => acc + (a.balance || 0), 0);

  // Despesas pendentes que vencem até o final do mês corrente
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const pendingBills = transactions
    .filter((t) => t.type === 'expense' && t.status !== 'paid')
    .filter((t) => t.transaction_date.startsWith(currentMonthPrefix))
    .reduce((acc, t) => acc + t.amount, 0);

  // Valor total disponível para gastar = saldo - despesas já comprometidas
  const safeToSpendTotal = totalBalance - pendingBills;

  // Limite seguro por dia
  const safeToSpendPerDay = safeToSpendTotal / daysRemainingSafe;
  const isPositive = safeToSpendPerDay >= 0;

  return (
    <div className="bg-gradient-to-r from-dark-900 via-dark-900 to-gold-950/20 border border-gold-400/30 rounded-2xl p-4 sm:p-5 shadow-lg relative">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gold-400/10 border border-gold-400/30 flex items-center justify-center text-gold-400 shrink-0">
            <Wallet size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-white">
                Disponível para Gastar Hoje
              </h3>

              {/* Badge com Tooltip Flutuante Elegante */}
              <div 
                ref={tooltipRef}
                className="relative inline-flex items-center"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <button
                  type="button"
                  onClick={() => setShowTooltip((prev) => !prev)}
                  className="group inline-flex items-center gap-1.5 text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-gold-400/15 text-gold-300 border border-gold-400/30 hover:bg-gold-400/25 hover:border-gold-400/50 transition-all cursor-pointer focus:outline-none"
                  aria-label="Ver fórmula de cálculo matemático"
                  title="Clique ou passe o mouse para ver a fórmula"
                >
                  <span>Safe to Spend</span>
                  <HelpCircle size={11} className="text-gold-400 group-hover:scale-110 transition-transform" />
                </button>

                {/* Dropdown/Tooltip Flutuante Black Obsidian & Gold */}
                <div
                  className={`absolute left-0 sm:left-auto top-full mt-2 z-40 w-72 sm:w-80 p-3.5 rounded-xl bg-dark-950/95 backdrop-blur-xl border border-gold-400/40 shadow-2xl transition-all duration-200 ${
                    showTooltip
                      ? 'opacity-100 translate-y-0 pointer-events-auto visible'
                      : 'opacity-0 -translate-y-1 pointer-events-none invisible'
                  }`}
                >
                  {/* Cabeçalho do Tooltip */}
                  <div className="flex items-center justify-between pb-2 border-b border-dark-800 mb-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <div className="w-5 h-5 rounded-md bg-gold-400/20 text-gold-400 flex items-center justify-center">
                        <Calculator size={12} />
                      </div>
                      <span>Fórmula Matemática</span>
                    </div>
                    <span className="text-[9px] font-semibold text-slate-400 bg-dark-900 px-1.5 py-0.5 rounded border border-dark-800">
                      Cálculo Seguro
                    </span>
                  </div>

                  {/* Destaque da Fórmula Matemática */}
                  <div className="p-2.5 rounded-lg bg-dark-900/90 border border-gold-400/30 mb-2.5">
                    <p className="text-[10px] text-slate-400 mb-1 font-medium">Equação utilizada:</p>
                    <p className="text-xs font-black text-gold-400 font-mono tracking-tight leading-snug">
                      (Saldo Atual - Contas a Vencer) ÷ Dias Restantes
                    </p>
                  </div>

                  {/* Decomposição dos Valores */}
                  <div className="space-y-1.5 text-[11px] text-slate-300">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Saldo Atual (Líquido):</span>
                      <span className="font-semibold text-white">
                        {isPrivate ? '••••••' : formatCurrency(totalBalance)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Contas a Vencer (Mês):</span>
                      <span className="font-semibold text-rose-400">
                        - {isPrivate ? '••••••' : formatCurrency(pendingBills)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Dias Restantes:</span>
                      <span className="font-semibold text-gold-400">
                        ÷ {daysRemainingSafe} {daysRemainingSafe === 1 ? 'dia' : 'dias'}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-dark-800 flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-200">Disponível por Dia:</span>
                      <span
                        className={`font-black ${
                          isPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPrivate ? '••••••' : formatCurrency(safeToSpendPerDay)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-0.5">
              Limite diário recomendado até o fim do mês após pagar todas as contas
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-dark-950/80 px-3 py-1 rounded-full border border-dark-800">
          <span className="text-gold-400 font-bold">{daysRemainingSafe}</span> dias restantes
        </div>
      </div>

      <div className="my-3 p-3.5 rounded-xl bg-dark-950/70 border border-dark-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            {isPositive ? (
              <ShieldCheck size={14} className="text-emerald-400" />
            ) : (
              <AlertCircle size={14} className="text-rose-400" />
            )}
            <span>Você pode gastar com segurança:</span>
          </p>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-black tracking-tight ${
                isPrivate
                  ? 'text-slate-400'
                  : isPositive
                  ? 'text-white'
                  : 'text-rose-400'
              }`}
            >
              {isPrivate ? '••••••' : formatCurrency(safeToSpendPerDay)}
            </span>
            <span className="text-xs text-slate-400 font-medium">/ dia</span>
          </div>
        </div>

        <div className="text-left sm:text-right text-xs text-slate-400">
          <p className="text-[11px] text-slate-500">Teto livre até dia 31:</p>
          <p className="font-bold text-slate-200">
            {isPrivate ? '••••••' : formatCurrency(safeToSpendTotal)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Saldo Líquido em Caixa</p>
          <p className={`font-semibold mt-0.5 ${isPrivate ? 'text-slate-400' : 'text-slate-200'}`}>
            {isPrivate ? '••••••' : formatCurrency(totalBalance)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Contas Comprometidas no Mês</p>
          <p className={`font-semibold mt-0.5 ${isPrivate ? 'text-slate-400' : 'text-rose-400'}`}>
            {isPrivate ? '••••••' : formatCurrency(pendingBills)}
          </p>
        </div>
      </div>
    </div>
  );
};
