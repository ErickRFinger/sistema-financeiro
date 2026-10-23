import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Calendar, Zap, CreditCard, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../lib/formatters';

interface SubscriptionItem {
  id: string;
  name: string;
  category: string;
  amount: number;
  dueDay: number;
  color: string;
}

interface SubscriptionHubWidgetProps {
  isPrivate?: boolean;
}

const DEFAULT_SUBSCRIPTIONS: SubscriptionItem[] = [
  { id: '1', name: 'Netflix 4K', category: 'Streaming', amount: 55.9, dueDay: 15, color: '#ec4899' },
  { id: '2', name: 'Spotify Premium', category: 'Música', amount: 21.9, dueDay: 5, color: '#10b981' },
  { id: '3', name: 'ChatGPT Plus', category: 'IA & Produtividade', amount: 115.0, dueDay: 22, color: '#8b5cf6' },
  { id: '4', name: 'Academia SmartFit', category: 'Saúde & Fitness', amount: 129.9, dueDay: 10, color: '#f59e0b' },
];

export const SubscriptionHubWidget: React.FC<SubscriptionHubWidgetProps> = ({
  isPrivate = false,
}) => {
  const [subs, setSubs] = useState<SubscriptionItem[]>(() => {
    try {
      const s = localStorage.getItem('aura_user_subscriptions');
      return s ? JSON.parse(s) : DEFAULT_SUBSCRIPTIONS;
    } catch {
      return DEFAULT_SUBSCRIPTIONS;
    }
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('');

  useEffect(() => {
    localStorage.setItem('aura_user_subscriptions', JSON.stringify(subs));
  }, [subs]);

  const monthlyTotal = subs.reduce((acc, s) => acc + s.amount, 0);
  const annualTotal = monthlyTotal * 12;

  const now = new Date();
  const currentDay = now.getDate();
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const getDaysRemaining = (due: number) => {
    if (due >= currentDay) return due - currentDay;
    return lastDayOfMonth - currentDay + due;
  };

  const handleAddSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount.trim() || !dueDay.trim()) return;

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    const parsedDay = parseInt(dueDay, 10);

    if (isNaN(parsedAmount) || isNaN(parsedDay) || parsedDay < 1 || parsedDay > 31) return;

    const newSub: SubscriptionItem = {
      id: Date.now().toString(),
      name: name.trim(),
      category: 'Serviços',
      amount: parsedAmount,
      dueDay: parsedDay,
      color: '#38bdf8',
    };

    setSubs((prev) => [...prev, newSub]);
    setName('');
    setAmount('');
    setDueDay('');
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    setSubs((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="bg-dark-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-dark-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gold-400/10 border border-gold-400/30 flex items-center justify-center text-gold-400 shrink-0">
            <CreditCard size={18} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              Radar de Assinaturas & Recorrências
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-gold-400/15 text-gold-300 border border-gold-400/30">
                Hub Fixo
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Controle automático de débitos automáticos e impacto anual
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3.5 py-1.5 rounded-xl bg-dark-950 border border-slate-800 hover:border-gold-400/50 text-gold-400 hover:bg-gold-400/10 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <PlusCircle size={14} />
          <span>Nova Assinatura</span>
        </button>
      </div>

      {/* KPI Cards: Mensal e Anual Acumulado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="p-4 rounded-2xl bg-dark-950/70 border border-slate-800 flex flex-col justify-between">
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            Custo Mensal Recorrente
          </p>
          <div className="text-2xl font-black text-gold-400 my-1">
            {isPrivate ? '••••••' : formatCurrency(monthlyTotal)}
            <span className="text-xs text-slate-400 font-medium ml-1.5">/ mês</span>
          </div>
          <p className="text-[10px] text-slate-500">
            {subs.length} assinaturas cadastradas ativas
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-dark-950/70 border border-slate-800 flex flex-col justify-between">
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            Impacto Anual Comprometido
          </p>
          <div className="text-2xl font-black text-emerald-400 my-1">
            {isPrivate ? '••••••' : formatCurrency(annualTotal)}
            <span className="text-xs text-slate-400 font-medium ml-1.5">/ ano</span>
          </div>
          <p className="text-[10px] text-slate-500">
            Equivale a {isPrivate ? '••%' : `${((annualTotal / (monthlyTotal * 12 || 1)) * 100).toFixed(0)}%`} das despesas anuais fixas
          </p>
        </div>
      </div>

      {/* Add Subscription Form (Toggle) */}
      {showAddForm && (
        <form onSubmit={handleAddSubscription} className="p-4 rounded-2xl bg-dark-950 border border-gold-400/30 space-y-3 animate-fadeIn">
          <p className="text-xs font-bold text-gold-400">Cadastrar Nova Assinatura</p>
          <input
            type="text"
            placeholder="Nome (ex: Disney+, Amazon Prime, Internet)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-dark-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-gold-400 transition-colors"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Valor (R$ 0,00)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-dark-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-gold-400 transition-colors"
              required
            />
            <input
              type="number"
              placeholder="Dia do Débito (1-31)"
              min={1}
              max={31}
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-dark-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-gold-400 transition-colors"
              required
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-gold-400 to-amber-500 text-dark-950 font-bold text-xs hover:brightness-110 transition-all cursor-pointer"
            >
              Salvar Assinatura
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl bg-dark-900 border border-slate-800 text-slate-300 font-semibold text-xs hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Subscription Items List */}
      <div className="space-y-2">
        {subs.map((s) => {
          const days = getDaysRemaining(s.dueDay);
          const isToday = days === 0;
          const isSoon = days <= 3 && !isToday;

          return (
            <div
              key={s.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-dark-950/50 border border-slate-800/80 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: s.color }}
                />
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-sm font-bold text-white truncate">{s.name}</p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span>{s.category}</span>
                    <span>•</span>
                    <span>Débito todo dia {s.dueDay}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-sm font-extrabold text-white">
                    {isPrivate ? '••••••' : formatCurrency(s.amount)}
                  </p>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                      isToday
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : isSoon
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-dark-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {isToday ? 'Debita hoje!' : isSoon ? `Em ${days} dias` : `Em ${days} dias`}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(s.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Remover assinatura"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
