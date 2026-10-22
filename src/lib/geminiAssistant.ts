import { FinancialAccount, FinancialTransaction, TransactionType, PaymentMethod, DEFAULT_CATEGORIES } from '../types/financial';
import { formatCurrency } from './formatters';

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionTaken?: {
    type: 'transaction_created' | 'balance_queried' | 'advice_given';
    transaction?: any;
  };
}

export interface AssistantActionPayload {
  intent: 'create_transaction' | 'query_balance' | 'query_expenses' | 'cfo_advice' | 'general_chat';
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

  // Fallback: Local High-Precision NLP Engine (No key required!)
  return processWithLocalNLP(cleanInput, accounts, transactions);
}

/**
 * Gemini 1.5 Flash Engine with Structured Intent & Financial Function Calling
 */
async function processWithGeminiAPI(
  userInput: string,
  accounts: FinancialAccount[],
  transactions: FinancialTransaction[],
  apiKey: string
): Promise<AssistantActionPayload | null> {
  const accountsContext = accounts.map(a => `ID: ${a.id}, Nome: ${a.name}, Saldo: R$ ${a.balance}`).join(' | ');
  const todayStr = new Date().toISOString().split('T')[0];

  const systemPrompt = `Você é o Assistente Executivo Financeiro Inteligente do sistema Aura Finance.
O usuário vai falar ou digitar comandos como:
- "ganhei 1800,00 coloca no caixa"
- "gastei 85 no almoço no cartão de crédito"
- "qual meu saldo?"
- "lança conta de luz de 320 reais a pagar dia 20"

Contas disponíveis no sistema: [${accountsContext}]
Data de hoje: ${todayStr}

Analise a intenção e responda ESTRITAMENTE em formato JSON (sem markdown em volta):
{
  "intent": "create_transaction" | "query_balance" | "query_expenses" | "cfo_advice" | "general_chat",
  "replyText": "Resposta amigável, clara e objetiva para o usuário em português.",
  "transactionData": {
    "type": "income" | "expense",
    "amount": 1800.00,
    "title": "Descrição clara do lançamento",
    "category": "Alimentação & Refeição" | "Combustível & Transporte" | "Infraestrutura & Ferramentas" | "Equipamentos & Hardware" | "Vendas & Serviços Prestados" | "Aluguel & Contas Fixas" | "Outros",
    "account_id": "ID exato da conta mais apropriada das disponíveis",
    "payment_method": "PIX" | "Cartão de Crédito" | "Cartão de Débito" | "Boleto" | "Dinheiro" | "Transferência",
    "date": "YYYY-MM-DD",
    "status": "paid" | "pending"
  }
}
Se for query_balance ou geral, transactionData pode ser nulo.`;

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

  const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(clean);

  return parsed;
}

/**
 * Local Rule-based NLP Engine (Works instantly with ZERO API keys)
 */
