import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  FileText, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  CheckCircle2, 
  Clock, 
  ChevronDown,
  Trash2,
  ExternalLink,
  PlusCircle,
  FileSpreadsheet
} from 'lucide-react';
import { 
  FinancialTransaction, 
  FinancialAccount, 
  TransactionType, 
  TransactionStatus,
  DEFAULT_CATEGORIES 
} from '../types/financial';
import { formatCurrency, formatDate } from '../lib/formatters';
import { generateFinancialStatementPDF } from '../lib/pdfExport';
import { exportFinancialStatementToExcel } from '../lib/excelExport';

interface StatementPageProps {
  transactions: FinancialTransaction[];
  accounts: FinancialAccount[];
  onSelectTransaction: (tx: FinancialTransaction) => void;
  onOpenNewTransaction: (type?: TransactionType) => void;
  onToggleStatus: (tx: FinancialTransaction, newStatus: 'paid' | 'pending') => Promise<void>;
  onDeleteTransaction: (tx: FinancialTransaction) => Promise<void>;
}

export const StatementPage: React.FC<StatementPageProps> = ({
  transactions,
  accounts,
  onSelectTransaction,
  onOpenNewTransaction,
  onToggleStatus,
  onDeleteTransaction,
}) => {
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [periodPreset, setPeriodPreset] = useState<'this_month' | 'last_month' | '7days' | 'today' | 'this_year' | 'all' | 'custom'>('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TransactionStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const accountMap = useMemo(() => {
    return new Map(accounts.map(a => [a.id, a]));
  }, [accounts]);

  // Date boundary calculation
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return transactions.filter(t => {
      // 1. Search term match
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(query);
        const matchesCategory = t.category.toLowerCase().includes(query);
        const matchesSupplier = t.supplier_name?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCategory && !matchesSupplier) return false;
      }

      // 2. Type filter
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;

      // 3. Status filter
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;

      // 4. Category filter
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

      // 5. Account filter
      if (accountFilter !== 'all' && t.account_id !== accountFilter) return false;

      // 6. Period filter
      const txDate = t.transaction_date;

      if (periodPreset === 'today') {
        return txDate === todayStr;
      }

      if (periodPreset === '7days') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        const weekAgo = d.toISOString().split('T')[0];
        return txDate >= weekAgo && txDate <= todayStr;
      }

      if (periodPreset === 'this_month') {
        const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        return txDate.startsWith(monthPrefix);
      }

      if (periodPreset === 'last_month') {
        const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
        const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        const monthPrefix = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
        return txDate.startsWith(monthPrefix);
      }

      if (periodPreset === 'this_year') {
        return txDate.startsWith(`${now.getFullYear()}-`);
      }

      if (periodPreset === 'custom') {
        if (startDate && txDate < startDate) return false;
        if (endDate && txDate > endDate) return false;
      }

      return true;
    });
  }, [
    transactions, 
    searchTerm, 
    periodPreset, 
    startDate, 
    endDate, 
    typeFilter, 
    statusFilter, 
    categoryFilter, 
    accountFilter
  ]);

  // Aggregate Metrics for filtered statement
  const totalFilteredExpense = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);

  const totalFilteredIncome = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);

  const netFilteredBalance = totalFilteredIncome - totalFilteredExpense;

  // Export PDF
  const handleExportPDF = () => {
    let periodLabel = 'Todos os Lançamentos';
    if (periodPreset === 'this_month') periodLabel = 'Mês Atual';
    if (periodPreset === 'last_month') periodLabel = 'Mês Anterior';
    if (periodPreset === '7days') periodLabel = 'Últimos 7 Dias';
    if (periodPreset === 'today') periodLabel = 'Hoje';
    if (periodPreset === 'custom') periodLabel = `${startDate || 'Início'} até ${endDate || 'Hoje'}`;

    generateFinancialStatementPDF({
      transactions: filteredTransactions,
      accounts,
      title: 'EXTRATO DETALHADO DE GASTOS E ENTRADAS',
      periodLabel,
      companyName: 'AURA FINANCE',
    });
  };

  // Export Excel
  const handleExportExcel = () => {
    exportFinancialStatementToExcel({
      transactions: filteredTransactions,
      accounts,
      fileName: `Extrato_${periodPreset}_${new Date().toISOString().split('T')[0]}`
    });
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* Header with Title and Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-dark-900 border border-dark-800 shadow-dark-card">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>Extrato de Gastos & Movimentações</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-gold-400/20 text-gold-400 font-extrabold border border-gold-400/30">
              {filteredTransactions.length} itens
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Auditoria completa de pagamentos, despesas e receitas com conciliação de comprovantes
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-dark-950 border border-dark-800 hover:border-gold-400/50 text-slate-200 hover:text-gold-400 font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-95"
            title="Baixar Relatório em PDF"
          >
            <FileText size={16} className="text-gold-400" />
            <span>Exportar PDF</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-dark-950 border border-dark-800 hover:border-emerald-500/50 text-slate-200 hover:text-emerald-400 font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-95"
            title="Exportar Planilha Excel"
          >
            <FileSpreadsheet size={16} className="text-emerald-400" />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => onOpenNewTransaction('expense')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-gold-400 to-amber-500 text-dark-950 font-extrabold text-xs sm:text-sm shadow-gold-glow active:scale-95 transition-all"
          >
            <PlusCircle size={16} />
            <span>Novo</span>
          </button>
        </div>
      </div>

      {/* Dynamic Summary Bar for the Selected Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-dark-900 border border-dark-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">Total Despesas no Filtro</p>
            <p className="text-xl sm:text-2xl font-black text-rose-400 mt-1">
              - {formatCurrency(totalFilteredExpense)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
            <ArrowDownRight size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-dark-900 border border-dark-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">Total Receitas no Filtro</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
              + {formatCurrency(totalFilteredIncome)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <ArrowUpRight size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-dark-900 border border-dark-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">Resultado do Período</p>
            <p className={`text-xl sm:text-2xl font-black mt-1 ${
              netFilteredBalance >= 0 ? 'text-gold-400' : 'text-rose-400'
            }`}>
              {formatCurrency(netFilteredBalance)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gold-400/10 text-gold-400 flex items-center justify-center border border-gold-400/20">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-dark-900 border border-dark-800 shadow-dark-card space-y-4">
        {/* Search input + Period pills */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por descrição, fornecedor, CNPJ ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-dark-950 border border-dark-800 rounded-2xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-gold-400 transition-all"
            />
          </div>

          {/* Quick Period Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'today', label: 'Hoje' },
              { id: '7days', label: '7 Dias' },
              { id: 'this_month', label: 'Este Mês' },
              { id: 'last_month', label: 'Mês Passado' },
              { id: 'this_year', label: 'Ano' },
              { id: 'all', label: 'Todos' },
              { id: 'custom', label: 'Personalizado' },
            ].map((preset) => (
              <button
                key={preset.id}
                onClick={() => setPeriodPreset(preset.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  periodPreset === preset.id
                    ? 'bg-gold-400 text-dark-950 shadow-gold-glow'
                    : 'bg-dark-950 text-slate-400 border border-dark-800 hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom date range inputs (visible if 'custom' is selected) */}
        {periodPreset === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-dark-950 border border-dark-800">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Calendar size={14} className="text-gold-400" />
              <span>De:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 bg-dark-900 border border-dark-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-400"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Até:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 bg-dark-900 border border-dark-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-400"
              />
            </div>
          </div>
        )}

        {/* Dropdown Filters (Type, Status, Category, Account) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-dark-850">
          {/* Type filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Tipo
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 bg-dark-950 border border-dark-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-400"
            >
              <option value="all">Todos os Tipos</option>
              <option value="expense">Apenas Despesas (Saídas)</option>
              <option value="income">Apenas Receitas (Entradas)</option>
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 bg-dark-950 border border-dark-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-400"
            >
              <option value="all">Todos os Status</option>
              <option value="paid">Pagos / Liquidados</option>
              <option value="pending">Pendentes / A Pagar</option>
            </select>
          </div>

          {/* Category filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Categoria
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-dark-950 border border-dark-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-400"
            >
              <option value="all">Todas as Categorias</option>
              {DEFAULT_CATEGORIES.map(cat => (
                <option key={cat.name} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Account filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Conta
            </label>
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-dark-950 border border-dark-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-400"
            >
              <option value="all">Todas as Contas</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List / Table */}
      <div className="rounded-3xl bg-dark-900 border border-dark-800 shadow-dark-card overflow-hidden">
        {filteredTransactions.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-dark-950 text-slate-400 uppercase font-bold border-b border-dark-800 tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Data</th>
                    <th className="py-3.5 px-4">Descrição / Fornecedor</th>
                    <th className="py-3.5 px-4">Categoria</th>
                    <th className="py-3.5 px-4">Conta</th>
                    <th className="py-3.5 px-4">Pagamento</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Valor</th>
                    <th className="py-3.5 px-4 text-center">NF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-850">
                  {filteredTransactions.map((tx) => {
                    const account = accountMap.get(tx.account_id);
                    return (
                      <tr
                        key={tx.id}
                        onClick={() => onSelectTransaction(tx)}
                        className="hover:bg-dark-850/60 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4 text-slate-300 font-mono">
                          {formatDate(tx.transaction_date)}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-100 group-hover:text-gold-400 transition-colors">
                            {tx.title}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-400">
                          <span className="px-2.5 py-1 rounded-lg bg-dark-950 border border-dark-800 text-[11px] font-medium">
                            {tx.category}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <span 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: account?.color || '#facc15' }}
                            />
                            <span>{account?.name || 'Padrão'}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-400">
                          {tx.payment_method || 'PIX'}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleStatus(tx, tx.status === 'paid' ? 'pending' : 'paid');
                            }}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border transition-all ${
                              tx.status === 'paid'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            }`}
                          >
                            {tx.status === 'paid' ? '✓ Pago' : '⏳ Pendente'}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <span className={`font-black text-sm ${
                            tx.type === 'income' ? 'text-emerald-400' : 'text-gold-400'
                          }`}>
                            {tx.type === 'income' ? '+ ' : '- '}
                            {formatCurrency(tx.amount)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {tx.receipt_url ? (
                            <a
                              href={tx.receipt_url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 rounded-lg bg-gold-400/10 text-gold-400 hover:bg-gold-400/20 inline-flex items-center"
                              title="Ver Comprovante Anexo"
                            >
                              <ExternalLink size={14} />
                            </a>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden divide-y divide-dark-850 p-2">
              {filteredTransactions.map((tx) => {
                const account = accountMap.get(tx.account_id);
                return (
                  <div
                    key={tx.id}
                    onClick={() => onSelectTransaction(tx)}
                    className="p-3.5 hover:bg-dark-950/70 rounded-2xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                          {tx.title}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                          <span>{formatDate(tx.transaction_date)}</span>
                          <span>•</span>
                          <span>{tx.category}</span>
                          {account && (
                            <>
                              <span>•</span>
                              <span>{account.name}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className={`text-sm font-black ${
                          tx.type === 'income' ? 'text-emerald-400' : 'text-gold-400'
                        }`}>
                          {tx.type === 'income' ? '+ ' : '- '}
                          {formatCurrency(tx.amount)}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleStatus(tx, tx.status === 'paid' ? 'pending' : 'paid');
                          }}
                          className={`mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {tx.status === 'paid' ? 'Pago' : 'Pendente'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="p-12 text-center">
            <p className="text-sm font-bold text-slate-300">Nenhum lançamento no filtro selecionado</p>
            <p className="text-xs text-slate-500 mt-1">Tente ajustar as datas ou limpar os filtros de busca.</p>
          </div>
        )}
      </div>
    </div>
  );
};
