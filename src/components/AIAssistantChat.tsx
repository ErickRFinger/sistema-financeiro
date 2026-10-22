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
  CornerDownLeft
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
  onOpenCFO: () => void;
}

export const AIAssistantChat: React.FC<AIAssistantChatProps> = ({
  accounts,
  transactions,
  onCreateTransaction,
  onOpenCFO,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Olá! Sou sua inteligência financeira com Gemini. Você pode falar ou digitar o que quiser, como por exemplo: "Ganhei 1800,00 coloca no caixa" ou "Gastei 85 no almoço".',
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

      // Execute transaction if detected (check transactionData existence and amount > 0!)
      if (result.transactionData && Number(result.transactionData.amount) > 0) {
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

        actionTaken = {
          type: 'transaction_created',
          transaction: result.transactionData,
        };

        confetti({
          particleCount: 60,
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
          text: 'Tive uma dificuldade para processar esse comando. Poderia repetir?',
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
          className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-gold-400 via-amber-400 to-yellow-300 text-dark-950 font-black text-xs sm:text-sm shadow-gold-glow-lg hover:scale-105 active:scale-95 transition-all border-2 border-dark-950 group"
          title="Abrir Assistente com IA"
        >
          <div className="w-6 h-6 rounded-full bg-dark-950 text-gold-400 flex items-center justify-center">
            <Sparkles size={14} className="animate-spin-slow" />
          </div>
          <span>Assistente IA</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </button>
      )}

      {/* Chat Drawer / Modal */}
      {isOpen && (
        <div className="fixed bottom-20 md:bottom-6 right-2 sm:right-6 z-50 w-[95vw] sm:w-[420px] max-h-[580px] rounded-3xl bg-dark-900 border border-gold-400/40 shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl">
          {/* Header */}
          <div className="p-4 bg-dark-950 border-b border-dark-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-gold-400 to-amber-500 flex items-center justify-center text-dark-950 shadow-gold-glow">
                <Bot size={20} className="fill-dark-950" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <span>Aura Copilot IA</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gold-400/20 text-gold-300 font-mono font-bold">
                    Gemini
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">Lançamentos em linguagem natural e voz</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Prompt Chips */}
          <div className="px-3 py-2 bg-dark-950/70 border-b border-dark-850 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
            <button
              onClick={() => handleSendMessage('Ganhei 1800,00 coloca no caixa')}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-dark-900 text-gold-400 border border-dark-800 hover:border-gold-400/50"
            >
              💰 Ganhei 1.800 coloca no caixa
            </button>
            <button
              onClick={() => handleSendMessage('Gastei 45 no almoço')}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-dark-900 text-slate-300 border border-dark-800 hover:border-gold-400/50"
            >
              🍔 Gastei 45 no almoço
            </button>
            <button
              onClick={() => handleSendMessage('Qual é o meu saldo total?')}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-dark-900 text-slate-300 border border-dark-800 hover:border-gold-400/50"
            >
              📊 Qual meu saldo?
            </button>
          </div>

          {/* Messages Flow */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[260px] max-h-[360px]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-gold-500 to-amber-500 text-dark-950 font-bold rounded-br-none shadow-sm'
                      : 'bg-dark-950 border border-dark-800 text-slate-200 rounded-bl-none shadow-inner'
                  }`}
                >
                  <p className="leading-relaxed">{m.text}</p>

                  {/* Transaction Created Card Attachment */}
                  {m.actionTaken?.type === 'transaction_created' && m.actionTaken.transaction && (
                    <div className="mt-2.5 p-2 rounded-xl bg-dark-900 border border-dark-800 text-white flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {m.actionTaken.transaction.type === 'income' ? (
                          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <ArrowUpRight size={14} />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                            <ArrowDownRight size={14} />
                          </div>
                        )}
                        <div>
                          <p className="font-extrabold text-[11px] truncate max-w-[120px]">
                            {m.actionTaken.transaction.title}
                          </p>
                          <span className="text-[9px] text-slate-400">
                            {m.actionTaken.transaction.category}
                          </span>
                        </div>
                      </div>

                      <span className={`font-black text-xs ${
                        m.actionTaken.transaction.type === 'income' ? 'text-emerald-400' : 'text-gold-400'
                      }`}>
                        {formatCurrency(m.actionTaken.transaction.amount)}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-600 px-1 mt-0.5">{m.timestamp}</span>
              </div>
            ))}

            {isProcessing && (
              <div className="flex items-center gap-1.5 text-gold-400 text-xs p-2">
                <span className="w-2 h-2 rounded-full bg-gold-400 animate-ping" />
                <span>Gemini pensando e lançando...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input & Voice Controls */}
          <div className="p-3 bg-dark-950 border-t border-dark-800 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2.5 rounded-2xl border transition-all ${
                isListening
                  ? 'bg-rose-500 text-white border-rose-400 animate-pulse shadow-lg'
                  : 'bg-dark-900 border-dark-800 text-slate-400 hover:text-gold-400 hover:border-gold-400/40'
              }`}
              title={isListening ? 'Parar gravação' : 'Falar comando por voz'}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={isListening ? 'Ouvindo sua voz...' : 'Ex: "Ganhei 1800 coloca no caixa"'}
              className="flex-1 px-3.5 py-2.5 bg-dark-900 border border-dark-800 rounded-2xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-gold-400"
            />

            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={isProcessing || !input.trim()}
              className="p-2.5 rounded-2xl bg-gold-400 text-dark-950 font-bold hover:brightness-110 active:scale-95 transition-all disabled:opacity-30 shadow-gold-glow"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
