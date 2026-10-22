import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Sparkles, 
  Database, 
  Key, 
  ShieldCheck, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  Server,
  Layers,
  FileCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { FinancialAccount, FinancialTransaction } from '../types/financial';

interface SettingsPageProps {
  systemName: string;
  setSystemName: (name: string) => void;
  onSeedDemoData: () => Promise<void>;
  onClearData: () => Promise<void>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  systemName,
  setSystemName,
  onSeedDemoData,
  onClearData,
}) => {
  const [localName, setLocalName] = useState(systemName);
  const [geminiKey, setGeminiKey] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pingStatus, setPingStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('aura_gemini_api_key') || '';
    setGeminiKey(savedKey);

    // Test ping to Supabase
    checkSupabasePing();
  }, []);

  const checkSupabasePing = async () => {
    setPingStatus('checking');
    const start = performance.now();
    try {
      const { data, error } = await supabase.from('financial_accounts').select('id').limit(1);
      const end = performance.now();
      if (!error) {
        setPingStatus('online');
        setPingMs(Math.round(end - start));
      } else {
        setPingStatus('offline');
      }
    } catch {
      setPingStatus('offline');
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSystemName(localName);
    localStorage.setItem('aura_system_name', localName);
    if (geminiKey.trim()) {
      localStorage.setItem('aura_gemini_api_key', geminiKey.trim());
    } else {
      localStorage.removeItem('aura_gemini_api_key');
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSeed = async () => {
    if (window.confirm('Deseja carregar dados de demonstração (gastos com NF, fornecedores, gasolina, mercado, clientes)?')) {
      setIsSeeding(true);
      await onSeedDemoData();
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-4xl">
      {/* Header */}
      <div className="p-5 sm:p-6 rounded-3xl bg-dark-900 border border-dark-800 shadow-dark-card">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Settings size={28} className="text-gold-400" />
          <span>Configurações & SaaS White-label</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Personalize a identidade da plataforma, credenciais de IA e verifique a integridade do banco Supabase
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={18} />
          <span>Configurações salvas com sucesso!</span>
        </div>
      )}

      {/* Supabase Infrastructure Diagnostic */}
      <div className="p-5 sm:p-6 rounded-3xl bg-dark-900 border border-dark-800 shadow-dark-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database size={20} className="text-gold-400" />
            <h3 className="text-base font-extrabold text-white">Conexão Supabase Cloud</h3>
          </div>

          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              pingStatus === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
            }`} />
            <span className="text-xs font-bold text-slate-200">
              {pingStatus === 'online' ? `Online (${pingMs}ms)` : 'Verificando...'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-dark-950 border border-dark-850">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Endpoint</span>
            <span className="text-xs font-mono text-gold-400 truncate block mt-0.5">
              https://hnfhrjgzeivzrcpumkyk.supabase.co
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-dark-950 border border-dark-850">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Storage Bucket</span>
            <span className="text-xs font-mono text-emerald-400 block mt-0.5">
              notas_fiscais (Público • Ativo)
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-dark-950 border border-dark-850 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Server size={16} className="text-gold-400" />
            <span>Tabelas Sincronizadas: `financial_transactions`, `financial_accounts`, `compras`</span>
          </div>
          <button
            onClick={checkSupabasePing}
            className="text-xs text-gold-400 hover:underline font-bold"
          >
            Testar Ping
          </button>
        </div>
      </div>

      {/* Form Settings */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Brand / White label */}
        <div className="p-5 sm:p-6 rounded-3xl bg-dark-900 border border-dark-800 shadow-dark-card space-y-4">
          <div className="flex items-center gap-2">
            <Layers size={20} className="text-gold-400" />
            <h3 className="text-base font-extrabold text-white">Identidade Visual (White-Label para Revenda)</h3>
          </div>
          <p className="text-xs text-slate-400">
            Defina o nome do produto comercial para venda aos seus clientes ou sua própria empresa.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Nome do Sistema / Empresa
            </label>
            <input
              type="text"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              placeholder="Ex: Aura Finance, Gestão Pro, Minha Empresa..."
              className="w-full px-4 py-2.5 bg-dark-950 border border-dark-800 rounded-2xl text-sm text-slate-100 focus:outline-none focus:border-gold-400"
            />
          </div>
        </div>

        {/* AI OCR Scanner Settings */}
        <div className="p-5 sm:p-6 rounded-3xl bg-dark-900 border border-dark-800 shadow-dark-card space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-gold-400" />
            <h3 className="text-base font-extrabold text-white">Configuração da IA para Notas Fiscais</h3>
          </div>
          <p className="text-xs text-slate-400">
            O sistema já inclui motor OCR local gratuito (Tesseract.js). Opcionalmente, adicione uma chave da API do Gemini para ativação do modo Turbo Vision.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Google Gemini API Key (Opcional)</span>
              <span className="text-[10px] text-slate-500 lowercase">modo offline ativo por padrão</span>
            </label>
            <div className="relative">
              <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full pl-10 pr-4 py-2.5 bg-dark-950 border border-dark-800 rounded-2xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-700 focus:outline-none focus:border-gold-400 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-gold-400 to-amber-500 text-dark-950 font-extrabold text-sm shadow-gold-glow hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Save size={18} />
          <span>Salvar Alterações</span>
        </button>
      </form>

      {/* Demo Data Seeder for Sales Demo */}
      <div className="p-5 sm:p-6 rounded-3xl bg-dark-900 border border-dark-800 shadow-dark-card space-y-3">
        <div className="flex items-center gap-2">
          <FileCheck size={20} className="text-gold-400" />
          <h3 className="text-base font-extrabold text-white">Demonstração Comercial para Venda</h3>
        </div>
        <p className="text-xs text-slate-400">
          Carregue despesas e receitas simuladas realistas (Fornecedores, Posto de Gasolina, Supermercado, Receitas de Vendas) para demonstrar o sistema pronto para clientes.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleSeed}
            disabled={isSeeding}
            className="px-4 py-2.5 rounded-2xl bg-dark-950 border border-gold-400/40 text-gold-400 hover:bg-gold-400/10 font-bold text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <Sparkles size={16} />
            <span>{isSeeding ? 'Carregando Demonstração...' : 'Carregar Dados de Demonstração'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
