import React, { useState, useEffect } from 'react';
import { X, CreditCard as CardIcon, Check, Shield } from 'lucide-react';
import { CreditCard } from '../types/financial';

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (card: Omit<CreditCard, 'id' | 'created_at'>) => void;
  initialCard?: CreditCard | null;
}

const BANK_OPTIONS = [
  { name: 'Nubank', defaultColor: 'purple' },
  { name: 'Banco Inter', defaultColor: 'orange' },
  { name: 'BTG Pactual', defaultColor: 'gold' },
  { name: 'XP Investimentos', defaultColor: 'black' },
  { name: 'Itaú', defaultColor: 'orange' },
  { name: 'Bradesco', defaultColor: 'rose' },
  { name: 'Santander', defaultColor: 'rose' },
  { name: 'C6 Bank', defaultColor: 'black' },
  { name: 'Caixa Econômica', defaultColor: 'blue' },
  { name: 'Banco do Brasil', defaultColor: 'blue' },
  { name: 'Outro Banco', defaultColor: 'black' },
];

const COLOR_THEMES: Record<string, { label: string; bg: string; border: string; text: string; glow: string }> = {
  black: {
    label: 'Obsidian Black',
    bg: 'from-dark-900 via-neutral-900 to-black',
    border: 'border-dark-700',
    text: 'text-slate-100',
    glow: 'shadow-dark-900/50',
  },
  gold: {
    label: 'Cyber Gold',
    bg: 'from-yellow-950 via-dark-900 to-amber-950',
    border: 'border-gold-400/50',
    text: 'text-gold-300',
    glow: 'shadow-gold-500/20',
  },
  purple: {
    label: 'Nu Purple',
    bg: 'from-purple-950 via-dark-950 to-violet-900',
    border: 'border-purple-500/40',
    text: 'text-purple-300',
    glow: 'shadow-purple-500/20',
  },
  orange: {
    label: 'Inter Orange',
    bg: 'from-orange-950 via-dark-950 to-amber-900',
    border: 'border-orange-500/40',
    text: 'text-orange-300',
    glow: 'shadow-orange-500/20',
  },
  blue: {
    label: 'Sapphire Blue',
    bg: 'from-blue-950 via-dark-950 to-cyan-950',
    border: 'border-blue-500/40',
    text: 'text-blue-300',
    glow: 'shadow-blue-500/20',
  },
  emerald: {
    label: 'Emerald Green',
    bg: 'from-emerald-950 via-dark-950 to-teal-950',
    border: 'border-emerald-500/40',
    text: 'text-emerald-300',
    glow: 'shadow-emerald-500/20',
  },
  rose: {
    label: 'Ruby Rose',
    bg: 'from-rose-950 via-dark-950 to-red-950',
    border: 'border-rose-500/40',
    text: 'text-rose-300',
    glow: 'shadow-rose-500/20',
  },
};

