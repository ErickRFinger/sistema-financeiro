import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  CreditCard, 
  QrCode, 
  Copy, 
  CheckCircle2, 
  ExternalLink, 
  Share2, 
  DollarSign, 
  AlertCircle,
  Zap,
  Sparkles,
  Download,
  Loader2,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  createPixPayment, 
  checkPaymentStatus, 
  createMercadoPagoCharge, 
  PixPaymentResult, 
  PaymentChargeResult 
} from '../lib/mercadoPago';
import { formatCurrency, parseCurrencyInput } from '../lib/formatters';
import { generateReceiptPdf } from '../lib/generateReceiptPdf';
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
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [title, setTitle] = useState('Assinatura Mensal Aura Finance PRO');
  const [amountRaw, setAmountRaw] = useState('9,90');
  const [customerName, setCustomerName] = useState(currentUser?.user_metadata?.full_name || 'Usuário Aura');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
  
  const [isLoading, setIsLoading] = useState(false);
  const [pixResult, setPixResult] = useState<PixPaymentResult | null>(null);
  const [cardResult, setCardResult] = useState<PaymentChargeResult | null>(null);
  
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isApproved, setIsApproved] = useState(false);
  
  const pollingRef = useRef<any>(null);

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
    // Reset states on open
    setPixResult(null);
    setCardResult(null);
    setIsApproved(false);
    setErrorMsg('');
  }, [initialMode, currentUser, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Polling para checar status do PIX a cada 3 segundos
  useEffect(() => {
    if (!pixResult?.payment_id || isApproved) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    const poll = async () => {
      try {
        const check = await checkPaymentStatus(pixResult.payment_id, currentUser?.id);
        if (check.approved) {
          setIsApproved(true);
          if (pollingRef.current) clearInterval(pollingRef.current);

          confetti({
            particleCount: 90,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#22c55e', '#facc15', '#38bdf8', '#ffffff']
          });

          if (onSubscriptionActivated) {
            onSubscriptionActivated();
          }
        }
      } catch (err) {
        // Ignora erros temporários de rede
      }
    };

    pollingRef.current = setInterval(poll, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [pixResult, isApproved, currentUser, onSubscriptionActivated]);

  if (!isOpen) return null;

  const handleModeChange = (newMode: 'subscription' | 'custom') => {
    setMode(newMode);
    setPixResult(null);
    setCardResult(null);
    setIsApproved(false);
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

  const handleGeneratePayment = async (e: React.FormEvent) => {
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
      if (paymentMethod === 'pix') {
        const res = await createPixPayment({
          title: title.trim(),
          amount: numAmount,
          customer_name: customerName.trim() || undefined,
          customer_email: customerEmail.trim() || undefined,
          user_id: currentUser?.id,
          invoice_id: mode === 'subscription' ? new Date().toISOString().slice(0, 7) : undefined,
        });
        setPixResult(res);
      } else {
        const res = await createMercadoPagoCharge({
          title: title.trim(),
          amount: numAmount,
          customer_name: customerName.trim() || undefined,
          customer_email: customerEmail.trim() || undefined,
        });
        setCardResult(res);
      }

      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#009ee3', '#facc15', '#ffffff']
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Não foi possível gerar a cobrança no Mercado Pago. Verifique a conexão.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPix = () => {
    if (!pixResult?.qr_code) return;
    navigator.clipboard.writeText(pixResult.qr_code);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handleCopyLink = () => {
    if (!cardResult?.checkout_url) return;
    navigator.clipboard.writeText(cardResult.checkout_url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const urlToShare = cardResult?.checkout_url || pixResult?.ticket_url;
    const amountVal = cardResult?.amount || pixResult?.amount || 9.90;
    const titleVal = cardResult?.title || pixResult?.title || 'Serviço Financeiro';

    let msg = `Olá! Segue o link de pagamento oficial via Mercado Pago referente a: *${titleVal}* no valor de *${formatCurrency(amountVal)}*:\n\n${urlToShare}`;
    if (pixResult?.qr_code) {
      msg += `\n\n*Código PIX Copia e Cola:*\n${pixResult.qr_code}`;
    }

    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleDownloadReceipt = () => {
    const now = new Date();
    const refMonth = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const invoiceNumber = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;

    generateReceiptPdf({
      invoiceNumber,
      customerName: customerName || 'Assinante Aura',
      customerEmail: customerEmail || 'Não informado',
      referenceMonth: refMonth,
      amount: pixResult?.amount || 9.90,
      paymentId: pixResult?.payment_id || `MP-${Date.now()}`,
      paymentDate: now.toLocaleDateString('pt-BR'),
      paymentMethod: 'PIX Instantâneo',
    });
  };

  const handleManualActivation = () => {
    setIsApproved(true);
    if (onSubscriptionActivated) {
      onSubscriptionActivated();
    }
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#22c55e', '#facc15', '#ffffff']
    });
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-dark-900 border border-gold-400/30 shadow-2xl p-6 my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-dark-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gold-400/20 to-amber-500/20 border border-gold-400/40 flex items-center justify-center text-gold-400 shadow-sm">
              <Zap size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white">
                  Pagamento por dentro do App
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-400/20 text-gold-300 font-bold border border-gold-400/40 flex items-center gap-1">
                  <Sparkles size={11} />
                  Oficial Mercado Pago
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {mode === 'subscription' 
                  ? 'Assinatura Mensal Aura Finance PRO (R$ 9,90/mês)'
                  : 'Cobrança avulsa para clientes via PIX ou Cartão'}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            title="Fechar janela (Esc)"
            aria-label="Fechar modal"
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-dark-800 active:scale-90 transition-all duration-150"
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

        {/* Payment Method Switcher (PIX ou Cartão) */}
        {!pixResult && !cardResult && (
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('pix')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                paymentMethod === 'pix'
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                  : 'bg-dark-950 border-dark-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <QrCode size={15} />
              <span>PIX Instantâneo (QR Code na Tela)</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                paymentMethod === 'card'
                  ? 'bg-sky-500/15 border-sky-500/50 text-sky-300'
                  : 'bg-dark-950 border-dark-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <CreditCard size={15} />
              <span>Cartão / Link Web</span>
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STATE 1: INITIAL FORM */}
        {!pixResult && !cardResult && (
          <form onSubmit={handleGeneratePayment} className="mt-4 space-y-4">
            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                {mode === 'subscription' ? 'Valor da Mensalidade' : 'Valor da Cobrança'}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-400 font-extrabold text-lg">
                  R$
                </span>
                <input
                  type="text"
                  required
                  readOnly={mode === 'subscription'}
                  placeholder="0,00"
                  value={amountRaw}
                  onChange={handleAmountChange}
                  className={`w-full pl-12 pr-4 py-3 bg-dark-950 border border-dark-800 rounded-2xl text-2xl font-black text-gold-400 focus:outline-none focus:border-gold-400 transition-all tracking-tight ${
                    mode === 'subscription' ? 'cursor-not-allowed opacity-90' : ''
                  }`}
                />
              </div>
            </div>

            {/* Title / Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Descrição do Pagamento
              </label>
              <input
                type="text"
                required
                readOnly={mode === 'subscription'}
                placeholder="Ex: Consultoria, Serviço Prestado, Produto"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full px-4 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-gold-400 transition-all ${
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
                className="w-full px-4 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-gold-400 transition-all"
              />
            </div>

            {mode === 'subscription' && (
              <div className="p-3.5 rounded-2xl bg-gold-400/10 border border-gold-400/20 text-xs text-slate-300 space-y-1">
                <p className="font-bold text-gold-400 flex items-center gap-1.5">
                  <Sparkles size={14} />
                  <span>Liberação Instantânea por Dentro do App:</span>
                </p>
                <p>• O QR Code aparece diretamente nesta tela.</p>
                <p>• Assim que você pagar no app do banco, o sistema reconhece em 3 segundos.</p>
                <p>• Sem necessidade de anexar comprovante ou falar com suporte.</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-gold-400 via-amber-400 to-yellow-500 text-dark-950 font-black text-sm sm:text-base hover:brightness-110 active:scale-95 transition-all shadow-gold-glow flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    <span>Gerando Cobrança no Mercado Pago...</span>
                  </span>
                ) : (
                  <>
                    {paymentMethod === 'pix' ? <QrCode size={19} /> : <CreditCard size={19} />}
                    <span>
                      {mode === 'subscription' 
                        ? (paymentMethod === 'pix' ? 'Gerar QR Code PIX (R$ 9,90)' : 'Pagar com Cartão (R$ 9,90)') 
                        : (paymentMethod === 'pix' ? 'Gerar PIX na Tela' : 'Gerar Link de Cartão')}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STATE 2: PIX GENERATED (INSIDE APP EXPERIENCE) */}
        {pixResult && (
          <div className="mt-4 space-y-4 animate-fade-in">
            {/* Status Indicator */}
            {isApproved ? (
              <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center shadow-lg">
                  <Check size={28} className="stroke-[3]" />
                </div>
                <h3 className="text-lg font-black text-white">
                  🎉 Pagamento Confirmado com Sucesso!
                </h3>
                <p className="text-xs text-emerald-300">
                  Sua assinatura Aura Finance PRO foi ativada e o acesso total está liberado.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    onClick={handleDownloadReceipt}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-dark-900 border border-emerald-500/40 text-white font-bold text-xs hover:bg-dark-850 transition-all shadow-sm"
                  >
                    <Download size={15} className="text-emerald-400" />
                    <span>Baixar Recibo Oficial em PDF</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-dark-950 font-black text-xs hover:brightness-110 transition-all"
                  >
                    <span>Concluir e Começar a Usar</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      Aguardando Pagamento via PIX...
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Checando aprovação a cada 3 segundos
                    </p>
                  </div>
                </div>
                <span className="text-sm font-black text-gold-400">
                  {formatCurrency(pixResult.amount)}
                </span>
              </div>
            )}

            {!isApproved && (
              <>
                {/* QR Code Image */}
                {pixResult.qr_code_base64 && (
                  <div className="text-center space-y-2">
                    <div className="inline-block p-3 rounded-3xl bg-white border-2 border-gold-400/40 shadow-xl">
                      <img 
                        src={`data:image/png;base64,${pixResult.qr_code_base64}`} 
                        alt="QR Code PIX Mercado Pago"
                        className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Abra o aplicativo do seu banco e aponte a câmera para o QR Code
                    </p>
                  </div>
                )}

                {/* PIX Copy & Paste Box */}
                {pixResult.qr_code && (
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Código PIX Copia e Cola
                    </label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        readOnly 
                        value={pixResult.qr_code} 
                        className="flex-1 px-3 py-2 bg-dark-950 border border-dark-800 rounded-xl text-xs text-gold-300 font-mono truncate focus:outline-none"
                      />
                      <button
                        onClick={handleCopyPix}
                        className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 ${
                          copiedPix 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-gold-400 hover:bg-gold-300 text-dark-950 shadow-gold-glow'
                        }`}
                      >
                        {copiedPix ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copiedPix ? 'Copiado!' : 'Copiar PIX'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions: WhatsApp & Manual Check */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={handleWhatsAppShare}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm"
                  >
                    <Share2 size={14} />
                    <span>Compartilhar no WhatsApp</span>
                  </button>

                  <button
                    onClick={handleManualActivation}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-200 border border-dark-750 font-bold text-xs transition-all"
                  >
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span>Já fiz a transferência</span>
                  </button>
                </div>
              </>
            )}

            {/* Back Button */}
            <div className="text-center pt-2">
              <button
                onClick={() => {
                  setPixResult(null);
                  setIsApproved(false);
                }}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                ← Emitir outro pagamento
              </button>
            </div>
          </div>
        )}

        {/* STATE 3: CARD CHECKOUT LINK GENERATED */}
        {cardResult && (
          <div className="mt-4 space-y-4 animate-fade-in">
            <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                <CreditCard size={20} />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white truncate">
                  Link de Checkout Mercado Pago Criado
                </h4>
                <p className="text-xs text-slate-400 truncate">
                  {formatCurrency(cardResult.amount)} • {cardResult.order_id}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Link de Pagamento
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={cardResult.checkout_url}
                  className="flex-1 px-3 py-2 bg-dark-950 border border-dark-800 rounded-xl text-xs text-sky-400 font-mono truncate focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                    copiedLink ? 'bg-emerald-500 text-white' : 'bg-dark-800 text-slate-200'
                  }`}
                >
                  <Copy size={14} />
                  <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href={cardResult.checkout_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs sm:text-sm transition-all shadow-sm"
              >
                <span>Pagar no Mercado Pago</span>
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

            {mode === 'subscription' && (
              <div className="pt-2 border-t border-dark-800">
                <button
                  onClick={handleManualActivation}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-400 to-amber-500 text-dark-950 font-extrabold text-xs sm:text-sm hover:brightness-110 active:scale-95 transition-all shadow-gold-glow flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  <span>Já realizei o pagamento / Liberar Acesso</span>
                </button>
              </div>
            )}

            <div className="text-center pt-2">
              <button
                onClick={() => setCardResult(null)}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                ← Emitir outro pagamento
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
