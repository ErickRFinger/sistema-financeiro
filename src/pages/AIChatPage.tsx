import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Mic, 
  MicOff, 
  Paperclip, 
  Trash2, 
  RotateCcw, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Landmark, 
  Wallet, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Zap, 
  Image as ImageIcon,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Volume2,
  VolumeX,
  ArrowLeftRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FinancialAccount, FinancialTransaction } from '../types/financial';
import { formatCurrency } from '../lib/formatters';
import { processUserFinancialVoiceOrText, AssistantMessage } from '../lib/geminiAssistant';
import { analyzeBankScreenshot } from '../lib/bankPrintScanner';

interface AIChatPageProps {
  accounts: FinancialAccount[];
  transactions: FinancialTransaction[];
  currentUser?: any;
  isPrivate?: boolean;
  onCreateTransaction: (data: Omit<FinancialTransaction, 'id' | 'created_at'>) => Promise<void>;
  onDeleteTransaction?: (tx: FinancialTransaction) => Promise<void>;
  onUpdateTransaction?: (tx: FinancialTransaction, updates: Partial<FinancialTransaction>) => Promise<any>;
  onUpdateTransactionStatus?: (tx: FinancialTransaction, newStatus: 'paid' | 'pending') => Promise<void>;
  onResetBankBalances?: () => Promise<void>;
  onUpdateAccountBalance?: (accountId: string, newBalance: number) => Promise<void>;
  onResetTransactions?: () => Promise<void>;
  onResetInvestments?: () => Promise<void>;
  onResetAllData?: (skipConfirm?: boolean) => Promise<void>;
  onCreateInvestment?: (inv: { name: string; category: string; amount: number; bank?: string; account_id?: string }) => Promise<void>;
  onUpdateInvestment?: (id: string, currentAmount: number) => Promise<void>;
  onDeleteInvestment?: (id: string) => Promise<void>;
  onNavigateTab: (tab: string) => void;
  onOpenScanner?: () => void;
  onOpenCFO?: () => void;
  onOpenMercadoPago?: () => void;
}

const DEFAULT_WELCOME_MESSAGE: AssistantMessage = {
  id: 'welcome_msg',
  sender: 'assistant',
  text: 'Olá! Sou o seu Copiloto Financeiro Autônomo com Inteligência Artificial — o cérebro central do Aura Finance PRO.\n\nEu tenho **acesso total ao seu sistema** para executar qualquer ordem que você desejar: lançar despesas, registrar receitas, zerar ou definir saldos de bancos, atualizar sua carteira de investimentos e gerenciar o fluxo de caixa em tempo real.\n\nVocê pode **digitar**, **falar pelo microfone** ou **enviar prints de bancos/comprovantes**!',
  timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
};

const QUICK_PROMPTS = [
  { label: '💸 Transfere 500 do BTG pro Inter', prompt: 'transfere 500 do btg pro inter' },
  { label: '✅ Baixar contas pendentes', prompt: 'baixar uns valores' },
  { label: '🔍 Qual meu maior gasto?', prompt: 'qual meu maior gasto?' },
  { label: '💰 Lançar R$ 150 pra Gabi', prompt: 'lança 150 pra gabi' },
  { label: '🛒 Quanto gastei com alimentação?', prompt: 'quanto gastei com alimentação?' },
  { label: '📈 Adicionar R$ 5.000 no Selic', prompt: 'adicionar 5000 no tesouro selic' },
  { label: '📊 Saúde do meu fluxo de caixa', prompt: 'como tá meu caixa hoje?' },
  { label: '🏦 Zerar o saldo dos bancos', prompt: 'zerar o saldo dos bancos' },
];

