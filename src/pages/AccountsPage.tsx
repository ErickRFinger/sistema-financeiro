import React, { useState } from 'react';
import { 
  Landmark, 
  Plus, 
  ArrowRightLeft, 
  Wallet, 
  CheckCircle2, 
  TrendingUp, 
  CreditCard,
  Edit2,
  PlusCircle
} from 'lucide-react';
import { FinancialAccount } from '../types/financial';
import { formatCurrency } from '../lib/formatters';
import { updateAccountBalance } from '../lib/supabase';
import { AccountModal } from '../components/AccountModal';

interface AccountsPageProps {
  accounts: FinancialAccount[];
  onRefreshAccounts: () => Promise<void>;
}

export const AccountsPage: React.FC<AccountsPageProps> = ({
  accounts,
  onRefreshAccounts,
}) => {
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [newBalanceInput, setNewBalanceInput] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Transfer states
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || '');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferSuccess, setTransferSuccess] = useState(false);

  const totalAssets = accounts.reduce((acc, a) => acc + (a.balance || 0), 0);

  const handleSaveBalance = async (accountId: string) => {
    const num = parseFloat(newBalanceInput.replace(',', '.'));
    if (isNaN(num)) return;

    setIsUpdating(true);
    await updateAccountBalance(accountId, num);
    await onRefreshAccounts();
    setIsUpdating(false);
    setEditingAccountId(null);
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(transferAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0 || fromAccountId === toAccountId) return;

    const fromAcc = accounts.find(a => a.id === fromAccountId);
    const toAcc = accounts.find(a => a.id === toAccountId);
    if (!fromAcc || !toAcc) return;

    setIsUpdating(true);
    await updateAccountBalance(fromAccountId, fromAcc.balance - amount);
    await updateAccountBalance(toAccountId, toAcc.balance + amount);
    await onRefreshAccounts();
    setIsUpdating(false);

    setTransferAmount('');
    setTransferSuccess(true);
    setTimeout(() => setTransferSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* Header */}
      <div className="p-5 sm:p-6 rounded-3xl bg-dark-900 border border-dark-800 shadow-dark-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Landmark size={28} className="text-gold-400" />
            <span>Contas Bancárias & Carteiras</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Gestão de saldos, conciliação e transferências entre instituições
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-2xl bg-dark-950 border border-dark-800 flex items-center gap-3">
            <Wallet size={18} className="text-gold-400" />
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Patrimônio Líquido</p>
              <p className="text-lg font-black text-gold-400">{formatCurrency(totalAssets)}</p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-gold-400 to-amber-500 text-dark-950 font-extrabold text-xs sm:text-sm hover:brightness-110 active:scale-95 transition-all shadow-gold-glow"
          >
            <PlusCircle size={18} />
            <span>Nova Conta</span>
          </button>
        </div>
      </div>

      {/* Grid of Bank Accounts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {accounts.map((acc) => {
          const percentage = totalAssets > 0 ? ((acc.balance / totalAssets) * 100).toFixed(1) : '0';
          const isEditing = editingAccountId === acc.id;

          return (
            <div
              key={acc.id}
              className="p-5 rounded-3xl bg-dark-900 border border-dark-800 hover:border-gold-400/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3.5 h-3.5 rounded-full shadow-sm"
                      style={{ backgroundColor: acc.color || '#facc15' }}
                    />
                    <h3 className="text-sm font-extrabold text-white truncate max-w-[130px]">
                      {acc.name}
                    </h3>
                  </div>

                  <button
                    onClick={() => {
                      setEditingAccountId(isEditing ? null : acc.id);
                      setNewBalanceInput(acc.balance.toString());
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-gold-400 hover:bg-dark-850 transition-colors"
                    title="Editar Saldo"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>

                {isEditing ? (
                  <div className="my-2 flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={newBalanceInput}
                      onChange={(e) => setNewBalanceInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-dark-950 border border-gold-400 text-sm font-bold text-gold-400 focus:outline-none"
                    />
                    <button
                      onClick={() => handleSaveBalance(acc.id)}
                      disabled={isUpdating}
                      className="px-2.5 py-1.5 rounded-xl bg-gold-400 text-dark-950 text-xs font-bold"
                    >
                      Salvar
                    </button>
                  </div>
                ) : (
                  <div className="text-2xl font-black text-white tracking-tight my-1">
                    {formatCurrency(acc.balance)}
                  </div>
                )}

                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>Participação</span>
                    <span className="font-bold text-slate-300">{percentage}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-dark-950 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${Math.max(0, Math.min(100, Number(percentage)))}%`,
                        backgroundColor: acc.color || '#facc15'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-dark-850 flex items-center justify-between text-[10px] text-slate-500">
                <span>Supabase ID: {acc.id}</span>
                <span className="text-emerald-400 font-semibold">Conectado</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Internal Transfer Module */}
      <div className="p-5 sm:p-6 rounded-3xl bg-dark-900 border border-dark-800 shadow-dark-card max-w-xl">
        <div className="flex items-center gap-2 mb-4">
          <ArrowRightLeft size={20} className="text-gold-400" />
          <h3 className="text-base font-extrabold text-white">Transferência entre Contas</h3>
        </div>

        {transferSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>Transferência realizada com sucesso! Saldos atualizados.</span>
          </div>
        )}

        <form onSubmit={handleTransfer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                De (Origem)
              </label>
              <select
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-400"
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance)})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Para (Destino)
              </label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-400"
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance)})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Valor da Transferência (R$)
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0,00"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-xl text-sm font-bold text-gold-400 focus:outline-none focus:border-gold-400"
            />
          </div>

          <button
            type="submit"
            disabled={isUpdating}
            className="w-full py-2.5 rounded-xl bg-gold-400 text-dark-950 font-bold text-xs sm:text-sm hover:brightness-110 active:scale-95 transition-all shadow-gold-glow disabled:opacity-50"
          >
            {isUpdating ? 'Processando Transferência...' : 'Confirmar Transferência'}
          </button>
        </form>
      </div>

      <AccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAccountCreated={async () => {
          await onRefreshAccounts();
        }}
      />
    </div>
  );
};
