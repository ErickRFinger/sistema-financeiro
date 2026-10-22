import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  DollarSign, 
  Euro, 
  Bitcoin, 
  Percent 
} from 'lucide-react';
import { formatCurrency } from '../lib/formatters';

interface CurrencyQuote {
  code: string;
  name: string;
  bid: number;
  pctChange: number;
}

export const CurrencyQuotesWidget: React.FC = () => {
  const [quotes, setQuotes] = useState<CurrencyQuote[]>([]);
  const [selicRate, setSelicRate] = useState<string>('13,75%');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      // 1. Fetch Currency rates
      const res = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,BTC-BRL');
      if (res.ok) {
        const data = await res.json();
        const list: CurrencyQuote[] = [
          {
            code: 'USD',
            name: 'Dólar Comercial',
            bid: parseFloat(data.USDBRL.bid),
            pctChange: parseFloat(data.USDBRL.pctChange),
          },
          {
            code: 'EUR',
            name: 'Euro',
            bid: parseFloat(data.EURBRL.bid),
            pctChange: parseFloat(data.EURBRL.pctChange),
          },
          {
            code: 'BTC',
            name: 'Bitcoin',
            bid: parseFloat(data.BTCBRL.bid),
            pctChange: parseFloat(data.BTCBRL.pctChange),
          },
        ];
        setQuotes(list);
        setLastUpdated(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.warn('Erro ao carregar cotações:', err);
    }

    // 2. Fetch Official Selic Rate from Banco Central do Brasil (SGS 432)
    try {
      const bcbRes = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json');
      if (bcbRes.ok) {
        const bcbData = await bcbRes.json();
        if (bcbData && bcbData[0]?.valor) {
          const num = parseFloat(bcbData[0].valor);
          setSelicRate(`${num.toFixed(2).replace('.', ',')}%`);
        }
      }
    } catch {
      // Fallback default
      setSelicRate('13,75%');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
    const interval = setInterval(fetchQuotes, 60000); // 1 minute auto refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-5 rounded-3xl bg-dark-900 border border-dark-800 shadow-dark-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Mercado Financeiro & Cotações em Tempo Real</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Atualizado {lastUpdated ? `às ${lastUpdated}` : 'agora'}
          </p>
        </div>

        <button
          onClick={fetchQuotes}
          disabled={loading}
          className="p-1.5 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-400 hover:text-gold-400 transition-colors"
          title="Atualizar cotações"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-gold-400' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quotes.map((q) => {
          const isUp = q.pctChange >= 0;
          return (
            <div 
              key={q.code}
              className="p-3.5 rounded-2xl bg-dark-950 border border-dark-850 hover:border-gold-400/30 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400">{q.name}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
                  isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {isUp ? '+' : ''}{q.pctChange.toFixed(2)}%
                </span>
              </div>

              <div className="text-base sm:text-lg font-black text-white mt-1">
                {formatCurrency(q.bid)}
              </div>
            </div>
          );
        })}

        {/* CDI & Selic Card (Banco Central) */}
        <div className="p-3.5 rounded-2xl bg-dark-950 border border-dark-850 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">Taxa Selic / CDI</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gold-400/10 text-gold-400">
              Banco Central
            </span>
          </div>

          <div className="text-base sm:text-lg font-black text-gold-400 mt-1">
            {selicRate} <span className="text-xs font-normal text-slate-400">a.a.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
