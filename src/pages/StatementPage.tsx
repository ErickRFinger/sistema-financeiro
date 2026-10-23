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
  FileSpreadsheet,
  Upload,
  X,
  AlertTriangle
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
import { BankStatementImporterModal } from '../components/BankStatementImporterModal';
import { showToast } from '../components/Toast';
import confetti from 'canvas-confetti';

interface StatementPageProps {
  transactions: FinancialTransaction[];
  accounts: FinancialAccount[];
  onSelectTransaction: (tx: FinancialTransaction) => void;
  onOpenNewTransaction: (type?: TransactionType) => void;
  onToggleStatus: (tx: FinancialTransaction, newStatus: 'paid' | 'pending') => Promise<void>;
  onDeleteTransaction: (tx: FinancialTransaction) => Promise<void>;
  onImportTransactions?: (imported: Omit<FinancialTransaction, 'id' | 'created_at'>[]) => Promise<void>;
}

// New state for bulk selection
interface SelectionState {
  selectedTxIds: string[];
}
const initialSelectionState: SelectionState = { selectedTxIds: [] };

const formatDateToISO = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getPresetDates = () => {
  const now = new Date();
  const todayStr = formatDateToISO(now);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);
  const sevenDaysAgoStr = formatDateToISO(sevenDaysAgo);

  const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  return {
    today: { start: todayStr, end: todayStr },
    '7days': { start: sevenDaysAgoStr, end: todayStr },
    this_month: { start: formatDateToISO(firstDayThisMonth), end: formatDateToISO(lastDayThisMonth) },
    last_month: { start: formatDateToISO(firstDayPrevMonth), end: formatDateToISO(lastDayPrevMonth) },
    all: { start: '', end: '' },
  };
};

const QUICK_DATE_PRESETS = [
  { id: 'today', label: 'Hoje' },
  { id: '7days', label: 'Últimos 7 dias' },
  { id: 'this_month', label: 'Este Mês' },
  { id: 'last_month', label: 'Mês Anterior' },
  { id: 'all', label: 'Todo o Período' },
] as const;

