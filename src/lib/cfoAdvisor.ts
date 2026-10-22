/**
 * CFO Virtual IA & Auditor Financeiro
 * Módulo exclusivo Black & Gold para Gestão Estratégica de Caixa
 */

import {
  FinancialAccount,
  FinancialTransaction,
} from '../types/financial';
import { formatCurrency } from './formatters';

export interface CategorySpending {
  category: string;
  totalSpent: number;
  transactionCount: number;
  percentageOfTotal: number;
}

export interface CashFlowForecast {
  daysAhead: number;
  expectedIncome: number;
  expectedExpense: number;
  netCashFlow: number;
  projectedBalance: number;
  dailyAverageIncome: number;
  dailyAverageExpense: number;
}

export interface CategoryLeak {
  category: string;
  totalSpent: number;
  percentageOfExpenses: number;
  isCritical: boolean;
}

export interface BreakEvenPoint {
  monthlyRevenueNeeded: number;
  currentMonthlyIncome: number;
  monthlyExpense: number;
  breakEvenGap: number;
  marginPercentage: number;
}

export interface CFOAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  category?: string;
  action?: string;
}

export interface CFOExecutiveRecommendation {
  id: string;
  priority: 'alta' | 'media' | 'baixa';
  action: string;
  expectedImpact: string;
  category?: string;
  effort?: 'baixo' | 'medio' | 'alto';
}

export interface FinancialHealthReport {
  score: number;
  scoreLabel: string;
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  netCashFlow: number;
  savingsRate: number;
  expenseCount: number;
  incomeCount: number;
  forecast: CashFlowForecast;
  topSpendingCategories: CategorySpending[];
  leakCategories: CategoryLeak[];
  breakEven: BreakEvenPoint;
  alerts: CFOAlert[];
  recommendations: CFOExecutiveRecommendation[];
}

export interface SupplierAuditResult {
  isAnomaly: boolean;
  supplierName: string;
  itemName?: string;
  currentPrice: number;
  previousPrice: number | null;
  percentageDiff: number;
  alertMessage: string;
  severity: 'normal' | 'warning' | 'critical';
}

function sumAmounts(
  transactions: FinancialTransaction[],
  filter: (t: FinancialTransaction) => boolean
): number {
  return transactions
    .filter(filter)
    .reduce((acc, t) => acc + (t.amount || 0), 0);
}

function calculateSavingsRate(monthlyIncome: number, monthlyExpense: number): number {
  if (monthlyIncome <= 0) return 0;
  return Math.max(0, Math.min(1, (monthlyIncome - monthlyExpense) / monthlyIncome));
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excelente';
  if (score >= 60) return 'Saudável';
  if (score >= 40) return 'Atenção';
  return 'Crítico';
}

/**
 * Analisa a saúde financeira completa
 */
