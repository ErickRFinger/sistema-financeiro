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
  const accountsContext = accounts.map(a => `ID: "${a.id}", Nome: "${a.name}", Saldo: ${a.balance}`).join(' | ');
  const todayStr = new Date().toISOString().split('T')[0];

  const systemPrompt = `Você é o Assistente Executivo Financeiro do sistema Aura Finance.
O usuário vai falar ou digitar comandos como:
- "ganhei 1800,00 coloca no caixa" -> Criar transação de RECEITA (income), valor 1800.00
- "gastei 85 no almoço no cartão de crédito" -> Criar transação de DESPESA (expense), valor 85.00
- "paguei a conta de luz 350 reais pelo BTG" -> Criar transação de DESPESA (expense), valor 350.00
- "qual meu saldo?" -> Consultar saldo

CONTAS BANCÁRIAS REAIS EXISTENTES NO SISTEMA:
[${accountsContext}]

IMPORTANTE SOBRE AS CONTAS:
- Se o usuário disser "caixa" ou "carteira" ou não especificar, use o ID "${accounts[0]?.id || 'acc_btg'}".
- Se falar BTG, use o ID correspondente.
- Se falar Inter, use o ID correspondente.
- O campo "account_id" DEVE SER O ID EXATO (ex: "${accounts[0]?.id || 'acc_btg'}").

DATA DE HOJE: ${todayStr}

Responda APENAS em JSON estrito (sem markdown):
{
  "intent": "create_transaction",
  "replyText": "Confirmação detalhada informando o valor e conta onde foi lançado.",
  "transactionData": {
    "type": "income" ou "expense",
    "amount": 1800.00,
    "title": "Descrição limpa do lançamento",
    "category": "Vendas & Serviços Prestados" | "Alimentação & Refeição" | "Combustível & Transporte" | "Infraestrutura & Ferramentas" | "Equipamentos & Hardware" | "Aluguel & Contas Fixas" | "Outros",
    "account_id": "${accounts[0]?.id || 'acc_btg'}",
    "payment_method": "PIX" | "Cartão de Crédito" | "Cartão de Débito" | "Boleto" | "Dinheiro",
    "date": "${todayStr}",
    "status": "paid"
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

  // Sanitize transaction data if returned
  if (parsed.transactionData && Number(parsed.transactionData.amount) > 0) {
    const rawType = String(parsed.transactionData.type || '').toLowerCase();
    parsed.transactionData.type = (
      rawType.includes('receita') || 
      rawType.includes('entrada') || 
      rawType.includes('ganho') || 
      rawType.includes('venda') || 
      rawType === 'income'
    ) ? 'income' : 'expense';

    parsed.transactionData.amount = Math.abs(Number(parsed.transactionData.amount));

    // Force valid account ID
    const targetId = String(parsed.transactionData.account_id || '').toLowerCase();
    const matchedAcc = accounts.find(a => a.id === targetId || a.name.toLowerCase().includes(targetId));
    if (matchedAcc) {
      parsed.transactionData.account_id = matchedAcc.id;
    } else {
      parsed.transactionData.account_id = accounts[0]?.id || 'acc_btg';
    }

    parsed.intent = 'create_transaction';
  }

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
  let amount = 0;
  const amountMatch = input.match(/(\d+(?:\.\d{3})*(?:,\d{2})?|\d+(?:\.\d{2})?)/);
  if (amountMatch) {
    const rawNum = amountMatch[1].replace(/\./g, '').replace(',', '.');
    amount = parseFloat(rawNum);
  }

  // 3. Determine Income vs Expense
  const isIncome = /ganhei|recebi|entrou|faturei|vendi|lucro|salario|pagaram|recebimento|pix recebido|deposito/i.test(lower);
  const isExpense = /gastei|paguei|comprei|saiu|boleto|despesa|custo|debitou|debita|pagar|compra/i.test(lower);

  const type: TransactionType = (isIncome && !isExpense) || lower.includes('ganhei') || lower.includes('recebi') ? 'income' : 'expense';

  // 4. Determine Target Bank Account
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

  // If user says "caixa" or "carteira"
  if (lower.includes('caixa') || lower.includes('carteira')) {
    const found = accounts.find(a => 
      a.id === 'acc_mp' || 
      a.name.toLowerCase().includes('mercado') || 
      a.name.toLowerCase().includes('caixa')
    );
    if (found) targetAccount = found;
  }

  // 5. Category detection
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

  // 6. Payment method
  let payment_method: PaymentMethod = 'PIX';
  if (/credito|crédito|cartao de credito|cartão de crédito/.test(lower)) payment_method = 'Cartão de Crédito';
  else if (/debito|débito|cartao de debito|cartão de débito/.test(lower)) payment_method = 'Cartão de Débito';
  else if (/boleto/.test(lower)) payment_method = 'Boleto';
  else if (/dinheiro|especie|espécie/.test(lower)) payment_method = 'Dinheiro';
  else if (/ted|transferencia|transferência/.test(lower)) payment_method = 'Transferência';

  // 7. Status (paid vs pending)
  const isPending = /a pagar|a vencer|vence|vencimento|agendado|pendente/.test(lower);
  const status: 'paid' | 'pending' = isPending ? 'pending' : 'paid';

  // 8. Clean title
  let title = type === 'income' ? 'Entrada no Caixa' : 'Despesa Lançada';
  const cleanedTitle = input
    .replace(/ganhei|recebi|gastei|paguei|coloquei|coloca|no caixa|na conta|reais|r\$|,00|\.00/gi, '')
    .replace(/(\d+(?:\.\d{3})*(?:,\d{2})?|\d+(?:\.\d{2})?)/g, '')
    .replace(/[,;]/g, '')
    .trim();

  if (cleanedTitle.length >= 3) {
    title = cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1);
  }

  if (amount > 0) {
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

  return {
    intent: 'general_chat',
    replyText: 'Entendi! Para lançar um valor automaticamente, você pode dizer por exemplo: "Ganhei 1800,00 coloca no caixa" ou "Gastei 45 no almoço".',
  };
}
