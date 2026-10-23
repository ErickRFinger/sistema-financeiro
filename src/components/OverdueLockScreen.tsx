import React from 'react';
import { ShieldAlert, AlertTriangle, CreditCard, Lock, Sparkles, CheckCircle2, QrCode } from 'lucide-react';
import { formatCurrency } from '../lib/formatters';

interface OverdueLockScreenProps {
  userEmail: string;
  overdueDate?: string;
  amount?: number;
  onPayNow: () => void;
  onSignOut: () => void;
}

export const OverdueLockScreen: React.FC<OverdueLockScreenProps> = ({
  userEmail,
  overdueDate = '10 de Setembro',
  amount = 9.90,
  onPayNow,
  onSignOut,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-dark-950 flex items-center justify-center p-4">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-80 h-80 bg-gold-400/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-lg w-full bg-dark-900 border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95">
        {/* Lock Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
          <Lock size={32} />
        </div>

        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-black uppercase tracking-wider mb-2">
            <AlertTriangle size={13} />
            <span>Acesso Suspenso • Inadimplência</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Sistema Temporariamente Bloqueado
          </h2>
          <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
            Identificamos uma fatura mensal de <strong>{formatCurrency(amount)}</strong> com vencimento em <strong>{overdueDate}</strong> que está atrasada há mais de 30 dias.
          </p>
        </div>

        {/* Invoice Summary Card */}
        <div className="p-4 rounded-2xl bg-dark-950 border border-dark-800 text-left space-y-3">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-dark-850">
            <span className="text-slate-400">Assinante:</span>
            <span className="text-slate-200 font-semibold truncate max-w-[200px]">{userEmail}</span>
          </div>
          <div className="flex items-center justify-between text-xs pb-2 border-b border-dark-850">
            <span className="text-slate-400">Plano:</span>
            <span className="text-gold-400 font-bold">Aura Finance PRO</span>
          </div>
          <div className="flex items-center justify-between text-xs pb-2 border-b border-dark-850">
            <span className="text-slate-400">Vencimento da Fatura:</span>
            <span className="text-rose-400 font-bold">Dia 10 (Atrasado +30 dias)</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Valor para Regularização:</span>
            <span className="text-lg font-black text-white">{formatCurrency(amount)}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="space-y-3 pt-2">
          <button
            onClick={onPayNow}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-gold-400 via-amber-500 to-yellow-500 text-dark-950 font-black text-sm hover:brightness-110 active:scale-95 transition-all shadow-gold-glow flex items-center justify-center gap-2"
          >
            <QrCode size={18} />
            <span>Desbloquear Agora via PIX Mercado Pago ({formatCurrency(amount)})</span>
          </button>
          
          <p className="text-[11px] text-slate-500">
            Liberação instantânea após a confirmação do pagamento via PIX ou Cartão
          </p>
        </div>

        {/* Logout Link */}
        <div className="pt-2 border-t border-dark-800">
          <button
            onClick={onSignOut}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Sair desta conta
          </button>
        </div>
      </div>
    </div>
  );
};
