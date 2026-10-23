import React, { useState } from 'react';
import { 
  Receipt, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  QrCode, 
  CreditCard, 
  Sparkles, 
  Lock,
  ArrowRight,
  Download,
  Info
} from 'lucide-react';
import { formatCurrency } from '../lib/formatters';
import { SystemSubscriptionInvoice } from '../types/financial';

interface SubscriptionInvoicesPageProps {
  currentUser: any;
  isAdmin: boolean;
  isPaidSubscription: boolean;
  trialDaysRemaining: number;
  invoices: SystemSubscriptionInvoice[];
  onPayInvoice: (invoice: SystemSubscriptionInvoice) => void;
}

export const SubscriptionInvoicesPage: React.FC<SubscriptionInvoicesPageProps> = ({
  currentUser,
  isAdmin,
  isPaidSubscription,
  trialDaysRemaining,
  invoices,
  onPayInvoice,
}) => {
  const [selectedReceipt, setSelectedReceipt] = useState<SystemSubscriptionInvoice | null>(null);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <Receipt className="text-gold-400" size={26} />
            <span>Faturas do Sistema & Assinatura</span>
          </h1>
          <p className="text-xs text-slate-400">
            Acompanhe suas mensalidades de R$ 9,90/mês com vencimento no dia 10 e quitação via Mercado Pago
          </p>
        </div>

        {/* Status Badge */}
        <div>
          {isAdmin ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <ShieldCheck size={16} />
              <span>Acesso Administrador Master (Vitalício)</span>
            </div>
          ) : trialDaysRemaining > 0 && !isPaidSubscription ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-gold-400/30 text-gold-400 text-xs font-bold">
              <Sparkles size={16} />
              <span>Período de Teste: {trialDaysRemaining} {trialDaysRemaining === 1 ? 'dia' : 'dias'} grátis</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gold-400/10 border border-gold-400/40 text-gold-400 text-xs font-bold">
              <CheckCircle2 size={16} />
              <span>Assinatura PRO Ativa</span>
            </div>
          )}
        </div>
      </div>

      {/* Subscription Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-dark-900 border border-dark-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Plano Contratado
          </span>
          <p className="text-lg font-black text-white">
            Aura Finance PRO
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Acesso irrestrito a todos os módulos</p>
        </div>

        <div className="p-4 rounded-2xl bg-dark-900 border border-dark-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Valor da Mensalidade
          </span>
          <p className="text-lg font-black text-gold-400">
            R$ 9,90 <span className="text-xs text-slate-400 font-normal">/ mês</span>
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Cobrança única e transparente</p>
        </div>

        <div className="p-4 rounded-2xl bg-dark-900 border border-dark-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Dia do Vencimento
          </span>
          <p className="text-lg font-black text-white">
            Todo Dia 10
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Vencimento mensal unificado</p>
        </div>

        <div className="p-4 rounded-2xl bg-dark-900 border border-dark-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Forma de Pagamento
          </span>
          <p className="text-lg font-black text-sky-400">
            Mercado Pago
          </p>
          <p className="text-[10px] text-slate-500 mt-1">PIX Instantâneo ou Cartão</p>
        </div>
      </div>

      {/* Rules Notice Box */}
      <div className="p-4 rounded-2xl bg-dark-900/50 border border-dark-800 flex items-start gap-3">
        <Info size={18} className="text-gold-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 space-y-1">
          <p className="font-bold text-white">Regras de Vencimento e Bloqueio:</p>
          <p className="text-slate-400">
            • As faturas vencem no <strong>dia 10 de cada mês</strong>. Caso não haja pagamento até o dia 10, a fatura recebe a identificação <strong className="text-amber-400">"Atrasado"</strong>.
          </p>
          <p className="text-slate-400">
            • Caso a fatura permaneça em aberto por <strong>mais de 30 dias (1 mês de atraso)</strong>, o acesso ao sistema é bloqueado temporariamente até a confirmação do pagamento de R$ 9,90 via Mercado Pago.
          </p>
        </div>
      </div>

      {/* Invoices List / Table */}
      <div className="border border-dark-800 rounded-2xl bg-dark-900/50 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-dark-800 bg-dark-950/60 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Histórico de Faturas do Sistema</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-dark-800 text-slate-300 border border-dark-750">
              {invoices.length} {invoices.length === 1 ? 'fatura' : 'faturas'}
            </span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-dark-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-dark-800">
              <tr>
                <th className="p-3.5">Competência</th>
                <th className="p-3.5">Vencimento</th>
                <th className="p-3.5">Valor</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-850">
              {invoices.map((inv) => {
                const isPaid = inv.status === 'paid';
                const isOverdue = inv.status === 'overdue';

                return (
                  <tr key={inv.id} className="hover:bg-dark-850/40 transition-colors">
                    <td className="p-3.5 font-bold text-white">
                      {inv.reference_label}
                    </td>
                    <td className="p-3.5 text-slate-400 font-mono">
                      {inv.due_date.split('-').reverse().join('/')}
                    </td>
                    <td className="p-3.5 font-extrabold text-slate-200">
                      {formatCurrency(inv.amount)}
                    </td>
                    <td className="p-3.5">
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                          <CheckCircle2 size={12} />
                          <span>Paga</span>
                        </span>
                      ) : isOverdue ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 font-black text-[10px] animate-pulse">
                          <AlertTriangle size={12} />
                          <span>Atrasado</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold text-[10px]">
                          <Clock size={12} />
                          <span>Pendente</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      {isPaid ? (
                        <button
                          onClick={() => setSelectedReceipt(inv)}
                          className="px-3 py-1.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-white text-[11px] font-semibold transition-colors"
                        >
                          Ver Comprovante
                        </button>
                      ) : (
                        <button
                          onClick={() => onPayInvoice(inv)}
                          className="px-3.5 py-1.5 rounded-xl bg-gold-400 hover:bg-gold-300 text-dark-950 font-black text-[11px] transition-all shadow-gold-glow active:scale-95 flex items-center gap-1.5 ml-auto"
                        >
                          <QrCode size={13} />
                          <span>Pagar Agora (R$ 9,90)</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-dark-900 border border-dark-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-white">Comprovante de Quitação</h3>
              <p className="text-xs text-slate-400">Assinatura Aura Finance PRO</p>
            </div>

            <div className="p-4 rounded-2xl bg-dark-950 border border-dark-800 text-xs space-y-2 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Competência:</span>
                <span className="font-semibold text-slate-200">{selectedReceipt.reference_label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Valor Pago:</span>
                <span className="font-bold text-emerald-400">{formatCurrency(selectedReceipt.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Data de Pagamento:</span>
                <span className="text-slate-200">{selectedReceipt.paid_at || 'Confirmado'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gateway:</span>
                <span className="text-sky-400 font-semibold">Mercado Pago PIX</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="text-emerald-400 font-bold">Liquidado com Sucesso</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedReceipt(null)}
              className="w-full py-2.5 rounded-xl bg-dark-800 text-slate-200 font-bold text-xs hover:bg-dark-750 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
