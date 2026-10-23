export type TransactionType = 'expense' | 'income';

export type TransactionStatus = 'paid' | 'pending' | 'overdue' | 'cancelled';

export type PaymentMethod = 
  | 'PIX'
  | 'Boleto'
  | 'Cartão de Crédito'
  | 'Cartão de Débito'
  | 'Transferência'
  | 'Dinheiro'
  | 'Outro';

export interface FinancialAccount {
  id: string;
  name: string;
  color: string;
  balance: number;
  created_at?: string;
}

export interface FinancialTransaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  account_id: string;
  category: string;
  transaction_date: string; // YYYY-MM-DD
  status: TransactionStatus;
  created_at?: string;
  
  // Extended metadata (extracted from receipt, stored in description or notes)
  receipt_url?: string | null;
  payment_method?: PaymentMethod;
  notes?: string;
  supplier_name?: string;
  supplier_cnpj?: string;
  installments_current?: number;
  installments_total?: number;
}

export interface FinancialInvestment {
  id: string;
  name: string;
  category: string;
  account_id: string;
  initial_amount: number;
  current_amount: number;
  last_updated: string;
  created_at?: string;
}

export interface InvoiceExtractedData {
  supplier_name: string;
  supplier_cnpj: string;
  invoice_number?: string;
  access_key?: string; // Chave de acesso 44 dígitos
  date: string; // YYYY-MM-DD
  total_amount: number;
  payment_method: PaymentMethod;
  category: string;
  items: Array<{
    description: string;
    quantity?: number;
    unit_price?: number;
    total_price: number;
  }>;
  raw_text?: string;
  confidence: number;
  receipt_file?: File;
  receipt_url?: string;
}

export interface DateFilterPreset {
  label: string;
  value: 'today' | '7days' | 'this_month' | 'last_month' | 'this_year' | 'custom' | 'all';
}

export interface FinancialFilters {
  search: string;
  preset: 'today' | '7days' | 'this_month' | 'last_month' | 'this_year' | 'custom' | 'all';
  startDate?: string;
  endDate?: string;
  type?: 'all' | TransactionType;
  status?: 'all' | TransactionStatus;
  category?: string;
  accountId?: string;
}

export const INITIAL_DEFAULT_ACCOUNTS: FinancialAccount[] = [
  { id: 'acc_btg', name: 'BTG Pactual', color: '#facc15', balance: 5000.0 },
  { id: 'acc_inter', name: 'Banco Inter', color: '#f97316', balance: 3200.0 },
  { id: 'acc_sicredi', name: 'Sicredi', color: '#10b981', balance: 1800.0 },
  { id: 'acc_mp', name: 'Mercado Pago', color: '#06b6d4', balance: 1200.0 },
];

export const DEFAULT_CATEGORIES: FinancialCategory[] = [
  { name: 'Alimentação & Refeição', icon: 'Utensils', color: '#f59e0b' },
  { name: 'Fornecedores & Peças', icon: 'Truck', color: '#eab308' },
  { name: 'Infraestrutura & Ferramentas', icon: 'Wrench', color: '#ca8a04' },
  { name: 'Combustível & Transporte', icon: 'Car', color: '#facc15' },
  { name: 'Serviços & Internet', icon: 'Wifi', color: '#38bdf8' },
  { name: 'Aluguel & Contas Fixas', icon: 'Home', color: '#a855f7' },
  { name: 'Equipamentos & Hardware', icon: 'Cpu', color: '#ec4899' },
  { name: 'Vendas & Serviços Prestados', icon: 'TrendingUp', color: '#22c55e' },
  { name: 'Salários & Pró-labore', icon: 'Users', color: '#14b8a6' },
  { name: 'Marketing & Comercial', icon: 'Megaphone', color: '#fb923c' },
  { name: 'Impostos & Taxas', icon: 'FileText', color: '#ef4444' },
  { name: 'Outros', icon: 'MoreHorizontal', color: '#94a3b8' },
];

export interface CreditCard {
  id: string;
  user_id?: string;
  name: string; // Ex: "Nubank Ultravioleta", "Inter Black", "XP Infinite"
  bank: string; // Ex: "Nubank", "Banco Inter", "BTG", "XP", "Itaú", "Bradesco", "Santander", "C6 Bank", "Caixa", "Outro"
  color: string; // "black" | "gold" | "purple" | "orange" | "blue" | "emerald" | "rose"
  limit_total: number;
  closing_day: number; // Dia de fechamento da fatura (1 a 31)
  due_day: number; // Dia de vencimento da fatura (1 a 31)
  card_brand?: 'visa' | 'mastercard' | 'elo' | 'amex' | 'outro';
  last_digits?: string; // Ex: "4892"
  created_at?: string;
}

export interface CreditCardExpense {
  id: string;
  card_id: string;
  user_id?: string;
  title: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: string;
  installments_current?: number;
  installments_total?: number;
  created_at?: string;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string; // 'un', 'kg', 'g', 'l', 'pct', 'cx'
  estimated_price?: number;
  actual_price?: number;
  is_purchased: boolean;
  category?: string;
}

export interface ShoppingList {
  id: string;
  user_id?: string;
  title: string;
  category: 'Mercado' | 'Casa' | 'Construção' | 'Farmácia' | 'Escritório' | 'Outros';
  items: ShoppingListItem[];
  is_completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SystemSubscriptionInvoice {
  id: string;
  user_id: string;
  reference_month: string; // "2026-10"
  reference_label: string; // "Outubro 2026"
  due_date: string; // "2026-10-10"
  amount: number; // 9.90
  status: 'paid' | 'pending' | 'overdue';
  paid_at?: string;
  payment_method?: string;
  mp_payment_id?: string;
}

export interface CategoryBudget {
  category: string;
  monthly_limit: number;
}

export interface FinancialCategory {
  name: string;
  icon: string;
  color: string;
}

