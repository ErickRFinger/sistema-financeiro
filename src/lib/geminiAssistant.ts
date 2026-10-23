import { FinancialAccount, FinancialTransaction, TransactionType, PaymentMethod, DEFAULT_CATEGORIES } from '../types/financial';
import { formatCurrency } from './formatters';

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  imageUrl?: string;
  actionTaken?: {
    type: 'transaction_created' | 'transaction_deleted' | 'transaction_updated' | 'data_reset' | 'undo_executed' | 'screen_opened' | 'investment_created' | 'bank_print_processed';
    transaction?: any;
    previousState?: any;
    investment?: any;
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
    | 'delete_transaction' 
    | 'update_transaction' 
    | 'reset_all_data' 
    | 'undo_action' 
    | 'open_screen' 
    | 'query_balance' 
    | 'query_expenses' 
    | 'cfo_advice' 
    | 'create_investment'
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
  targetTransaction?: FinancialTransaction;
  transactionUpdates?: {
    new_amount?: number;
    new_status?: 'paid' | 'pending';
    new_category?: string;
    new_account_id?: string;
  };
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
Você tem poder de controle TOTAL sobre o sistema. Se o usuário mandar lançar, alterar, cancelar, excluir, zerar tudo ou voltar, você executa a ação.

CONTAS BANCÁRIAS DISPONÍVEIS:
[${accountsContext}]

ÚLTIMOS LANÇAMENTOS DO USUÁRIO:
[${recentTxsContext}]

DATA DE HOJE: ${todayStr}

Comandos que você deve reconhecer:
1. CRIAR: "ganhei 1800 coloca no caixa", "gastei 85 no almoço", "comprei parafusos 120" -> intent: "create_transaction"
2. ZERAR TUDO: "zera tudo", "zerar tudo", "limpa todos os lançamentos", "apaga tudo" -> intent: "reset_all_data"
3. VOLTAR / DESFAZER: "volta", "desfaz", "cancela a última ação", "desfazer" -> intent: "undo_action"
4. EXCLUIR / CANCELAR: "exclui o último lançamento", "cancela o almoço", "apaga a conta de luz" -> intent: "delete_transaction"
5. ALTERAR: "altera o almoço para 95 reais", "muda o valor para 200", "marca como pago", "marca como pendente" -> intent: "update_transaction"
6. ABRIR TELAS: "abre o leitor de nota fiscal", "abre o extrato", "cobrar com mercado pago", "abre o cfo" -> intent: "open_screen"
7. SALDO: "qual meu saldo?", "quanto tenho?" -> intent: "query_balance"

Responda APENAS em JSON estrito (sem markdown):
{
  "intent": "create_transaction" | "delete_transaction" | "update_transaction" | "reset_all_data" | "undo_action" | "open_screen" | "query_balance" | "general_chat",
  "replyText": "Resposta clara em português confirmando o que você executou.",
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
  if (
    lower.includes('zera tudo') || 
    lower.includes('zerar tudo') || 
    lower.includes('limpa tudo') || 
    lower.includes('limpar tudo') || 
    lower.includes('resetar tudo') || 
    lower.includes('apaga tudo') ||
    lower.includes('apagar tudo') ||
    lower.includes('zera meus dados') ||
    lower.includes('reiniciar dados')
  ) {
    return {
      intent: 'reset_all_data',
      replyText: '⚠️ Entendido! Zerei todos os lançamentos e reiniciei suas contas bancárias com saldo R$ 0,00.',
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
  // 4. ALTERAR LANÇAMENTO
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
  // 6. CONSULTA DE SALDO E PATRIMÔNIO
  // ==========================================
  if (lower.includes('saldo') || lower.includes('quanto tenho') || lower.includes('patrimonio') || lower.includes('dinheiro tenho')) {
    const total = accounts.reduce((acc, a) => acc + a.balance, 0);
    const breakdown = accounts.map(a => `${a.name}: ${formatCurrency(a.balance)}`).join(', ');
    return {
      intent: 'query_balance',
      replyText: `Seu patrimônio total é de ${formatCurrency(total)}. Detalhamento: ${breakdown}.`,
    };
  }

  // ==========================================
  // 7. LANÇAR TRANSAÇÃO (RECEITA / DESPESA)
  // ==========================================
  let amount = 0;
  const amountMatch = input.match(/(\d+(?:\.\d{3})*(?:,\d{2})?|\d+(?:\.\d{2})?)/);
  if (amountMatch) {
    const rawNum = amountMatch[1].replace(/\./g, '').replace(',', '.');
    amount = parseFloat(rawNum);
  }

  const isIncome = /ganhei|recebi|entrou|faturei|vendi|lucro|salario|pagaram|recebimento|pix recebido|deposito/i.test(lower);
  const isExpense = /gastei|paguei|comprei|saiu|boleto|despesa|custo|debitou|debita|pagar|compra/i.test(lower);

  if (amount > 0 && (isIncome || isExpense || lower.includes('caixa') || lower.includes('coloca'))) {
    const type: TransactionType = (isIncome && !isExpense) || lower.includes('ganhei') || lower.includes('recebi') ? 'income' : 'expense';

    let targetAccount = accounts[0] || { id: 'acc_btg', name: 'Conta Principal' };
    for (const acc of accounts) {
      const accName = acc.name.toLowerCase();
      if (
        lower.includes(accName) || 
        (accName.includes('btg') && lower.includes('btg')) || 
        (accName.includes('inter') && lower.includes('inter')) || 
        (accName.includes('mercado') && lower.includes('mercado')) || 
        (accName.includes('sicredi') && lower.includes('sicredi'))
      ) {
        targetAccount = acc;
        break;
      }
    }

    if (lower.includes('caixa') || lower.includes('carteira')) {
      const found = accounts.find(a => 
        a.id.includes('mp') || 
        a.name.toLowerCase().includes('mercado') || 
        a.name.toLowerCase().includes('caixa')
      );
      if (found) targetAccount = found;
    }

    let category = type === 'income' ? 'Vendas & Serviços Prestados' : 'Outros';
    if (/almoco|almoço|jantar|lanche|comida|mercado|padaria|restaurante|cafe|café|ifood/.test(lower)) {
      category = 'Alimentação & Refeição';
    } else if (/gasolina|combustivel|combustível|etanol|diesel|posto|uber|estacionamento|pedagio|pedágio/.test(lower)) {
      category = 'Combustível & Transporte';
    } else if (/ferramenta|parafuso|bucha|material|obra|construcao|construção|cabo|fita/.test(lower)) {
      category = 'Infraestrutura & Ferramentas';
    } else if (/camera|câmera|dvr|switch|servidor|computador|notebook|pecas|peças|hardware/.test(lower)) {
      category = 'Equipamentos & Hardware';
    } else if (/luz|agua|água|aluguel|internet|vivo|energia|claro|enel/.test(lower)) {
      category = 'Aluguel & Contas Fixas';
    }

    let payment_method: PaymentMethod = 'PIX';
    if (/credito|crédito|cartao de credito|cartão de crédito/.test(lower)) payment_method = 'Cartão de Crédito';
    else if (/debito|débito|cartao de debito|cartão de débito/.test(lower)) payment_method = 'Cartão de Débito';
    else if (/boleto/.test(lower)) payment_method = 'Boleto';
    else if (/dinheiro|especie|espécie/.test(lower)) payment_method = 'Dinheiro';

    const isPending = /a pagar|a vencer|vence|vencimento|agendado|pendente/.test(lower);
    const status: 'paid' | 'pending' = isPending ? 'pending' : 'paid';

    let title = type === 'income' ? 'Entrada no Caixa' : 'Despesa Lançada';
    const cleanedTitle = input
      .replace(/ganhei|recebi|gastei|paguei|coloquei|coloca|no caixa|na conta|reais|r\$|,00|\.00/gi, '')
      .replace(/(\d+(?:\.\d{3})*(?:,\d{2})?|\d+(?:\.\d{2})?)/g, '')
      .replace(/[,;]/g, '')
      .trim();

    if (cleanedTitle.length >= 3) {
      title = cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1);
    }

    return {
      intent: 'create_transaction',
      replyText: `✅ Lançamento registrado! ${type === 'income' ? 'Receita' : 'Despesa'} de ${formatCurrency(amount)} adicionada na conta ${targetAccount.name} (${category}).`,
      transactionData: {
        type,
        amount,
        title,
        category,
        account_id: targetAccount.id,
        payment_method,
        date: new Date().toISOString().split('T')[0],
        status,
      },
    };
  }

  // Default Fallback
  return {
    intent: 'general_chat',
    replyText: 'Entendi! Posso fazer lançamentos, alterar valores, cancelar gastos, zerar tudo ou abrir relatórios. O que deseja fazer?',
  };
}
