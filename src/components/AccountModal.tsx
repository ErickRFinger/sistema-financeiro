import React, { useState, useEffect } from 'react';
import { 
  X, 
  Landmark, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FinancialAccount } from '../types/financial';
import { parseCurrencyInput } from '../lib/formatters';
import { createAccount } from '../lib/supabase';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountCreated: (account: FinancialAccount) => void;
}

const COLOR_PRESETS = [
  '#facc15', // Gold
  '#a855f7', // Purple (Nubank)
  '#f97316', // Orange (Inter)
  '#10b981', // Emerald (Sicredi)
  '#06b6d4', // Cyan (Mercado Pago)
  '#3b82f6', // Blue (Caixa / BTG)
  '#ef4444', // Red (Santander / Bradesco)
  '#64748b', // Slate
];

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onAccountCreated,
}) => {
  const [name, setName] = useState('');
  const [balanceRaw, setBalanceRaw] = useState('');
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) {
      setBalanceRaw('');
      return;
    }
    const num = parseFloat(val) / 100;
    setBalanceRaw(new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(num));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Informe o nome da conta ou banco.');
      return;
    }

    const initialBalance = balanceRaw ? parseCurrencyInput(balanceRaw) : 0;
    const cleanId = 'acc_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15) + '_' + Math.random().toString(36).substring(2, 6);

    setIsSubmitting(true);
    try {
      const created = await createAccount({
        id: cleanId,
        name: name.trim(),
        balance: initialBalance,
        color,
      });

      if (!created) {
        throw new Error('Falha ao cadastrar conta.');
      }

      onAccountCreated(created);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: [color, '#facc15', '#ffffff'],
      });

      onClose();
      setName('');
      setBalanceRaw('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Erro ao registrar nova conta. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-dark-900 border border-gold-400/30 shadow-2xl p-5 sm:p-7 my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-dark-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gold-400/20 text-gold-400 border border-gold-400/40 flex items-center justify-center font-bold">
              <Landmark size={20} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Nova Conta Bancária</h2>
              <p className="text-xs text-slate-400">Adicione um banco, carteira ou cofre</p>
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

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Nome da Instituição / Carteira
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Nubank, C6 Bank, Dinheiro em Mãos, Cofre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-gold-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Saldo Inicial (R$)
            </label>
            <input
              type="text"
              placeholder="0,00"
              value={balanceRaw}
              onChange={handleBalanceChange}
              className="w-full px-3.5 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-sm font-bold text-gold-400 focus:outline-none focus:border-gold-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Cor de Destaque
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    color === c ? 'scale-125 border-white shadow-md' : 'border-transparent hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-gold-400 to-amber-500 text-dark-950 font-extrabold text-sm hover:brightness-110 active:scale-95 transition-all shadow-gold-glow disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando Conta...' : 'Cadastrar Conta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
