import { FinancialAccount, FinancialTransaction, TransactionType, PaymentMethod, DEFAULT_CATEGORIES } from '../types/financial';
import { formatCurrency } from './formatters';

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  imageUrl?: string;
  suggestedChips?: string[];
  actionTaken?: {
    type: 
      | 'transaction_created' 
      | 'multiple_transactions_created'
      | 'bulk_paid'
      | 'transfer_executed'
      | 'transaction_deleted' 
      | 'transaction_updated' 
      | 'bank_balances_reset'
      | 'account_balance_updated'
      | 'transactions_reset'
      | 'investments_reset'
      | 'data_reset' 
      | 'undo_executed' 
      | 'screen_opened' 
      | 'investment_created' 
      | 'bank_print_processed';
    transaction?: any;
    count?: number;
    transferData?: {
      sourceAccountName: string;
      targetAccountName: string;
      amount: number;
    };
    previousState?: any;
    investment?: any;
    accountName?: string;
    newBalance?: number;
    bankPrintData?: {
      title: string;
      amount: number;
      bankName: string;
      type: string;
      yieldInfo?: string;
    };
  };
}

export interface AssistantActionPayload {
  intent: 
    | 'create_transaction' 
    | 'create_multiple_transactions'
    | 'bulk_mark_paid'
    | 'transfer_between_accounts'
    | 'delete_transaction' 
    | 'update_transaction' 
    | 'reset_bank_balances'
    | 'set_account_balance'
    | 'reset_transactions'
    | 'reset_investments'
    | 'reset_all_data' 
    | 'undo_action' 
    | 'open_screen' 
    | 'query_balance' 
    | 'query_expenses' 
    | 'cfo_advice' 
    | 'create_investment'
    | 'update_investment'
    | 'delete_investment'
    | 'bank_print_processed'
    | 'general_chat';
  transactionData?: {
    type: TransactionType;
    amount: number;
    title: string;
    category: string;
    account_id: string;
    payment_method: PaymentMethod;
    date: string;
    status: 'paid' | 'pending';
  };
  multipleTransactions?: Array<{
    type: TransactionType;
    amount: number;
    title: string;
    category: string;
    account_id: string;
    payment_method: PaymentMethod;
    date: string;
    status: 'paid' | 'pending';
  }>;
  bulkTargetTxs?: FinancialTransaction[];
  transferData?: {
    sourceAccountId: string;
    sourceAccountName: string;
    targetAccountId: string;
    targetAccountName: string;
    amount: number;
  };
  suggestedChips?: string[];
  targetTransaction?: FinancialTransaction;
  transactionUpdates?: {
    new_amount?: number;
    new_status?: 'paid' | 'pending';
    new_category?: string;
    new_account_id?: string;
  };
  targetAccountId?: string;
  targetAccountName?: string;
  newBalance?: number;
  targetInvestmentId?: string;
  targetInvestmentName?: string;
  newInvestmentAmount?: number;
  targetScreen?: 'scanner' | 'cfo' | 'mercadopago' | 'statement' | 'accounts' | 'investments' | 'dashboard' | 'cards' | 'shopping_lists' | 'subscription_invoices';
  investmentData?: {
    name: string;
    category: string;
    amount: number;
    bank: string;
    account_id?: string;
  };
  bankPrintData?: {
    title: string;
    amount: number;
    bankName: string;
    type: string;
    yieldInfo?: string;
  };
  replyText: string;
}

/**
 * Process natural language user input using Google Gemini or local Portuguese NLP fallback
 */
