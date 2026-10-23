import React, { useState, useMemo, useEffect } from 'react';
import { 
  Target, 
  Sliders, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  TrendingDown, 
  X, 
  Check, 
  RotateCcw,
  ChevronRight,
  Info,
  PieChart
} from 'lucide-react';
import { FinancialTransaction, DEFAULT_CATEGORIES } from '../types/financial';
import { formatCurrency, parseCurrencyInput } from '../lib/formatters';

export interface CategoryBudget {
  category: string;
  monthlyLimit: number;
}

export const DEFAULT_BUDGET_LIMITS: Record<string, number> = {
  'Alimentação & Refeição': 1500,
  'Combustível & Transporte': 800,
  'Aluguel & Contas Fixas': 2200,
  'Serviços & Internet': 350,
  'Fornecedores & Peças': 2000,
  'Infraestrutura & Ferramentas': 800,
  'Marketing & Comercial': 600,
  'Equipamentos & Hardware': 1000,
  'Impostos & Taxas': 1200,
  'Outros': 500,
};

type BudgetRuleGroup = 'needs' | 'lifestyle' | 'future';

function classifyCategoryToRule(category: string, title?: string): BudgetRuleGroup {
  const normalized = `${category} ${title || ''}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 1. Futuro (20% - Investimentos e Poupança)
  if (
    normalized.includes('invest') ||
    normalized.includes('poupan') ||
    normalized.includes('futuro') ||
    normalized.includes('aporte') ||
    normalized.includes('reserva') ||
    normalized.includes('previden') ||
    normalized.includes('caixinha') ||
    normalized.includes('cofrinho') ||
    normalized.includes('tesouro') ||
    normalized.includes('cdb') ||
    normalized.includes('acoes') ||
    normalized.includes('fii') ||
    normalized.includes('fundo') ||
    normalized.includes('cripto')
  ) {
    return 'future';
  }

  // 2. Necessidades (50% - Moradia, Alimentação, Saúde)
  if (
    normalized.includes('aliment') ||
    normalized.includes('refeic') ||
    normalized.includes('moradia') ||
    normalized.includes('aluguel') ||
    normalized.includes('contas fixas') ||
    normalized.includes('saude') ||
    normalized.includes('medic') ||
    normalized.includes('farmacia') ||
    normalized.includes('hospital') ||
    normalized.includes('supermercado') ||
    normalized.includes('mercado') ||
    normalized.includes('luz') ||
    normalized.includes('agua') ||
    normalized.includes('energia') ||
    normalized.includes('gas') ||
    normalized.includes('internet') ||
    normalized.includes('servicos') ||
    normalized.includes('imposto') ||
    normalized.includes('taxa') ||
    normalized.includes('fornecedor') ||
    normalized.includes('infraestrutura') ||
    normalized.includes('essencial') ||
    normalized.includes('condominio')
  ) {
    return 'needs';
  }

  // 3. Estilo de Vida (30% - Lazer, Compras, Transporte)
  return 'lifestyle';
}

interface CategoryBudgetWidgetProps {
  transactions: FinancialTransaction[];
  currentUser?: any;
  onOpenNewExpense?: () => void;
  isPrivate?: boolean;
}

export const CategoryBudgetWidget: React.FC<CategoryBudgetWidgetProps> = ({
  transactions,
  currentUser,
  onOpenNewExpense,
  isPrivate = false,
}) => {
  const userKey = currentUser ? `aura_user_${currentUser.id}` : 'aura_guest';
  const storageKey = `${userKey}_category_budgets`;

  // Carrega orçamentos salvos do usuário ou padrões
  const [budgets, setBudgets] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Erro ao carregar metas de orçamento:', e);
      }
    }
    return DEFAULT_BUDGET_LIMITS;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudgets, setEditingBudgets] = useState<Record<string, string>>({});
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Mês atual
  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthName = now.toLocaleDateString('pt-BR', { month: 'long' });
  const capitalizedMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

  // Despesas do mês corrente agrupadas por categoria
  const currentMonthExpensesByCategory = useMemo(() => {
    const map = new Map<string, number>();

    transactions
      .filter(t => t.type === 'expense' && t.transaction_date.startsWith(currentMonthPrefix))
      .forEach(t => {
        const cat = t.category || 'Outros';
        map.set(cat, (map.get(cat) || 0) + t.amount);
      });

    return map;
  }, [transactions, currentMonthPrefix]);

  // Total orçado global e total gasto global no mês
  const { totalBudgeted, totalSpent, globalPercent, categoriesData } = useMemo(() => {
    let budgetedSum = 0;
    let spentSum = 0;

    const list = Object.entries(budgets).map(([catName, limit]) => {
      const spent = currentMonthExpensesByCategory.get(catName) || 0;
      budgetedSum += limit;
      spentSum += spent;

      const percent = limit > 0 ? (spent / limit) * 100 : 0;
      const remaining = Math.max(0, limit - spent);
      const isExceeded = spent > limit;
      const exceededAmount = isExceeded ? spent - limit : 0;

      return {
        category: catName,
        limit,
        spent,
        percent,
        remaining,
        isExceeded,
        exceededAmount,
      };
    });

    // Ordena as categorias que mais consumiram ou estouraram a meta primeiro
    list.sort((a, b) => b.percent - a.percent);

    const overallPercent = budgetedSum > 0 ? (spentSum / budgetedSum) * 100 : 0;

    return {
      totalBudgeted: budgetedSum,
      totalSpent: spentSum,
      globalPercent: overallPercent,
      categoriesData: list,
    };
  }, [budgets, currentMonthExpensesByCategory]);

  const handleOpenModal = () => {
    const formatted: Record<string, string> = {};
    DEFAULT_CATEGORIES.forEach(cat => {
      const val = budgets[cat.name] !== undefined ? budgets[cat.name] : (DEFAULT_BUDGET_LIMITS[cat.name] || 500);
      formatted[cat.name] = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(val);
    });
    setEditingBudgets(formatted);
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Record<string, number> = {};

    Object.entries(editingBudgets).forEach(([cat, valStr]) => {
      const num = parseCurrencyInput(valStr);
      updated[cat] = num >= 0 ? num : 0;
    });

    setBudgets(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setIsModalOpen(false);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Deseja restaurar as metas sugeridas pelo sistema?')) {
      setBudgets(DEFAULT_BUDGET_LIMITS);
      localStorage.setItem(storageKey, JSON.stringify(DEFAULT_BUDGET_LIMITS));
      setIsModalOpen(false);
    }
  };

  const displayedCategories = showAll ? categoriesData : categoriesData.slice(0, 5);
  const exceededCount = categoriesData.filter(c => c.isExceeded).length;

  // Cálculo dos percentuais reais da Regra 50/30/20 nas despesas do mês
  const rule503020Data = useMemo(() => {
    let needsTotal = 0;
    let lifestyleTotal = 0;
    let futureTotal = 0;

    transactions
      .filter(t => t.type === 'expense' && t.transaction_date.startsWith(currentMonthPrefix))
      .forEach(t => {
        const group = classifyCategoryToRule(t.category || '', t.title || '');
        if (group === 'needs') needsTotal += t.amount;
        else if (group === 'lifestyle') lifestyleTotal += t.amount;
        else if (group === 'future') futureTotal += t.amount;
      });

    const total = needsTotal + lifestyleTotal + futureTotal;

    const needsPct = total > 0 ? (needsTotal / total) * 100 : 0;
    const lifestylePct = total > 0 ? (lifestyleTotal / total) * 100 : 0;
    const futurePct = total > 0 ? (futureTotal / total) * 100 : 0;

    return {
      total,
      needsTotal,
      lifestyleTotal,
      futureTotal,
      needsPct,
      lifestylePct,
      futurePct,
    };
  }, [transactions, currentMonthPrefix]);

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-dark-900 border border-dark-800 shadow-dark-card space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gold-400/20 to-amber-500/20 border border-gold-400/40 flex items-center justify-center text-gold-400 shadow-sm shrink-0">
            <Target size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Metas de Orçamento por Categoria
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-gold-400/15 text-gold-300 font-extrabold border border-gold-400/30">
                {capitalizedMonth}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Controle de teto de gastos mensais para manter a saúde financeira sob controle
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenModal}
          className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-dark-950 border border-dark-800 hover:border-gold-400/40 text-slate-300 hover:text-gold-400 text-xs font-bold transition-all shadow-sm active:scale-95 shrink-0"
        >
          <Sliders size={14} className="text-gold-400" />
          <span>Ajustar Metas</span>
        </button>
      </div>

      {/* Global Health Progress Card */}
      <div className="p-4 rounded-2xl bg-dark-950 border border-dark-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div>
            <span className="text-slate-400 font-semibold">Consumo Global do Orçamento:</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg sm:text-xl font-black text-white">
                {isPrivate ? '••••••' : formatCurrency(totalSpent)}
              </span>
              <span className="text-xs text-slate-500 font-normal">
                de {isPrivate ? '••••••' : formatCurrency(totalBudgeted)}
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-slate-400 font-semibold">Disponível no Mês:</span>
            <p className={`text-base font-extrabold ${totalSpent > totalBudgeted ? 'text-rose-400' : 'text-emerald-400'}`}>
              {isPrivate ? '••••••' : (totalSpent > totalBudgeted 
                ? `Estourado por ${formatCurrency(totalSpent - totalBudgeted)}` 
                : `${formatCurrency(totalBudgeted - totalSpent)} restantes`)}
            </p>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="space-y-1">
          <div className="h-3 w-full bg-dark-900 rounded-full overflow-hidden p-0.5 border border-dark-800">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                globalPercent > 100 
                  ? 'bg-gradient-to-r from-rose-500 to-red-600 animate-pulse' 
                  : globalPercent > 80 
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500' 
                    : 'bg-gradient-to-r from-emerald-500 to-teal-400'
              }`}
              style={{ width: `${Math.min(100, globalPercent)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
            <span>0%</span>
            <span className={globalPercent > 100 ? 'text-rose-400' : globalPercent > 80 ? 'text-amber-400' : 'text-emerald-400'}>
              {globalPercent.toFixed(1)}% utilizado
            </span>
            <span>100%</span>
          </div>
        </div>

        {exceededCount > 0 && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2 text-rose-300 text-xs font-semibold">
            <AlertTriangle size={15} className="text-rose-400 shrink-0" />
            <span>Atenção: {exceededCount} {exceededCount === 1 ? 'categoria ultrapassou' : 'categorias ultrapassaram'} o teto estipulado para este mês.</span>
          </div>
        )}
      </div>

      {/* Categories Breakdown List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          <span>Categorias & Metas</span>
          <span>Gasto / Teto</span>
        </div>

        <div className="space-y-2.5">
          {displayedCategories.map((item) => {
            const isDanger = item.percent >= 100;
            const isWarning = item.percent >= 80 && item.percent < 100;

            return (
              <div 
                key={item.category}
                className="p-3 sm:p-3.5 rounded-2xl bg-dark-950/70 border border-dark-850 hover:border-dark-750 transition-all space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-xs sm:text-sm text-slate-200 truncate">
                      {item.category}
                    </span>
                    {isDanger && (
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[10px] font-black border border-rose-500/30 shrink-0 animate-pulse">
                        Estourado
                      </span>
                    )}
                    {isWarning && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 shrink-0">
                        Atenção
                      </span>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-xs sm:text-sm font-black ${isDanger ? 'text-rose-400' : 'text-slate-100'}`}>
                      {isPrivate ? '••••••' : formatCurrency(item.spent)}
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal ml-1">
                      / {isPrivate ? '••••••' : formatCurrency(item.limit)}
                    </span>
                  </div>
                </div>

                {/* Progress bar per category */}
                <div className="space-y-1">
                  <div className="h-2 w-full bg-dark-900 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        isDanger 
                          ? 'bg-rose-500' 
                          : isWarning 
                            ? 'bg-amber-400' 
                            : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, item.percent)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-500">
                      {item.isExceeded 
                        ? `Ultrapassou em ${isPrivate ? '••••••' : formatCurrency(item.exceededAmount)}` 
                        : `Ainda pode gastar: ${isPrivate ? '••••••' : formatCurrency(item.remaining)}`}
                    </span>
                    <span className={`font-extrabold ${isDanger ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-slate-400'}`}>
                      {item.percent.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {categoriesData.length > 5 && (
          <div className="text-center pt-1">
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-xs text-gold-400 hover:text-gold-300 font-bold transition-colors inline-flex items-center gap-1"
            >
              <span>{showAll ? 'Mostrar Menos Categorias' : `Ver Todas as ${categoriesData.length} Categorias`}</span>
              <ChevronRight size={14} className={`transition-transform ${showAll ? '-rotate-90' : 'rotate-90'}`} />
            </button>
          </div>
        )}
      </div>

      {/* Card Resumo da Regra 50/30/20 (Rodapé) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-dark-950 border border-dark-800 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gold-400/20 to-amber-500/20 border border-gold-400/30 text-gold-400 flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
              <PieChart size={17} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-extrabold text-white tracking-tight">
                  Regra 50/30/20 (Distribuição de Gastos)
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-400/10 text-gold-300 font-bold border border-gold-400/20 hidden sm:inline">
                  Equilíbrio Financeiro
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Comparativo da sua distribuição real de despesas deste mês com o método ideal
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] text-slate-500 font-medium block">Total Gasto no Mês:</span>
            <span className="text-xs sm:text-sm font-black text-slate-200">
              {isPrivate ? '••••••' : formatCurrency(rule503020Data.total)}
            </span>
          </div>
        </div>

        {/* Barra de Progresso Trifásica Colorida (Azul, Ouro, Esmeralda) */}
        <div className="space-y-1.5">
          <div className="h-3.5 w-full bg-dark-900 rounded-full overflow-hidden flex p-0.5 border border-dark-800 gap-0.5 shadow-inner">
            {rule503020Data.total === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-[9px] text-slate-500 font-medium">
                Sem despesas registradas em {capitalizedMonth}
              </div>
            ) : (
              <>
                {rule503020Data.needsPct > 0 && (
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-blue-500 rounded-l-full first:rounded-l-full last:rounded-r-full transition-all duration-500"
                    style={{ width: `${rule503020Data.needsPct}%` }}
                    title={`Necessidades: ${rule503020Data.needsPct.toFixed(1)}%`}
                  />
                )}
                {rule503020Data.lifestylePct > 0 && (
                  <div
                    className="h-full bg-gradient-to-r from-gold-400 to-amber-500 first:rounded-l-full last:rounded-r-full transition-all duration-500"
                    style={{ width: `${rule503020Data.lifestylePct}%` }}
                    title={`Estilo de Vida: ${rule503020Data.lifestylePct.toFixed(1)}%`}
                  />
                )}
                {rule503020Data.futurePct > 0 && (
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-r-full first:rounded-l-full last:rounded-r-full transition-all duration-500"
                    style={{ width: `${rule503020Data.futurePct}%` }}
                    title={`Futuro: ${rule503020Data.futurePct.toFixed(1)}%`}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Grid dos 3 Pilares com Metas Ideais e Reais */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {/* Pilar 1: Necessidades (50% - Azul) */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-dark-900 border border-sky-500/25 hover:border-sky-500/50 transition-all space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 font-bold text-sky-400">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shrink-0" />
                Necessidades
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 font-extrabold border border-sky-500/30">
                Alvo: 50%
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-base sm:text-lg font-black text-white">
                {rule503020Data.needsPct.toFixed(0)}%
              </span>
              <span className="text-xs text-slate-300 font-semibold">
                {isPrivate ? '••••••' : formatCurrency(rule503020Data.needsTotal)}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Moradia, Alimentação, Saúde
            </p>
          </div>

          {/* Pilar 2: Estilo de Vida (30% - Ouro) */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-dark-900 border border-gold-400/25 hover:border-gold-400/50 transition-all space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 font-bold text-gold-400">
                <span className="w-2.5 h-2.5 rounded-full bg-gold-400 shrink-0" />
                Estilo de Vida
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold-400/15 text-gold-300 font-extrabold border border-gold-400/30">
                Alvo: 30%
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-base sm:text-lg font-black text-white">
                {rule503020Data.lifestylePct.toFixed(0)}%
              </span>
              <span className="text-xs text-slate-300 font-semibold">
                {isPrivate ? '••••••' : formatCurrency(rule503020Data.lifestyleTotal)}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Lazer, Compras, Transporte
            </p>
          </div>

          {/* Pilar 3: Futuro (20% - Esmeralda) */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-dark-900 border border-emerald-500/25 hover:border-emerald-500/50 transition-all space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                Futuro
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-extrabold border border-emerald-500/30">
                Alvo: 20%
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-base sm:text-lg font-black text-white">
                {rule503020Data.futurePct.toFixed(0)}%
              </span>
              <span className="text-xs text-slate-300 font-semibold">
                {isPrivate ? '••••••' : formatCurrency(rule503020Data.futureTotal)}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Investimentos e Poupança
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Configuração de Metas */}
      {isModalOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
        >
          <div className="relative w-full max-w-lg rounded-3xl bg-dark-900 border border-gold-400/30 shadow-2xl p-5 sm:p-6 my-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-dark-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gold-400/20 text-gold-400 flex items-center justify-center font-bold">
                  <Sliders size={18} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Definir Tetos de Gastos Mensais
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Estipule quanto você deseja gastar no máximo em cada categoria
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                title="Fechar janela (Esc)"
                aria-label="Fechar modal"
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-dark-800 active:scale-90 transition-all duration-150"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="mt-4 space-y-4">
              <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-3 divide-y divide-dark-850">
                {DEFAULT_CATEGORIES.map((cat) => {
                  const val = editingBudgets[cat.name] || '0,00';

                  return (
                    <div key={cat.name} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <label className="text-xs font-bold text-slate-200 block truncate">
                          {cat.name}
                        </label>
                        <span className="text-[10px] text-slate-500">Limite mensal</span>
                      </div>

                      <div className="relative w-36 shrink-0">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gold-400 text-xs font-bold">
                          R$
                        </span>
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '');
                            if (!raw) {
                              setEditingBudgets(prev => ({ ...prev, [cat.name]: '' }));
                              return;
                            }
                            const num = parseFloat(raw) / 100;
                            const formatted = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(num);
                            setEditingBudgets(prev => ({ ...prev, [cat.name]: formatted }));
                          }}
                          className="w-full pl-8 pr-2.5 py-1.5 bg-dark-950 border border-dark-800 rounded-xl text-xs font-bold text-slate-100 text-right focus:outline-none focus:border-gold-400 transition-all font-mono"
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-dark-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="px-3 py-2 rounded-xl bg-dark-950 border border-dark-800 hover:border-dark-700 text-slate-400 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw size={13} />
                  <span>Sugeridos</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-dark-800 text-slate-300 font-bold text-xs hover:bg-dark-750 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-gold-400 to-amber-500 text-dark-950 font-black text-xs hover:brightness-110 active:scale-95 transition-all shadow-gold-glow flex items-center gap-1.5"
                  >
                    <Check size={14} className="stroke-[3]" />
                    <span>Salvar Metas</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