export const CardModal: React.FC<CardModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCard,
}) => {
  const [name, setName] = useState(initialCard?.name || '');
  const [bank, setBank] = useState(initialCard?.bank || 'Nubank');
  const [color, setColor] = useState(initialCard?.color || 'purple');
  const [limitTotal, setLimitTotal] = useState<string>(initialCard ? String(initialCard.limit_total) : '');
  const [closingDay, setClosingDay] = useState<number>(initialCard?.closing_day || 25);
  const [dueDay, setDueDay] = useState<number>(initialCard?.due_day || 5);
  const [cardBrand, setCardBrand] = useState<'visa' | 'mastercard' | 'elo' | 'amex' | 'outro'>(initialCard?.card_brand || 'mastercard');
  const [lastDigits, setLastDigits] = useState(initialCard?.last_digits || '4892');

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

  const handleBankChange = (newBank: string) => {
    setBank(newBank);
    const found = BANK_OPTIONS.find(b => b.name === newBank);
    if (found && !initialCard) {
      setColor(found.defaultColor);
      if (!name || BANK_OPTIONS.some(b => b.name === name)) {
        setName(`${newBank} Black`);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedLimit = parseFloat(limitTotal.replace(/\./g, '').replace(',', '.')) || 0;
    if (parsedLimit <= 0) {
      alert('Por favor, informe um limite válido maior que zero.');
      return;
    }

    onSave({
      name: name.trim() || `${bank} Cartão`,
      bank,
      color,
      limit_total: parsedLimit,
      closing_day: Number(closingDay),
      due_day: Number(dueDay),
      card_brand: cardBrand,
      last_digits: lastDigits.replace(/\D/g, '').slice(-4) || '1234',
    });

    onClose();
  };

  const activeTheme = COLOR_THEMES[color] || COLOR_THEMES.black;

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-dark-900 border border-gold-400/30 shadow-2xl p-5 sm:p-7 my-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[calc(100vh-3rem)]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-5 border-b border-dark-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-400/10 border border-gold-400/30 flex items-center justify-center text-gold-400">
              <CardIcon size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {initialCard ? 'Editar Cartão de Crédito' : 'Adicionar Cartão de Crédito'}
              </h2>
              <p className="text-xs text-slate-400">
                Gerencie limites, faturas e controle de gastos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Fechar janela (Esc)"
            aria-label="Fechar modal"
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-dark-800 active:scale-90 transition-all duration-150"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body & Live Preview */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Live Card Preview */}
          <div className="flex justify-center">
            <div className={`
              w-full max-w-[340px] h-[190px] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-xl border
              bg-gradient-to-br ${activeTheme.bg} ${activeTheme.border} ${activeTheme.glow}
            `}>
              {/* Card Hologram Glow */}
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />

              {/* Card Top Row: Chip & Contactless */}
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black tracking-wider uppercase text-slate-200">
                    {bank}
                  </span>
                </div>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-300">
                  {cardBrand.toUpperCase()}
                </div>
              </div>

              {/* Chip Visual */}
              <div className="flex items-center gap-3 z-10 my-auto">
                <div className="w-10 h-7 rounded-md bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-300 border border-amber-600/40 shadow-inner flex flex-col justify-center px-1">
                  <div className="h-[1px] bg-amber-800/40 my-0.5" />
                  <div className="h-[1px] bg-amber-800/40 my-0.5" />
                </div>
                {/* Contactless waves */}
                <div className="text-slate-400 font-mono text-sm tracking-tighter">
                  )))
                </div>
              </div>

              {/* Card Number & Details */}
              <div className="z-10">
                <div className="text-slate-300 font-mono tracking-widest text-sm drop-shadow-sm mb-2">
                  •••• •••• •••• {lastDigits || '4892'}
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">Nome no Cartão</p>
                    <p className="font-semibold text-slate-100 uppercase truncate max-w-[150px]">
                      {name || 'MEU CARTÃO'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">Vencimento</p>
                    <p className="font-bold text-gold-400">
                      Dia {dueDay}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form id="card-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Banco Emissor
                </label>
                <select
                  value={bank}
                  onChange={(e) => handleBankChange(e.target.value)}
                  className="w-full bg-dark-950 border border-dark-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-gold-400 transition-colors"
                >
                  {BANK_OPTIONS.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Bandeira
                </label>
                <select
                  value={cardBrand}
                  onChange={(e) => setCardBrand(e.target.value as any)}
                  className="w-full bg-dark-950 border border-dark-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-gold-400 transition-colors"
                >
                  <option value="mastercard">Mastercard</option>
                  <option value="visa">Visa</option>
                  <option value="elo">Elo</option>
                  <option value="amex">American Express</option>
                  <option value="outro">Outra Bandeira</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Apelido / Nome do Cartão
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Nubank Ultravioleta"
                  required
                  className="w-full bg-dark-950 border border-dark-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-gold-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Últimos 4 Dígitos
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={lastDigits}
                  onChange={(e) => setLastDigits(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ex: 4892"
                  className="w-full bg-dark-950 border border-dark-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-gold-400 transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Limite Total do Cartão (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={limitTotal}
                onChange={(e) => setLimitTotal(e.target.value)}
                placeholder="Ex: 10000.00"
                required
                className="w-full bg-dark-950 border border-dark-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-gold-400 transition-colors font-bold text-gold-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Dia de Fechamento
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={closingDay}
                  onChange={(e) => setClosingDay(Number(e.target.value))}
                  required
                  className="w-full bg-dark-950 border border-dark-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-gold-400 transition-colors"
                />
                <p className="text-[10px] text-slate-500 mt-1">Dia que encerra compras do mês</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Dia de Vencimento
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={dueDay}
                  onChange={(e) => setDueDay(Number(e.target.value))}
                  required
                  className="w-full bg-dark-950 border border-dark-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-gold-400 transition-colors"
                />
                <p className="text-[10px] text-slate-500 mt-1">Dia do pagamento da fatura</p>
              </div>
            </div>

            {/* Color Palette Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Tema Visual do Cartão
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {Object.entries(COLOR_THEMES).map(([key, theme]) => {
                  const isSelected = color === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setColor(key)}
                      className={`
                        h-10 rounded-xl border flex items-center justify-center transition-all bg-gradient-to-br ${theme.bg}
                        ${isSelected ? `${theme.border} ring-2 ring-gold-400 scale-105` : 'border-dark-750 opacity-80 hover:opacity-100'}
                      `}
                      title={theme.label}
                    >
                      {isSelected && <Check size={16} className="text-white drop-shadow" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-dark-800 bg-dark-950/60 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold hover:bg-dark-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="card-form"
            className="px-5 py-2 rounded-xl bg-gold-400 hover:bg-gold-300 text-dark-950 font-black text-xs transition-all shadow-gold-glow active:scale-95"
          >
            {initialCard ? 'Salvar Alterações' : 'Cadastrar Cartão'}
          </button>
        </div>
      </div>
    </div>
  );
};
