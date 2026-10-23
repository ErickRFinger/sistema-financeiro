import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  UploadCloud, 
  Calendar, 
  Tag, 
  Landmark, 
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Plus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  FinancialAccount, 
  FinancialTransaction, 
  TransactionType, 
  PaymentMethod,
  DEFAULT_CATEGORIES 
} from '../types/financial';
import { parseCurrencyInput, formatCurrency } from '../lib/formatters';
import { uploadReceiptFile } from '../lib/supabase';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transactionData: Omit<FinancialTransaction, 'id' | 'created_at'>) => Promise<void>;
  accounts: FinancialAccount[];
  initialType?: TransactionType;
}

export const guessCategory = (text: string): string | null => {
  const lower = text.toLowerCase();
  if (lower.includes('uber') || lower.includes('99') || lower.includes('gasolina') || lower.includes('posto') || lower.includes('shell') || lower.includes('ipiranga') || lower.includes('estacionamento') || lower.includes('pedagio') || lower.includes('pedágio')) {
    return 'Combustível & Transporte';
  }
  if (lower.includes('mercado') || lower.includes('supermercado') || lower.includes('almoço') || lower.includes('almoco') || lower.includes('jantar') || lower.includes('restaurante') || lower.includes('ifood') || lower.includes('padaria') || lower.includes('café') || lower.includes('cafe') || lower.includes('pizza') || lower.includes('lanche') || lower.includes('açougue') || lower.includes('acougue')) {
    return 'Alimentação & Refeição';
  }
  if (lower.includes('copel') || lower.includes('enel') || lower.includes('celesc') || lower.includes('luz') || lower.includes('energia') || lower.includes('água') || lower.includes('agua') || lower.includes('aluguel') || lower.includes('condomínio') || lower.includes('condominio') || lower.includes('iptu') || lower.includes('gás') || lower.includes('gas')) {
    return 'Aluguel & Contas Fixas';
  }
  if (lower.includes('internet') || lower.includes('fibra') || lower.includes('claro') || lower.includes('vivo') || lower.includes('tim') || lower.includes('servidor') || lower.includes('hospedagem') || lower.includes('software') || lower.includes('assinatura') || lower.includes('chatgpt') || lower.includes('openai')) {
    return 'Serviços & Internet';
  }
  if (lower.includes('peça') || lower.includes('peca') || lower.includes('fornecedor') || lower.includes('camera') || lower.includes('câmera') || lower.includes('dvr') || lower.includes('cabo') || lower.includes('conector') || lower.includes('fonte') || lower.includes('disco') || lower.includes('hd') || lower.includes('switch') || lower.includes('roteador')) {
    return 'Fornecedores & Peças';
  }
  if (lower.includes('ferramenta') || lower.includes('alicate') || lower.includes('furadeira') || lower.includes('escada') || lower.includes('parafuso') || lower.includes('chave')) {
    return 'Infraestrutura & Ferramentas';
  }
  if (lower.includes('anúncio') || lower.includes('anuncio') || lower.includes('ads') || lower.includes('meta') || lower.includes('google ads') || lower.includes('marketing') || lower.includes('tráfego') || lower.includes('trafego')) {
    return 'Marketing & Comercial';
  }
  if (lower.includes('imposto') || lower.includes('darf') || lower.includes('das') || lower.includes('simples') || lower.includes('taxa') || lower.includes('tributo')) {
    return 'Impostos & Taxas';
  }
  if (lower.includes('salário') || lower.includes('salario') || lower.includes('adiantamento') || lower.includes('pró-labore') || lower.includes('comissão') || lower.includes('comissao')) {
    return 'Salários & Pró-labore';
  }
  if (lower.includes('venda') || lower.includes('instalação') || lower.includes('instalacao') || lower.includes('manutenção') || lower.includes('manutencao') || lower.includes('contrato') || lower.includes('honorário')) {
    return 'Vendas & Serviços Prestados';
  }
  return null;
};

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  accounts,
  initialType = 'expense',
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [title, setTitle] = useState('');
  const [amountRaw, setAmountRaw] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || 'acc_btg');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0].name);
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'paid' | 'pending'>('paid');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [installments, setInstallments] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [autoDetectedCategory, setAutoDetectedCategory] = useState<string | null>(null);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) {
      setAmountRaw('');
      return;
    }
    const num = parseFloat(val) / 100;
    setAmountRaw(new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(num));
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);

    if (type === 'expense') {
      const guessed = guessCategory(newTitle);
      if (guessed) {
        setCategory(guessed);
        setAutoDetectedCategory(guessed);
      } else {
        setAutoDetectedCategory(null);
      }
    }
  };

  const executeSave = useCallback(async (createAnother: boolean = false) => {
    if (isSubmitting) return;
    setErrorMsg('');

    const numericAmount = parseCurrencyInput(amountRaw);
    if (numericAmount <= 0) {
      setErrorMsg('Por favor, informe um valor válido maior que zero.');
      return;
    }

    if (!title.trim()) {
      setErrorMsg('Por favor, digite uma descrição ou nome do fornecedor.');
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedReceiptUrl: string | null = null;
      if (selectedFile) {
        uploadedReceiptUrl = await uploadReceiptFile(selectedFile);
      }

      // If installments > 1, create installment transactions
      if (installments > 1 && type === 'expense') {
        const installmentValue = Number((numericAmount / installments).toFixed(2));
        const baseDate = new Date(transactionDate);

        for (let i = 1; i <= installments; i++) {
          const installmentDate = new Date(baseDate);
          installmentDate.setMonth(installmentDate.getMonth() + (i - 1));
          const dateStr = installmentDate.toISOString().split('T')[0];

          await onSubmit({
            title: `${title} (${i}/${installments})`,
            amount: installmentValue,
            type,
            account_id: accountId,
            category,
            transaction_date: dateStr,
            status: i === 1 ? status : 'pending',
            payment_method: paymentMethod,
            receipt_url: uploadedReceiptUrl,
          });
        }
      } else {
        await onSubmit({
          title: title.trim(),
          amount: numericAmount,
          type,
          account_id: accountId,
          category,
          transaction_date: transactionDate,
          status,
          payment_method: paymentMethod,
          receipt_url: uploadedReceiptUrl,
        });
      }

      // Trigger celebration
      confetti({
        particleCount: createAnother ? 35 : 60,
        spread: 60,
        origin: { y: 0.75 },
        colors: ['#facc15', '#eab308', '#ffffff']
      });

      if (!createAnother) {
        onClose();
      }

      // Reset form
      setTitle('');
      setAmountRaw('');
      setSelectedFile(null);
      setInstallments(1);
      setAutoDetectedCategory(null);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Erro ao salvar lançamento. Verifique a conexão com o Supabase.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    amountRaw,
    title,
    selectedFile,
    installments,
    type,
    transactionDate,
    accountId,
    category,
    status,
    paymentMethod,
    onSubmit,
    onClose,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeSave(false);
  };

  // Atalhos de teclado para produtividade (Cmd + Enter, Cmd + Shift + Enter, Esc)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 3. Escape -> Fecha o modal
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // 1 e 2. Cmd/Ctrl + Enter (com ou sem Shift)
      const isMetaOrCtrl = e.metaKey || e.ctrlKey;
      if (isMetaOrCtrl && e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          executeSave(true);
        } else {
          executeSave(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, executeSave]);

  if (!isOpen) return null;

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-dark-900 border border-gold-400/30 shadow-2xl p-6 my-6 sm:my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-dark-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gold-400" />
            <h2 className="text-xl font-extrabold text-white">
              {type === 'expense' ? 'Lançar Pagamento / Despesa' : 'Lançar Nova Receita'}
            </h2>
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

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Type Selector (Despesa vs Receita) */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-dark-950 border border-dark-800">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                type === 'expense'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownCircle size={18} />
              <span>Despesa (Saída)</span>
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                type === 'income'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpCircle size={18} />
              <span>Receita (Entrada)</span>
            </button>
          </div>

          {/* Valor Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Valor do Lançamento
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-400 font-extrabold text-lg">
                R$
              </span>
              <input
                type="text"
                required
                placeholder="0,00"
                value={amountRaw}
                onChange={handleAmountChange}
                className="w-full pl-12 pr-4 py-3 bg-dark-950 border border-dark-800 rounded-2xl text-2xl font-black text-gold-400 focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400 transition-all tracking-tight"
              />
            </div>
          </div>

          {/* Descrição / Fornecedor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Descrição / Fornecedor
              </label>
              {autoDetectedCategory && (
                <span className="text-[10px] text-gold-400 font-bold flex items-center gap-1 animate-fade-in">
                  <Sparkles size={11} />
                  <span>Sugerido: {autoDetectedCategory}</span>
                </span>
              )}
            </div>
            <input
              type="text"
              required
              placeholder="Ex: Fornecedor Hikvision, Aluguel, Posto Ipiranga..."
              value={title}
              onChange={handleTitleChange}
              className="w-full px-4 py-2.5 bg-dark-950 border border-dark-800 rounded-2xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-gold-400 transition-all"
            />
          </div>

          {/* Grid: Conta Bancária e Categoria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Conta / Banco
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-dark-950 border border-dark-800 rounded-2xl text-sm text-slate-200 focus:outline-none focus:border-gold-400"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatCurrency(acc.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-dark-950 border border-dark-800 rounded-2xl text-sm text-slate-200 focus:outline-none focus:border-gold-400"
              >
                {DEFAULT_CATEGORIES.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid: Data e Forma de Pagamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Data
              </label>
              <input
                type="date"
                required
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-dark-950 border border-dark-800 rounded-2xl text-sm text-slate-200 focus:outline-none focus:border-gold-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3.5 py-2.5 bg-dark-950 border border-dark-800 rounded-2xl text-sm text-slate-200 focus:outline-none focus:border-gold-400"
              >
                <option value="PIX">PIX</option>
                <option value="Boleto">Boleto Bancário</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Cartão de Débito">Cartão de Débito</option>
                <option value="Transferência">Transferência / TED</option>
                <option value="Dinheiro">Dinheiro em Espécie</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>

          {/* Status & Parcelamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Situação
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('paid')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    status === 'paid'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-dark-950 text-slate-400 border border-dark-800'
                  }`}
                >
                  ✓ Pago / Liquidado
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('pending')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    status === 'pending'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-dark-950 text-slate-400 border border-dark-800'
                  }`}
                >
                  ⏳ Pendente / A Pagar
                </button>
              </div>
            </div>

            {type === 'expense' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Parcelamento
                </label>
                <select
                  value={installments}
                  onChange={(e) => setInstallments(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-dark-950 border border-dark-800 rounded-2xl text-sm text-slate-200 focus:outline-none focus:border-gold-400"
                >
                  <option value={1}>À Vista (1x)</option>
                  <option value={2}>2x Parcelas</option>
                  <option value={3}>3x Parcelas</option>
                  <option value={4}>4x Parcelas</option>
                  <option value={5}>5x Parcelas</option>
                  <option value={6}>6x Parcelas</option>
                  <option value={10}>10x Parcelas</option>
                  <option value={12}>12x Parcelas</option>
                  <option value={24}>24x Parcelas</option>
                </select>
              </div>
            )}
          </div>

          {/* Anexo de Comprovante / Nota Fiscal */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Anexo de Comprovante / NF (Opcional)
            </label>
            <label className="flex flex-col items-center justify-center p-3.5 border border-dashed border-dark-750 hover:border-gold-400/50 rounded-2xl bg-dark-950/60 cursor-pointer transition-colors group">
              <UploadCloud size={22} className="text-slate-400 group-hover:text-gold-400 transition-colors" />
              <span className="text-xs text-slate-300 mt-1">
                {selectedFile ? selectedFile.name : 'Clique para anexar imagem ou PDF da NF'}
              </span>
              <span className="text-[10px] text-slate-500">
                Salvo direto no Supabase Storage (notas_fiscais)
              </span>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>

          {/* Submit Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => executeSave(true)}
              className="w-full sm:w-auto px-4 py-3.5 rounded-2xl bg-dark-950 border border-gold-400/40 text-gold-400 hover:bg-gold-400/10 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
              title="Salvar e continuar lançando outro gasto"
            >
              <Plus size={16} />
              <span>Salvar e Novo</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 w-full py-3.5 rounded-2xl bg-gradient-to-r from-gold-400 to-amber-500 text-dark-950 font-extrabold text-sm sm:text-base hover:brightness-110 active:scale-[0.99] transition-all shadow-gold-glow flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-dark-950 border-t-transparent rounded-full animate-spin" />
                  <span>Salvando no Supabase...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>Confirmar Lançamento</span>
                </>
              )}
            </button>
          </div>

          {/* Legenda de atalhos de teclado */}
          <p className="text-[11px] text-center text-slate-500 font-medium select-none pt-1">
            [⌘ + Enter para salvar • ⌘ + Shift + Enter para Salvar e Novo • Esc para fechar]
          </p>
        </form>
      </div>
    </div>
  );
};
