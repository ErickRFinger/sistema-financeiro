import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight, 
  Zap, 
  Lightbulb, 
  Sliders, 
  CheckCircle2, 
  DollarSign, 
  Percent 
} from 'lucide-react';
import { 
  analyzeFinancialHealth, 
  FinancialHealthReport 
} from '../lib/cfoAdvisor';
import { FinancialAccount, FinancialTransaction } from '../types/financial';
import { formatCurrency } from '../lib/formatters';

interface CFOModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: FinancialTransaction[];
  accounts: FinancialAccount[];
}

export const CFOModal: React.FC<CFOModalProps> = ({
  isOpen,
  onClose,
  transactions,
  accounts,
}) => {
  const [simulationCutPercent, setSimulationCutPercent] = useState<number>(10);

  if (!isOpen) return null;

  const report: FinancialHealthReport = analyzeFinancialHealth(transactions, accounts);

  // Top category to simulate
  const topCategory = report.topSpendingCategories[0] || { category: 'Despesas Gerais', totalSpent: report.monthlyExpense };
  const simulatedSavings = Math.round(topCategory.totalSpent * (simulationCutPercent / 100));
  const simulatedNewNet = report.netCashFlow + simulatedSavings;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (score >= 60) return 'text-gold-400 border-gold-400/40 bg-gold-400/10';
    if (score >= 40) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-dark-900 border border-gold-400/40 shadow-2xl p-5 sm:p-7 my-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-dark-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gold-400 to-amber-500 flex items-center justify-center text-dark-950 font-black shadow-gold-glow">
              <Zap size={22} className="fill-dark-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  CFO Virtual com IA
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-gold-400/20 text-gold-300 border border-gold-400/40 text-[10px] font-extrabold uppercase">
                  Copiloto Estratégico
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Diagnóstico executivo, previsão de caixa e blindagem contra cobranças abusivas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-5 space-y-6">
          {/* Top Score & Quick Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Score Card */}
            <div className="md:col-span-4 p-5 rounded-3xl bg-dark-950 border border-dark-800 flex flex-col justify-between items-center text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Score de Saúde de Caixa
              </span>

              <div className="my-3">
                <div className={`w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center shadow-lg ${getScoreColor(report.score)}`}>
                  <span className="text-3xl font-black tracking-tight">{report.score}</span>
                  <span className="text-[10px] font-bold uppercase -mt-1">/ 100</span>
                </div>
                <p className="text-sm font-extrabold text-white mt-2">
                  Status: <span className="text-gold-400">{report.scoreLabel}</span>
                </p>
              </div>

              <div className="w-full bg-dark-900 h-2 rounded-full overflow-hidden border border-dark-800">
                <div
                  className="bg-gradient-to-r from-amber-500 to-gold-400 h-full transition-all duration-700"
                  style={{ width: `${report.score}%` }}
                />
              </div>
            </div>

            {/* Cash Flow Forecast & Break-even */}
            <div className="md:col-span-8 p-5 rounded-3xl bg-dark-950 border border-dark-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp size={15} className="text-gold-400" />
                    <span>Previsão de Caixa para 30 Dias</span>
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-dark-900 text-slate-300 border border-dark-800 font-mono">
                    Run-rate projetado
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 my-2">
                  <div className="p-3 rounded-2xl bg-dark-900/80 border border-dark-850">
                    <span className="text-[10px] text-slate-400 font-semibold block">Entradas Projetadas</span>
                    <span className="text-base font-extrabold text-emerald-400">
                      + {formatCurrency(report.forecast.expectedIncome)}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-dark-900/80 border border-dark-850">
                    <span className="text-[10px] text-slate-400 font-semibold block">Saídas Projetadas</span>
                    <span className="text-base font-extrabold text-rose-400">
                      - {formatCurrency(report.forecast.expectedExpense)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Break-even point */}
              <div className="mt-3 pt-3 border-t border-dark-850 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Ponto de Equilíbrio (Break-even): </span>
                  <span className="font-extrabold text-white">{formatCurrency(report.breakEven.monthlyRevenueNeeded)}/mês</span>
                </div>
                <div className={`font-bold ${report.breakEven.breakEvenGap >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {report.breakEven.breakEvenGap >= 0 ? `+${formatCurrency(report.breakEven.breakEvenGap)} livre` : `Déficit de ${formatCurrency(Math.abs(report.breakEven.breakEvenGap))}`}
                </div>
              </div>
            </div>
          </div>

          {/* Critical Alerts Section */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle size={15} className="text-amber-400" />
              <span>Diagnósticos & Alertas de Auditoria</span>
            </h4>

            {report.alerts.length > 0 ? (
              <div className="space-y-2">
                {report.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${
                      alert.severity === 'critical'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        : alert.severity === 'warning'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : 'bg-gold-400/10 border-gold-400/30 text-gold-300'
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      <AlertTriangle size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-extrabold uppercase tracking-wide">
                        {alert.title}
                      </h5>
                      <p className="text-xs mt-0.5 text-slate-200">
                        {alert.description}
                      </p>
                      {alert.action && (
                        <p className="text-[11px] font-semibold text-gold-400 mt-1">
                          ↳ Sugestão do CFO: {alert.action}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>Nenhum alerta crítico ou vazamento detectado no caixa. Operação saudável!</span>
              </div>
            )}
          </div>

          {/* 3 Executive Recommendations */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb size={15} className="text-gold-400" />
              <span>3 Ações Prioritárias Recomendadas pela IA</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {report.recommendations.map((rec, i) => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-2xl bg-dark-950 border border-dark-800 hover:border-gold-400/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className="w-5 h-5 rounded-full bg-gold-400/20 text-gold-400 font-bold text-[10px] flex items-center justify-center mb-2">
                      {i + 1}
                    </span>
                    <h5 className="text-xs font-extrabold text-white">
                      {rec.action}
                    </h5>
                  </div>
                  <div className="mt-3 pt-2 border-t border-dark-850">
                    <span className="text-[10px] text-slate-400 block font-medium">Impacto esperado:</span>
                    <span className="text-xs font-bold text-gold-400">{rec.expectedImpact}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Impact Simulator */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-dark-950 via-dark-900 to-dark-950 border border-gold-400/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-gold-400" />
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
                  Simulador de Economia: "E se eu cortar custos?"
                </h4>
              </div>
              <span className="text-xs font-black text-gold-400 bg-gold-400/10 px-2.5 py-0.5 rounded-full border border-gold-400/20">
                {simulationCutPercent}% de redução
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Ajuste a régua para simular uma redução de custos em <strong className="text-white">{topCategory.category}</strong> (onde mais se gasta):
            </p>

            <input
              type="range"
              min="5"
              max="30"
              step="5"
              value={simulationCutPercent}
              onChange={(e) => setSimulationCutPercent(Number(e.target.value))}
              className="w-full accent-gold-400 cursor-pointer h-2 bg-dark-800 rounded-lg"
            />

            <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-dark-850">
              <div className="text-center p-2 rounded-xl bg-dark-950">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Economia Direta</span>
                <span className="text-base sm:text-lg font-black text-emerald-400">
                  + {formatCurrency(simulatedSavings)}
                </span>
              </div>

              <div className="text-center p-2 rounded-xl bg-dark-950">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Novo Resultado Mensal</span>
                <span className="text-base sm:text-lg font-black text-gold-400">
                  {formatCurrency(simulatedNewNet)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-dark-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gold-400 text-dark-950 font-bold text-xs sm:text-sm hover:brightness-110 active:scale-95 transition-all shadow-gold-glow"
          >
            Entendido, Fechar Diagnóstico
          </button>
        </div>
      </div>
    </div>
  );
};
