import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Clock, 
  PlusCircle, 
  ScanLine, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronRight,
  PieChart as PieIcon,
  BarChart3,
  Zap,
  CreditCard,
  PlayCircle,
  BookOpen,
  Receipt,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { UpcomingBillsAlert } from '../components/UpcomingBillsAlert';
import { MetricCard } from '../components/MetricCard';
import { CurrencyQuotesWidget } from '../components/CurrencyQuotesWidget';
import { PWAInstallBanner } from '../components/PWAInstallBanner';
import { CategoryBudgetWidget } from '../components/CategoryBudgetWidget';
import { FinancialHealthScore } from '../components/FinancialHealthScore';
import { MonthlyComparisonWidget } from '../components/MonthlyComparisonWidget';
import { SafeToSpendWidget } from '../components/SafeToSpendWidget';
import { SubscriptionHubWidget } from '../components/SubscriptionHubWidget';
import { FinancialGoalsWidget } from '../components/FinancialGoalsWidget';
import { FinancialAccount, FinancialTransaction } from '../types/financial';
import { formatCurrency, formatDateFriendly } from '../lib/formatters';

interface DashboardPageProps {
  accounts: FinancialAccount[];
  transactions: FinancialTransaction[];
  currentUser?: any;
  isPrivate?: boolean;
  onOpenNewTransaction: (type?: 'expense' | 'income') => void;
  onOpenScanner: () => void;
  onOpenCFO?: () => void;
  onOpenMercadoPago?: () => void;
  onSelectTransaction: (tx: FinancialTransaction) => void;
  onNavigateToStatement: () => void;
  onNavigateToCards?: () => void;
  onNavigateToShopping?: () => void;
  onNavigateToTutorial?: () => void;
  onNavigateToSubscription?: () => void;
  isPaidSubscription?: boolean;
  trialDaysRemaining?: number;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  accounts,
  transactions,
  currentUser,
  isPrivate = false,
  onOpenNewTransaction,
  onOpenScanner,
  onOpenCFO,
  onOpenMercadoPago,
  onSelectTransaction,
  onNavigateToStatement,
  onNavigateToTutorial,
  onNavigateToSubscription,
  isPaidSubscription = false,
  trialDaysRemaining = 7,
}) => {
  // Current month bounds
  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Metrics
  const totalBalance = useMemo(() => {
    return accounts.reduce((acc, a) => acc + (a.balance || 0), 0);
  }, [accounts]);

  const currentMonthTransactions = useMemo(() => {
    return transactions.filter(t => t.transaction_date.startsWith(currentMonthPrefix));
  }, [transactions, currentMonthPrefix]);

  const monthIncome = useMemo(() => {
    return currentMonthTransactions
      .filter(t => t.type === 'income' && t.status === 'paid')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [currentMonthTransactions]);

  const monthExpense = useMemo(() => {
    return currentMonthTransactions
      .filter(t => t.type === 'expense' && t.status === 'paid')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [currentMonthTransactions]);

  const pendingBills = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense' && t.status !== 'paid')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions]);

  const monthNet = monthIncome - monthExpense;

  // Chart data: Monthly Cashflow grouped by day
  const cashFlowChartData = useMemo(() => {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const map = new Map<number, { day: string; receitas: number; despesas: number }>();

    for (let d = 1; d <= daysInMonth; d++) {
      map.set(d, { day: `${String(d).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`, receitas: 0, despesas: 0 });
    }

    currentMonthTransactions.forEach(t => {
      const parts = t.transaction_date.split('-');
      if (parts.length === 3) {
        const d = parseInt(parts[2], 10);
        const item = map.get(d);
        if (item) {
          if (t.type === 'income') item.receitas += t.amount;
          else item.despesas += t.amount;
        }
      }
    });

    return Array.from(map.values()).slice(0, Math.min(daysInMonth, now.getDate() + 3));
  }, [currentMonthTransactions, now]);

  // Chart data: Category breakdown for expenses
  const categoryChartData = useMemo(() => {
    const map = new Map<string, number>();
    currentMonthTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const cat = t.category || 'Outros';
        map.set(cat, (map.get(cat) || 0) + t.amount);
      });

    const colors = ['#facc15', '#f59e0b', '#eab308', '#ca8a04', '#38bdf8', '#a855f7', '#ec4899', '#14b8a6'];
    return Array.from(map.entries())
      .map(([name, value], idx) => ({
        name,
        value,
        color: colors[idx % colors.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [currentMonthTransactions]);

  // Recent 6 transactions
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 6);
  }, [transactions]);

  const accountMap = useMemo(() => {
    return new Map(accounts.map(a => [a.id, a]));
  }, [accounts]);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Banner / Welcome & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 border border-dark-800 shadow-dark-card">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-gold-400/20 text-gold-400 font-extrabold text-[11px] border border-gold-400/30">
              SISTEMA PRO
            </span>
            <span className="text-xs text-slate-400">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
            Painel Financeiro <span className="gold-gradient-text">Black & Gold</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Gestão patrimonial completa com inteligência artificial para leitura e conciliação de notas fiscais.
          </p>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenCFO && (
            <button
              onClick={onOpenCFO}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-gold-400 to-amber-500 text-dark-950 font-black text-xs sm:text-sm hover:brightness-110 active:scale-95 transition-all shadow-gold-glow"
            >
              <Zap size={18} className="fill-dark-950" />
              <span>CFO Virtual (IA)</span>
            </button>
          )}

          <button
            onClick={onOpenScanner}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-dark-950 border border-gold-400/50 text-gold-400 hover:bg-gold-400/10 font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-95"
          >
            <ScanLine size={18} className="animate-pulse" />
            <span>Ler Nota Fiscal (IA)</span>
          </button>

          <button
            onClick={() => onOpenNewTransaction('expense')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30 font-bold text-xs sm:text-sm transition-all active:scale-95"
          >
            <TrendingDown size={18} />
            <span>+ Pagar / Despesa</span>
          </button>

          <button
            onClick={() => onOpenNewTransaction('income')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 font-bold text-xs sm:text-sm transition-all active:scale-95"
          >
            <TrendingUp size={18} />
            <span>+ Receber</span>
          </button>
        </div>
      </div>

      {/* PWA Download Banner */}
      <PWAInstallBanner />

      {/* Tutorial & Video Guide Banner */}
      {onNavigateToTutorial && (
        <div 
          onClick={onNavigateToTutorial}
          className="group cursor-pointer rounded-2xl bg-gradient-to-r from-dark-900 via-dark-950 to-dark-900 border border-gold-400/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-gold-400 transition-all shadow-md hover:shadow-gold-glow"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gold-400/15 border border-gold-400/30 flex items-center justify-center text-gold-400 shrink-0 group-hover:scale-105 transition-transform">
              <PlayCircle size={24} className="fill-gold-400/20 text-gold-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-white group-hover:text-gold-300 transition-colors">
                  Novo por aqui? Assista ao Vídeo Tutorial & Conheça Todas as Funções
                </span>
                <span className="hidden md:inline-flex text-[10px] px-2 py-0.5 rounded-full bg-gold-400/20 text-gold-300 border border-gold-400/30 font-bold">
                  7 Dias Grátis • R$ 9,90/mês
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Aprenda a usar a IA, enviar prints bancários (Porquinhos NuBank/PicPay), ler faturas em PDF e baixar o app no celular.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-gold-400 group-hover:translate-x-1 transition-transform shrink-0 self-end sm:self-auto">
            <span>Acessar Tutoriais</span>
            <ChevronRight size={16} />
          </div>
        </div>
      )}

      {/* Upcoming Bills Alert */}
      <UpcomingBillsAlert
        transactions={transactions}
        onNavigateToStatement={onNavigateToStatement}
        isPrivate={isPrivate}
      />

      {/* Safe to Spend Today / Rest of Month (Copilot Money style) */}
      <SafeToSpendWidget
        accounts={accounts}
        transactions={transactions}
        isPrivate={isPrivate}
      />

      {/* System Subscription Invoice Alert / Trial Reminder Banner */}
      {onNavigateToSubscription && (
        <>
          {!isPaidSubscription && trialDaysRemaining <= 0 ? (
            <div 
              onClick={onNavigateToSubscription}
              className="cursor-pointer rounded-2xl bg-gradient-to-r from-rose-950/70 via-dark-900 to-amber-950/60 border border-rose-500/40 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg hover:border-rose-400 transition-all group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 animate-pulse">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-black text-rose-200">
                      Mensalidade Pendente • R$ 9,90/mês
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                      Venceu dia 10
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">
                    Seu período de testes encerrou. Quite sua fatura via PIX com liberação imediata para evitar bloqueios no sistema.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-gold-400 to-amber-500 text-dark-950 font-black text-xs shadow-gold-glow group-hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5">
                  <Receipt size={14} />
                  <span>Pagar R$ 9,90 (PIX)</span>
                </button>
              </div>
            </div>
          ) : !isPaidSubscription && trialDaysRemaining > 0 ? (
            <div 
              onClick={onNavigateToSubscription}
              className="cursor-pointer rounded-2xl bg-gradient-to-r from-dark-900 via-dark-950 to-dark-900 border border-emerald-500/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md hover:border-emerald-500/60 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-white">
                      Degustação VIP Ativa: {trialDaysRemaining} {trialDaysRemaining === 1 ? 'dia restante' : 'dias restantes'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                      7 Dias Grátis
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Aproveite acesso ilimitado. Sua primeira fatura de apenas R$ 9,90/mês vencerá no dia 10.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0 self-end sm:self-auto">
                <span>Ver Faturas</span>
                <ChevronRight size={15} />
              </div>
            </div>
          ) : now.getDate() >= 7 && now.getDate() <= 10 ? (
            <div 
              onClick={onNavigateToSubscription}
              className="cursor-pointer rounded-2xl bg-gradient-to-r from-dark-900 via-dark-950 to-gold-950/20 border border-gold-400/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md hover:border-gold-400 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gold-400/15 border border-gold-400/30 flex items-center justify-center text-gold-400 shrink-0">
                  <Receipt size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-white">
                      Lembrete: Mensalidade de R$ 9,90 vence dia 10
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-400/20 text-gold-300 border border-gold-400/30 font-bold">
                      PIX Instantâneo
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Mantenha sua conta em dia com compensação automática em menos de 10 segundos.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-gold-400 group-hover:translate-x-1 transition-transform shrink-0 self-end sm:self-auto">
                <span>Pagar Fatura</span>
                <ChevronRight size={15} />
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Saldo Consolidado"
          value={isPrivate ? '••••••' : formatCurrency(totalBalance)}
          subtitle="Soma de todas as contas"
          icon={Wallet}
          highlight={true}
          variant="gold"
        />

        <MetricCard
          title="Receitas no Mês"
          value={isPrivate ? '••••••' : formatCurrency(monthIncome)}
          subtitle="Entradas liquidadas"
          icon={TrendingUp}
          variant="green"
          trend={{ value: 'Mês atual', isPositive: true }}
        />

        <MetricCard
          title="Despesas no Mês"
          value={isPrivate ? '••••••' : formatCurrency(monthExpense)}
          subtitle="Saídas pagas"
          icon={TrendingDown}
          variant="red"
          trend={{ value: 'Mês atual', isPositive: false }}
        />

        <MetricCard
          title="Contas a Pagar"
          value={isPrivate ? '••••••' : formatCurrency(pendingBills)}
          subtitle="Pendentes no período"
          icon={Clock}
          variant="default"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Cashflow Evolution Area Chart */}
        <div className="lg:col-span-8 p-5 sm:p-6 rounded-3xl bg-dark-900 border border-dark-800 shadow-dark-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <BarChart3 size={18} className="text-gold-400" />
                <span>Fluxo de Caixa Diário</span>
              </h3>
              <p className="text-xs text-slate-400">
                Receitas e Despesas do mês corrente
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-slate-300">Receitas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gold-400" />
                <span className="text-slate-300">Despesas</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#facc15" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#facc15" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} tickFormatter={(val) => `R$${val}`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0d1017', 
                    borderColor: '#232b3e', 
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                  }}
                  formatter={(value: any) => [formatCurrency(value), '']}
                />
                <Area type="monotone" dataKey="receitas" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReceitas)" />
                <Area type="monotone" dataKey="despesas" stroke="#facc15" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDespesas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses by Category Donut Chart */}
        <div className="lg:col-span-4 p-5 sm:p-6 rounded-3xl bg-dark-900 border border-dark-800 shadow-dark-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <PieIcon size={18} className="text-gold-400" />
                <span>Gastos por Categoria</span>
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Distribuição dos desembolsos
            </p>
          </div>

          <div className="h-44 w-full my-2 flex items-center justify-center">
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0d1017', 
                      borderColor: '#232b3e', 
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px' 
                    }}
                    formatter={(val: any) => [formatCurrency(val), 'Valor']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500 text-center py-8">
                Nenhum gasto registrado este mês
              </div>
            )}
          </div>

          {/* Category Legends */}
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {categoryChartData.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-slate-300 truncate max-w-[120px]">{cat.name}</span>
                </div>
                <span className="font-bold text-slate-200">{formatCurrency(cat.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Category Budgets & Goals */}
      <CategoryBudgetWidget 
        transactions={transactions} 
        currentUser={currentUser} 
        isPrivate={isPrivate}
        onOpenNewExpense={() => onOpenNewTransaction('expense')}
      />

      {/* Bank Accounts Row */}
      <div className="p-5 sm:p-6 rounded-3xl bg-dark-900 border border-dark-800 shadow-dark-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-extrabold text-white">
              Saldos Bancários & Carteiras
            </h3>
            <p className="text-xs text-slate-400">
              Sincronizado em tempo real com o Supabase
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {accounts.map((acc) => (
            <div 
              key={acc.id}
              className="p-4 rounded-2xl bg-dark-950 border border-dark-800 hover:border-gold-400/40 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300">{acc.name}</span>
                <span 
                  className="w-3 h-3 rounded-full shadow-sm" 
                  style={{ backgroundColor: acc.color || '#facc15' }}
                />
              </div>
              <div className="text-xl font-black text-white group-hover:text-gold-400 transition-colors">
                {isPrivate ? '••••••' : formatCurrency(acc.balance)}
              </div>
              <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
                <span>Disponível</span>
                <span className="text-emerald-400 font-semibold">Ativo</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Radar de Metas Financeiras com Anéis Circulares SVG */}
      <FinancialGoalsWidget isPrivate={isPrivate} />

      {/* Financial Health, Comparison & Subscriptions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <FinancialHealthScore
          income={monthIncome}
          expenses={monthExpense}
          transactionsCount={currentMonthTransactions.length}
          isPrivate={isPrivate}
        />

        <MonthlyComparisonWidget
          transactions={transactions}
          isPrivate={isPrivate}
        />

        <SubscriptionHubWidget isPrivate={isPrivate} />

        <CurrencyQuotesWidget />
      </div>

      {/* Recent Transactions Feed */}
      <div className="p-5 sm:p-6 rounded-3xl bg-dark-900 border border-dark-800 shadow-dark-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-extrabold text-white">
              Últimos Lançamentos
            </h3>
            <p className="text-xs text-slate-400">
              Clique em qualquer item para ver detalhes ou comprovante
            </p>
          </div>

          <button
            onClick={onNavigateToStatement}
            className="flex items-center gap-1 text-xs font-bold text-gold-400 hover:underline"
          >
            <span>Ver Extrato Completo</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="space-y-2">
            {recentTransactions.map((tx) => {
              const account = accountMap.get(tx.account_id);
              return (
                <div
                  key={tx.id}
                  onClick={() => onSelectTransaction(tx)}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-dark-950/70 hover:bg-dark-950 border border-dark-800 hover:border-gold-400/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'income' 
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}>
                      {tx.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white group-hover:text-gold-400 transition-colors truncate">
                        {tx.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{formatDateFriendly(tx.transaction_date)}</span>
                        <span>•</span>
                        <span>{tx.category}</span>
                        {account && (
                          <>
                            <span>•</span>
                            <span className="text-slate-300 font-medium">{account.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-3">
                    <div className={`text-sm sm:text-base font-extrabold ${
                      tx.type === 'income' ? 'text-emerald-400' : 'text-gold-400'
                    }`}>
                      {tx.type === 'income' ? '+ ' : '- '}
                      {formatCurrency(tx.amount)}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      tx.status === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {tx.status === 'paid' ? 'Pago' : 'Pendente'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-dark-850 flex items-center justify-center text-slate-500 mb-3">
              <PlusCircle size={24} />
            </div>
            <p className="text-sm font-bold text-slate-300">Nenhum lançamento encontrado</p>
            <p className="text-xs text-slate-500 mt-1">
              Comece lançando um pagamento ou escaneie uma nota fiscal com a IA.
            </p>
            <button
              onClick={() => onOpenNewTransaction('expense')}
              className="mt-4 px-4 py-2 rounded-xl bg-gold-400 text-dark-950 font-bold text-xs shadow-gold-glow"
            >
              Criar Primeiro Lançamento
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
