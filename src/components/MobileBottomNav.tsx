import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  ScanLine, 
  Landmark, 
  Settings,
  Bot
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenScanner: () => void;
  onOpenNewTransaction: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenScanner,
  onOpenNewTransaction: _onOpenNewTransaction,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-dark-950/95 backdrop-blur-lg border-t border-dark-800 px-3 py-2 pb-safe">
      <div className="flex items-center justify-around relative">
        {/* Dashboard */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg transition-colors ${
            activeTab === 'dashboard' ? 'text-gold-400 font-bold' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard size={20} />
          <span className="text-[10px]">Início</span>
        </button>

        {/* Chat IA Flagship */}
        <button
          onClick={() => setActiveTab('ai_chat')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg transition-colors relative ${
            activeTab === 'ai_chat' ? 'text-gold-400 font-bold' : 'text-slate-400 hover:text-gold-400'
          }`}
        >
          <div className="relative">
            <Bot size={20} className={activeTab === 'ai_chat' ? 'text-gold-400' : ''} />
            <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
          </div>
          <span className="text-[10px] font-medium">Chat IA</span>
        </button>

        {/* Center Floating AI Scanner Button */}
        <div className="-mt-6 flex flex-col items-center">
          <button
            onClick={onOpenScanner}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-gold-500 via-amber-400 to-yellow-300 text-dark-950 flex items-center justify-center shadow-gold-glow-lg border-2 border-dark-950 active:scale-90 transition-transform"
            aria-label="Escanear Nota Fiscal"
          >
            <ScanLine size={24} className="stroke-[2.5]" />
          </button>
          <span className="text-[10px] font-bold text-gold-400 mt-1">Ler NF</span>
        </div>

        {/* Extrato */}
        <button
          onClick={() => setActiveTab('statement')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg transition-colors ${
            activeTab === 'statement' ? 'text-gold-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Receipt size={20} />
          <span className="text-[10px]">Extrato</span>
        </button>

        {/* Contas */}
        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg transition-colors ${
            activeTab === 'accounts' ? 'text-gold-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Landmark size={20} />
          <span className="text-[10px]">Contas</span>
        </button>
      </div>
    </div>
  );
};
