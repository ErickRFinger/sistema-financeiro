import React from 'react';
import { 
  Lock, 
  Sparkles, 
  CreditCard, 
  CheckCircle2, 
  LogOut, 
  Zap, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface TrialPaywallProps {
  userEmail: string;
  onOpenCheckout: () => void;
  onSignOut: () => void;
}

export const TrialPaywall: React.FC<TrialPaywallProps> = ({
  userEmail,
  onOpenCheckout,
  onSignOut,
}) => {
  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex items-center justify-center p-4 selection:bg-gold-400 selection:text-dark-950 font-sans">
      <div className="relative w-full max-w-lg rounded-3xl bg-dark-900 border border-gold-400/40 shadow-2xl p-6 sm:p-8 text-center my-6">
        {/* Glow icon */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-gold-400 via-amber-500 to-yellow-600 flex items-center justify-center mx-auto shadow-gold-glow mb-6">
          <Lock size={32} className="text-dark-950" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider mb-3">
          <span>Período de Teste de 7 Dias Expirado</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Ative sua Assinatura Mensal
        </h2>

        <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed">
          Seus 7 dias gratuitos de acesso total ao <strong>Aura Finance PRO</strong> terminaram. Ative agora para continuar lançando gastos, escaneando notas fiscais e usando a IA.
        </p>

        {/* Pricing Card */}
        <div className="my-6 p-5 rounded-2xl bg-dark-950 border border-gold-400/30 text-left">
          <div className="flex items-center justify-between border-b border-dark-850 pb-3 mb-3">
            <div>
              <span className="text-xs font-extrabold text-gold-400 uppercase tracking-wider block">
                Plano Mensal Aura PRO
              </span>
              <span className="text-slate-400 text-xs">Renovação a cada 30 dias</span>
            </div>
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-black text-white">R$ 9,90</span>
              <span className="text-xs text-slate-400 block">/mês</span>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
              <span>Leitor de Notas Fiscais ilimitado com IA OCR</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
              <span>Assistente por Voz Gemini e comandos em linguagem natural</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
              <span>CFO Virtual, Auditoria de Fornecedores e Extrato Executivo</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
              <span>Pagamento instantâneo via PIX ou Cartão (Mercado Pago)</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onOpenCheckout}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-gold-400 via-amber-400 to-yellow-500 text-dark-950 font-black text-sm sm:text-base hover:brightness-110 active:scale-95 transition-all shadow-gold-glow flex items-center justify-center gap-2"
        >
          <CreditCard size={20} />
          <span>Pagar R$ 9,90 com Mercado Pago (PIX)</span>
          <ArrowRight size={18} />
        </button>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-dark-850">
          <span className="truncate max-w-[200px]">Conta: {userEmail}</span>
          <button
            onClick={onSignOut}
            className="text-rose-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <LogOut size={13} />
            <span>Sair da conta</span>
          </button>
        </div>
      </div>
    </div>
  );
};
