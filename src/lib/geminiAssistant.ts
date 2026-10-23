import { FinancialAccount, FinancialTransaction, TransactionType, PaymentMethod, DEFAULT_CATEGORIES } from '../types/financial';
import { formatCurrency } from './formatters';

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  imageUrl?: string;
  actionTaken?: {
    type: 
      | 'transaction_created' 
      | 'multiple_transactions_created'
      | 'bulk_paid'
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
  // 5. ALTERAR LANÇAMENTO (STATUS OU VALOR)
  // ==========================================
  if (
    lower.includes('altera') || 
    lower.includes('alterar') || 
    lower.includes('muda o') || 
    lower.includes('mudar o') || 
    lower.includes('marca como') || 
    lower.includes('marcar como') || 
    lower.includes('corrige') || 
    lower.includes('corrigir')
  ) {
    if (transactions.length === 0) {
      return {
        intent: 'general_chat',
        replyText: 'Você ainda não possui nenhum lançamento registrado para alterar.',
      };
    }

    let target = transactions[0];
    for (const t of transactions) {
      if (lower.includes(t.title.toLowerCase())) {
        target = t;
        break;
      }
    }

    // Check for status update
    if (lower.includes('pago') || lower.includes('paga') || lower.includes('liquidado')) {
      return {
        intent: 'update_transaction',
        targetTransaction: target,
        transactionUpdates: { new_status: 'paid' },
        replyText: `✅ Lançamento "${target.title}" foi marcado como PAGO.`,
      };
    }

    if (lower.includes('pendente') || lower.includes('a pagar')) {
      return {
        intent: 'update_transaction',
        targetTransaction: target,
        transactionUpdates: { new_status: 'pending' },
        replyText: `⏳ Lançamento "${target.title}" foi alterado para status PENDENTE.`,
      };
    }

    // Check for new amount
    const amountMatch = input.match(/(\d+(?:\.\d{3})*(?:,\d{2})?|\d+(?:\.\d{2})?)/);
    if (amountMatch) {
      const rawNum = amountMatch[1].replace(/\./g, '').replace(',', '.');
      const newAmount = parseFloat(rawNum);
      if (newAmount > 0) {
        return {
          intent: 'update_transaction',
          targetTransaction: target,
          transactionUpdates: { new_amount: newAmount },
          replyText: `✏️ O valor de "${target.title}" foi alterado para ${formatCurrency(newAmount)}.`,
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
  // 6. CONSULTA DE SALDO E PATRIMÔNIO (apenas se NÃO for comando de zerar)
  // ==========================================
  const hasZeroWord = /zera|limpa|apaga|reset|coloca|muda|ajusta|definir/i.test(lower);
  if (!hasZeroWord && (lower.includes('saldo') || lower.includes('quanto tenho') || lower.includes('patrimonio') || lower.includes('dinheiro tenho'))) {
    const total = accounts.reduce((acc, a) => acc + a.balance, 0);
    const breakdown = accounts.map(a => `${a.name}: ${formatCurrency(a.balance)}`).join(', ');
    return {
      intent: 'query_balance',
      replyText: `Seu patrimônio total é de ${formatCurrency(total)}. Detalhamento: ${breakdown}.`,
    };
  }

  // ==========================================
  // 7. LANÇAR TRANSAÇÃO (ÚNICA OU MÚLTIPLAS / BATCH)
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

    const isPending = /a pagar|a vencer|vence|vencimento|agendado|pendente/.test(segLower);
    const segStatus: 'paid' | 'pending' = isPending ? 'pending' : 'paid';

    // Título inteligente
    let segTitle = segType === 'income' ? 'Entrada no Caixa' : 'Despesa Lançada';

    // Captura se foi "pra [pessoa]" (ex: "pra gabi", "para o joao", "pro carlos")
    const personMatch = segment.match(/(?:pra|para|pro)\s+([a-zA-ZÀ-ÿ]+)/i);
    if (personMatch) {
      const personName = personMatch[1].charAt(0).toUpperCase() + personMatch[1].slice(1).toLowerCase();
      segTitle = `${personName}`;
    } else {
      const cleaned = segment
        .replace(/ganhei|recebi|gastei|paguei|coloquei|coloca|lança(r)?|lançamento|anota(r)?|registra(r)?|cadastra(r)?|no caixa|na conta|reais|r\$|,00|\.00|de /gi, '')
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
      date: new Date().toISOString().split('T')[0],
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
      const summaryList = multiTxs.map(t => `• ${t.title}: ${formatCurrency(t.amount)} (${t.category})`).join('\n');
      return {
        intent: 'create_multiple_transactions',
        multipleTransactions: multiTxs,
        replyText: `🚀 Perfeito! Registrei ${multiTxs.length} lançamentos de uma só vez (Total: ${formatCurrency(totalMulti)}):\n\n${summaryList}`,
      };
    }
  }

  // 7.2 Lançamento Único
  if (isIncome || isExpense || isLaunchVerb || lower.includes('caixa') || lower.includes('coloca')) {
    const singleTx = parseSegmentToTx(input);
    if (singleTx) {
      const targetAcc = accounts.find(a => a.id === singleTx.account_id) || accounts[0] || { name: 'Conta Principal' };
      return {
        intent: 'create_transaction',
        replyText: `✅ Lançamento registrado! ${singleTx.type === 'income' ? 'Receita' : 'Despesa'} "${singleTx.title}" de ${formatCurrency(singleTx.amount)} lançada na conta ${targetAcc.name} (${singleTx.category}).`,
        transactionData: singleTx,
      };
    }
  }

  // Default Fallback
  return {
    intent: 'general_chat',
    replyText: 'Entendi! Posso fazer lançamentos, alterar valores, cancelar gastos, zerar tudo ou abrir relatórios. O que deseja fazer?',
  };
}
