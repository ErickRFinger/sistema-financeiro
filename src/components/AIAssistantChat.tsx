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
  AlertTriangle,
  Image as ImageIcon,
  Coins,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  AssistantMessage, 
  processUserFinancialVoiceOrText 
} from '../lib/geminiAssistant';
import { analyzeBankScreenshot } from '../lib/bankPrintScanner';
import { FinancialAccount, FinancialTransaction } from '../types/financial';
import { formatCurrency } from '../lib/formatters';

interface AIAssistantChatProps {
  accounts: FinancialAccount[];
  transactions: FinancialTransaction[];
  onCreateTransaction: (data: Omit<FinancialTransaction, 'id' | 'created_at'>) => Promise<void>;
  onDeleteTransaction?: (tx: FinancialTransaction) => Promise<void>;
  onUpdateTransactionStatus?: (tx: FinancialTransaction, newStatus: 'paid' | 'pending') => Promise<void>;
  onResetAllData?: () => Promise<void>;
  onCreateInvestment?: (inv: { name: string; category: string; amount: number; bank?: string; account_id?: string }) => Promise<void>;
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
  onCreateInvestment,
  onOpenScanner,
  onOpenCFO,
  onOpenMercadoPago,
  onNavigateTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<{ file: File; previewUrl: string } | null>(null);

  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Olá! Sou seu Copiloto Financeiro com IA. Você pode digitar, falar ou enviar prints de bancos (Porquinho Nubank, Caixinhas, PIX e comprovantes) que eu lanço tudo no sistema para você!',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

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