export async function processUserFinancialVoiceOrText(
  input: string,
  accounts: FinancialAccount[],
  transactions: FinancialTransaction[],
  geminiApiKey?: string
): Promise<AssistantActionPayload> {
  const cleanInput = input.trim();
  const key = geminiApiKey || localStorage.getItem('aura_gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY;

  if (key) {
    try {
      const geminiResult = await processWithGeminiAPI(cleanInput, accounts, transactions, key);
      if (geminiResult) return geminiResult;
    } catch (err) {
      console.warn('Erro ao chamar Gemini API, usando motor NLP integrado:', err);
    }
  }

  // Fallback: Local High-Precision Autonomous NLP Engine (Works instantly with ZERO API keys!)
  return processWithLocalNLP(cleanInput, accounts, transactions);
}

/**
 * Gemini 1.5 Flash Engine with Autonomous Function Calling
 */
async function processWithGeminiAPI(
  userInput: string,
  accounts: FinancialAccount[],
  transactions: FinancialTransaction[],
  apiKey: string
): Promise<AssistantActionPayload | null> {
  const accountsContext = accounts.map(a => `ID: "${a.id}", Nome: "${a.name}", Saldo: ${a.balance}`).join(' | ');
  const recentTxsContext = transactions.slice(0, 5).map(t => `ID: "${t.id}", Título: "${t.title}", Valor: ${t.amount}, Tipo: ${t.type}, Status: ${t.status}`).join(' | ');
  const todayStr = new Date().toISOString().split('T')[0];

  const systemPrompt = `Você é o Copiloto Autônomo e Assistente Executivo Financeiro do sistema Aura Finance PRO.
Você tem poder de controle TOTAL sobre o sistema. Se o usuário mandar lançar, alterar, cancelar, excluir, zerar bancos, zerar saldo, zerar tudo ou voltar, você executa a ação.

CONTAS BANCÁRIAS DISPONÍVEIS:
[${accountsContext}]

ÚLTIMOS LANÇAMENTOS DO USUÁRIO:
[${recentTxsContext}]

DATA DE HOJE: ${todayStr}

Comandos que você deve reconhecer:
1. CRIAR: "ganhei 1800 coloca no caixa", "gastei 85 no almoço", "comprei parafusos 120", "pix de 50" -> intent: "create_transaction"
2. ZERAR TUDO: "zera tudo", "zerar tudo", "limpa tudo", "apaga tudo", "reiniciar sistema" -> intent: "reset_all_data"
3. ZERAR SALDO DOS BANCOS: "zerar saldo dos bancos", "zerar os bancos", "zerar saldo", "zerar contas", "limpar bancos" -> intent: "reset_bank_balances"
4. ZERAR OU DEFINIR CONTA ESPECÍFICA: "zerar banco inter", "zera o btg", "coloca 500 no inter", "mudar saldo do sicredi para 1500" -> intent: "set_account_balance", targetAccountId: "...", newBalance: ...
5. ZERAR EXTRATO / LANÇAMENTOS: "zerar extrato", "limpar lançamentos", "apagar todas as despesas", "zerar transações" -> intent: "reset_transactions"
6. ZERAR INVESTIMENTOS: "zerar investimentos", "limpar carteira", "apagar porquinhos" -> intent: "reset_investments"
7. VOLTAR / DESFAZER: "volta", "desfaz", "cancela a última ação", "desfazer" -> intent: "undo_action"
8. EXCLUIR / CANCELAR: "exclui o último lançamento", "cancela o almoço", "apaga a conta de luz" -> intent: "delete_transaction"
9. ALTERAR: "altera o almoço para 95 reais", "muda o valor para 200", "marca como pago", "marca como pendente" -> intent: "update_transaction"
10. ABRIR TELAS: "abre o leitor de nota fiscal", "abre o extrato", "cobrar com mercado pago", "abre o cfo" -> intent: "open_screen"
11. INVESTIMENTOS / RESERVAS: "guardei 5000 no nubank", "adicionar 2000 no tesouro selic", "aporte de 1500" -> intent: "create_investment"
12. SALDO: "qual meu saldo?", "quanto tenho?" -> intent: "query_balance"

Responda APENAS em JSON estrito (sem markdown):
{
  "intent": "create_transaction" | "delete_transaction" | "update_transaction" | "reset_bank_balances" | "set_account_balance" | "reset_transactions" | "reset_investments" | "create_investment" | "update_investment" | "delete_investment" | "reset_all_data" | "undo_action" | "open_screen" | "query_balance" | "general_chat",
  "replyText": "Resposta clara em português confirmando o que você executou.",
  "targetAccountId": "id_da_conta" (opcional para set_account_balance),
  "targetAccountName": "nome_da_conta" (opcional para set_account_balance),
  "newBalance": 0 (opcional para set_account_balance ou reset_bank_balances),
  "targetScreen": "scanner" | "cfo" | "mercadopago" | "statement" | "accounts" | "investments" | "dashboard" (opcional),
  "transactionData": {
    "type": "income" ou "expense",
    "amount": 1800.00,
    "title": "Descrição limpa",
    "category": "Alimentação & Refeição" | "Combustível & Transporte" | "Infraestrutura & Ferramentas" | "Equipamentos & Hardware" | "Aluguel & Contas Fixas" | "Vendas & Serviços Prestados" | "Outros",
    "account_id": "${accounts[0]?.id || 'acc_btg'}",
    "payment_method": "PIX" | "Cartão de Crédito" | "Cartão de Débito" | "Boleto" | "Dinheiro",
    "date": "${todayStr}",
    "status": "paid" | "pending"
  },
  "transactionUpdates": {
    "new_amount": 95.00 (opcional),
    "new_status": "paid" ou "pending" (opcional)
  }
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `${systemPrompt}\n\nComando do Usuário: "${userInput}"` }],
          },
        ],
      }),
    }
  );

  if (!response.ok) return null;

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  const parsed = JSON.parse(jsonMatch[0]);

  // If intent is delete or update, associate target transaction from recent list
  if ((parsed.intent === 'delete_transaction' || parsed.intent === 'update_transaction') && transactions.length > 0) {
    const lowerInput = userInput.toLowerCase();
    const matched = transactions.find(t => 
      lowerInput.includes(t.title.toLowerCase()) || 
      lowerInput.includes(t.category.toLowerCase())
    ) || transactions[0];
    parsed.targetTransaction = matched;
  }

  return parsed;
}

/**
 * Local High-Precision Autonomous NLP Engine
 * Executa todas as ações mesmo sem chave de API do Gemini!
 */
function processWithLocalNLP(
  input: string,
  accounts: FinancialAccount[],
  transactions: FinancialTransaction[]
): AssistantActionPayload {
  const lower = input.toLowerCase().trim();

  // ==========================================
  // 1. ZERAR TUDO (RESET ALL DATA)
  // ==========================================
  const isResetAll = 
    /zera(r)?\s+(tudo|meus dados|o sistema|geral)/i.test(lower) ||
    /limpa(r)?\s+(tudo|meus dados|o sistema|geral)/i.test(lower) ||
    /apaga(r)?\s+(tudo|meus dados|o sistema|geral)/i.test(lower) ||
    /reset(ar)?\s+(tudo|meus dados|o sistema|geral)/i.test(lower) ||
    /reinicia(r)?\s+(dados|sistema|tudo)/i.test(lower);

  if (isResetAll) {
    return {
      intent: 'reset_all_data',
      replyText: '⚠️ Entendido! Zerei todos os lançamentos e reiniciei todas as suas contas bancárias com saldo R$ 0,00.',
    };
  }

  // ==========================================
  // 2. ZERAR / DEFINIR SALDO DE CONTA OU BANCO ESPECÍFICO
  // Ex: "zerar inter", "zera o saldo do btg", "coloca 500 no sicredi", "saldo do inter para 0"
  // ==========================================
  for (const acc of accounts) {
    const accNameLower = acc.name.toLowerCase();
    const simpleName = accNameLower.replace(/^banco\s+/i, '');
    const words = simpleName.split(/\s+/).filter(w => w.length > 2);
    const isThisAccount = lower.includes(accNameLower) || lower.includes(simpleName) || words.some(w => lower.includes(w));

    if (isThisAccount) {
      const isZeroCommand = 
        /zera(r)?/i.test(lower) || 
        /limpa(r)?/i.test(lower) || 
        /(saldo|deixar|colocar|mudar|ajustar).*?(0|zero)/i.test(lower);

      if (isZeroCommand) {
        return {
          intent: 'set_account_balance',
          targetAccountId: acc.id,
          targetAccountName: acc.name,
          newBalance: 0,
          replyText: `🏦 Perfeito! O saldo da conta ${acc.name} foi zerado para R$ 0,00 com sucesso.`,
        };
      }

      // Check if user specified a specific new balance for this account
      const setBalanceMatch = lower.match(/(?:saldo|coloca|colocar|muda|mudar|ajusta|ajustar|definir|deixar).*?(?:para|em|de)?\s*(?:r\$\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d{2})?|\d+(?:[,\.]\d{2})?|\d+)/i);
      if (setBalanceMatch && !lower.includes('gastei') && !lower.includes('comprei') && !lower.includes('recebi') && !lower.includes('ganhei')) {
        const rawNum = setBalanceMatch[1];
        let val = 0;
        if (rawNum.includes(',') && rawNum.includes('.')) {
          val = parseFloat(rawNum.replace(/\./g, '').replace(',', '.'));
        } else if (rawNum.includes(',')) {
          val = parseFloat(rawNum.replace(',', '.'));
        } else {
          val = parseFloat(rawNum);
        }

        return {
          intent: 'set_account_balance',
          targetAccountId: acc.id,
          targetAccountName: acc.name,
          newBalance: val,
          replyText: `🏦 Saldo da conta ${acc.name} redefinido para ${formatCurrency(val)} com sucesso.`,
        };
      }
    }
  }

  // ==========================================
  // 3. ZERAR SALDO DE TODOS OS BANCOS / CONTAS
  // Ex: "zerar o saldo dos bancos", "zera saldo dos bancos", "zerar os bancos", "zerar saldo", "zerar contas"
  // ==========================================
  const isResetBankBalances = 
    /zera(r)?\s+(o\s+)?saldo(s)?/i.test(lower) ||
    /zera(r)?\s+(os\s+)?banco(s)?/i.test(lower) ||
    /zera(r)?\s+(as\s+)?conta(s)?/i.test(lower) ||
    /limpa(r)?\s+(os\s+)?banco(s)?/i.test(lower) ||
    /limpa(r)?\s+(as\s+)?conta(s)?/i.test(lower) ||
    /limpa(r)?\s+(o\s+)?saldo(s)?/i.test(lower) ||
    /reset(ar)?\s+(o\s+)?saldo(s)?/i.test(lower) ||
    /redefinir\s+(o\s+)?saldo(s)?/i.test(lower) ||
    lower === 'zerar saldo' ||
    lower === 'zera saldo' ||
    lower === 'zerar bancos' ||
    lower === 'zera bancos' ||
    lower === 'zerar contas' ||
    lower === 'zera contas' ||
    lower === 'zerar o saldo' ||
    lower === 'zera o saldo';

  if (isResetBankBalances) {
    return {
      intent: 'reset_bank_balances',
      newBalance: 0,
      replyText: '🏦 Entendido! Zerei o saldo de todas as suas contas bancárias para R$ 0,00.',
    };
  }

  // ==========================================
  // 4. ZERAR EXTRATO / LANÇAMENTOS / DESPESAS
  // Ex: "zerar extrato", "limpar lançamentos", "apagar todas as despesas", "zerar transações"
  // ==========================================
  const isResetTransactions = 
    /zera(r)?\s+(o\s+)?extrato/i.test(lower) ||
    /limpa(r)?\s+(o\s+)?extrato/i.test(lower) ||
    /zera(r)?\s+(os\s+)?lançamento(s)?/i.test(lower) ||
    /limpa(r)?\s+(os\s+)?lançamento(s)?/i.test(lower) ||
    /apaga(r)?\s+(os\s+)?lançamento(s)?/i.test(lower) ||
    /zera(r)?\s+(as\s+)?despesa(s)?/i.test(lower) ||
    /apaga(r)?\s+toda(s)?\s+(as\s+)?despesa(s)?/i.test(lower) ||
    /apaga(r)?\s+toda(s)?\s+(as\s+)?transaç(ão|ões)/i.test(lower) ||
    /limpa(r)?\s+(as\s+)?transaç(ão|ões)/i.test(lower) ||
    /zera(r)?\s+(as\s+)?transaç(ão|ões)/i.test(lower);

  if (isResetTransactions) {
    return {
      intent: 'reset_transactions',
      replyText: '🗑️ Entendido! Limpei todos os lançamentos do seu extrato financeiro.',
    };
  }

  // ==========================================
  // 5. ZERAR INVESTIMENTOS / CARTEIRA
  // Ex: "zerar investimentos", "limpar carteira", "apagar investimentos"
  // ==========================================
  const isResetInvestments = 
    /zera(r)?\s+(os\s+)?investimento(s)?/i.test(lower) ||
    /limpa(r)?\s+(a\s+)?carteira/i.test(lower) ||
    /apaga(r)?\s+(os\s+)?investimento(s)?/i.test(lower) ||
    /zera(r)?\s+(as\s+)?caixinha(s)?/i.test(lower) ||
    /zera(r)?\s+(os\s+)?porquinho(s)?/i.test(lower);

  if (isResetInvestments) {
    return {
      intent: 'reset_investments',
      replyText: '🪙 Entendido! Limpei todos os investimentos e porquinhos da sua carteira.',
    };
  }

  // ==========================================
  // 2. VOLTAR / DESFAZER (UNDO)
  // ==========================================
  if (
    lower === 'volta' || 
    lower === 'voltar' || 
    lower === 'desfaz' || 
    lower === 'desfazer' || 
    lower.includes('desfaz o que') || 
    lower.includes('cancela a ultima') || 
    lower.includes('desfazer a ultima') || 
    lower.includes('recupera o que')
  ) {
    return {
      intent: 'undo_action',
      replyText: '↩️ Ação desfeita com sucesso! Restaurei o estado anterior do sistema.',
    };
  }

  // ==========================================
  // 3. PORQUINHO / CAIXINHA / RESERVA BANCÁRIA
  // ==========================================
  if (
    lower.includes('porco') || 
    lower.includes('porquinho') || 
    lower.includes('cofrinho') || 
    lower.includes('caixinha') ||
    lower.includes('guardado')
  ) {
    const amountMatch = input.match(/(?:r\$\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d{2})?|\d+(?:[,\.]\d{2})?|\d+)/i);
    if (amountMatch) {
      const rawNum = amountMatch[1];
      let val = 0;
      if (rawNum.includes(',') && rawNum.includes('.')) {
        val = parseFloat(rawNum.replace(/\./g, '').replace(',', '.'));
      } else if (rawNum.includes(',')) {
        val = parseFloat(rawNum.replace(',', '.'));
      } else {
        val = parseFloat(rawNum);
      }
      if (val > 0) {
        let bankName = 'Nubank';
        if (lower.includes('inter')) bankName = 'Banco Inter';
        else if (lower.includes('picpay')) bankName = 'PicPay';
        else if (lower.includes('btg')) bankName = 'BTG Pactual';
        else if (lower.includes('itau') || lower.includes('itaú')) bankName = 'Itaú';
        else if (lower.includes('mercado')) bankName = 'Mercado Pago';

        return {
          intent: 'create_investment',
          replyText: `🐷 Identifiquei seu Porquinho/Caixinha de ${formatCurrency(val)} no ${bankName}! Lançando no seu patrimônio consolidado e na carteira de investimentos...`,
          investmentData: {
            name: `Porquinho / Caixinha - ${bankName}`,
            category: 'Renda Fixa & Reserva',
            amount: val,
            bank: bankName,
          },
        };
      }
    }
  }

  // ==========================================
  // 4. EXCLUIR / CANCELAR LANÇAMENTO
  // ==========================================
  if (
    lower.includes('exclui') || 
    lower.includes('excluir') || 
    lower.includes('cancela') || 
    lower.includes('cancelar') || 
    lower.includes('apaga o') || 
    lower.includes('apagar o') || 
    lower.includes('deleta') || 
    lower.includes('deletar') || 
    lower.includes('remove o') || 
    lower.includes('remover o')
  ) {
    if (transactions.length === 0) {
      return {
        intent: 'general_chat',
        replyText: 'Você ainda não possui nenhum lançamento para excluir.',
      };
    }

    // Try finding by keyword
    let target = transactions[0]; // default to last one
    for (const t of transactions) {
      const titleLower = t.title.toLowerCase();
      if (lower.includes(titleLower) || lower.includes(t.category.toLowerCase())) {
        target = t;
        break;
      }
    }

    return {
      intent: 'delete_transaction',
      targetTransaction: target,
      replyText: `🗑️ Lançamento "${target.title}" no valor de ${formatCurrency(target.amount)} foi excluído e o saldo foi recalculado.`,
    };
  }

  // ==========================================
  // 4. BAIXAR / DAR BAIXA / QUITAR / LIQUIDAR (NOVO & ULTRA-AUTÔNOMO)
  // Ex: "baixar uns valores", "dar baixa na conta da gabi", "baixa o almoço", "quitar 150", "dar baixa em tudo", "baixar todas as pendentes"
  // ==========================================
  const isBaixaCommand = /baixa(r)?|dar baixa|dei baixa|quita(r)?|quitei|liquida(r)?|liquidado|paguei a conta/i.test(lower);
  if (isBaixaCommand) {
    if (transactions.length === 0) {
      return {
        intent: 'general_chat',
        replyText: 'Você ainda não possui nenhum lançamento para dar baixa.',
      };
    }

    const pendingTxs = transactions.filter(t => t.status === 'pending');

    // 4.1 Baixar em massa (todas as pendentes ou "baixar uns valores" sem especificar)
    const isGenericBulk = 
      /baixa(r)?\s+(uns\s+)?valores/i.test(lower) ||
      /baixa(r)?\s+(em\s+)?tudo/i.test(lower) ||
      /baixa(r)?\s+(todas|todos)/i.test(lower) ||
      /dar baixa\s+(em\s+)?tudo/i.test(lower) ||
      /dar baixa\s+nas\s+pendentes/i.test(lower) ||
      /baixa(r)?\s+(as\s+)?pendentes/i.test(lower);

    if (isGenericBulk) {
      if (pendingTxs.length > 0) {
        return {
          intent: 'bulk_mark_paid',
          bulkTargetTxs: pendingTxs,
          replyText: `✅ Baixa executada com sucesso! ${pendingTxs.length} conta(s) pendente(s) foram marcadas como PAGAS no seu extrato.`,
        };
      } else {
        return {
          intent: 'general_chat',
          replyText: '🎉 Todas as suas contas já estão com status de PAGO! Não há pendências para dar baixa.',
        };
      }
    }

    // 4.2 Baixar lançamento específico por nome (ex: "baixa a conta da gabi", "dar baixa no almoço")
    let target = transactions.find(t => {
      const titleLower = t.title.toLowerCase();
      // Match words of length >= 3
      const words = lower.replace(/baixa(r)?|dar baixa|dei baixa|quita(r)?|quitei|liquida(r)?|conta|lançamento|valor|pra|para|o|a|de|do|da/gi, ' ')
        .trim().split(/\s+/).filter(w => w.length >= 3);
      return words.some(w => titleLower.includes(w));
    });

    // 4.3 Se não achou por nome, busca por valor (ex: "baixa o de 150")
    if (!target) {
      const amountMatch = input.match(/(\d+(?:\.\d{3})*(?:,\d{2})?|\d+(?:\.\d{2})?)/);
      if (amountMatch) {
        const val = parseFloat(amountMatch[1].replace(/\./g, '').replace(',', '.'));
        target = transactions.find(t => Math.abs(t.amount - val) < 0.01 && t.status === 'pending') ||
                 transactions.find(t => Math.abs(t.amount - val) < 0.01);
      }
    }

    // 4.4 Se não achou específico, pega a primeira pendente ou a última transação
    if (!target) {
      target = pendingTxs[0] || transactions[0];
    }

    if (target) {
      return {
        intent: 'update_transaction',
        targetTransaction: target,
        transactionUpdates: { new_status: 'paid' },
        replyText: `✅ Baixa confirmada! Lançamento "${target.title}" no valor de ${formatCurrency(target.amount)} foi marcado como PAGO.`,
      };
    }
  }

  // ==========================================
  // 5. AUTO-CORREÇÃO & ALTERAÇÃO INTELIGENTE DE LANÇAMENTOS
  // Ex: "não era 150, era 180", "muda pra 180", "ops, era 80", "troca a conta pro Inter", "muda a categoria pra Alimentação"
  // ==========================================
  const isCorrection = 
    /n[aã]o\s+era\b|ops\b|na\s+verdade|muda\s+(pra|pro|para|o|a)?|troca\s+(pra|pro|para|o|a)?|altera|alterar|corrige|corrigir|marca\s+como|marcar\s+como/i.test(lower);

  if (isCorrection) {
    if (transactions.length === 0) {
      return {
        intent: 'general_chat',
        replyText: 'Você ainda não possui nenhum lançamento registrado no extrato para alterar.',
      };
    }

    // 1. Identificar o alvo (Target)
    let target = transactions[0]; // Padrão: transação mais recente
    for (const t of transactions) {
      if (t.title && lower.includes(t.title.toLowerCase())) {
        target = t;
        break;
      }
      if (t.category && lower.includes(t.category.toLowerCase())) {
        target = t;
        break;
      }
    }

    // 2. Troca de Conta Bancária: "troca pro inter", "muda a conta pro btg", "coloca no inter"
    if (/conta\s+(pro|pra|para|no|na)|(pro|pra|no|na)\s+(banco\s+)?(inter|btg|mercado|sicredi|caixa)/i.test(lower)) {
      for (const acc of accounts) {
        const accLower = acc.name.toLowerCase();
        const simple = accLower.replace(/^banco\s+/i, '');
        if (lower.includes(simple) || lower.includes(accLower)) {
          return {
            intent: 'update_transaction',
            targetTransaction: target,
            transactionUpdates: { new_account_id: acc.id },
            replyText: `🏦 **Conta Alterada!** O lançamento "${target.title}" (${formatCurrency(target.amount)}) foi transferido para a conta **${acc.name}** com saldo recalculado.`,
            suggestedChips: ['📑 Ver no Extrato', '📊 Saúde do Caixa', '➕ Novo Lançamento'],
          };
        }
      }
    }

    // 3. Troca de Categoria: "muda a categoria pra Alimentação", "categoria combustível"
    if (/categoria|pra\s+(alimenta[cç][aã]o|combust[ií]vel|infraestrutura|equipamentos|aluguel|vendas)/i.test(lower)) {
      let newCat = 'Outros';
      if (/alimenta/i.test(lower)) newCat = 'Alimentação & Refeição';
      else if (/combust[ií]vel|gasolina|transporte/i.test(lower)) newCat = 'Combustível & Transporte';
      else if (/ferramenta|material|infra/i.test(lower)) newCat = 'Infraestrutura & Ferramentas';
      else if (/equipamento|hardware|pe[cç]a/i.test(lower)) newCat = 'Equipamentos & Hardware';
      else if (/aluguel|fixa|luz|água/i.test(lower)) newCat = 'Aluguel & Contas Fixas';
      else if (/venda|servi[cç]o/i.test(lower)) newCat = 'Vendas & Serviços Prestados';

      return {
        intent: 'update_transaction',
        targetTransaction: target,
        transactionUpdates: { new_category: newCat },
        replyText: `🏷️ **Categoria Atualizada!** Lançamento "${target.title}" agora está categorizado em **"${newCat}"**.`,
        suggestedChips: ['📑 Ver no Extrato', '📊 CFO Virtual', '➕ Novo Lançamento'],
      };
    }

    // 4. Marcar como Pago / Pendente
    if (/pago|paga|liquidado|baixar/i.test(lower)) {
      return {
        intent: 'update_transaction',
        targetTransaction: target,
        transactionUpdates: { new_status: 'paid' },
        replyText: `✅ **Baixa Confirmada!** Lançamento "${target.title}" de ${formatCurrency(target.amount)} foi marcado como **PAGO**.`,
        suggestedChips: ['📑 Ver no Extrato', '📊 Saúde do Caixa', '➕ Novo Lançamento'],
      };
    }

    if (/pendente|a\s+pagar|a\s+vencer/i.test(lower)) {
      return {
        intent: 'update_transaction',
        targetTransaction: target,
        transactionUpdates: { new_status: 'pending' },
        replyText: `⏳ **Status Atualizado!** Lançamento "${target.title}" foi alterado para status **PENDENTE**.`,
        suggestedChips: ['📑 Ver no Extrato', '📊 Saúde do Caixa', '➕ Novo Lançamento'],
      };
    }

    // 5. Correção de Valor: "não era 150, era 180", "muda pra 180", "ops, era 80"
    const correctionMatch = input.match(/(?:n[aã]o\s+era\s+\d+.*?)?(?:era|foi|pra|para|pro|valor)\s*(?:r\$\s*)?(\d+(?:[,\.]\d{2})?|\d+)/i) ||
                           input.match(/(\d+(?:\.\d{3})*(?:,\d{2})?|\d+(?:\.\d{2})?)/);
    if (correctionMatch) {
      const rawNum = correctionMatch[1].replace(/\./g, '').replace(',', '.');
      const newAmount = parseFloat(rawNum);
      if (newAmount > 0 && Math.abs(newAmount - target.amount) > 0.001) {
        return {
          intent: 'update_transaction',
          targetTransaction: target,
          transactionUpdates: { new_amount: newAmount },
          replyText: `✏️ **Valor Corrigido com Sucesso!**\n\n• **Lançamento:** "${target.title}"\n• **De:** ${formatCurrency(target.amount)} ➔ **Para:** **${formatCurrency(newAmount)}**\n• Saldo bancário e relatórios reajustados instantaneamente!`,
          suggestedChips: ['📑 Ver no Extrato', '↩️ Desfazer', '📊 Como tá meu caixa?'],
        };
      }
    }
  }

  // ==========================================
  // 5. NAVEGAÇÃO & ABERTURA DE TELAS
  // ==========================================
  if (lower.includes('leitor') || lower.includes('nota fiscal') || lower.includes('escanear') || lower.includes('ler nota')) {
    return {
      intent: 'open_screen',
      targetScreen: 'scanner',
      replyText: '📸 Abrindo o Leitor de Nota Fiscal com Inteligência Artificial OCR...',
    };
  }

  if (lower.includes('cfo') || lower.includes('diagnostico') || lower.includes('saude financeira') || lower.includes('auditoria')) {
    return {
      intent: 'open_screen',
      targetScreen: 'cfo',
      replyText: '📊 Abrindo o CFO Virtual com diagnóstico executivo e auditoria de preços...',
    };
  }

  if (lower.includes('mercado pago') || lower.includes('cobrar') || lower.includes('mensalidade') || lower.includes('pix cobranca')) {
    return {
      intent: 'open_screen',
      targetScreen: 'mercadopago',
      replyText: '⚡ Abrindo módulo de cobrança via Mercado Pago...',
    };
  }

  if (lower.includes('extrato') || lower.includes('relatorio')) {
    return {
      intent: 'open_screen',
      targetScreen: 'statement',
      replyText: '📑 Abrindo o Extrato Completo com filtros e exportação PDF/Excel...',
    };
  }

  if (lower.includes('investimento') || lower.includes('acoes') || lower.includes('cdi') || lower.includes('selic')) {
    return {
      intent: 'open_screen',
      targetScreen: 'investments',
      replyText: '🪙 Abrindo a carteira de Investimentos e Cotações ao Vivo...',
    };
  }

  if (lower.includes('cartao') || lower.includes('cartões') || lower.includes('cartoes') || lower.includes('fatura do cartao') || lower.includes('limite do cartao')) {
    return {
      intent: 'open_screen',
      targetScreen: 'cards',
      replyText: '💳 Abrindo o módulo de Cartões de Crédito, Limites e Leitor de Fatura...',
    };
  }

  if (lower.includes('lista de compras') || lower.includes('lista de compra') || lower.includes('compras') || lower.includes('mercado') || lower.includes('supermercado')) {
    return {
      intent: 'open_screen',
      targetScreen: 'shopping_lists',
      replyText: '🛒 Abrindo suas Listas de Compras Inteligentes (Mercado, Casa, Obras)...',
    };
  }

  if (lower.includes('faturas do sistema') || lower.includes('minha assinatura') || lower.includes('fatura do sistema') || lower.includes('minhas faturas')) {
    return {
      intent: 'open_screen',
      targetScreen: 'subscription_invoices',
      replyText: '📄 Abrindo Faturas do Sistema e Assinatura Aura Finance PRO (R$ 9,90/mês)...',
    };
  }

  // ==========================================
  // 6. TRANSFERÊNCIA ENTRE CONTAS BANCÁRIAS (NOVO & EXECUTIVO)
  // Ex: "transfere 500 do btg pro inter", "passa 200 do inter pro sicredi", "transferir 1000 da caixa pro btg"
  // ==========================================
  const isTransfer = /transfere|transferir|transferência|passa(r)?\s+\d+|manda(r)?\s+\d+.*?(?:pra|pro|para)/i.test(lower);
  if (isTransfer && accounts.length >= 2) {
    const amountMatch = input.match(/(\d+(?:\.\d{3})*(?:,\d{2})?|\d+(?:\.\d{2})?|\d+)/);
    if (amountMatch) {
      const rawNum = amountMatch[1].replace(/\./g, '').replace(',', '.');
      const transferAmount = parseFloat(rawNum);

      if (transferAmount > 0) {
        // Encontrar conta de origem (após "do", "da", "de")
        let sourceAcc = accounts[0];
        let targetAcc = accounts[1] || accounts[0];

        for (const acc of accounts) {
          const accLower = acc.name.toLowerCase();
          const simple = accLower.replace(/^banco\s+/i, '');
          if (new RegExp(`(?:do|da|de)\\s+.*?${simple}`, 'i').test(lower) || (lower.includes('do ' + simple) || lower.includes('da ' + simple))) {
            sourceAcc = acc;
          }
          if (new RegExp(`(?:para|pro|pra|ao)\\s+.*?${simple}`, 'i').test(lower) || (lower.includes('pro ' + simple) || lower.includes('pra ' + simple))) {
            targetAcc = acc;
          }
        }

        if (sourceAcc.id !== targetAcc.id) {
          return {
            intent: 'transfer_between_accounts',
            transferData: {
              sourceAccountId: sourceAcc.id,
              sourceAccountName: sourceAcc.name,
              targetAccountId: targetAcc.id,
              targetAccountName: targetAcc.name,
              amount: transferAmount,
            },
            replyText: `💸 **Transferência Executada com Sucesso!**\n\n• **Origem:** ${sourceAcc.name} (-${formatCurrency(transferAmount)})\n• **Destino:** ${targetAcc.name} (+${formatCurrency(transferAmount)})\n• **Status:** Saldo das duas contas recalculado automaticamente.`,
            suggestedChips: ['📑 Ver no Extrato', '🏦 Ver Contas', '📊 Raio-X do Caixa'],
          };
        }
      }
    }
  }

  // ==========================================
  // 7. CONSULTAS ANALÍTICAS & CFO VIRTUAL (QUANTO GASTEI / MAIOR GASTO / SAÚDE DO CAIXA)
  // ==========================================
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const netResult = totalIncome - totalExpenses;

  // 7.1 "Qual meu maior gasto?" ou "Onde gastei mais?"
  if (/qual\s+(o\s+)?maior\s+(gasto|despesa|compra)|onde\s+gastei\s+mais/i.test(lower)) {
    const expenses = transactions.filter(t => t.type === 'expense');
    if (expenses.length === 0) {
      return {
        intent: 'general_chat',
        replyText: 'Você ainda não possui despesas registradas para avaliar o maior gasto.',
        suggestedChips: ['➕ Novo Lançamento', '📸 Ler Nota Fiscal'],
      };
    }
    const highest = [...expenses].sort((a, b) => b.amount - a.amount)[0];
    const pct = totalExpenses > 0 ? ((highest.amount / totalExpenses) * 100).toFixed(1) : '100';

    return {
      intent: 'cfo_advice',
      replyText: `🔍 **Seu Maior Gasto Registrado:**\n\n• **Lançamento:** "${highest.title}"\n• **Valor:** ${formatCurrency(highest.amount)}\n• **Categoria:** ${highest.category}\n• **Conta:** ${accounts.find(a => a.id === highest.account_id)?.name || 'Principal'}\n• **Impacto:** Representa **${pct}%** de todas as suas despesas registradas.`,
      suggestedChips: ['📑 Ver no Extrato', '📊 Análise Completa', '💡 Como Economizar?'],
    };
  }

  // 7.2 "Quanto gastei com [categoria/pessoa/termo]?" (Ex: "com alimentação", "com almoço", "com a gabi")
  const specificExpenseMatch = lower.match(/quanto\s+(eu\s+)?(gastei|paguei|saiu)\s+com\s+([a-zA-ZÀ-ÿ\s]+)/i);
  if (specificExpenseMatch) {
    const term = specificExpenseMatch[3].trim().toLowerCase();
    const matched = transactions.filter(t => 
      t.type === 'expense' && (
        t.title.toLowerCase().includes(term) || 
        t.category.toLowerCase().includes(term)
      )
    );
    const sum = matched.reduce((acc, t) => acc + t.amount, 0);

    if (matched.length > 0) {
      const topItems = matched.slice(0, 4).map(m => `• ${m.title}: ${formatCurrency(m.amount)} (${m.status === 'paid' ? 'Pago' : 'Pendente'})`).join('\n');
      return {
        intent: 'query_expenses',
        replyText: `🛒 **Gastos com "${term.toUpperCase()}":**\n\nTotal acumulado: **${formatCurrency(sum)}** em ${matched.length} lançamento(s):\n\n${topItems}`,
        suggestedChips: ['📑 Ver no Extrato', '➕ Adicionar Gasto', '📊 CFO Virtual'],
      };
    } else {
      return {
        intent: 'query_expenses',
        replyText: `Não encontrei despesas registradas com o termo "${term}". Seu histórico para esse item está zerado!`,
        suggestedChips: ['➕ Lançar Despesa', '📑 Extrato Completo'],
      };
    }
  }

  // 7.3 "Quanto gastei esse mês?" ou "Qual o total de despesas?"
  if (/quanto\s+(eu\s+)?(gastei|saiu)|total\s+(de\s+)?despesa(s)?|meus\s+gastos/i.test(lower) && !lower.includes('com ')) {
    return {
      intent: 'query_expenses',
      replyText: `📊 **Raio-X Consolidado de Despesas:**\n\n• **Total de Despesas:** ${formatCurrency(totalExpenses)}\n• **Total de Receitas:** ${formatCurrency(totalIncome)}\n• **Resultado Líquido:** ${formatCurrency(netResult)} ${netResult >= 0 ? '(Superávit 🟢)' : '(Déficit 🔴)'}\n\n💡 *Parecer do CFO:* ${netResult >= 0 ? 'Excelente! Suas receitas superam seus custos. Considere destinar pelo menos 20% do superávit para sua reserva no CDI.' : 'Atenção aos custos variáveis para evitar consumir suas reservas bancárias.'}`,
      suggestedChips: ['🔍 Qual meu maior gasto?', '📑 Ver no Extrato', '🪙 Investir Superávit'],
    };
  }

  // 7.4 "Quanto faturei?" ou "Total de receitas?" ou "Quanto ganhei?"
  if (/quanto\s+(eu\s+)?(faturei|ganhei|recebi|entrou)|total\s+(de\s+)?receita(s)?/i.test(lower)) {
    return {
      intent: 'query_expenses',
      replyText: `💰 **Total de Entradas & Faturamento:**\n\nVocê faturou um total de **${formatCurrency(totalIncome)}** até o momento.\n\n• Despesas deduzidas: ${formatCurrency(totalExpenses)}\n• Caixa Líquido: **${formatCurrency(netResult)}**`,
      suggestedChips: ['➕ Nova Receita', '📑 Ver Extrato', '📊 CFO Virtual'],
    };
  }

  // 7.5 "Como tá meu caixa?" ou "Saúde financeira"
  if (/como\s+tá\s+(meu\s+)?caixa|como\s+está\s+(o\s+)?caixa|saude\s+financeira|diagnostico/i.test(lower)) {
    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
    const pendingCount = transactions.filter(t => t.status === 'pending').length;
    const score = netResult >= 0 ? 92 : 65;

    return {
      intent: 'cfo_advice',
      replyText: `⚡ **Diagnóstico de Saúde Financeira (${score}/100):**\n\n• **Saldo Consolidado nos Bancos:** ${formatCurrency(totalBalance)}\n• **Resultado Operacional:** ${formatCurrency(netResult)} ${netResult >= 0 ? '🟢' : '🔴'}\n• **Contas Pendentes:** ${pendingCount} a serem quitadas.\n\n*Recomendação:* ${pendingCount > 0 ? `Dê baixa nas ${pendingCount} contas pendentes para manter a conciliação bancária 100% auditada.` : 'Seu fluxo de caixa está perfeitamente conciliado e sem pendências!'}`,
      suggestedChips: ['✅ Baixar contas pendentes', '📑 Extrato', '🪙 Investimentos'],
    };
  }

  // ==========================================
  // 7.6 AUDITORIA DE DUPLICIDADES (NOVO)
  // Ex: "tem lançamento duplicado?", "ver duplicados", "auditar duplicidades"
  // ==========================================
  if (/duplicad|duplicidade|lancamento repetido|despesa repetida/i.test(lower)) {
    const duplicates: Array<{ t1: FinancialTransaction; t2: FinancialTransaction }> = [];
    for (let i = 0; i < transactions.length; i++) {
      for (let j = i + 1; j < transactions.length; j++) {
        const a = transactions[i];
        const b = transactions[j];
        if (Math.abs(a.amount - b.amount) < 0.01) {
          const diffDays = Math.abs(new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()) / (1000 * 3600 * 24);
          if (diffDays <= 4 && (a.title.toLowerCase() === b.title.toLowerCase() || a.category === b.category)) {
            duplicates.push({ t1: a, t2: b });
          }
        }
      }
    }

    if (duplicates.length > 0) {
      const dupList = duplicates.slice(0, 3).map(d => 
        `• **"${d.t1.title}"** e **"${d.t2.title}"**: ${formatCurrency(d.t1.amount)} (${d.t1.transaction_date})`
      ).join('\n');

      return {
        intent: 'cfo_advice',
        replyText: `⚠️ **Atenção! Encontrei ${duplicates.length} possível(is) duplicidade(s) no seu extrato:**\n\n${dupList}\n\n*Dica do Copiloto:* Para excluir uma das duplicatas, basta dizer: *"excluir ${duplicates[0].t1.title}"*.`,
        suggestedChips: [`🗑️ Excluir ${duplicates[0].t1.title}`, '📑 Ver no Extrato', '📊 CFO Virtual'],
      };
    } else {
      return {
        intent: 'cfo_advice',
        replyText: `✅ **Auditoria de Integridade Concluída:** Nenhum lançamento duplicado encontrado no seu extrato! Todos os seus ${transactions.length} registros estão 100% íntegros.`,
        suggestedChips: ['📑 Ver no Extrato', '📊 Saúde do Caixa', '➕ Novo Lançamento'],
      };
    }
  }

  // ==========================================
  // 7.7 REGRA 50/30/20 & PLANO DE ECONOMIA (NOVO)
  // Ex: "regra 50 30 20", "plano de economia", "como economizar 1000 reais", "meta de economia"
  // ==========================================
  if (/50\/30\/20|50 30 20|plano de economia|como economizar|meta de economia/i.test(lower)) {
    const baseIncome = totalIncome > 0 ? totalIncome : 5000;
    const essentialBudget = baseIncome * 0.50;
    const lifestyleBudget = baseIncome * 0.30;
    const investmentBudget = baseIncome * 0.20;

    return {
      intent: 'cfo_advice',
      replyText: `🎯 **Plano Executivo de Distribuição Financeira (Regra 50/30/20):**\n\nCom base no seu faturamento (${formatCurrency(baseIncome)}), o modelo ideal de divisão patrimonial é:\n\n• **50% Necessidades Essenciais:** até **${formatCurrency(essentialBudget)}** *(Aluguel, Luz, Comida, Contas Fixas)*\n• **30% Estilo de Vida & Desejos:** até **${formatCurrency(lifestyleBudget)}** *(Lazer, Restaurantes, Compras Pessoais)*\n• **20% Liberdade Financeira & Reserva:** **${formatCurrency(investmentBudget)}** *(Aportes mensais no Tesouro Selic / CDI)*\n\n💡 *Diagnóstico Atual:* Suas despesas totais estão em ${formatCurrency(totalExpenses)}. ${totalExpenses <= essentialBudget ? 'Você está gastando abaixo do teto de necessidades essenciais! 🟢' : 'Suas despesas ultrapassaram o teto ideal de 50%. Recomendo cortar custos variáveis.'}`,
      suggestedChips: ['🪙 Investir 20%', '🔍 Qual meu maior gasto?', '📑 Ver Extrato'],
    };
  }

  // ==========================================
  // 7.8 RUNWAY & BURN RATE DO CAIXA (NOVO)
  // Ex: "quanto tempo dura meu saldo?", "runway", "burn rate", "previsao de quebra", "autonomia do caixa"
  // ==========================================
  if (/runway|burn\s*rate|tempo\s+dura\s+(meu\s+)?(saldo|dinheiro|caixa)|previs[aã]o\s+(de\s+)?quebra|sobreviv[eê]ncia\s+do\s+caixa|autonomia\s+(do\s+)?caixa|quantos\s+dias\s+(dura|aguenta)/i.test(lower)) {
    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
    const dailyBurn = totalExpenses > 0 ? totalExpenses / 30 : 0;
    const runwayDays = dailyBurn > 0 ? Math.round(totalBalance / dailyBurn) : (totalBalance > 0 ? 999 : 0);
    const runwayMonths = (runwayDays / 30).toFixed(1);

    if (runwayDays >= 90) {
      return {
        intent: 'cfo_advice',
        replyText: `🛡️ **Autonomia & Runway de Caixa (Score: Excelente 🟢):**\n\n• **Saldo Consolidado:** ${formatCurrency(totalBalance)}\n• **Taxa Média de Queima (Burn Rate):** ~${formatCurrency(dailyBurn)}/dia (${formatCurrency(totalExpenses)}/mês)\n• **Autonomia Estimada:** **${runwayDays} dias** (~${runwayMonths} meses) sem novas receitas!\n\n💡 *Parecer do CFO:* Sua operação conta com blindagem financeira sólida. Você possui fôlego de mais de um trimestre para investir em expansão ou aportar em renda fixa (CDI/Selic).`,
        suggestedChips: ['🎯 Regra 50/30/20', '🪙 Investimentos', '📊 Saúde do Caixa'],
      };
    } else if (runwayDays >= 30) {
      return {
        intent: 'cfo_advice',
        replyText: `⚡ **Autonomia & Runway de Caixa (Score: Atenção Moderada 🟡):**\n\n• **Saldo Consolidado:** ${formatCurrency(totalBalance)}\n• **Taxa Média de Queima:** ~${formatCurrency(dailyBurn)}/dia\n• **Autonomia Estimada:** **${runwayDays} dias** (~${runwayMonths} meses).\n\n💡 *Parecer do CFO:* Seu caixa sustenta cerca de 1 a 2 meses no ritmo atual. Recomendo focar em acelerar cobranças e antecipar recebíveis para ampliar a margem de segurança.`,
        suggestedChips: ['🔍 Qual meu maior gasto?', '🎯 Regra 50/30/20', '📑 Ver Extrato'],
      };
    } else {
      return {
        intent: 'cfo_advice',
        replyText: `🚨 **Alerta de Liquidez & Runway Curto (Score: Crítico 🔴):**\n\n• **Saldo Consolidado:** ${formatCurrency(totalBalance)}\n• **Taxa Média de Queima:** ~${formatCurrency(dailyBurn)}/dia\n• **Autonomia Restante:** apenas **${runwayDays} dias**!\n\n⚠️ *Plano Emergencial:* Contenha gastos variáveis hoje mesmo e ative cobranças ativas com urgência para evitar necessidade de crédito bancário.`,
        suggestedChips: ['📉 Cortar Custos', '📑 Extrato Completo', '📊 CFO Virtual'],
      };
    }
  }

  // ==========================================
  // 7.9 DETECÇÃO DE ASSINATURAS & VAMPIROS FINANCEIROS (NOVO)
  // Ex: "detectar assinaturas", "quais minhas assinaturas", "gastos fixos", "vampiros financeiros"
  // ==========================================
  if (/assinatura(s)?|gastos\s+fixos|custos\s+fixos|vampiro(s)?\s+financeiro(s)?|recorr[eê]ncia(s)?|servi[cç]os\s+recorrentes/i.test(lower)) {
    const subRegex = /netflix|spotify|openai|chatgpt|youtube|icloud|apple|amazon|prime|gym|academia|smart\s*fit|aluguel|internet|vivo|claro|tim|software|canva|adobe|github|vercel|hospedagem|seguro|saude|saúde|celular|condominio|condomínio|plano/i;
    const recurringTxs = transactions.filter(t => t.type === 'expense' && (subRegex.test(t.title) || t.category === 'Aluguel & Contas Fixas'));

    const uniqueMap = new Map<string, number>();
    recurringTxs.forEach(t => {
      const cleanTitle = t.title.trim();
      if (!uniqueMap.has(cleanTitle) || uniqueMap.get(cleanTitle)! < t.amount) {
        uniqueMap.set(cleanTitle, t.amount);
      }
    });

    if (uniqueMap.size > 0) {
      const subList: string[] = [];
      let totalMonthlySubs = 0;
      uniqueMap.forEach((amt, name) => {
        totalMonthlySubs += amt;
        subList.push(`• **${name}:** ${formatCurrency(amt)}/mês (${formatCurrency(amt * 12)}/ano)`);
      });

      const totalAnnual = totalMonthlySubs * 12;
      return {
        intent: 'cfo_advice',
        replyText: `🦇 **Auditoria de Custos Recorrentes & Assinaturas (${uniqueMap.size} identificadas):**\n\n${subList.slice(0, 5).join('\n')}\n\n• **Custo Mensal Consolidado:** **${formatCurrency(totalMonthlySubs)}/mês**\n• **Drenagem Anual do Caixa:** **${formatCurrency(totalAnnual)}/ano**\n\n💡 *Dica do CFO:* Cancelar ou renegociar planos não essenciais pode colocar mais de ${formatCurrency(totalAnnual * 0.3)} livres no seu bolso todo ano!`,
        suggestedChips: ['🎯 Regra 50/30/20', '📑 Ver Extrato', '📊 CFO Virtual'],
      };
    } else {
      return {
        intent: 'cfo_advice',
        replyText: `✅ **Controle de Assinaturas Impecável:** Não localizei débitos automáticos recorrentes ou assinaturas ocultas no seu extrato recente. Seus custos fixos estão enxutos!`,
        suggestedChips: ['➕ Novo Lançamento', '📊 Saúde do Caixa', '📑 Ver Extrato'],
      };
    }
  }

  // ==========================================
  // 7.10 PLANO DE QUITAÇÃO DE CONTAS / MÉTODO BOLA DE NEVE (NOVO)
  // Ex: "como quitar minhas contas?", "quitar dividas", "metodo bola de neve", "ordem de quitacao"
  // ==========================================
  if (/como\s+quitar|quitar\s+d[ií]vidas|quitar\s+contas|m[eé]todo\s+bola\s+de\s+neve|ordem\s+de\s+quita[cç][aã]o|plano\s+de\s+quita[cç][aã]o|acelerar\s+quita[cç][aã]o/i.test(lower)) {
    const pendings = transactions.filter(t => t.status === 'pending' && t.type === 'expense');
    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

    if (pendings.length > 0) {
      const sorted = [...pendings].sort((a, b) => a.amount - b.amount);
      const totalPending = sorted.reduce((sum, t) => sum + t.amount, 0);

      const itemsList = sorted.slice(0, 5).map((t, idx) => 
        `${idx + 1}º **${t.title}**: ${formatCurrency(t.amount)} *(Venc: ${t.transaction_date})*`
      ).join('\n');

      const canPayAll = totalBalance >= totalPending;

      return {
        intent: 'cfo_advice',
        replyText: `🏔️ **Plano Executivo de Quitação (Método Bola de Neve):**\n\nVocê possui **${pendings.length} conta(s) pendente(s)** totalizando **${formatCurrency(totalPending)}**.\n\n**Ordem Recomendada de Pagamento (Menor para Maior):**\n${itemsList}\n\n${canPayAll 
          ? `🎉 **Excelente notícia:** Seu saldo consolidado (${formatCurrency(totalBalance)}) cobre 100% de todas as pendências hoje mesmo e ainda sobram **${formatCurrency(totalBalance - totalPending)}** de reserva!` 
          : `💡 *Estratégia:* Liquide primeiro o item mais barato (${sorted[0].title} de ${formatCurrency(sorted[0].amount)}) para liberar fluxo e eliminar 1 compromisso imediatamente.`}\n\nPara liquidar tudo agora, basta dizer: *"dar baixa em tudo"*.`,
        suggestedChips: ['✅ Dar baixa em tudo', '📑 Ver Extrato', '📊 Saúde do Caixa'],
      };
    } else {
      return {
        intent: 'cfo_advice',
        replyText: `🎉 **Parabéns!** Você não possui nenhuma despesa ou conta pendente no sistema. Todas as suas obrigações financeiras estão 100% quitadas e em dia!`,
        suggestedChips: ['➕ Novo Lançamento', '📊 Como tá meu caixa?', '🪙 Investimentos'],
      };
    }
  }

  // ==========================================
  // 7.11 SIMULADOR DE JUROS COMPOSTOS & APORTES (NOVO)
  // Ex: "simular investimento", "se eu investir 500 por mês", "juros compostos", "quanto rende 1000"
  // ==========================================
  if (/simular\s+investimento|se\s+eu\s+investir|juros\s+compostos|quanto\s+rende|proje[cç][aã]o\s+de\s+investimento/i.test(lower)) {
    const matchNum = input.match(/(\d+(?:\.\d{3})*(?:,\d{2})?|\d+)/);
    const aporte = matchNum ? parseFloat(matchNum[1].replace(/\./g, '').replace(',', '.')) : 500;
    const monthlyRate = 0.0085; // ~10.75% a.a. CDI / Tesouro Selic

    const calcCompound = (months: number, p: number) => {
      const fv = p * (((1 + monthlyRate) ** months - 1) / monthlyRate);
      const invested = p * months;
      const profit = fv - invested;
      return { fv, invested, profit };
    };

    const res1y = calcCompound(12, aporte);
    const res5y = calcCompound(60, aporte);
    const res10y = calcCompound(120, aporte);

    return {
      intent: 'cfo_advice',
      replyText: `📈 **Simulação de Independência Financeira (Juros Compostos CDI / Selic ~10,75% a.a.):**\n\nAportando mensalmente **${formatCurrency(aporte)}**:\n\n• **Em 1 ano (12 meses):**\n  - Total Investido: ${formatCurrency(res1y.invested)}\n  - Montante Final: **${formatCurrency(res1y.fv)}** *(Lucro de juros: +${formatCurrency(res1y.profit)})*\n\n• **Em 5 anos (60 meses):**\n  - Total Investido: ${formatCurrency(res5y.invested)}\n  - Montante Final: **${formatCurrency(res5y.fv)}** *(Lucro de juros: +${formatCurrency(res5y.profit)})*\n\n• **Em 10 anos (120 meses):**\n  - Total Investido: ${formatCurrency(res10y.invested)}\n  - Montante Final: **${formatCurrency(res10y.fv)}** *(Lucro puro: +${formatCurrency(res10y.profit)} gerados automaticamente!)*\n\n💡 *Visão do CFO:* A partir do 5º ano, o poder dos juros compostos cria um salário passivo real. Mantenha a consistência!`,
      suggestedChips: ['🎯 Regra 50/30/20', '🏦 Consultar Saldo', '📊 Como tá meu caixa?'],
    };
  }

  // ==========================================
  // 7.12 GERADOR DE RELATÓRIO EXECUTIVO PARA WHATSAPP (NOVO)
  // Ex: "gerar resumo pro whatsapp", "relatório whatsapp", "fechamento do caixa", "resumo executivo"
  // ==========================================
  if (/gerar\s+(resumo|relat[oó]rio)\s+(pro|para|no)\s+whatsapp|relat[oó]rio\s+whatsapp|resumo\s+whatsapp|fechamento\s+(do\s+dia|do\s+caixa|executivo)|copiar\s+resumo/i.test(lower)) {
    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
    const pendingCount = transactions.filter(t => t.status === 'pending').length;
    const dateFormatted = new Date().toLocaleDateString('pt-BR');

    const whatsappText = `📊 *FECHAMENTO EXECUTIVO - ${dateFormatted}*\n` +
      `🏢 *Sistema:* Aura Finance PRO\n\n` +
      `🏦 *Saldo Consolidado:* ${formatCurrency(totalBalance)}\n` +
      `📈 *Entradas / Faturamento:* +${formatCurrency(totalIncome)}\n` +
      `📉 *Despesas / Saídas:* -${formatCurrency(totalExpenses)}\n` +
      `⚖️ *Resultado Líquido:* ${formatCurrency(netResult)} ${netResult >= 0 ? '(Superávit 🟢)' : '(Déficit 🔴)'}\n\n` +
      `⏳ *Contas Pendentes:* ${pendingCount} registro(s)\n` +
      `🛡️ *Saúde do Fluxo:* ${netResult >= 0 ? 'Excelente / Positiva 🟢' : 'Atenção aos custos variáveis 🔴'}\n\n` +
      `_Gerado automaticamente pelo Copiloto de IA Aura Finance PRO_`;

    return {
      intent: 'cfo_advice',
      replyText: `📱 **Relatório Executivo Pronto para WhatsApp:**\n*(Selecione e copie o texto abaixo para compartilhar com sócios ou clientes)*\n\n\`\`\`text\n${whatsappText}\n\`\`\`\n\n💡 Dica: Você também pode clicar no alto-falante 🔊 para ouvir o fechamento em voz alta!`,
      suggestedChips: ['📑 Ver no Extrato', '📊 CFO Virtual', '✅ Baixar contas pendentes'],
    };
  }

  // ==========================================
  // 7.13 CONSULTA TEMPORAL HOJE / GASTOS DE HOJE (NOVO)
  // Ex: "quanto gastei hoje?", "gastos de hoje", "entradas de hoje", "o que gastei hoje"
  // ==========================================
  if (/quanto\s+gastei\s+hoje|gastos\s+de\s+hoje|sa[ií]das\s+de\s+hoje|entradas\s+de\s+hoje|faturei\s+hoje|movimento\s+de\s+hoje/i.test(lower)) {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTxs = transactions.filter(t => t.transaction_date === todayStr);
    const todayExpenses = todayTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const todayIncome = todayTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);

    if (todayTxs.length > 0) {
      const txLines = todayTxs.slice(0, 5).map(t => 
        `• **${t.title}:** ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)} (${t.category})`
      ).join('\n');

      return {
        intent: 'query_expenses',
        replyText: `📅 **Movimentações Registradas Hoje (${new Date().toLocaleDateString('pt-BR')}):**\n\n${txLines}\n\n• **Total de Saídas Hoje:** ${formatCurrency(todayExpenses)}\n• **Total de Entradas Hoje:** ${formatCurrency(todayIncome)}\n• **Saldo do Dia:** ${formatCurrency(todayIncome - todayExpenses)}`,
        suggestedChips: ['➕ Novo Lançamento', '📊 Como tá meu caixa?', '📑 Ver no Extrato'],
      };
    } else {
      return {
        intent: 'query_expenses',
        replyText: `📅 **Hoje (${new Date().toLocaleDateString('pt-BR')}) ainda não há movimentações registradas!**\n\nSeu caixa do dia está zerado. Deseja realizar algum lançamento agora?`,
        suggestedChips: ['➕ Lançar Despesa', '💰 Lançar Receita', '📊 Saúde do Caixa'],
      };
    }
  }

  // ==========================================
  // 8. CONSULTA DE SALDO E PATRIMÔNIO (apenas se NÃO for comando de zerar)
  // ==========================================
  const hasZeroWord = /zera|limpa|apaga|reset|coloca|muda|ajusta|definir/i.test(lower);
  if (!hasZeroWord && (lower.includes('saldo') || lower.includes('quanto tenho') || lower.includes('patrimonio') || lower.includes('dinheiro tenho'))) {
    const total = accounts.reduce((acc, a) => acc + a.balance, 0);
    const breakdown = accounts.map(a => `${a.name}: ${formatCurrency(a.balance)}`).join(', ');
    return {
      intent: 'query_balance',
      replyText: `🏦 **Seu Patrimônio Total é de ${formatCurrency(total)}**.\n\nDetalhamento por conta:\n${accounts.map(a => `• **${a.name}:** ${formatCurrency(a.balance)}`).join('\n')}`,
      suggestedChips: ['📊 Como tá meu caixa?', '💸 Quanto gastei?', '💸 Fazer Transferência'],
    };
  }

  // ==========================================
  // 8.1 PARCELAMENTO AUTOMÁTICO DE COMPRAS (NOVO & EXCLUSIVO)
  // Ex: "comprei um celular em 10x de 350", "parcele 1200 em 6 vezes", "lança notebook em 12x de 450 no cartão"
  // ==========================================
  const installmentRegex1 = /(\d{1,2})\s*x(?:\s+de)?\s*(?:r\$\s*)?(\d+(?:[,\.]\d{2})?|\d+)/i;
  const installmentRegex2 = /(\d{1,2})\s+(?:vezes|parcelas)(?:\s+de)?\s*(?:r\$\s*)?(\d+(?:[,\.]\d{2})?|\d+)/i;
  const matchInst1 = input.match(installmentRegex1);
  const matchInst2 = input.match(installmentRegex2);

  if (matchInst1 || matchInst2) {
    const activeMatch = matchInst1 || matchInst2;
    if (activeMatch) {
      const installmentsCount = parseInt(activeMatch[1]);
      const installmentValue = parseFloat(activeMatch[2].replace(/\./g, '').replace(',', '.'));

      if (installmentsCount >= 2 && installmentsCount <= 60 && installmentValue > 0) {
        let productName = input
          .replace(/(?:comprei|gastei|lança(r)?|parcela(r|e)?|um|uma|no|na|cartao|cartão|de credito|de crédito)\s*/gi, '')
          .replace(/em\s+\d{1,2}\s*(?:x|vezes|parcelas).*$/gi, '')
          .replace(/\d{1,2}\s*x.*$/gi, '')
          .replace(/\d{1,2}\s+(?:vezes|parcelas).*$/gi, '')
          .trim();

        if (productName.length < 2) productName = 'Compra Parcelada';
        productName = productName.charAt(0).toUpperCase() + productName.slice(1);

        const generatedInstallments = [];
        const now = new Date();

        for (let i = 1; i <= installmentsCount; i++) {
          const dueDate = new Date(now.getFullYear(), now.getMonth() + (i - 1), now.getDate());
          const dateStr = dueDate.toISOString().split('T')[0];

          generatedInstallments.push({
            type: 'expense' as TransactionType,
            amount: parseFloat(installmentValue.toFixed(2)),
            title: `${productName} (${i}/${installmentsCount})`,
            category: /celular|computador|notebook|tv|hardware|peca/i.test(productName) ? 'Equipamentos & Hardware' : 'Outros',
            account_id: accounts[0]?.id || 'acc_btg',
            payment_method: 'Cartão de Crédito' as PaymentMethod,
            date: dateStr,
            status: i === 1 ? ('paid' as const) : ('pending' as const),
          });
        }

        const totalCalculated = installmentValue * installmentsCount;
        return {
          intent: 'create_multiple_transactions',
          multipleTransactions: generatedInstallments,
          replyText: `💳 **Parcelamento Inteligente Programado!**\n\n• **Item:** ${productName}\n• **Total:** ${formatCurrency(totalCalculated)} dividido em **${installmentsCount}x de ${formatCurrency(installmentValue)}** no Cartão de Crédito.\n• **Vencimentos:** De ${generatedInstallments[0].date} até ${generatedInstallments[generatedInstallments.length - 1].date}.\n\n✅ Primeira parcela lançada e as ${installmentsCount - 1} restantes agendadas como pendentes nos seus respectivos meses!`,
          suggestedChips: ['📑 Ver no Extrato', '💳 Abrir Cartões', '📊 Saúde do Caixa'],
        };
      }
    }
  }

  // ==========================================
  // 9. LANÇAR TRANSAÇÃO (ÚNICA OU MÚLTIPLAS / BATCH)
  // Ex: "lançamento pra gabi de 150", "lança 50 pra gabi e 100 de gasolina", "gastei 85 no almoço"
  // ==========================================
  const isLaunchVerb = /lança(r)?|lançamento(s)?|anota(r)?|registra(r)?|cadastra(r)?|adiciona(r)?|coloca(r)?|bota(r)?|passa(r)?|pix(zinho)?|pagamento/i.test(lower);
  const isIncome = /ganhei|recebi|entrou|faturei|vendi|lucro|salario|pagaram|recebimento|pix recebido|deposito/i.test(lower);
  const isExpense = /gastei|paguei|comprei|saiu|boleto|despesa|custo|debitou|debita|pagar|compra|pra |para /i.test(lower);

  // Helper para extrair dados estruturados de um trecho de texto
  const parseSegmentToTx = (segment: string) => {
    const segLower = segment.toLowerCase();
    const amountMatch = segment.match(/(\d+(?:\.\d{3})*(?:,\d{2})?|\d+(?:\.\d{2})?|\d+)/);
    if (!amountMatch) return null;

    const rawNum = amountMatch[1].replace(/\./g, '').replace(',', '.');
    const segAmount = parseFloat(rawNum);
    if (isNaN(segAmount) || segAmount <= 0) return null;

    const segIsIncome = /ganhei|recebi|entrou|faturei|vendi|lucro|salario|pagaram|recebimento|pix recebido|deposito/i.test(segLower);
    const segType: TransactionType = segIsIncome ? 'income' : 'expense';

    // 1. Identificar Data Inteligente (Ontem, Anteontem, Amanhã, Vence dia X, etc.)
    const now = new Date();
    const txDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (/\bontem\b/i.test(segLower)) {
      txDate.setDate(txDate.getDate() - 1);
    } else if (/\banteontem\b|\bantes\s+de\s+ontem\b/i.test(segLower)) {
      txDate.setDate(txDate.getDate() - 2);
    } else if (/\bamanh[aã]\b/i.test(segLower)) {
      txDate.setDate(txDate.getDate() + 1);
    } else if (/\bdepois\s+de\s+amanh[aã]\b/i.test(segLower)) {
      txDate.setDate(txDate.getDate() + 2);
    } else if (/\bm[eê]s\s+passado\b/i.test(segLower)) {
      txDate.setMonth(txDate.getMonth() - 1);
    } else {
      const dayMatch = segLower.match(/(?:dia|vence\s+dia|vencimento\s+dia)\s+(\d{1,2})/i);
      if (dayMatch) {
        const dayNum = parseInt(dayMatch[1]);
        if (dayNum >= 1 && dayNum <= 31) {
          txDate.setDate(dayNum);
        }
      } else {
        const weekdayMap: Record<string, number> = {
          domingo: 0, segunda: 1, terca: 2, terça: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6, sábado: 6
        };
        const weekMatch = segLower.match(/(?:pr[oó]xim[ao]\s+)?(domingo|segunda|ter[cç]a|quarta|quinta|sexta|s[aá]bado)/i);
        if (weekMatch) {
          const targetDay = weekdayMap[weekMatch[1].toLowerCase()];
          if (targetDay !== undefined) {
            const currentDay = txDate.getDay();
            let diff = targetDay - currentDay;
            if (diff <= 0) diff += 7;
            txDate.setDate(txDate.getDate() + diff);
          }
        }
      }
    }
    const finalDateStr = txDate.toISOString().split('T')[0];

    // Identificar Conta
    let segAccount = accounts[0] || { id: 'acc_btg', name: 'Conta Principal' };
    for (const acc of accounts) {
      const accName = acc.name.toLowerCase();
      if (
        segLower.includes(accName) || 
        (accName.includes('btg') && segLower.includes('btg')) || 
        (accName.includes('inter') && segLower.includes('inter')) || 
        (accName.includes('mercado') && segLower.includes('mercado')) || 
        (accName.includes('sicredi') && segLower.includes('sicredi'))
      ) {
        segAccount = acc;
        break;
      }
    }

    if (segLower.includes('caixa') || segLower.includes('carteira')) {
      const found = accounts.find(a => 
        a.id.includes('mp') || 
        a.name.toLowerCase().includes('mercado') || 
        a.name.toLowerCase().includes('caixa')
      );
      if (found) segAccount = found;
    }

    // Identificar Categoria
    let segCategory = segType === 'income' ? 'Vendas & Serviços Prestados' : 'Outros';
    if (/almoco|almoço|jantar|lanche|comida|mercado|padaria|restaurante|cafe|café|ifood/.test(segLower)) {
      segCategory = 'Alimentação & Refeição';
    } else if (/gasolina|combustivel|combustível|etanol|diesel|posto|uber|estacionamento|pedagio|pedágio/.test(segLower)) {
      segCategory = 'Combustível & Transporte';
    } else if (/ferramenta|parafuso|bucha|material|obra|construcao|construção|cabo|fita/.test(segLower)) {
      segCategory = 'Infraestrutura & Ferramentas';
    } else if (/camera|câmera|dvr|switch|servidor|computador|notebook|pecas|peças|hardware/.test(segLower)) {
      segCategory = 'Equipamentos & Hardware';
    } else if (/luz|agua|água|aluguel|internet|vivo|energia|claro|enel/.test(segLower)) {
      segCategory = 'Aluguel & Contas Fixas';
    }

    // Forma de Pagamento
    let segPaymentMethod: PaymentMethod = 'PIX';
    if (/credito|crédito|cartao de credito|cartão de crédito/.test(segLower)) segPaymentMethod = 'Cartão de Crédito';
    else if (/debito|débito|cartao de debito|cartão de débito/.test(segLower)) segPaymentMethod = 'Cartão de Débito';
    else if (/boleto/.test(segLower)) segPaymentMethod = 'Boleto';
    else if (/dinheiro|especie|espécie/.test(segLower)) segPaymentMethod = 'Dinheiro';

    const isPending = /a pagar|a vencer|vence|vencimento|agendado|pendente|amanh[aã]|depois de amanh[aã]/i.test(segLower) || (txDate > now);
    const segStatus: 'paid' | 'pending' = isPending ? 'pending' : 'paid';

    // Título inteligente com Fornecedores, Clientes e Pessoas
    let segTitle = segType === 'income' ? 'Entrada no Caixa' : 'Despesa Lançada';

    const personMatch = segment.match(/(?:pra|para|pro|com)\s+([a-zA-ZÀ-ÿ]+)/i);
    const storeMatch = segment.match(/(?:no|na|loja|supermercado|posto|farm[aá]cia|padaria)\s+([a-zA-ZÀ-ÿ0-9\s]+?)(?=\s+(?:de|valor|\d|ontem|amanh[aã]|hoje|$))/i);
    const clientMatch = segment.match(/(?:cliente|servi[cç]o\s+(?:do|da|de))\s+([a-zA-ZÀ-ÿ]+)/i);

    if (personMatch) {
      const personName = personMatch[1].charAt(0).toUpperCase() + personMatch[1].slice(1).toLowerCase();
      const extraWord = segment.replace(new RegExp(`.*?(?:pra|para|pro|com)\\s+${personName}\\s*`, 'i'), '').trim();
      const cleanExtra = extraWord.replace(/(?:de|no|na|ontem|amanhã|hoje|\d+|r\$|reais).*$/i, '').trim();
      if (cleanExtra.length >= 3 && !/^(pago|pix|débito|debito|crédito|credito)$/i.test(cleanExtra)) {
        segTitle = `${personName} - ${cleanExtra.charAt(0).toUpperCase() + cleanExtra.slice(1)}`;
      } else {
        segTitle = personName;
      }
    } else if (clientMatch) {
      const clientName = clientMatch[1].charAt(0).toUpperCase() + clientMatch[1].slice(1).toLowerCase();
      segTitle = `Cliente ${clientName}`;
    } else if (storeMatch) {
      const storeName = storeMatch[1].trim();
      if (storeName.length >= 3) {
        segTitle = storeName.charAt(0).toUpperCase() + storeName.slice(1);
      }
    } else {
      const cleaned = segment
        .replace(/ganhei|recebi|gastei|paguei|coloquei|coloca|lança(r)?|lançamento|anota(r)?|registra(r)?|cadastra(r)?|no caixa|na conta|reais|r\$|,00|\.00|de |ontem|amanh[aã]|hoje|anteontem/gi, '')
        .replace(/(\d+(?:\.\d{3})*(?:,\d{2})?|\d+(?:\.\d{2})?|\d+)/g, '')
        .replace(/[,;]/g, '')
        .trim();
      if (cleaned.length >= 2) {
        segTitle = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      }
    }

    return {
      type: segType,
      amount: segAmount,
      title: segTitle,
      category: segCategory,
      account_id: segAccount.id,
      payment_method: segPaymentMethod,
      date: finalDateStr,
      status: segStatus,
    };
  };

  // 7.1 Checar se há múltiplos lançamentos separados por "e", vírgula ou quebra de linha
  // Ex: "lança 50 pra gabi e 100 de gasolina", "150 pra gabi, 80 almoço, 40 uber"
  const rawSegments = input.split(/\s+e\s+|,\s*|\n+/i).map(s => s.trim()).filter(s => s.length > 0);
  if (rawSegments.length >= 2) {
    const multiTxs = rawSegments.map(s => parseSegmentToTx(s)).filter((t): t is NonNullable<typeof t> => t !== null);
    if (multiTxs.length >= 2) {
      const totalMulti = multiTxs.reduce((sum, t) => sum + t.amount, 0);
      const summaryList = multiTxs.map(t => `• **${t.title}**: ${formatCurrency(t.amount)} (${t.category} - ${t.date})`).join('\n');
      return {
        intent: 'create_multiple_transactions',
        multipleTransactions: multiTxs,
        replyText: `🚀 **Múltiplos Lançamentos Registrados (${multiTxs.length})!**\n\n${summaryList}\n\n• **Total Consolidado:** **${formatCurrency(totalMulti)}**`,
        suggestedChips: ['📑 Ver no Extrato', '↩️ Desfazer', '📊 Saúde do Caixa'],
      };
    }
  }

  // 7.2 Lançamento Único
  if (isIncome || isExpense || isLaunchVerb || lower.includes('caixa') || lower.includes('coloca')) {
    const singleTx = parseSegmentToTx(input);
    if (singleTx) {
      const targetAcc = accounts.find(a => a.id === singleTx.account_id) || accounts[0] || { name: 'Conta Principal' };
      const todayStr = new Date().toISOString().split('T')[0];
      const isToday = singleTx.date === todayStr;
      const dateDisplay = isToday ? 'Hoje' : singleTx.date;

      return {
        intent: 'create_transaction',
        replyText: `✅ **Lançamento Registrado com Sucesso!**\n\n• **Item:** ${singleTx.title}\n• **Valor:** **${formatCurrency(singleTx.amount)}** (${singleTx.type === 'income' ? 'Receita 🟢' : 'Despesa 🔴'})\n• **Conta:** ${targetAcc.name} | **Forma:** ${singleTx.payment_method}\n• **Data:** ${dateDisplay} | **Status:** ${singleTx.status === 'paid' ? 'Pago ✅' : 'Pendente ⏳'}\n• **Categoria:** ${singleTx.category}`,
        transactionData: singleTx,
        suggestedChips: [`✏️ Mudar Valor`, '📑 Ver no Extrato', '↩️ Desfazer', '📊 Como tá meu caixa?'],
      };
    }
  }

  // Default Fallback
  return {
    intent: 'general_chat',
    replyText: 'Entendi! Posso fazer lançamentos, alterar valores, cancelar gastos, zerar tudo ou abrir relatórios. O que deseja fazer?',
  };
}
