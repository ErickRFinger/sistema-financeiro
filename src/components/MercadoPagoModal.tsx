import React, { useState, useEffect } from 'react';
import { 
  X, 
  CreditCard, 
  QrCode, 
  Copy, 
  CheckCircle2, 
  ExternalLink, 
  Send, 
  Share2, 
  DollarSign, 
  AlertCircle,
  Zap,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { createMercadoPagoCharge, PaymentChargeResult } from '../lib/mercadoPago';
import { formatCurrency, parseCurrencyInput } from '../lib/formatters';
import { FinancialAccount, FinancialTransaction } from '../types/financial';

interface MercadoPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: FinancialAccount[];
  currentUser?: any;
  initialMode?: 'subscription' | 'custom';
  onRegisterIncome: (tx: Omit<FinancialTransaction, 'id' | 'created_at'>) => Promise<void>;
  onSubscriptionActivated?: () => void;
}

export const MercadoPagoModal: React.FC<MercadoPagoModalProps> = ({
  isOpen,
  onClose,
  accounts,
  currentUser,
  initialMode = 'subscription',
  onRegisterIncome,
  onSubscriptionActivated,
}) => {
  const [mode, setMode] = useState<'subscription' | 'custom'>(initialMode);
  const [title, setTitle] = useState('Assinatura Mensal Aura Finance PRO');
  const [amountRaw, setAmountRaw] = useState('9,90');
  const [customerName, setCustomerName] = useState(currentUser?.user_metadata?.full_name || 'Usuário Aura');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PaymentChargeResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (initialMode === 'subscription') {
      setMode('subscription');
      setTitle('Assinatura Mensal Aura Finance PRO');
      setAmountRaw('9,90');
    }
    if (currentUser) {
      if (currentUser.user_metadata?.full_name) {
        setCustomerName(currentUser.user_metadata.full_name);
      }
      if (currentUser.email) {
        setCustomerEmail(currentUser.email);
      }
    }
  }, [initialMode, currentUser, isOpen]);

  if (!isOpen) return null;

  const handleModeChange = (newMode: 'subscription' | 'custom') => {
    setMode(newMode);
    setResult(null);
    setErrorMsg('');
    if (newMode === 'subscription') {
      setTitle('Assinatura Mensal Aura Finance PRO');
      setAmountRaw('9,90');
    } else {
      setTitle('');
      setAmountRaw('');
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) {
      setAmountRaw('');
      return;
    }
    const num = parseFloat(val) / 100;
    setAmountRaw(new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(num));
  };

  const handleCreateCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const numAmount = parseCurrencyInput(amountRaw);

    if (numAmount <= 0) {
      setErrorMsg('Informe um valor válido maior que zero.');
      return;
    }

    if (!title.trim()) {
      setErrorMsg('Informe uma descrição para o serviço/produto.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await createMercadoPagoCharge({
        title: title.trim(),
        amount: numAmount,
        customer_name: customerName.trim() || undefined,
        customer_email: customerEmail.trim() || undefined,
      });

      setResult(res);
      setRegistered(false);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#009ee3', '#facc15', '#ffffff']
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Não foi possível gerar a cobrança no Mercado Pago. Verifique a conexão.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!result?.checkout_url) return;
    navigator.clipboard.writeText(result.checkout_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    if (!result?.checkout_url) return;
    const msg = `Olá! Segue o link de pagamento oficial via Mercado Pago (PIX ou Cartão) referente a: *${result.title}* no valor de *${formatCurrency(result.amount)}*:\n\n${result.checkout_url}`;
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleConfirmSubscription = () => {
    if (onSubscriptionActivated) {
      onSubscriptionActivated();
    }
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#22c55e', '#facc15', '#ffffff']
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-dark-900 border border-sky-500/30 shadow-2xl p-6 my-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-dark-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-sm">
              <CreditCard size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white">
                  Mercado Pago Oficial
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40">
                  PIX & Cartão
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {mode === 'subscription' 
                  ? 'Assinatura Mensal do Sistema (R$ 9,90/mês)'
                  : 'Cobrança avulsa para seus clientes'}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="mt-4 grid grid-cols-2 gap-2 p-1 rounded-2xl bg-dark-950 border border-dark-800">
          <button
            type="button"
            onClick={() => handleModeChange('subscription')}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'subscription'
                ? 'bg-gold-400 text-dark-950 shadow-gold-glow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap size={14} />
            <span>Assinatura (R$ 9,90/mês)</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('custom')}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'custom'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign size={14} />
            <span>Cobrança de Cliente</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {!result ? (
          /* Form to create charge */
          <form onSubmit={handleCreateCharge} className="mt-5 space-y-4">
            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                {mode === 'subscription' ? 'Valor da Mensalidade' : 'Valor da Cobrança'}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400 font-extrabold text-lg">
                  R$
                </span>
                <input
                  type="text"
                  required
                  readOnly={mode === 'subscription'}
                  placeholder="0,00"
                  value={amountRaw}
                  onChange={handleAmountChange}
                  className={`w-full pl-12 pr-4 py-3 bg-dark-950 border border-dark-800 rounded-2xl text-2xl font-black text-sky-400 focus:outline-none focus:border-sky-400 transition-all tracking-tight ${
                    mode === 'subscription' ? 'cursor-not-allowed opacity-90' : ''
                  }`}
                />
              </div>
            </div>

            {/* Title / Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Descrição
              </label>
              <input
                type="text"
                required
                readOnly={mode === 'subscription'}
                placeholder="Ex: Consultoria, Serviço Prestado, Produto"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full px-4 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-400 transition-all ${
                  mode === 'subscription' ? 'cursor-not-allowed opacity-90' : ''
                }`}
              />
            </div>

            {/* Payer Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                E-mail do Pagador
              </label>
              <input
                type="email"
                placeholder="cliente@email.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-400 transition-all"
              />
            </div>

            {mode === 'subscription' && (
              <div className="p-3.5 rounded-2xl bg-gold-400/10 border border-gold-400/20 text-xs text-slate-300 space-y-1">
                <p className="font-bold text-gold-400 flex items-center gap-1.5">
                  <Sparkles size={14} />
                  <span>Benefícios da Assinatura PRO:</span>
                </p>
                <p>• Leitor de NF ilimitado com OCR de cupom fiscal e DANFE</p>
                <p>• Assistente de Voz Inteligente com Google Gemini</p>
                <p>• CFO Virtual, Diagnóstico e Auditoria anti-sobrepreço</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-extrabold text-sm sm:text-base hover:brightness-110 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Conectando ao Mercado Pago...</span>
                ) : (
                  <>
                    <CreditCard size={18} />
                    <span>{mode === 'subscription' ? 'Gerar Pagamento da Mensalidade (R$ 9,90)' : 'Gerar Link de Cobrança PIX'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Result: Generated Link & QR Code Display */
          <div className="mt-5 space-y-5 animate-fade-in">
            {/* Success Pill */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white truncate">
                  Cobrança Mercado Pago Criada!
                </h4>
                <p className="text-xs text-slate-400 truncate">
                  Ref: {result.order_id} • {formatCurrency(result.amount)}
                </p>
              </div>
            </div>

            {/* Copy Link Button */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Link de Checkout Seguro
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={result.checkout_url}
                  className="flex-1 px-3.5 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-xs text-sky-400 font-mono truncate focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                    copied 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-dark-800 hover:bg-dark-750 text-slate-200 border border-dark-750'
                  }`}
                >
                  <Copy size={14} />
                  <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            {/* Action Buttons: Open & WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <a
                href={result.checkout_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs sm:text-sm transition-all shadow-sm"
              >
                <span>Abrir Pagamento Mercado Pago</span>
                <ExternalLink size={15} />
              </a>

              <button
                onClick={handleWhatsAppShare}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition-all shadow-sm"
              >
                <Share2 size={15} />
                <span>Enviar pelo WhatsApp</span>
              </button>
            </div>

            {/* Activate Subscription Confirmation */}
            {mode === 'subscription' && (
              <div className="pt-2 border-t border-dark-800">
                <button
                  onClick={handleConfirmSubscription}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-400 to-amber-500 text-dark-950 font-extrabold text-xs sm:text-sm hover:brightness-110 active:scale-95 transition-all shadow-gold-glow flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  <span>Já paguei / Liberar Acesso Imediato</span>
                </button>
              </div>
            )}

            {/* Reset Button */}
            <div className="text-center pt-2">
              <button
                onClick={() => setResult(null)}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                ← Emitir outra cobrança
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