export const StatementPage: React.FC<StatementPageProps> = ({
  transactions,
  accounts,
  onSelectTransaction,
  onOpenNewTransaction,
  onToggleStatus,
  onDeleteTransaction,
  onImportTransactions,
}) => {
  // Filter States
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<string>(() => getPresetDates().this_month.start);
  const [endDate, setEndDate] = useState<string>(() => getPresetDates().this_month.end);
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TransactionStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');

  // Bulk Action Selection State
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  const [bulkActionConfirmOpen, setBulkActionConfirmOpen] = useState(false);

  const handlePresetClick = (presetId: (typeof QUICK_DATE_PRESETS)[number]['id']) => {
    const presets = getPresetDates();
    const selected = presets[presetId];
    setStartDate(selected.start);
    setEndDate(selected.end);
  };

  const isPresetActive = (presetId: (typeof QUICK_DATE_PRESETS)[number]['id']) => {
    const presets = getPresetDates();
    const target = presets[presetId];
    return startDate === target.start && endDate === target.end;
  };

  const accountMap = useMemo(() => {
    return new Map(accounts.map(a => [a.id, a]));
  }, [accounts]);

  // Date boundary calculation
  const filteredTransactions = useMemo(() => {
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

      // 6. Period filter via startDate and endDate
      const txDate = t.transaction_date ? t.transaction_date.split('T')[0] : '';
      if (startDate && txDate < startDate) return false;
      if (endDate && txDate > endDate) return false;

      return true;
    });
  }, [
    transactions, 
    searchTerm, 
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

  // Bulk Action Calculations and Handlers
  const totalSelected = useMemo(() => {
    return filteredTransactions.reduce((acc, tx) => {
      return selectedTxIds.includes(tx.id) ? acc + tx.amount : acc;
    }, 0);
  }, [selectedTxIds, filteredTransactions]);

  const handleBulkMarkPaid = async () => {
    const count = selectedTxIds.length;
    for (const id of selectedTxIds) {
      const tx = filteredTransactions.find((t) => t.id === id);
      if (tx && tx.status !== 'paid') {
        await onToggleStatus(tx, 'paid');
      }
    }
    setSelectedTxIds([]);
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.85 }
    });
    showToast(`${count} transação${count !== 1 ? 's' : ''} marcada${count !== 1 ? 's' : ''} como paga${count !== 1 ? 's' : ''}!`, 'success');
  };

  const handleBulkDelete = async () => {
    setBulkActionConfirmOpen(true);
  };

  const confirmBulkDelete = async () => {
    const count = selectedTxIds.length;
    for (const id of selectedTxIds) {
      const tx = filteredTransactions.find((t) => t.id === id);
      if (tx) {
        await onDeleteTransaction(tx);
      }
    }
    setSelectedTxIds([]);
    setBulkActionConfirmOpen(false);
    showToast(`${count} transação${count !== 1 ? 'ões' : ''} excluída${count !== 1 ? 's' : ''} com sucesso!`, 'info');
  };

  const handleBulkCancelSelection = () => {
    setSelectedTxIds([]);
    showToast('Seleção cancelada.', 'success');
  };

  // Export PDF
  const handleExportPDF = () => {
    let periodLabel = 'Todo o Período';
    if (isPresetActive('this_month')) periodLabel = 'Este Mês';
    else if (isPresetActive('last_month')) periodLabel = 'Mês Anterior';
    else if (isPresetActive('7days')) periodLabel = 'Últimos 7 Dias';
    else if (isPresetActive('today')) periodLabel = 'Hoje';
    else if (startDate || endDate) periodLabel = `${formatDate(startDate) || 'Início'} até ${formatDate(endDate) || 'Hoje'}`;

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
    let periodSlug = 'todo_o_periodo';
    if (isPresetActive('this_month')) periodSlug = 'este_mes';
    else if (isPresetActive('last_month')) periodSlug = 'mes_anterior';
    else if (isPresetActive('7days')) periodSlug = '7dias';
    else if (isPresetActive('today')) periodSlug = 'hoje';
    else if (startDate || endDate) periodSlug = `${startDate || 'inicio'}_${endDate || 'fim'}`;

    exportFinancialStatementToExcel({
      transactions: filteredTransactions,
      accounts,
      fileName: `Extrato_${periodSlug}_${new Date().toISOString().split('T')[0]}`
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
        <div className="flex flex-wrap items-center gap-2">
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
            onClick={() => setIsImporterOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-dark-950 border border-dark-800 hover:border-cyan-400/50 text-slate-200 hover:text-cyan-300 font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-95"
            title="Importar Extrato Bancário (OFX ou CSV)"
          >
            <Upload size={16} className="text-cyan-400" />
            <span>Importar Extrato</span>
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
        {/* Search bar */}
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por descrição, fornecedor, CNPJ ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-dark-950 border border-dark-800 rounded-2xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-gold-400 transition-all"
          />
        </div>

        {/* Date Filter: Quick Presets Horizontal Bar + Manual Date Inputs */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-dark-950 border border-dark-800 space-y-3">
          {/* Quick Filter Horizontal Pills Bar (logo acima dos inputs) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Calendar size={14} className="text-gold-400" />
              <span>Período Rápido:</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {QUICK_DATE_PRESETS.map((preset) => {
                const active = isPresetActive(preset.id);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetClick(preset.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 cursor-pointer ${
                      active
                        ? 'border border-gold-400 bg-gold-400/20 text-gold-300 shadow-gold-glow'
                        : 'border border-dark-800 bg-dark-900/90 text-slate-400 hover:text-white hover:border-dark-700 hover:bg-dark-850'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manual Date Inputs (logo abaixo) */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-dark-850/80 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="font-semibold text-slate-300">Data Inicial:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 bg-dark-900 border border-dark-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-400 transition-all"
              />
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <span className="font-semibold text-slate-300">Data Final:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 bg-dark-900 border border-dark-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-400 transition-all"
              />
            </div>

            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => handlePresetClick('all')}
                className="text-[11px] text-slate-500 hover:text-gold-400 transition-colors ml-auto sm:ml-0"
              >
                Limpar datas
              </button>
            )}
          </div>
        </div>

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
                    <th className="py-3.5 px-4 w-12">
                      <label className="flex items-center justify-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-600 bg-dark-950 text-gold-400 focus:ring-gold-400/30 focus:ring-2 cursor-pointer"
                          checked={selectedTxIds.length === filteredTransactions.length && filteredTransactions.length > 0}
                          onChange={() => setSelectedTxIds((prev) => prev.length === filteredTransactions.length ? [] : filteredTransactions.map(tx => tx.id))}
                        />
                      </label>
                    </th>
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
                        <td className="py-3.5 px-4 w-12">
                          <label className="flex items-center justify-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-slate-600 bg-dark-950 text-gold-400 focus:ring-gold-400/30 focus:ring-2 cursor-pointer"
                              checked={selectedTxIds.includes(tx.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                setSelectedTxIds((prev) =>
                                  prev.includes(tx.id)
                                    ? prev.filter((id) => id !== tx.id)
                                    : [...prev, tx.id]
                                );
                              }}
                            />
                          </label>
                        </td>
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
                    <div className="flex items-start gap-3">
                      <label
                        className="flex items-center justify-center mt-0.5 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-600 bg-dark-950 text-gold-400 focus:ring-gold-400/30 focus:ring-2 cursor-pointer"
                          checked={selectedTxIds.includes(tx.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            setSelectedTxIds((prev) =>
                              prev.includes(tx.id)
                                ? prev.filter((id) => id !== tx.id)
                                : [...prev, tx.id]
                            );
                          }}
                        />
                      </label>
                      <div className="min-w-0 flex-1">
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

      {/* Bulk Action Floating Bar */}
      {selectedTxIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-4 sm:px-0">
          <div className="bg-dark-900/95 backdrop-blur-xl border border-gold-400/40 rounded-2xl shadow-2xl px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 min-w-[300px] max-w-[600px] animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center gap-4 text-sm font-semibold text-slate-100">
              <span className="flex items-center gap-2 text-gold-400">
                <CheckCircle2 size={18} />
                <span>{selectedTxIds.length} selecionada{selectedTxIds.length !== 1 ? 's' : ''}</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-gold-400/20 text-gold-400 border border-gold-400/30 font-mono text-xs">
                Total: {formatCurrency(totalSelected)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkMarkPaid}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 font-bold text-xs transition-all shadow-sm active:scale-95"
                title="Marcar como Pagas"
              >
                <CheckCircle2 size={14} />
                <span>Marcar como Pagas</span>
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/50 font-bold text-xs transition-all shadow-sm active:scale-95"
                title="Excluir Selecionadas"
              >
                <Trash2 size={14} />
                <span>Excluir</span>
              </button>
              <button
                onClick={handleBulkCancelSelection}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-dark-950 border border-dark-800 text-slate-400 hover:bg-dark-850 hover:border-dark-700 hover:text-slate-200 font-bold text-xs transition-all shadow-sm active:scale-95"
                title="Cancelar Seleção"
              >
                <X size={14} />
                <span>Cancelar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkActionConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-dark-900 border border-gold-400/40 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
                <AlertTriangle size={22} className="text-rose-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Confirmar Exclusão</h3>
            </div>
            <p className="text-slate-300 mb-6">
              Tem certeza que deseja excluir <strong className="text-gold-400">{selectedTxIds.length} transação{selectedTxIds.length !== 1 ? 'ões' : ''}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setBulkActionConfirmOpen(false)}
                className="px-4 py-2 rounded-xl bg-dark-950 border border-dark-800 text-slate-400 hover:bg-dark-850 hover:border-dark-700 hover:text-slate-200 font-bold text-sm transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmBulkDelete}
                className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/50 font-bold text-sm transition-all"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importação de Extrato Bancário OFX / CSV */}
      <BankStatementImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        accounts={accounts}
        categories={DEFAULT_CATEGORIES}
        onImportComplete={async (imported) => {
          if (onImportTransactions) {
            await onImportTransactions(imported);
          }
        }}
      />
    </div>
  );
};