  // Clipboard Paste handler (for Ctrl+V screenshots!)
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          setSelectedImage({
            file,
            previewUrl: URL.createObjectURL(file),
          });
          e.preventDefault();
          break;
        }
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage({
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (textToSend?: string) => {
    // If an image is attached, process bank print
    if (selectedImage) {
      await handleProcessBankImage(selectedImage.file, textToSend);
      return;
    }

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
      // 3. PORQUINHO / CAIXINHA / RESERVA TEXTUAL
      // ==========================================
      else if (result.intent === 'create_investment' && result.investmentData && onCreateInvestment) {
        await onCreateInvestment({
          name: result.investmentData.name,
          category: result.investmentData.category,
          amount: result.investmentData.amount,
          bank: result.investmentData.bank,
        });

        actionTaken = {
          type: 'investment_created',
          investment: result.investmentData,
        };

        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      }

      // ==========================================
      // 4. EXCLUIR / CANCELAR LANÇAMENTO
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
      // 5. ALTERAR LANÇAMENTO
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
      // 6. ABRIR TELAS / NAVEGAÇÃO
      // ==========================================
      else if (result.intent === 'open_screen') {
        if (result.targetScreen === 'scanner' && onOpenScanner) onOpenScanner();
        else if (result.targetScreen === 'cfo') onOpenCFO();
        else if (result.targetScreen === 'mercadopago' && onOpenMercadoPago) onOpenMercadoPago();
        else if (result.targetScreen && onNavigateTab) onNavigateTab(result.targetScreen);
        actionTaken = { type: 'screen_opened' };
      }

      // ==========================================
      // 7. CRIAR LANÇAMENTO (RECEITA OU DESPESA)
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
        });
      }

      const botMsg: AssistantMessage = {
        id: 'asst_' + Date.now(),
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
          id: 'asst_' + Date.now(),
          sender: 'assistant',
          text: 'Não consegui processar seu comando. Tente falar de outra forma ou clique nos botões rápidos.',
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Process Bank Screenshots (Prints de Porquinho, Caixinha, PIX, etc.)
  const handleProcessBankImage = async (file: File, userTextPrompt?: string) => {
    setIsProcessing(true);
    setProcessingStatus('Lendo print do banco com inteligência óptica...');

    const previewUrl = selectedImage ? selectedImage.previewUrl : URL.createObjectURL(file);
    const userText = (userTextPrompt || input).trim() || '📷 [Print do Banco / Porquinho enviado]';

    const userMsg: AssistantMessage = {
      id: 'user_' + Date.now(),
      sender: 'user',
      text: userText,
      imageUrl: previewUrl,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSelectedImage(null);

    try {
      const analysis = await analyzeBankScreenshot(file, accounts, (status) => {
        setProcessingStatus(status);
      });

      if (analysis.detected && analysis.amount > 0) {
        if (analysis.type === 'pix_in' || analysis.type === 'pix_out') {
          const isIncome = analysis.type === 'pix_in';
          await onCreateTransaction({
            title: analysis.title,
            amount: analysis.amount,
            type: isIncome ? 'income' : 'expense',
            account_id: accounts[0]?.id || 'acc_btg',
            category: analysis.category,
            transaction_date: new Date().toISOString().split('T')[0],
            status: 'paid',
            payment_method: 'PIX',
            notes: `Lançado via leitura de print bancário (${analysis.bankName}).`,
          });

          const botReply: AssistantMessage = {
            id: 'asst_' + Date.now(),
            sender: 'assistant',
            text: `⚡ Identifiquei um comprovante de **PIX ${isIncome ? 'Recebido' : 'Enviado'}** do **${analysis.bankName}** no valor de **${formatCurrency(analysis.amount)}**!\n\n✅ Lançamento registrado automaticamente com status Pago no seu extrato.`,
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            actionTaken: {
              type: 'bank_print_processed',
              bankPrintData: {
                title: analysis.title,
                amount: analysis.amount,
                bankName: analysis.bankName,
                type: analysis.type,
                yieldInfo: analysis.yieldInfo,
              },
            },
          };
          setMessages((prev) => [...prev, botReply]);
        } else {
          // Porquinho / Caixinha / Reserva / Investimento
          if (onCreateInvestment) {
            await onCreateInvestment({
              name: analysis.title,
              category: analysis.category,
              amount: analysis.amount,
              bank: analysis.bankName,
            });
          }

          const botReply: AssistantMessage = {
            id: 'asst_' + Date.now(),
            sender: 'assistant',
            text: `🐷 Reconheci com sucesso o seu **${analysis.title}** no valor de **${formatCurrency(analysis.amount)}**!\n\n${analysis.yieldInfo ? `📈 *${analysis.yieldInfo}*\n\n` : ''}✅ Inserido automaticamente no seu patrimônio consolidado e na carteira de investimentos.`,
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            actionTaken: {
              type: 'bank_print_processed',
              bankPrintData: {
                title: analysis.title,
                amount: analysis.amount,
                bankName: analysis.bankName,
                type: analysis.type,
                yieldInfo: analysis.yieldInfo,
              },
            },
          };
          setMessages((prev) => [...prev, botReply]);
        }

        confetti({
          particleCount: 70,
          spread: 75,
          origin: { y: 0.7 },
        });
      } else {
        const fallbackReply: AssistantMessage = {
          id: 'asst_' + Date.now(),
          sender: 'assistant',
          text: `🔍 Analisei o print enviado, mas não consegui identificar com nitidez o valor do porquinho ou saldo.\n\n💡 Você pode enviar um print com corte mais aproximado no valor ou simplesmente digitar: **"Tenho um porco de 45000"** que eu lanço na hora para você!`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, fallbackReply]);
      }
    } catch (err) {
      console.error('Erro na análise de print:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'asst_' + Date.now(),
          sender: 'assistant',
          text: 'Ocorreu uma falha ao ler a imagem do print. Você também pode digitar "Tenho um porco de 45000" para registrar diretamente!',
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 md:bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-gold-400 via-amber-500 to-yellow-500 text-dark-950 font-extrabold shadow-gold-glow-lg hover:scale-105 active:scale-95 transition-all group"
          aria-label="Abrir Copiloto IA Financeiro"
        >
          <div className="w-6 h-6 rounded-full bg-dark-950 text-gold-400 flex items-center justify-center">
            <Bot size={15} />
          </div>
          <span className="text-xs tracking-wide hidden sm:inline">IA Financeira</span>
          <span className="w-2 h-2 rounded-full bg-emerald-950 animate-ping" />
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div 
          onPaste={handlePaste}
          className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 w-[94vw] sm:w-[420px] h-[550px] max-h-[85vh] bg-dark-950 border border-gold-400/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95"
        >
          {/* Header */}
          <div className="p-4 border-b border-dark-800 bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gold-400 text-dark-950 flex items-center justify-center shadow-gold-glow">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5">
                  <span>Aura AI • Copiloto Multimodal</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Visão Ativa</span>
                </h3>
                <p className="text-[10px] text-slate-400">
                  Aceita prints de porquinhos, comprovantes e voz
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-dark-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-3.5 py-2 border-b border-dark-850 bg-dark-950 flex items-center gap-1.5 overflow-x-auto text-[11px] scrollbar-none">
            <button
              type="button"
              onClick={() => handleSendMessage('Tenho um porco de 45000')}
              className="px-2.5 py-1 rounded-full bg-dark-900 text-slate-300 hover:text-gold-400 border border-dark-800 whitespace-nowrap transition-colors"
            >
              🐷 Porquinho R$ 45k
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 rounded-full bg-gold-400/15 text-gold-300 hover:text-gold-200 border border-gold-400/30 whitespace-nowrap transition-colors"
            >
              📷 Subir Print
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('Qual meu saldo?')}
              className="px-2.5 py-1 rounded-full bg-dark-900 text-slate-300 hover:text-gold-400 border border-dark-800 whitespace-nowrap transition-colors"
            >
              💰 Saldo
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('Volta')}
              className="px-2.5 py-1 rounded-full bg-dark-900 text-slate-300 hover:text-sky-400 border border-dark-800 whitespace-nowrap transition-colors"
            >
              ↩️ Desfazer
            </button>
            <button
              type="button"
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
                    {/* User Image Thumbnail Preview in Bubble */}
                    {msg.imageUrl && (
                      <div className="mb-2 rounded-xl overflow-hidden border border-black/20 max-w-[220px]">
                        <img 
                          src={msg.imageUrl} 
                          alt="Print bancário" 
                          className="w-full h-auto object-cover max-h-40 rounded-lg" 
                        />
                      </div>
                    )}

                    <div className="whitespace-pre-line">{msg.text}</div>

                    {/* Action pill: Bank Print Processed (Porquinho / Caixinha / PIX) */}
                    {msg.actionTaken && msg.actionTaken.type === 'bank_print_processed' && msg.actionTaken.bankPrintData && (
                      <div className="mt-3 p-3 rounded-xl bg-dark-900 border border-gold-400/40 text-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-white">{msg.actionTaken.bankPrintData.title}</span>
                          <span className="font-black text-sm text-gold-400">
                            {formatCurrency(msg.actionTaken.bankPrintData.amount)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                          <CheckCircle2 size={13} />
                          <span>Lançado no Sistema com Sucesso!</span>
                        </div>
                        {onNavigateTab && (
                          <button
                            type="button"
                            onClick={() => onNavigateTab('investments')}
                            className="w-full py-1.5 px-3 rounded-lg bg-gold-400/10 hover:bg-gold-400/20 text-gold-400 border border-gold-400/30 text-[11px] font-bold transition-colors text-center block mt-1"
                          >
                            Ver em Investimentos & Patrimônio →
                          </button>
                        )}
                      </div>
                    )}

                    {/* Action pill: Investment Created */}
                    {msg.actionTaken && msg.actionTaken.type === 'investment_created' && msg.actionTaken.investment && (
                      <div className="mt-3 p-3 rounded-xl bg-dark-900 border border-gold-400/40 text-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-white">{msg.actionTaken.investment.name}</span>
                          <span className="font-black text-sm text-gold-400">
                            {formatCurrency(msg.actionTaken.investment.amount)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                          <CheckCircle2 size={13} />
                          <span>Ativo patrimonial adicionado!</span>
                        </div>
                      </div>
                    )}

                    {/* Action pill: Transaction Created */}
                    {msg.actionTaken && msg.actionTaken.type === 'transaction_created' && (
                      <div className="mt-2 pt-2 border-t border-dark-800/60 flex items-center gap-2 text-[11px] text-emerald-400 font-bold">
                        <CheckCircle2 size={13} />
                        <span>Transação lançada no fluxo de caixa!</span>
                      </div>
                    )}

                    {/* Action pill: Transaction Deleted */}
                    {msg.actionTaken && msg.actionTaken.type === 'transaction_deleted' && (
                      <div className="mt-2 pt-2 border-t border-dark-800/60 flex items-center gap-2 text-[11px] text-rose-400 font-bold">
                        <Trash2 size={13} />
                        <span>Lançamento removido e saldo ajustado!</span>
                      </div>
                    )}

                    {/* Action pill: Data Reset */}
                    {msg.actionTaken && msg.actionTaken.type === 'data_reset' && (
                      <div className="mt-2 pt-2 border-t border-dark-800/60 flex items-center gap-2 text-[11px] text-rose-400 font-bold">
                        <AlertTriangle size={13} />
                        <span>Sistema zerado!</span>
                      </div>
                    )}

                    {/* Action pill: Undo Executed */}
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
              <div className="flex items-center gap-2 text-xs text-gold-400 animate-pulse bg-dark-900/60 p-2.5 rounded-xl border border-gold-400/20 max-w-[80%]">
                <Loader2 size={15} className="animate-spin text-gold-400" />
                <span>{processingStatus || 'Processando inteligência financeira...'}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Attached Image Preview above Input */}
          {selectedImage && (
            <div className="px-3 py-2 bg-dark-900 border-t border-dark-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img 
                  src={selectedImage.previewUrl} 
                  alt="Preview" 
                  className="w-10 h-10 object-cover rounded-lg border border-gold-400/40" 
                />
                <div>
                  <p className="text-xs font-bold text-slate-200 truncate max-w-[200px]">
                    {selectedImage.file.name || 'Print do Banco'}
                  </p>
                  <p className="text-[10px] text-gold-400">
                    Pronto para enviar e reconhecer valores
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="p-1 text-slate-400 hover:text-rose-400 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Input Box with Microphone & Camera / Image Upload */}
          <div className="p-3 border-t border-dark-800 bg-dark-900">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              {/* Hidden File Input for Image Upload */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Upload Image Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl bg-dark-950 text-slate-400 hover:text-gold-400 border border-dark-800 transition-colors"
                title="Enviar print bancário (Porquinho, Caixinha, PIX)"
              >
                <ImageIcon size={18} />
              </button>

              {/* Voice Mic Button */}
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
                placeholder={isListening ? 'Ouvindo... pode falar' : 'Cole um print (Ctrl+V) ou digite (ex: "tenho 45k no porco")...'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl bg-dark-950 border border-dark-800 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-400 transition-colors"
              />

              <button
                type="submit"
                disabled={(!input.trim() && !selectedImage) || isProcessing}
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
