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
  CreditCard
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
import { MetricCard } from '../components/MetricCard';
import { FinancialAccount, FinancialTransaction } from '../types/financial';
import { formatCurrency, formatDateFriendly } from '../lib/formatters';

interface DashboardPageProps {
  accounts: FinancialAccount[];
  transactions: FinancialTransaction[];
  onOpenNewTransaction: (type?: 'expense' | 'income') => void;
  onOpenScanner: () => void;
  onOpenCFO?: () => void;
  onOpenMercadoPago?: () => void;
  onSelectTransaction: (tx: FinancialTransaction) => void;
  onNavigateToStatement: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  accounts,
  transactions,
  onOpenNewTransaction,
  onOpenScanner,
  onOpenCFO,
  onOpenMercadoPago,
  onSelectTransaction,
  onNavigateToStatement,
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

          {onOpenMercadoPago && (
            <button
              onClick={onOpenMercadoPago}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/40 hover:bg-sky-500/20 font-bold text-xs sm:text-sm transition-all active:scale-95 shadow-sm"
              title="Emitir cobrança PIX e Link de Pagamento Mercado Pago"
            >
              <CreditCard size={18} />
              <span>Cobrar MP (PIX)</span>
            </button>
          )}

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

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Saldo Consolidado"
          value={formatCurrency(totalBalance)}
          subtitle="Soma de todas as contas"
          icon={Wallet}
          highlight={true}
          variant="gold"
        />

        <MetricCard
          title="Receitas no Mês"
          value={formatCurrency(monthIncome)}
          subtitle="Entradas liquidadas"
          icon={TrendingUp}
          variant="green"
          trend={{ value: 'Mês atual', isPositive: true }}
        />

        <MetricCard
          title="Despesas no Mês"
          value={formatCurrency(monthExpense)}
          subtitle="Saídas pagas"
          icon={TrendingDown}
          variant="red"
          trend={{ value: 'Mês atual', isPositive: false }}
        />

        <MetricCard
          title="Contas a Pagar"
          value={formatCurrency(pendingBills)}
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
                {formatCurrency(acc.balance)}
              </div>
              <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
                <span>Disponível</span>
                <span className="text-emerald-400 font-semibold">Ativo</span>
              </div>
            </div>
          ))}
        </div>
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