export function analyzeFinancialHealth(
  transactions: FinancialTransaction[],
  accounts: FinancialAccount[]
): FinancialHealthReport {
  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const currentMonthTx = transactions.filter(t => t.transaction_date.startsWith(currentMonthPrefix));
  const activeTx = transactions.filter(t => t.status !== 'cancelled');

  const totalBalance = accounts.reduce((acc, a) => acc + (a.balance || 0), 0);
  const monthIncome = sumAmounts(currentMonthTx, t => t.type === 'income' && t.status === 'paid');
  const monthExpense = sumAmounts(currentMonthTx, t => t.type === 'expense' && t.status === 'paid');
  const netCashFlow = monthIncome - monthExpense;

  const expenseCount = activeTx.filter(t => t.type === 'expense').length;
  const incomeCount = activeTx.filter(t => t.type === 'income' && t.status === 'paid').length;
  const savingsRate = calculateSavingsRate(monthIncome, monthExpense);

  // Despesas agrupadas por categoria
  const catMap = new Map<string, { total: number; count: number }>();
  currentMonthTx.forEach(t => {
    if (t.type !== 'expense') return;
    const item = catMap.get(t.category) || { total: 0, count: 0 };
    item.total += t.amount;
    item.count += 1;
    catMap.set(t.category, item);
  });

  const topSpendingCategories: CategorySpending[] = Array.from(catMap.entries())
    .map(([category, val]) => ({
      category,
      totalSpent: val.total,
      transactionCount: val.count,
      percentageOfTotal: monthExpense > 0 ? Math.round((val.total / monthExpense) * 100) : 0,
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent);

  // Vazamentos de capital (categorias que consomem mais de 25% de todas as despesas)
  const leakCategories: CategoryLeak[] = topSpendingCategories
    .filter(c => c.percentageOfTotal >= 20)
    .map(c => ({
      category: c.category,
      totalSpent: c.totalSpent,
      percentageOfExpenses: c.percentageOfTotal,
      isCritical: c.percentageOfTotal >= 35,
    }));

  // Ponto de Equilíbrio (Break-even)
  const breakEven: BreakEvenPoint = {
    monthlyRevenueNeeded: monthExpense,
    currentMonthlyIncome: monthIncome,
    monthlyExpense: monthExpense,
    breakEvenGap: monthIncome - monthExpense,
    marginPercentage: monthIncome > 0 ? Math.round(((monthIncome - monthExpense) / monthIncome) * 100) : 0,
  };

  // Previsão para os próximos 30 dias (pendentes + média diária)
  const pendingIncome = sumAmounts(transactions, t => t.type === 'income' && t.status === 'pending');
  const pendingExpense = sumAmounts(transactions, t => t.type === 'expense' && t.status === 'pending');
  
  const dailyAverageExpense = monthExpense > 0 ? monthExpense / Math.max(1, now.getDate()) : 50;
  const dailyAverageIncome = monthIncome > 0 ? monthIncome / Math.max(1, now.getDate()) : 80;

  const forecast: CashFlowForecast = {
    daysAhead: 30,
    expectedIncome: pendingIncome + (dailyAverageIncome * 30),
    expectedExpense: pendingExpense + (dailyAverageExpense * 30),
    netCashFlow: (pendingIncome + (dailyAverageIncome * 30)) - (pendingExpense + (dailyAverageExpense * 30)),
    projectedBalance: totalBalance + ((pendingIncome + (dailyAverageIncome * 30)) - (pendingExpense + (dailyAverageExpense * 30))),
    dailyAverageIncome,
    dailyAverageExpense,
  };

  // Cálculo do Score de Saúde (0 a 100)
  let score = 50;

  // 1. Saldo positivo
  if (totalBalance > 0) score += 10;
  if (totalBalance >= monthExpense * 2) score += 15; // Colchão de 2 meses
  
  // 2. Fluxo de caixa do mês
  if (netCashFlow > 0) score += 15;
  else if (netCashFlow < 0) score -= 20;

  // 3. Taxa de poupança / margem
  if (savingsRate >= 0.20) score += 10;

  // 4. Contas pendentes vs saldo
  if (pendingExpense > totalBalance && totalBalance > 0) score -= 15;

  score = Math.max(10, Math.min(100, Math.round(score)));
  const scoreLabel = getScoreLabel(score);

  // Alertas inteligentes
  const alerts: CFOAlert[] = [];

  if (pendingExpense > totalBalance * 0.7 && pendingExpense > 0) {
    alerts.push({
      id: 'alert_cash_shortage',
      severity: 'critical',
      title: 'Pressão Imediata de Caixa',
      description: `As contas pendentes (${formatCurrency(pendingExpense)}) consomem mais de 70% do saldo total em caixa.`,
      action: 'Priorizar cobranças de clientes ou postergar compras não-essenciais.',
    });
  }

  if (leakCategories.length > 0) {
    const mainLeak = leakCategories[0];
    alerts.push({
      id: 'alert_high_concentration',
      severity: 'warning',
      title: `Concentração em ${mainLeak.category}`,
      description: `A categoria ${mainLeak.category} representa ${mainLeak.percentageOfExpenses}% de todas as saídas deste mês (${formatCurrency(mainLeak.totalSpent)}).`,
      action: 'Auditar notas e negociar descontos em lote.',
    });
  }

  if (netCashFlow < 0) {
    alerts.push({
      id: 'alert_burn_rate',
      severity: 'critical',
      title: 'Queima de Caixa no Mês',
      description: `As despesas superaram as receitas em ${formatCurrency(Math.abs(netCashFlow))}.`,
      action: 'Cortar custos variáveis e antecipar recebíveis.',
    });
  } else if (netCashFlow > 0) {
    alerts.push({
      id: 'alert_surplus',
      severity: 'info',
      title: 'Superávit Operacional',
      description: `Operação gerando caixa positivo de ${formatCurrency(netCashFlow)} no mês atual.`,
      action: 'Alocar 30% em investimentos de liquidez diária.',
    });
  }

  // 3 Recomendações Executivas de Elite
  const recommendations: CFOExecutiveRecommendation[] = [];

  if (topSpendingCategories.length > 0) {
    const topCat = topSpendingCategories[0];
    recommendations.push({
      id: 'rec_cost_cut',
      priority: 'alta',
      action: `Reduzir 10% nos gastos de ${topCat.category}`,
      expectedImpact: `Economia direta de ${formatCurrency(topCat.totalSpent * 0.10)} no próximo mês`,
      category: topCat.category,
      effort: 'baixo',
    });
  }

  recommendations.push({
    id: 'rec_reserve',
    priority: 'media',
    action: 'Formar Reserva de Emergência para 3 meses de custos fixos',
    expectedImpact: `Meta de blindagem patrimonial: ${formatCurrency(monthExpense * 3)}`,
    effort: 'medio',
  });

  recommendations.push({
    id: 'rec_pix',
    priority: 'alta',
    action: 'Incentivar pagamentos à vista via PIX com desconto de 3%',
    expectedImpact: 'Giro de caixa imediato e eliminação de taxas de máquina de cartão',
    effort: 'baixo',
  });

  return {
    score,
    scoreLabel,
    totalBalance,
    monthlyIncome: monthIncome,
    monthlyExpense: monthExpense,
    netCashFlow,
    savingsRate,
    expenseCount,
    incomeCount,
    forecast,
    topSpendingCategories,
    leakCategories,
    breakEven,
    alerts,
    recommendations,
  };
}

/**
 * Auditoria de Fornecedores & Anti-Cobrança Abusiva
 */
export function auditSupplierPrices(
  transactions: FinancialTransaction[],
  supplierName: string,
  currentAmount: number
): SupplierAuditResult {
  if (!supplierName || currentAmount <= 0) {
    return {
      isAnomaly: false,
      supplierName: supplierName || 'Fornecedor',
      currentPrice: currentAmount,
      previousPrice: null,
      percentageDiff: 0,
      alertMessage: 'Dados insuficientes para histórico.',
      severity: 'normal',
    };
  }

  const cleanName = supplierName.trim().toLowerCase();

  // Histórico de compras anteriores do mesmo fornecedor
  const pastOrders = transactions.filter(t => {
    if (t.type !== 'expense') return false;
    const matchSupplier = t.supplier_name?.toLowerCase().includes(cleanName);
    const matchTitle = t.title.toLowerCase().includes(cleanName);
    return matchSupplier || matchTitle;
  });

  if (pastOrders.length === 0) {
    return {
      isAnomaly: false,
      supplierName,
      currentPrice: currentAmount,
      previousPrice: null,
      percentageDiff: 0,
      alertMessage: 'Primeira compra registrada com este fornecedor.',
      severity: 'normal',
    };
  }

  // Preço da última compra anterior
  const lastOrder = pastOrders[0];
  const previousPrice = lastOrder.amount;
  const percentageDiff = Math.round(((currentAmount - previousPrice) / previousPrice) * 100);

  if (percentageDiff >= 20) {
    return {
      isAnomaly: true,
      supplierName,
      currentPrice: currentAmount,
      previousPrice,
      percentageDiff,
      alertMessage: `⚠️ Alerta de Aumento: Este fornecedor cobrou +${percentageDiff}% em relação à compra anterior (${formatCurrency(previousPrice)} ➔ ${formatCurrency(currentAmount)}).`,
      severity: 'critical',
    };
  } else if (percentageDiff >= 10) {
    return {
      isAnomaly: true,
      supplierName,
      currentPrice: currentAmount,
      previousPrice,
      percentageDiff,
      alertMessage: `Atenção: Aumento de ${percentageDiff}% detectado em relação à última nota (${formatCurrency(previousPrice)}).`,
      severity: 'warning',
    };
  } else if (percentageDiff <= -10) {
    return {
      isAnomaly: false,
      supplierName,
      currentPrice: currentAmount,
      previousPrice,
      percentageDiff,
      alertMessage: `Ótima negociação! Redução de ${Math.abs(percentageDiff)}% obtida em relação à última compra.`,
      severity: 'normal',
    };
  }

  return {
    isAnomaly: false,
    supplierName,
    currentPrice: currentAmount,
    previousPrice,
    percentageDiff,
    alertMessage: 'Preço dentro da média histórica deste fornecedor.',
    severity: 'normal',
  };
}
