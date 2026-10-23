import React, { useState, useEffect } from 'react';
import { X, PlusCircle, CreditCard, Calendar, Tag, Layers } from 'lucide-react';
import { CreditCard as ICreditCard, CreditCardExpense, DEFAULT_CATEGORIES } from '../types/financial';

interface CardExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: ICreditCard[];
  selectedCardId?: string;
  onSave: (expense: Omit<CreditCardExpense, 'id' | 'created_at'>) => void;
}

export const CardExpenseModal: React.FC<CardExpenseModalProps> = ({
  isOpen,
  onClose,
  cards,
  selectedCardId,
  onSave,
}) => {
  const [cardId, setCardId] = useState<string>(selectedCardId || (cards[0]?.id || ''));
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Alimentação & Refeição');
  const [installments, setInstallments] = useState<number>(1);

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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.')) || 0;
    if (parsedAmount <= 0) {
      alert('Por favor, informe um valor válido maior que zero.');
      return;
    }
    if (!cardId) {
      alert('Selecione um cartão de crédito.');
      return;
    }

    onSave({
      card_id: cardId,
      title: title.trim(),
      amount: parsedAmount,
      date,
      category,
      installments_current: 1,
      installments_total: installments,
    });

    onClose();
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-dark-900 border border-gold-400/30 shadow-2xl p-5 sm:p-7 my-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-dark-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-400/10 border border-gold-400/30 flex items-center justify-center text-gold-400">
              <PlusCircle size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Lançar Compra no Cartão</h2>
              <p className="text-xs text-slate-400">Registre despesas à vista ou parceladas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Fechar janela (Esc)"
            aria-label="Fechar modal"
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-dark-800 active:scale-90 transition-all duration-150"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Cartão Utilizado
            </label>
            <select
              value={cardId}
              onChange={(e) => setCardId(e.target.value)}
              className="w-full bg-dark-950 border border-dark-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-gold-400 transition-colors"
            >
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.bank} - Final {c.last_digits || '0000'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Descrição da Compra
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Supermercado Pão de Açúcar, Amazon, Uber"
              required
              className="w-full bg-dark-950 border border-dark-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-gold-400 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Valor Total (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ex: 150.00"
                required
                className="w-full bg-dark-950 border border-dark-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-gold-400 transition-colors font-bold text-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Parcelas
              </label>
              <select
                value={installments}
                onChange={(e) => setInstallments(Number(e.target.value))}
                className="w-full bg-dark-950 border border-dark-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-gold-400 transition-colors"
              >
                <option value={1}>À vista (1x)</option>
                <option value={2}>2x</option>
                <option value={3}>3x</option>
                <option value={4}>4x</option>
                <option value={5}>5x</option>
                <option value={6}>6x</option>
                <option value={10}>10x</option>
                <option value={12}>12x</option>
                <option value={18}>18x</option>
                <option value={24}>24x</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Data da Compra
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-dark-950 border border-dark-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-gold-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-dark-950 border border-dark-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-gold-400 transition-colors"
              >
                {DEFAULT_CATEGORIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-dark-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold hover:bg-dark-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gold-400 hover:bg-gold-300 text-dark-950 font-black text-xs transition-all shadow-gold-glow active:scale-95"
            >
              Lançar no Cartão
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