export const AIChatPage: React.FC<AIChatPageProps> = ({
  accounts,
  transactions,
  currentUser,
  isPrivate = false,
  onCreateTransaction,
  onDeleteTransaction,
  onUpdateTransaction,
  onUpdateTransactionStatus,
  onResetBankBalances,
  onUpdateAccountBalance,
  onResetTransactions,
  onResetInvestments,
  onResetAllData,
  onCreateInvestment,
  onUpdateInvestment,
  onDeleteInvestment,
  onNavigateTab,
  onOpenScanner,
  onOpenCFO,
  onOpenMercadoPago,
}) => {
  const [messages, setMessages] = useState<AssistantMessage[]>(() => {
    const saved = localStorage.getItem('aura_ai_fullchat_history');
    return saved ? JSON.parse(saved) : [DEFAULT_WELCOME_MESSAGE];
  });
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<{ file: File; previewUrl: string } | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const speakMessage = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (speakingMsgId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const clean = text
      .replace(/[*_#`~•]/g, ' ')
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, '');
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.05;
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);
    setSpeakingMsgId(id);
    window.speechSynthesis.speak(utterance);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync chat history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('aura_ai_fullchat_history', JSON.stringify(messages.slice(-50)));
    } catch {
      // Storage quota guard
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Total balance & stats
  const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);

  // Voice Recognition setup
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

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

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

  // Image paste support (Ctrl+V)
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

  // Process bank print
  const handleProcessBankImage = async (file: File, caption?: string) => {
    setIsProcessing(true);
    setProcessingStatus('Analisando print bancário com OCR e Inteligência Artificial...');

    const userMsg: AssistantMessage = {
      id: 'user_' + Date.now(),
      sender: 'user',
      text: caption || 'Enviou um print bancário para leitura automática',
      imageUrl: selectedImage?.previewUrl,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setSelectedImage(null);
    setInput('');

    try {
      const analysis = await analyzeBankScreenshot(file, accounts, (msg) => setProcessingStatus(msg));

      if (analysis && analysis.amount > 0 && onCreateInvestment) {
        await onCreateInvestment({
          name: analysis.title,
          category: 'Renda Fixa & Reserva',
          amount: analysis.amount,
          bank: analysis.bankName,
        });

        const assistantMsg: AssistantMessage = {
          id: 'asst_' + Date.now(),
          sender: 'assistant',
          text: `🎉 **${analysis.bankName} detectado com sucesso!**\n\nIdentifiquei uma reserva de **${formatCurrency(analysis.amount)}**!\n\n${analysis.yieldInfo ? `📈 *${analysis.yieldInfo}*\n\n` : ''}✅ Inserido automaticamente no seu patrimônio consolidado e na carteira de investimentos.`,
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

        setMessages((prev) => [...prev, assistantMsg]);
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.7 } });
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: 'asst_' + Date.now(),
            sender: 'assistant',
            text: 'Não consegui identificar com clareza os valores do print bancário. Você pode digitar o comando diretamente (ex: "guardei 1500 no Nubank").',
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: 'asst_' + Date.now(),
          sender: 'assistant',
          text: 'Houve uma falha ao processar o print bancário. Tente digitar o valor diretamente.',
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Main command handler
  const handleSendMessage = async (textToSend?: string) => {
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
    setProcessingStatus('Executando ordem com autoridade autônoma...');

    try {
      const result = await processUserFinancialVoiceOrText(userText, accounts, transactions);
      let actionTaken: any = undefined;

      // 1. ZERAR TUDO
      if (result.intent === 'reset_all_data' && onResetAllData) {
        setUndoStack((prev) => [
          { type: 'reset_data', prevAccounts: [...accounts], prevTransactions: [...transactions] },
          ...prev
        ]);
        await onResetAllData(true);
        actionTaken = { type: 'data_reset' };
      }

      // 2. ZERAR SALDO DOS BANCOS
      else if (result.intent === 'reset_bank_balances' && onResetBankBalances) {
        setUndoStack((prev) => [
          { type: 'reset_bank_balances', prevAccounts: [...accounts] },
          ...prev
        ]);
        await onResetBankBalances();
        actionTaken = { type: 'bank_balances_reset' };
        confetti({ particleCount: 35, spread: 50, origin: { y: 0.8 } });
      }

      // 3. ZERAR OU DEFINIR SALDO DE CONTA ESPECÍFICA
      else if (result.intent === 'set_account_balance' && result.targetAccountId && onUpdateAccountBalance) {
        const prevAcc = accounts.find(a => a.id === result.targetAccountId);
        setUndoStack((prev) => [
          { type: 'set_account_balance', accountId: result.targetAccountId, prevBalance: prevAcc ? prevAcc.balance : 0 },
          ...prev
        ]);
        await onUpdateAccountBalance(result.targetAccountId, result.newBalance ?? 0);
        actionTaken = {
          type: 'account_balance_updated',
          accountName: result.targetAccountName,
          newBalance: result.newBalance ?? 0,
        };
        confetti({ particleCount: 30, spread: 45, origin: { y: 0.8 } });
      }

      // 4. ZERAR EXTRATO / LANÇAMENTOS
      else if (result.intent === 'reset_transactions' && onResetTransactions) {
        setUndoStack((prev) => [
          { type: 'reset_transactions', prevTransactions: [...transactions] },
          ...prev
        ]);
        await onResetTransactions();
        actionTaken = { type: 'transactions_reset' };
      }

      // 5. ZERAR INVESTIMENTOS
      else if (result.intent === 'reset_investments' && onResetInvestments) {
        await onResetInvestments();
        actionTaken = { type: 'investments_reset' };
      }

      // 6. VOLTAR / DESFAZER
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
          } else if (lastAction.type === 'reset_bank_balances' && onUpdateAccountBalance) {
            for (const acc of lastAction.prevAccounts) {
              await onUpdateAccountBalance(acc.id, acc.balance);
            }
          } else if (lastAction.type === 'set_account_balance' && onUpdateAccountBalance) {
            await onUpdateAccountBalance(lastAction.accountId, lastAction.prevBalance);
          }
          actionTaken = { type: 'undo_executed' };
        } else {
          result.replyText = 'Não encontrei nenhuma ação recente para desfazer.';
        }
      }

      // 7. CRIAR INVESTIMENTO / PORQUINHO
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
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      }

      // 8. ATUALIZAR INVESTIMENTO
      else if (result.intent === 'update_investment' && result.targetInvestmentId && onUpdateInvestment) {
        await onUpdateInvestment(result.targetInvestmentId, result.newInvestmentAmount || 0);
        actionTaken = {
          type: 'investment_updated',
          investment: { name: result.targetInvestmentName, amount: result.newInvestmentAmount },
        };
      }

      // 9. EXCLUIR / CANCELAR LANÇAMENTO
      else if (result.intent === 'delete_transaction' && result.targetTransaction && onDeleteTransaction) {
        setUndoStack((prev) => [
          { type: 'deleted', tx: result.targetTransaction },
          ...prev
        ]);
        await onDeleteTransaction(result.targetTransaction);
        actionTaken = { type: 'transaction_deleted', transaction: result.targetTransaction };
      }

      // 10. ALTERAR LANÇAMENTO (VALOR, CONTA, CATEGORIA OU STATUS)
      else if (result.intent === 'update_transaction' && result.targetTransaction) {
        const targetTx = result.targetTransaction;

        if (result.transactionUpdates && onUpdateTransaction) {
          const updates: Partial<FinancialTransaction> = {};
          if (result.transactionUpdates.new_status) updates.status = result.transactionUpdates.new_status;
          if (result.transactionUpdates.new_amount !== undefined) updates.amount = result.transactionUpdates.new_amount;
          if (result.transactionUpdates.new_category) updates.category = result.transactionUpdates.new_category;
          if (result.transactionUpdates.new_account_id) updates.account_id = result.transactionUpdates.new_account_id;

          setUndoStack((prev) => [
            { type: 'transaction_edited', prevTx: targetTx },
            ...prev
          ]);
          const updated = await onUpdateTransaction(targetTx, updates);
          actionTaken = { type: 'transaction_updated', transaction: updated || { ...targetTx, ...updates } };
          confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 } });
        } else if (result.transactionUpdates?.new_status && onUpdateTransactionStatus) {
          setUndoStack((prev) => [
            { type: 'status_updated', tx: targetTx, prevStatus: targetTx.status },
            ...prev
          ]);
          await onUpdateTransactionStatus(targetTx, result.transactionUpdates.new_status);
          actionTaken = { type: 'transaction_updated', transaction: targetTx };
        }
      }

      // 11. ABRIR TELAS / NAVEGAÇÃO
      else if (result.intent === 'open_screen') {
        if (result.targetScreen === 'scanner' && onOpenScanner) onOpenScanner();
        else if (result.targetScreen === 'cfo' && onOpenCFO) onOpenCFO();
        else if (result.targetScreen === 'mercadopago' && onOpenMercadoPago) onOpenMercadoPago();
        else if (result.targetScreen) onNavigateTab(result.targetScreen);
        actionTaken = { type: 'screen_opened' };
      }

      // 12. CRIAR MÚLTIPLAS TRANSAÇÕES (BATCH)
      else if (result.intent === 'create_multiple_transactions' && result.multipleTransactions && onCreateTransaction) {
        const createdList: any[] = [];
        for (const txData of result.multipleTransactions) {
          const newTx = {
            title: txData.title,
            amount: txData.amount,
            type: txData.type,
            category: txData.category,
            account_id: txData.account_id,
            payment_method: txData.payment_method,
            transaction_date: txData.date,
            status: txData.status,
          };
          await onCreateTransaction(newTx);
          createdList.push(newTx);
        }
        setUndoStack((prev) => [{ type: 'multiple_created', txs: createdList }, ...prev]);
        actionTaken = { type: 'multiple_transactions_created', count: createdList.length };
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.8 } });
      }

      // 13. BAIXA EM MASSA (BULK MARK PAID)
      else if (result.intent === 'bulk_mark_paid' && result.bulkTargetTxs && onUpdateTransactionStatus) {
        for (const tx of result.bulkTargetTxs) {
          await onUpdateTransactionStatus(tx, 'paid');
        }
        actionTaken = { type: 'bulk_paid', count: result.bulkTargetTxs.length };
        confetti({ particleCount: 50, spread: 65, origin: { y: 0.8 } });
      }

      // 13.1 TRANSFERÊNCIA ENTRE CONTAS
      else if (result.intent === 'transfer_between_accounts' && result.transferData && onCreateTransaction) {
        const { sourceAccountId, sourceAccountName, targetAccountId, targetAccountName, amount } = result.transferData;

        // Despesa na origem
        const expenseTx = {
          title: `Transferência para ${targetAccountName}`,
          amount,
          type: 'expense' as const,
          category: 'Outros',
          account_id: sourceAccountId,
          payment_method: 'PIX' as const,
          transaction_date: new Date().toISOString().split('T')[0],
          status: 'paid' as const,
        };
        await onCreateTransaction(expenseTx);

        // Receita no destino
        const incomeTx = {
          title: `Transferência de ${sourceAccountName}`,
          amount,
          type: 'income' as const,
          category: 'Outros',
          account_id: targetAccountId,
          payment_method: 'PIX' as const,
          transaction_date: new Date().toISOString().split('T')[0],
          status: 'paid' as const,
        };
        await onCreateTransaction(incomeTx);

        setUndoStack((prev) => [{ type: 'transfer', txs: [expenseTx, incomeTx] }, ...prev]);
        actionTaken = {
          type: 'transfer_executed',
          transferData: { sourceAccountName, targetAccountName, amount },
        };
        confetti({ particleCount: 55, spread: 65, origin: { y: 0.8 } });
      }

      // 14. CRIAR TRANSAÇÃO ÚNICA (RECEITA / DESPESA)
      else if (result.intent === 'create_transaction' && result.transactionData) {
        const txData = result.transactionData;
        const newTx = {
          title: txData.title,
          amount: txData.amount,
          type: txData.type,
          category: txData.category,
          account_id: txData.account_id,
          payment_method: txData.payment_method,
          transaction_date: txData.date,
          status: txData.status,
        };

        await onCreateTransaction(newTx);
        setUndoStack((prev) => [{ type: 'created', tx: newTx }, ...prev]);
        actionTaken = { type: 'transaction_created', transaction: newTx };
        confetti({ particleCount: 40, spread: 55, origin: { y: 0.8 } });
      }

      const asstMsg: AssistantMessage = {
        id: 'asst_' + Date.now(),
        sender: 'assistant',
        text: result.replyText,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        actionTaken,
        suggestedChips: result.suggestedChips,
      };

      setMessages((prev) => [...prev, asstMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'asst_' + Date.now(),
          sender: 'assistant',
          text: 'Ocorreu um erro ao processar o comando. Tente reformular a frase.',
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleClearHistory = () => {
    if (confirm('Deseja limpar todo o histórico da conversa com a IA?')) {
      setMessages([DEFAULT_WELCOME_MESSAGE]);
      localStorage.removeItem('aura_ai_fullchat_history');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-6xl mx-auto pb-4">
      {/* Top Header Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#0D1017] border border-white/10 shadow-2xl backdrop-blur-xl mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-yellow-500 via-amber-400 to-yellow-300 text-black flex items-center justify-center shadow-gold-glow">
              <Bot size={26} className="stroke-[2.5]" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-[#0D1017] animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Copiloto Financeiro Autônomo
              </h1>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
                ✨ Carro-Chefe PRO
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
              <span>Acesso Total:</span>
              <strong className="text-slate-300">Lançar, Zerar, Modificar & Gerenciar Carteira</strong>
            </p>
          </div>
        </div>

        {/* Live Metrics Pill & Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-2xl px-3.5 py-2">
            <div className="flex items-center gap-2 text-xs">
              <Wallet size={15} className="text-yellow-400" />
              <span className="text-slate-400 font-medium">Patrimônio:</span>
              <strong className="text-yellow-400 font-bold font-mono">
                {isPrivate ? '••••••' : formatCurrency(totalBalance)}
              </strong>
            </div>
            <div className="h-3 w-px bg-white/10" />
            <div className="text-xs text-slate-400">
              <span>Contas: </span>
              <strong className="text-white">{accounts.length}</strong>
            </div>
          </div>

          <button
            onClick={handleClearHistory}
            className="p-2.5 rounded-xl border border-white/10 bg-white/[0.02] text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-all text-xs font-semibold flex items-center gap-1.5 active:scale-95 cursor-pointer"
            title="Limpar histórico do chat"
          >
            <Trash2 size={16} />
            <span className="hidden lg:inline text-xs">Limpar Chat</span>
          </button>
        </div>
      </div>

      {/* Main Chat Stream Container */}
      <div 
        onPaste={handlePaste}
        className="flex-1 bg-[#0D1017]/80 border border-white/10 rounded-3xl p-4 sm:p-6 overflow-y-auto space-y-4 backdrop-blur-xl shadow-inner scrollbar-thin scrollbar-thumb-white/10"
      >
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-3xl ${
                isUser ? 'ml-auto' : 'mr-auto'
              }`}
            >
              <div
                className={`p-4 rounded-3xl text-sm leading-relaxed ${
                  isUser
                    ? 'bg-yellow-500/15 border border-yellow-500/30 text-white rounded-br-sm shadow-md'
                    : 'bg-white/[0.03] border border-white/10 text-slate-200 rounded-bl-sm shadow-lg'
                }`}
              >
                {/* Image Preview if user attached */}
                {msg.imageUrl && (
                  <div className="mb-3 rounded-2xl overflow-hidden border border-white/10 max-w-xs">
                    <img src={msg.imageUrl} alt="Anexo do usuário" className="w-full h-auto object-cover" />
                  </div>
                )}

                <div className="whitespace-pre-line">{msg.text}</div>

                {/* Structured Action Pills */}
                {msg.actionTaken && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                    {/* Bank Balances Reset */}
                    {msg.actionTaken.type === 'bank_balances_reset' && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300 font-bold">
                        <div className="flex items-center gap-2">
                          <Landmark size={16} className="text-amber-400" />
                          <span>Saldo de todos os bancos zerados para R$ 0,00!</span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                          Sincronizado
                        </span>
                      </div>
                    )}

                    {/* Account Balance Updated */}
                    {msg.actionTaken.type === 'account_balance_updated' && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300 font-bold">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-amber-400" />
                          <span>Saldo de {msg.actionTaken.accountName || 'Conta'} ajustado para {formatCurrency(msg.actionTaken.newBalance || 0)}!</span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                          Atualizado
                        </span>
                      </div>
                    )}

                    {/* Transactions Reset */}
                    {msg.actionTaken.type === 'transactions_reset' && (
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300 font-bold">
                        <Trash2 size={16} className="text-rose-400" />
                        <span>Todos os lançamentos do extrato foram apagados!</span>
                      </div>
                    )}

                    {/* Transaction Created or Updated - Rich Executive Card */}
                    {(msg.actionTaken.type === 'transaction_created' || msg.actionTaken.type === 'transaction_updated') && msg.actionTaken.transaction && (
                      <div className="p-3.5 rounded-2xl bg-dark-900 border border-gold-400/40 text-slate-200 space-y-2.5 shadow-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                              msg.actionTaken.transaction.type === 'income' 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}>
                              {msg.actionTaken.transaction.type === 'income' ? 'Receita' : 'Despesa'}
                            </span>
                            <span className="font-bold text-xs text-white truncate max-w-[160px] sm:max-w-[220px]">
                              {msg.actionTaken.transaction.title}
                            </span>
                          </div>
                          <span className={`font-black text-sm font-mono ${
                            msg.actionTaken.transaction.type === 'income' ? 'text-emerald-400' : 'text-gold-400'
                          }`}>
                            {msg.actionTaken.transaction.type === 'income' ? '+' : '-'} {formatCurrency(msg.actionTaken.transaction.amount)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-400 pt-1 border-t border-dark-800">
                          <div>
                            <span className="text-slate-500">Conta:</span>{' '}
                            <span className="text-slate-200 font-medium">
                              {accounts.find(a => a.id === msg.actionTaken?.transaction?.account_id)?.name || 'Conta Principal'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Data:</span>{' '}
                            <span className="text-slate-200 font-medium">
                              {msg.actionTaken.transaction.transaction_date || 'Hoje'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Categoria:</span>{' '}
                            <span className="text-slate-200 font-medium truncate block">
                              {msg.actionTaken.transaction.category || 'Geral'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Status:</span>{' '}
                            <span className={`font-semibold ${msg.actionTaken.transaction.status === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {msg.actionTaken.transaction.status === 'paid' ? 'Pago ✅' : 'Pendente ⏳'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 pt-1.5 border-t border-dark-800/80">
                          <button
                            type="button"
                            onClick={() => onNavigateTab('statement')}
                            className="flex-1 py-1 px-2 rounded-lg bg-gold-400/10 hover:bg-gold-400/20 text-gold-400 border border-gold-400/30 text-[10px] font-bold transition-all text-center"
                          >
                            📑 Ver no Extrato
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendMessage(`muda o valor de ${msg.actionTaken?.transaction?.title} para `)}
                            className="py-1 px-2.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-300 text-[10px] font-bold transition-all"
                            title="Editar este lançamento"
                          >
                            ✏️ Editar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Investment Created */}
                    {msg.actionTaken.type === 'investment_created' && msg.actionTaken.investment && (
                      <div className="p-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-between text-xs text-yellow-300 font-bold">
                        <div className="flex items-center gap-2">
                          <Zap size={16} className="text-yellow-400" />
                          <span>{msg.actionTaken.investment.name}: {formatCurrency(msg.actionTaken.investment.amount)}</span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300">
                          Carteira
                        </span>
                      </div>
                    )}

                    {/* Data Reset */}
                    {msg.actionTaken.type === 'data_reset' && (
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300 font-bold">
                        <AlertTriangle size={16} className="text-rose-400" />
                        <span>Sistema zerado completamente!</span>
                      </div>
                    )}

                    {/* Undo executed */}
                    {msg.actionTaken.type === 'undo_executed' && (
                      <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center gap-2 text-xs text-blue-300 font-bold">
                        <RotateCcw size={16} className="text-blue-400" />
                        <span>Ação desfeita com sucesso! Estado anterior restaurado.</span>
                      </div>
                    )}

                    {/* Transfer Executed */}
                    {msg.actionTaken.type === 'transfer_executed' && msg.actionTaken.transferData && (
                      <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between text-xs text-purple-300 font-bold">
                        <div className="flex items-center gap-2">
                          <ArrowLeftRight size={16} className="text-purple-400" />
                          <span>{msg.actionTaken.transferData.sourceAccountName} ➔ {msg.actionTaken.transferData.targetAccountName}: {formatCurrency(msg.actionTaken.transferData.amount)}</span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                          Transferido
                        </span>
                      </div>
                    )}

                    {/* Multiple Transactions Created */}
                    {msg.actionTaken.type === 'multiple_transactions_created' && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300 font-bold">
                        <div className="flex items-center gap-2">
                          <TrendingDown size={16} className="text-emerald-400" />
                          <span>{msg.actionTaken.count} lançamentos criados com sucesso!</span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                          Em Lote
                        </span>
                      </div>
                    )}

                    {/* Bulk Paid */}
                    {msg.actionTaken.type === 'bulk_paid' && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300 font-bold">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-400" />
                          <span>{msg.actionTaken.count} contas pendentes baixadas como PAGAS!</span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                          Baixa Concluída
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Interactive Action Chips */}
                {msg.suggestedChips && msg.suggestedChips.length > 0 && !isUser && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-white/10">
                    {msg.suggestedChips.map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(chip)}
                        className="px-2.5 py-1 rounded-xl bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-400/25 text-[11px] font-bold text-yellow-300 transition-all active:scale-95 cursor-pointer flex items-center gap-1 shadow-sm"
                      >
                        <Sparkles size={11} className="text-yellow-400" />
                        <span>{chip}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1 px-2">
                <span className="text-[10px] text-slate-500 font-mono">
                  {msg.timestamp}
                </span>
                {!isUser && (
                  <button
                    onClick={() => speakMessage(msg.id, msg.text)}
                    className={`p-1 rounded-lg transition-colors cursor-pointer ${
                      speakingMsgId === msg.id 
                        ? 'text-yellow-400 bg-yellow-400/20 animate-pulse' 
                        : 'text-slate-500 hover:text-yellow-400 hover:bg-white/5'
                    }`}
                    title={speakingMsgId === msg.id ? 'Parar leitura de voz' : 'Ouvir resposta com voz neural'}
                  >
                    {speakingMsgId === msg.id ? <VolumeX size={13} /> : <Volume2 size={13} />}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {isProcessing && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/10 max-w-md animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-yellow-400/20 text-yellow-400 flex items-center justify-center shrink-0">
              <Sparkles size={18} className="animate-spin" />
            </div>
            <span className="text-xs text-yellow-400 font-semibold">
              {processingStatus || 'Processando instrução...'}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="my-3 overflow-x-auto pb-1 scrollbar-none flex items-center gap-2 shrink-0">
        <span className="text-[11px] font-bold text-slate-500 shrink-0 uppercase tracking-wider flex items-center gap-1">
          <Sparkles size={12} className="text-yellow-400" /> Comandos Rápidos:
        </span>
        {QUICK_PROMPTS.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(item.prompt)}
            disabled={isProcessing}
            className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-yellow-400/40 hover:bg-yellow-500/10 hover:text-yellow-400 text-slate-300 text-xs font-semibold whitespace-nowrap transition-all active:scale-95 cursor-pointer shrink-0"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Bottom Composer Box */}
      <div className="p-3 sm:p-4 rounded-3xl bg-[#0D1017] border border-white/10 shadow-2xl backdrop-blur-xl shrink-0">
        {/* Attachment preview if user selected */}
        {selectedImage && (
          <div className="flex items-center justify-between p-2 mb-2 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2.5">
              <img src={selectedImage.previewUrl} alt="Prévia" className="w-10 h-10 object-cover rounded-xl border border-white/10" />
              <div className="text-xs text-slate-300">
                <span className="font-bold text-white block">Print bancário selecionado</span>
                <span className="text-[10px] text-slate-400">Pronto para OCR automático</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 sm:gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />

          {/* Attach Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer shrink-0"
            title="Anexar print ou comprovante bancário"
          >
            <Paperclip size={18} />
          </button>

          {/* Voice Input Button */}
          <button
            onClick={toggleListening}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer shrink-0 ${
              isListening
                ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-400 hover:text-white'
            }`}
            title={isListening ? 'Gravando voz... Clique para parar' : 'Falar comando por voz'}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          {/* Input Field */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Peça para a IA lançar, zerar bancos, alterar carteira ou resolver qualquer coisa..."
            className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none px-2"
          />

          {/* Send Button */}
          <button
            onClick={() => handleSendMessage()}
            disabled={(!input.trim() && !selectedImage) || isProcessing}
            className={`p-2.5 sm:px-4 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              (input.trim() || selectedImage) && !isProcessing
                ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-black shadow-gold-glow active:scale-95'
                : 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
            }`}
          >
            <span className="hidden sm:inline">Enviar</span>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
