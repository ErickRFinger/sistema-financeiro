import React, { useState } from 'react';
import { 
  X, 
  Coins, 
  TrendingUp, 
  Calendar, 
  Landmark, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FinancialAccount, FinancialInvestment } from '../types/financial';
import { formatCurrency, parseCurrencyInput } from '../lib/formatters';
import { createInvestment } from '../lib/supabase';

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: FinancialAccount[];
  onInvestmentCreated: (inv: FinancialInvestment) => void;
}

const INVESTMENT_CATEGORIES = [
  'Renda Fixa (CDB, CDI, Tesouro)',
  'Ações & Mercado de Ações',
  'Fundos Imobiliários (FIIs)',
  'Criptoativos & Bitcoin',
  'Reserva de Emergência / Oportunidade',
  'Outros Ativos',
];

export const InvestmentModal: React.FC<InvestmentModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onInvestmentCreated,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(INVESTMENT_CATEGORIES[0]);
  const [accountId, setAccountId] = useState(accounts[0]?.id || 'acc_btg');
  const [initialAmountRaw, setInitialAmountRaw] = useState('');
  const [currentAmountRaw, setCurrentAmountRaw] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleCurrencyInput = (val: string, setter: (v: string) => void) => {
    const digits = val.replace(/\D/g, '');
    if (!digits) {
      setter('');
      return;
    }
    const num = parseFloat(digits) / 100;
    setter(new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(num));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const initialNum = parseCurrencyInput(initialAmountRaw);
    const currentNum = currentAmountRaw ? parseCurrencyInput(currentAmountRaw) : initialNum;

    if (!name.trim()) {
      setErrorMsg('Informe o nome do ativo ou título.');
      return;
    }

    if (initialNum <= 0) {
      setErrorMsg('Informe um valor de aporte inicial válido.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createInvestment({
        name: name.trim(),
        category,
        account_id: accountId,
        initial_amount: initialNum,
        current_amount: currentNum,
        last_updated: date,
      });

      if (!created) {
        throw new Error('Falha ao cadastrar no Supabase.');
      }

      onInvestmentCreated(created);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#facc15', '#10b981', '#ffffff'],
      });

      onClose();
      setName('');
      setInitialAmountRaw('');
      setCurrentAmountRaw('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Erro ao registrar investimento. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-dark-900 border border-gold-400/30 shadow-2xl p-6 my-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-dark-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gold-400/20 text-gold-400 border border-gold-400/40 flex items-center justify-center font-bold">
              <Coins size={20} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Novo Investimento</h2>
              <p className="text-xs text-slate-400">Cadastre um ativo para monitorar rentabilidade</p>
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Nome do Ativo ou Título
            </label>
            <input
              type="text"
              required
              placeholder="Ex: CDB BTG 120% CDI, Tesouro Selic 2029, Bitcoin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-gold-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-400"
              >
                {INVESTMENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Corretora / Banco
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-400"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Aporte Inicial (R$)
              </label>
              <input
                type="text"
                required
                placeholder="0,00"
                value={initialAmountRaw}
                onChange={(e) => handleCurrencyInput(e.target.value, setInitialAmountRaw)}
                className="w-full px-3.5 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-gold-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Valor Atual (R$)
              </label>
              <input
                type="text"
                placeholder="Mesmo do aporte se novo"
                value={currentAmountRaw}
                onChange={(e) => handleCurrencyInput(e.target.value, setCurrentAmountRaw)}
                className="w-full px-3.5 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-sm font-bold text-gold-400 focus:outline-none focus:border-gold-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Data da Aplicação
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-dark-950 border border-dark-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-gold-400"
            />
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-gold-400 to-amber-500 text-dark-950 font-extrabold text-sm hover:brightness-110 active:scale-95 transition-all shadow-gold-glow disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando Ativo...' : 'Cadastrar Investimento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
