import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  highlight?: boolean;
  variant?: 'gold' | 'green' | 'red' | 'default';
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  highlight,
  variant = 'default',
  onClick,
}) => {
  const getBorderColor = () => {
    if (highlight || variant === 'gold') return 'border-gold-400/40 hover:border-gold-400 shadow-gold-glow';
    if (variant === 'green') return 'border-emerald-500/30 hover:border-emerald-500/60';
    if (variant === 'red') return 'border-rose-500/30 hover:border-rose-500/60';
    return 'border-dark-800 hover:border-dark-750';
  };

  const getIconColor = () => {
    if (variant === 'gold' || highlight) return 'text-gold-400 bg-gold-400/10 border-gold-400/20';
    if (variant === 'green') return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    if (variant === 'red') return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
    return 'text-slate-300 bg-dark-800 border-dark-750';
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl bg-dark-900/90 backdrop-blur-md p-5 border transition-all duration-200
        ${getBorderColor()}
        ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}
      `}
    >
      {/* Background ambient gradient glow */}
      {highlight && (
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-gold-400/10 rounded-full blur-2xl pointer-events-none" />
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {title}
        </p>
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${getIconColor()}`}>
          <Icon size={18} />
        </div>
      </div>

      <div className="mt-3">
        <h3 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
          variant === 'gold' || highlight ? 'text-gold-400' : 'text-white'
        }`}>
          {value}
        </h3>

        <div className="mt-2 flex items-center justify-between text-xs">
          {subtitle && (
            <span className="text-slate-400 font-medium">
              {subtitle}
            </span>
          )}

          {trend && (
            <div className={`flex items-center gap-0.5 font-semibold ${
              trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {trend.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              <span>{trend.value}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