function processWithLocalNLP(
  input: string,
  accounts: FinancialAccount[],
  transactions: FinancialTransaction[]
): AssistantActionPayload {
  const lower = input.toLowerCase();

  // 1. Balance Query intent
  if (lower.includes('saldo') || lower.includes('quanto tenho') || lower.includes('patrimonio') || lower.includes('dinheiro tenho')) {
    const total = accounts.reduce((acc, a) => acc + a.balance, 0);
    const breakdown = accounts.map(a => `${a.name}: ${formatCurrency(a.balance)}`).join(', ');
    return {
      intent: 'query_balance',
      replyText: `Seu patrimônio total hoje é de ${formatCurrency(total)}. Detalhamento: ${breakdown}.`,
    };
  }

  // 2. Extract Amount
  // matches "1800", "1800,00", "1.800,00", "1800.00", "85", "45,50"
  let amount = 0;
  const amountMatch = input.match(/(\d+(?:\.\d{3})*(?:,\d{2})?|\d+(?:\.\d{2})?)/);
  if (amountMatch) {
    const rawNum = amountMatch[1].replace(/\./g, '').replace(',', '.');
    amount = parseFloat(rawNum);
  }

  // 3. Determine Income vs Expense
  const isIncome = /ganhei|recebi|entrou|faturei|vendi|lucro|salario|pagaram|recebimento|pix recebido/i.test(lower);
  const isExpense = /gastei|paguei|comprei|saiu|boleto|despesa|custo|debitou|pago|pagar/i.test(lower);

  const type: TransactionType = isIncome ? 'income' : 'expense';

  // 4. Determine Target Bank Account
  let targetAccount = accounts[0];
  for (const acc of accounts) {
    const accName = acc.name.toLowerCase();
    if (lower.includes(accName) || (accName.includes('btg') && lower.includes('btg')) || (accName.includes('inter') && lower.includes('inter')) || (accName.includes('mercado') && lower.includes('mercado')) || (accName.includes('sicredi') && lower.includes('sicredi'))) {
      targetAccount = acc;
      break;
    }
  }

  // If user says "caixa" or "carteira"
  if (lower.includes('caixa') || lower.includes('carteira')) {
    const found = accounts.find(a => a.name.toLowerCase().includes('mercado') || a.name.toLowerCase().includes('caixa') || a.name.toLowerCase().includes('inter'));
    if (found) targetAccount = found;
  }

  // 5. Category detection
  let category = isIncome ? 'Vendas & Serviços Prestados' : 'Outros';
  if (/almoco|jantar|lanche|comida|mercado|padaria|restaurante|cafe|ifood/.test(lower)) {
    category = 'Alimentação & Refeição';
  } else if (/gasolina|combustivel|etanol|diesel|posto|uber|estacionamento|pedagio/.test(lower)) {
    category = 'Combustível & Transporte';
  } else if (/ferramenta|parafuso|bucha|material|obra|construcao|cabo|fita/.test(lower)) {
    category = 'Infraestrutura & Ferramentas';
  } else if (/camera|dvr|switch|servidor|computador|notebook|pecas|hardware/.test(lower)) {
    category = 'Equipamentos & Hardware';
  } else if (/luz|agua|aluguel|internet|vivo|energia|claro|enel/.test(lower)) {
    category = 'Aluguel & Contas Fixas';
  }

  // 6. Payment method
  let payment_method: PaymentMethod = 'PIX';
  if (/credito|cartao de credito/.test(lower)) payment_method = 'Cartão de Crédito';
  else if (/debito|cartao de debito/.test(lower)) payment_method = 'Cartão de Débito';
  else if (/boleto/.test(lower)) payment_method = 'Boleto';
  else if (/dinheiro|especie/.test(lower)) payment_method = 'Dinheiro';
  else if (/ted|transferencia/.test(lower)) payment_method = 'Transferência';

  // 7. Status (paid vs pending)
  const isPending = /a pagar|a vencer|vence|vencimento|agendado|pendente/.test(lower);
  const status: 'paid' | 'pending' = isPending ? 'pending' : 'paid';

  // 8. Title formulation
  let title = isIncome ? 'Recebimento / Venda' : 'Despesa Lançada por IA';
  const cleanedTitle = input
    .replace(/ganhei|recebi|gastei|paguei|coloquei|coloca|no caixa|na conta|reais|r\$/gi, '')
    .replace(/(\d+(?:\.\d{3})*(?:,\d{2})?|\d+(?:\.\d{2})?)/, '')
    .trim();

  if (cleanedTitle.length >= 3) {
    title = cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1);
  }

  if (amount > 0) {
    return {
      intent: 'create_transaction',
      replyText: `Pronto! Registrei ${type === 'income' ? 'uma entrada' : 'uma saída'} de ${formatCurrency(amount)} na conta ${targetAccount.name} (${category}).`,
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

  return {
    intent: 'general_chat',
    replyText: 'Entendi! Para lançar, você pode dizer por exemplo: "Ganhei 1800 coloca no caixa" ou "Gastei 45 no almoço com cartão".',
  };
}
