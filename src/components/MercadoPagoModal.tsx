import React, { useState } from 'react';
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
  AlertCircle 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { createMercadoPagoCharge, PaymentChargeResult } from '../lib/mercadoPago';
import { formatCurrency, parseCurrencyInput } from '../lib/formatters';
import { FinancialAccount, FinancialTransaction } from '../types/financial';

interface MercadoPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: FinancialAccount[];
  onRegisterIncome: (tx: Omit<FinancialTransaction, 'id' | 'created_at'>) => Promise<void>;
}

export const MercadoPagoModal: React.FC<MercadoPagoModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onRegisterIncome,
}) => {
  const [title, setTitle] = useState('');
  const [amountRaw, setAmountRaw] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PaymentChargeResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [registered, setRegistered] = useState(false);

  if (!isOpen) return null;

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
        particleCount: 40,
        spread: 50,
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

  const handleMarkAsPaid = async () => {
    if (!result || registered) return;

    // Resolve Mercado Pago or first account
    const mpAcc = accounts.find(a => a.id === 'acc_mp' || a.name.toLowerCase().includes('mercado')) || accounts[0];

    await onRegisterIncome({
      title: `${result.title} [Mercado Pago: ${result.order_id}]`,
      amount: result.amount,
      type: 'income',
      account_id: mpAcc?.id || 'acc_mp',
      category: 'Vendas & Serviços Prestados',
      transaction_date: new Date().toISOString().split('T')[0],
      status: 'paid',
      payment_method: 'PIX',
    });

    setRegistered(true);
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#22c55e', '#facc15', '#ffffff']
    });
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
                  Cobrança Mercado Pago
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40">
                  PIX & Cartão
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gere links oficiais de pagamento e receba direto no seu caixa
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
                Valor da Cobrança
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400 font-extrabold text-lg">
                  R$
                </span>
                <input
                  type="text"
                  required
                  placeholder="0,00"
                  value={amountRaw}
                  onChange={handleAmountChange}
                  className="w-full pl-12 pr-4 py-3 bg-dark-950 border border-dark-800 rounded-2xl text-2xl font-black text-sky-400 focus:outline-none focus:border-sky-400 transition-all tracking-tight"
                />
              </div>
            </div>

            {/* Title / Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Descrição do Serviço / Produto
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Manutenção Mensal, Projeto Web, Instalação..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-dark-950 border border-dark-800 rounded-2xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-400 transition-all"
              />
            </div>

            {/* Customer Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nome do Cliente (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Silva"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-dark-950 border border-dark-800 rounded-2xl text-xs text-slate-200 focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  E-mail do Cliente (Opcional)
                </label>
                <input
                  type="email"
                  placeholder="cliente@email.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-dark-950 border border-dark-800 rounded-2xl text-xs text-slate-200 focus:outline-none focus:border-sky-400"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 text-dark-950 font-black text-sm hover:brightness-110 active:scale-[0.99] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-dark-950 border-t-transparent rounded-full animate-spin" />
                    <span>Conectando ao Mercado Pago...</span>
                  </>
                ) : (
                  <>
                    <QrCode size={18} />
                    <span>Gerar Link & QR Code de Pagamento</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Payment Result */
          <div className="mt-5 space-y-4">
            <div className="p-4 rounded-2xl bg-dark-950 border border-dark-800 text-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Cobrança Gerada com Sucesso
              </span>
              <div className="text-3xl font-black text-sky-400 mt-1">
                {formatCurrency(result.amount)}
              </div>
              <p className="text-xs text-slate-300 font-semibold mt-1 truncate">
                {result.title}
              </p>
              <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                ID do Pedido: {result.order_id}
              </span>
            </div>

            {/* Checkout Link Input with Copy button */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Link de Pagamento Oficial (Checkout Mercado Pago)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={result.checkout_url}
                  className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-xl text-xs text-slate-300 font-mono focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 ${
                    copied
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-dark-800 hover:bg-dark-750 text-slate-200 border-dark-750'
                  }`}
                >
                  {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            {/* Action buttons (WhatsApp, Open, Dar Baixa) */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={handleWhatsAppShare}
                className="py-2.5 px-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Share2 size={15} />
                <span>Enviar no WhatsApp</span>
              </button>

              <a
                href={result.checkout_url}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 rounded-xl bg-dark-800 hover:bg-dark-750 border border-dark-750 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <ExternalLink size={15} />
                <span>Abrir Checkout</span>
              </a>
            </div>

            {/* Reconcile / Dar Baixa no Caixa */}
            <div className="pt-2 border-t border-dark-850">
              <button
                onClick={handleMarkAsPaid}
                disabled={registered}
                className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                  registered
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                    : 'bg-gradient-to-r from-gold-400 to-amber-500 text-dark-950 shadow-gold-glow hover:brightness-110 active:scale-95'
                }`}
              >
                <CheckCircle2 size={16} />
                <span>{registered ? '✓ Já Registrado no Caixa como Receita' : 'Cliente Pagou? Dar Baixa no Caixa Agora'}</span>
              </button>
            </div>

            <div className="text-center pt-1">
              <button
                onClick={() => setResult(null)}
                className="text-xs text-slate-500 hover:text-slate-300 underline"
              >
                + Criar outra cobrança
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
