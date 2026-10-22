import React from 'react';
import { 
  Zap, 
  ScanLine, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  LogIn, 
  UserPlus, 
  Lock,
  TrendingUp,
  Receipt,
  CreditCard
} from 'lucide-react';

interface LandingAuthGateProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export const LandingAuthGate: React.FC<LandingAuthGateProps> = ({
  onOpenLogin,
  onOpenRegister,
}) => {
  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col justify-between selection:bg-gold-400 selection:text-dark-950 font-sans">
      {/* Top Navbar */}
      <header className="border-b border-dark-800 bg-dark-950/80 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gold-400 via-amber-500 to-yellow-600 flex items-center justify-center shadow-gold-glow">
              <Zap size={22} className="text-dark-950 fill-dark-950" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white">Aura</span>
              <span className="font-light text-xl text-gold-400 ml-1">PRO</span>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold -mt-1">
                Gestão Financeira & IA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-300 hover:text-white hover:bg-dark-900 border border-dark-800 transition-colors"
            >
              <LogIn size={16} />
              <span>Entrar</span>
            </button>

            <button
              onClick={onOpenRegister}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-gold-400 to-amber-500 text-dark-950 text-xs sm:text-sm font-extrabold hover:brightness-110 active:scale-95 transition-all shadow-gold-glow"
            >
              <UserPlus size={16} />
              <span>Testar 7 Dias Grátis</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16 flex flex-col items-center justify-center text-center">
        {/* Launch Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-400 text-xs font-bold uppercase tracking-wider mb-6 animate-pulse">
          <Sparkles size={14} />
          <span>7 Dias de Teste Grátis • Cancele quando quiser</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight max-w-4xl leading-tight sm:leading-none">
          O Sistema Financeiro Inteligente com <span className="text-gold-400">IA & Leitor de Notas</span>
        </h1>

        <p className="mt-6 text-sm sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Lance pagamentos falando com a IA, escaneie notas fiscais com OCR automático, receba auditoria de custos e tenha controle total do seu fluxo de caixa em qualquer dispositivo.
        </p>

        {/* CTA Buttons Box */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            onClick={onOpenRegister}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-gold-400 via-amber-400 to-yellow-500 text-dark-950 font-black text-base hover:brightness-110 active:scale-95 transition-all shadow-gold-glow"
          >
            <span>Começar 7 Dias Grátis</span>
            <ArrowRight size={18} />
          </button>

          <button
            onClick={onOpenLogin}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-dark-900 hover:bg-dark-850 text-slate-200 border border-dark-800 font-bold text-base transition-colors"
          >
            <Lock size={18} className="text-gold-400" />
            <span>Já sou cadastrado / Login</span>
          </button>
        </div>

        {/* Price & Guarantee Pill */}
        <div className="mt-5 flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-400" />
            7 dias gratuitos sem compromisso
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <CreditCard size={14} className="text-gold-400" />
            Apenas R$ 9,90 / mês após o teste
          </span>
        </div>

        {/* 3 Pillars Feature Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="p-6 rounded-3xl bg-dark-900 border border-dark-800 shadow-dark-card hover:border-gold-400/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-gold-400/10 border border-gold-400/30 flex items-center justify-center text-gold-400 mb-4">
              <ScanLine size={24} />
            </div>
            <h3 className="text-lg font-extrabold text-white mb-2">Leitor de Nota Fiscal com IA</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tire foto ou envie o PDF da nota fiscal. O OCR com inteligência artificial extrai fornecedor, CNPJ, valor total e lança a despesa automaticamente.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-dark-900 border border-dark-800 shadow-dark-card hover:border-gold-400/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
              <Zap size={24} />
            </div>
            <h3 className="text-lg font-extrabold text-white mb-2">Assistente por Voz Gemini</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Basta falar "ganhei 1.800 coloca no caixa" ou "gastei 85 no almoço" para a inteligência financeira identificar a conta e cadastrar a transação.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-dark-900 border border-dark-800 shadow-dark-card hover:border-gold-400/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-4">
              <TrendingUp size={24} />
            </div>
            <h3 className="text-lg font-extrabold text-white mb-2">CFO Virtual & Cotações</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Score de saúde financeira 0-100, auditoria contra preços abusivos de fornecedores, cotações ao vivo do Banco Central e relatórios em PDF.
            </p>
          </div>
        </div>

        {/* Admin Access Hint */}
        <div className="mt-12 p-4 rounded-2xl bg-dark-900/60 border border-dark-800 text-xs text-slate-400 flex items-center justify-center gap-2 max-w-md">
          <ShieldCheck size={16} className="text-gold-400 shrink-0" />
          <span>
            Perfil Administrador: Faça login com usuário <strong className="text-white">admin</strong> e sua senha master.
          </span>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-800 py-6 px-4 text-center text-xs text-slate-500">
        <p>© 2026 Aura Finance PRO • Sistema Financeiro Comercial com Inteligência Artificial • Erick Finger</p>
      </footer>
    </div>
  );
};
