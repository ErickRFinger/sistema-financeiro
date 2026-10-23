import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Mic, 
  MicOff, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  Wallet,
  Zap,
  RotateCcw,
  Trash2,
  ScanLine,
  CreditCard,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  AssistantMessage, 
  processUserFinancialVoiceOrText 
} from '../lib/geminiAssistant';
import { FinancialAccount, FinancialTransaction } from '../types/financial';
import { formatCurrency } from '../lib/formatters';

interface AIAssistantChatProps {
  accounts: FinancialAccount[];
  transactions: FinancialTransaction[];
  onCreateTransaction: (data: Omit<FinancialTransaction, 'id' | 'created_at'>) => Promise<void>;
  onDeleteTransaction?: (tx: FinancialTransaction) => Promise<void>;
  onUpdateTransactionStatus?: (tx: FinancialTransaction, newStatus: 'paid' | 'pending') => Promise<void>;
  onResetAllData?: () => Promise<void>;
  onOpenScanner?: () => void;
  onOpenCFO: () => void;
  onOpenMercadoPago?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const AIAssistantChat: React.FC<AIAssistantChatProps> = ({
  accounts,
  transactions,
  onCreateTransaction,
  onDeleteTransaction,
  onUpdateTransactionStatus,
  onResetAllData,
  onOpenScanner,
  onOpenCFO,
  onOpenMercadoPago,
  onNavigateTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Olá! Sou sua inteligência financeira com controle total. Você pode mandar lançar, alterar, cancelar, excluir, zerar tudo ou voltar a qualquer momento.',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize Speech Recognition if supported by browser
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'pt-BR';
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSendMessage(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [accounts, transactions]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Reconhecimento de voz não suportado neste navegador. Digite seu comando.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const userText = (textToSend || input).trim();
    if (!userText || isProcessing) return;

    setInput('');
    const userMsg: AssistantMessage = {
      id: 'user_' + Date.now(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      const result = await processUserFinancialVoiceOrText(userText, accounts, transactions);
      let actionTaken: any = undefined;

      // ==========================================
      // 1. ZERAR TUDO
      // ==========================================
      if (result.intent === 'reset_all_data' && onResetAllData) {
        setUndoStack((prev) => [
          { type: 'reset_data', prevAccounts: [...accounts], prevTransactions: [...transactions] },
          ...prev
        ]);
        await onResetAllData();
        actionTaken = { type: 'data_reset' };
      }

      // ==========================================
      // 2. VOLTAR / DESFAZER
      // ==========================================
      else if (result.intent === 'undo_action') {
        if (undoStack.length > 0) {
          const lastAction = undoStack[0];
          setUndoStack((prev) => prev.slice(1));

          if (lastAction.type === 'created' && onDeleteTransaction) {
            const match = transactions.find(t => t.title === lastAction.tx.title && t.amount === lastAction.tx.amount);
            if (match) await onDeleteTransaction(match);
          } else if (lastAction.type === 'deleted') {
            await onCreateTransaction(lastAction.tx);
          } else if (lastAction.type === 'status_updated' && onUpdateTransactionStatus) {
            await onUpdateTransactionStatus(lastAction.tx, lastAction.prevStatus);
          }
          actionTaken = { type: 'undo_executed' };
        } else {
          result.replyText = 'Não encontrei nenhuma ação recente para desfazer.';
        }
      }

      // ==========================================
      // 3. EXCLUIR / CANCELAR LANÇAMENTO
      // ==========================================
      else if (result.intent === 'delete_transaction' && result.targetTransaction && onDeleteTransaction) {
        setUndoStack((prev) => [
          { type: 'deleted', tx: result.targetTransaction },
          ...prev
        ]);
        await onDeleteTransaction(result.targetTransaction);
        actionTaken = { type: 'transaction_deleted', transaction: result.targetTransaction };
      }

      // ==========================================
      // 4. ALTERAR LANÇAMENTO
      // ==========================================
      else if (result.intent === 'update_transaction' && result.targetTransaction) {
        const targetTx = result.targetTransaction;
        if (result.transactionUpdates?.new_status && onUpdateTransactionStatus) {
          setUndoStack((prev) => [
            { type: 'status_updated', tx: targetTx, prevStatus: targetTx.status },
            ...prev
          ]);
          await onUpdateTransactionStatus(targetTx, result.transactionUpdates.new_status);
          actionTaken = { type: 'transaction_updated', transaction: targetTx };
        }
      }

      // ==========================================
      // 5. ABRIR TELAS / NAVEGAÇÃO
      // ==========================================
      else if (result.intent === 'open_screen') {
        if (result.targetScreen === 'scanner' && onOpenScanner) onOpenScanner();
        else if (result.targetScreen === 'cfo') onOpenCFO();
        else if (result.targetScreen === 'mercadopago' && onOpenMercadoPago) onOpenMercadoPago();
        else if (result.targetScreen && onNavigateTab) onNavigateTab(result.targetScreen);
        actionTaken = { type: 'screen_opened' };
      }

      // ==========================================
      // 6. CRIAR LANÇAMENTO (RECEITA OU DESPESA)
      // ==========================================
      else if (result.transactionData && Number(result.transactionData.amount) > 0) {
        await onCreateTransaction({
          title: result.transactionData.title,
          amount: Number(result.transactionData.amount),
          type: result.transactionData.type,
          account_id: result.transactionData.account_id,
          category: result.transactionData.category,
          transaction_date: result.transactionData.date,
          status: result.transactionData.status,
          payment_method: result.transactionData.payment_method,
        });

        setUndoStack((prev) => [
          { type: 'created', tx: result.transactionData },
          ...prev
        ]);

        actionTaken = {
          type: 'transaction_created',
          transaction: result.transactionData,
        };

        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#facc15', '#22c55e', '#ffffff'],
        });
      }

      const botMsg: AssistantMessage = {
        id: 'bot_' + Date.now(),
        sender: 'assistant',
        text: result.replyText,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        actionTaken,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_err_' + Date.now(),
          sender: 'assistant',
          text: 'Tive uma dificuldade momentânea para processar. Poderia repetir o comando?',
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Floating Action Pill/Bubble (Bottom Right) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 md:bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-gold-400 via-amber-400 to-yellow-500 text-dark-950 font-black shadow-gold-glow hover:scale-105 active:scale-95 transition-all text-xs sm:text-sm group"
          title="Assistente com IA & Comandos de Voz"
        >
          <div className="w-6 h-6 rounded-full bg-dark-950 text-gold-400 flex items-center justify-center">
            <Bot size={15} />
          </div>
          <span>Assistente IA</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        </button>
      )}

      {/* Slide-over Drawer / Modal Chat */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-50 w-full sm:w-96 sm:max-w-md h-full sm:h-[580px] bg-dark-950/95 sm:bg-dark-900 border border-dark-800 sm:border-gold-400/30 sm:rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden backdrop-blur-xl animate-fade-in">
          {/* Header */}
          <div className="p-4 border-b border-dark-800 bg-dark-900/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gold-400/20 text-gold-400 border border-gold-400/40 flex items-center justify-center shadow-sm">
                <Bot size={18} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-extrabold text-white">Copiloto IA Total</h3>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                    Online
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Lança, altera, cancela, zera e desfaz
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Quick Command Suggestions Chips */}
          <div className="px-3 py-2 bg-dark-950 border-b border-dark-850 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
            <button
              onClick={() => handleSendMessage('Ganhei 1800,00 coloca no caixa')}
              className="px-2.5 py-1 rounded-full bg-dark-900 text-slate-300 hover:text-gold-400 border border-dark-800 whitespace-nowrap transition-colors"
            >
              + Ganhei 1800
            </button>
            <button
              onClick={() => handleSendMessage('Gastei 85 no almoço')}
              className="px-2.5 py-1 rounded-full bg-dark-900 text-slate-300 hover:text-rose-400 border border-dark-800 whitespace-nowrap transition-colors"
            >
              - Almoço 85
            </button>
            <button
              onClick={() => handleSendMessage('Exclui o último lançamento')}
              className="px-2.5 py-1 rounded-full bg-dark-900 text-slate-300 hover:text-rose-400 border border-dark-800 whitespace-nowrap transition-colors"
            >
              🗑️ Excluir último
            </button>
            <button
              onClick={() => handleSendMessage('Volta')}
              className="px-2.5 py-1 rounded-full bg-dark-900 text-slate-300 hover:text-sky-400 border border-dark-800 whitespace-nowrap transition-colors"
            >
              ↩️ Desfazer
            </button>
            <button
              onClick={() => handleSendMessage('Qual meu saldo?')}
              className="px-2.5 py-1 rounded-full bg-dark-900 text-slate-300 hover:text-gold-400 border border-dark-800 whitespace-nowrap transition-colors"
            >
              💰 Saldo
            </button>
            <button
              onClick={() => handleSendMessage('Zera tudo')}
              className="px-2.5 py-1 rounded-full bg-dark-900 text-slate-400 hover:text-rose-400 border border-dark-800 whitespace-nowrap transition-colors"
            >
              ⚠️ Zerar tudo
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-gradient-to-r from-gold-400 to-amber-500 text-dark-950 font-bold rounded-br-xs shadow-md'
                        : 'bg-dark-950 border border-dark-800 text-slate-200 rounded-bl-xs'
                    }`}
                  >
                    {msg.text}

                    {/* Action pill inside bot message */}
                    {msg.actionTaken && msg.actionTaken.type === 'transaction_created' && (
                      <div className="mt-2 pt-2 border-t border-dark-800/60 flex items-center gap-2 text-[11px] text-emerald-400 font-bold">
                        <CheckCircle2 size={13} />
                        <span>Transação lançada no fluxo de caixa!</span>
                      </div>
                    )}
                    {msg.actionTaken && msg.actionTaken.type === 'transaction_deleted' && (
                      <div className="mt-2 pt-2 border-t border-dark-800/60 flex items-center gap-2 text-[11px] text-rose-400 font-bold">
                        <Trash2 size={13} />
                        <span>Lançamento removido e saldo ajustado!</span>
                      </div>
                    )}
                    {msg.actionTaken && msg.actionTaken.type === 'data_reset' && (
                      <div className="mt-2 pt-2 border-t border-dark-800/60 flex items-center gap-2 text-[11px] text-rose-400 font-bold">
                        <AlertTriangle size={13} />
                        <span>Sistema zerado!</span>
                      </div>
                    )}
                    {msg.actionTaken && msg.actionTaken.type === 'undo_executed' && (
                      <div className="mt-2 pt-2 border-t border-dark-800/60 flex items-center gap-2 text-[11px] text-sky-400 font-bold">
                        <RotateCcw size={13} />
                        <span>Ação desfeita com sucesso!</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {isProcessing && (
              <div className="flex items-center gap-2 text-xs text-gold-400 animate-pulse">
                <Sparkles size={14} className="animate-spin" />
                <span>Processando comando...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box with Microphone */}
          <div className="p-3 border-t border-dark-800 bg-dark-900">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2.5 rounded-xl border transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                    : 'bg-dark-950 text-slate-400 hover:text-gold-400 border-dark-800'
                }`}
                title={isListening ? 'Ouvindo...' : 'Falar por voz'}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              <input
                type="text"
                placeholder={isListening ? 'Ouvindo... pode falar' : 'Fale ou digite (ex: "zera tudo", "volta", "lancei 150")...'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-800 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-400 transition-colors"
              />

              <button
                type="submit"
                disabled={!input.trim() || isProcessing}
                className="p-2.5 rounded-xl bg-gold-400 text-dark-950 font-bold hover:brightness-110 active:scale-95 transition-all disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
