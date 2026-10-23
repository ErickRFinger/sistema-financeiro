import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  ExternalLink, 
  FileText, 
  Calendar, 
  Tag, 
  CreditCard, 
  Landmark, 
  CheckCircle2, 
  Clock,
  ArrowDownCircle,
  ArrowUpCircle
} from 'lucide-react';
import { FinancialTransaction, FinancialAccount } from '../types/financial';
import { formatCurrency, formatDate } from '../lib/formatters';

interface TransactionDetailsModalProps {
  transaction: FinancialTransaction | null;
  onClose: () => void;
  accounts: FinancialAccount[];
  onToggleStatus: (tx: FinancialTransaction, newStatus: 'paid' | 'pending') => Promise<void>;
  onDelete: (tx: FinancialTransaction) => Promise<void>;
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  transaction,
  onClose,
  accounts,
  onToggleStatus,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    if (!transaction) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [transaction, onClose]);

  if (!transaction) return null;

  const account = accounts.find(a => a.id === transaction.account_id);

  const handleStatusChange = async () => {
    setIsToggling(true);
    const nextStatus = transaction.status === 'paid' ? 'pending' : 'paid';
    await onToggleStatus(transaction, nextStatus);
    setIsToggling(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja excluir este lançamento? O saldo da conta será recalculado.')) {
      setIsDeleting(true);
      await onDelete(transaction);
      setIsDeleting(false);
      onClose();
    }
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
          <div className="flex items-center gap-2.5">
            {transaction.type === 'income' ? (
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <ArrowUpCircle size={20} />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                <ArrowDownCircle size={20} />
              </div>
            )}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {transaction.type === 'income' ? 'Entrada / Receita' : 'Saída / Despesa'}
              </span>
              <h3 className="text-lg font-extrabold text-white truncate max-w-xs">
                {transaction.title}
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Amount Big Display */}
        <div className="my-5 p-4 rounded-2xl bg-dark-950 border border-dark-850 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Valor do Registro</span>
            <div className={`text-2xl sm:text-3xl font-black tracking-tight ${
              transaction.type === 'income' ? 'text-emerald-400' : 'text-gold-400'
            }`}>
              {transaction.type === 'income' ? '+ ' : '- '}
              {formatCurrency(transaction.amount)}
            </div>
          </div>

          <button
            onClick={handleStatusChange}
            disabled={isToggling}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 ${
              transaction.status === 'paid'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
            }`}
          >
            {transaction.status === 'paid' ? (
              <>
                <CheckCircle2 size={14} />
                <span>Pago</span>
              </>
            ) : (
              <>
                <Clock size={14} />
                <span>Pendente</span>
              </>
            )}
          </button>
        </div>

        {/* Meta details list */}
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-dark-850">
            <span className="text-slate-400 flex items-center gap-2">
              <Calendar size={16} className="text-gold-400" />
              <span>Data da Operação</span>
            </span>
            <span className="font-semibold text-slate-200">
              {formatDate(transaction.transaction_date)}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-dark-850">
            <span className="text-slate-400 flex items-center gap-2">
              <Landmark size={16} className="text-gold-400" />
              <span>Conta Bancária</span>
            </span>
            <span className="font-semibold text-slate-200">
              {account?.name || 'Conta Padrão'}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-dark-850">
            <span className="text-slate-400 flex items-center gap-2">
              <Tag size={16} className="text-gold-400" />
              <span>Categoria</span>
            </span>
            <span className="font-semibold text-slate-200">
              {transaction.category}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-dark-850">
            <span className="text-slate-400 flex items-center gap-2">
              <CreditCard size={16} className="text-gold-400" />
              <span>Forma de Pagamento</span>
            </span>
            <span className="font-semibold text-slate-200">
              {transaction.payment_method || 'PIX'}
            </span>
          </div>

          {/* Receipt link or preview if available */}
          {transaction.receipt_url && (
            <div className="mt-4 p-3.5 rounded-2xl bg-dark-950 border border-dark-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText size={20} className="text-gold-400" />
                <div>
                  <p className="text-xs font-bold text-slate-200">Comprovante / Nota Fiscal</p>
                  <p className="text-[10px] text-slate-500">Armazenado no Supabase Storage</p>
                </div>
              </div>

              <a
                href={transaction.receipt_url}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-gold-400/10 hover:bg-gold-400/20 text-gold-400 border border-gold-400/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <span>Visualizar</span>
                <ExternalLink size={13} />
              </a>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-dark-800 flex items-center justify-between">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all"
          >
            <Trash2 size={16} />
            <span>{isDeleting ? 'Excluindo...' : 'Excluir Lançamento'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-200 text-xs font-bold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
