import React, { useMemo } from 'react';
import { Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { FinancialTransaction } from '../types/financial';
import { formatCurrency } from '../lib/formatters';

interface UpcomingBillsAlertProps {
  transactions: FinancialTransaction[];
  onNavigateToStatement: () => void;
  isPrivate?: boolean;
}

export const UpcomingBillsAlert: React.FC<UpcomingBillsAlertProps> = ({
  transactions,
  onNavigateToStatement,
  isPrivate = false,
}) => {
  // Filter and compute upcoming bills due today or within next 3 days
  const upcomingBills = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return transactions
      .filter((t) => t.type === 'expense' && t.status !== 'paid')
      .filter((t) => {
        const transactionDate = new Date(t.transaction_date);
        transactionDate.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil(
          (transactionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        return diffDays >= 0 && diffDays <= 3;
      })
      .sort(
        (a, b) =>
          new Date(a.transaction_date).getTime() -
          new Date(b.transaction_date).getTime()
      );
  }, [transactions]);

  // Return null if no upcoming bills
  if (upcomingBills.length === 0) {
    return null;
  }

  const isSingleBill = upcomingBills.length === 1;
  const title = isSingleBill
    ? '1 Conta Vence Hoje ou em Breve'
    : `${upcomingBills.length} Contas Vencendo em Breve`;

  const getDueText = (dateStr: string): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const txDate = new Date(dateStr);
    txDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil(
      (txDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return 'Vence Hoje';
    if (diffDays === 1) return 'Vence Amanhã';
    return `Em ${diffDays} dias`;
  };

  return (
    <div className="bg-gradient-to-r from-amber-950/30 via-dark-900 to-dark-900 border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
          {isSingleBill ? <Clock size={18} /> : <AlertTriangle size={18} />}
        </div>
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            {title}
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
              Atenção
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Contas a pagar nos próximos 3 dias para você não pagar juros ou multas
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        {upcomingBills.map((bill) => (
          <div
            key={bill.id}
            className="flex items-center justify-between p-3 rounded-xl bg-dark-950/70 border border-slate-800/80 hover:border-amber-500/30 transition-colors"
          >
            <div className="min-w-0 flex-1 pr-3">
              <p className="text-sm font-medium text-white truncate">
                {bill.title}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="text-amber-400 font-semibold">
                  {getDueText(bill.transaction_date)}
                </span>
                <span>•</span>
                <span>{bill.category}</span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-sm font-bold text-amber-400">
                {isPrivate ? '••••••' : formatCurrency(bill.amount)}
              </div>
              <div className="text-[10px] text-slate-500 font-medium uppercase">
                {bill.status === 'overdue'
                  ? 'VENCIDA'
                  : bill.status === 'pending'
                  ? 'PENDENTE'
                  : bill.status}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onNavigateToStatement}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-gold-400/20 border border-amber-500/40 text-amber-300 hover:from-amber-500/30 hover:to-gold-400/30 font-bold text-sm transition-all flex items-center justify-center gap-2 group cursor-pointer"
      >
        <span>Ver Contas no Extrato</span>
        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};
