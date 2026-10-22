import * as XLSX from 'xlsx';
import { FinancialTransaction, FinancialAccount } from '../types/financial';
import { formatDate } from './formatters';

interface ExportExcelOptions {
  transactions: FinancialTransaction[];
  accounts: FinancialAccount[];
  fileName?: string;
}

export function exportFinancialStatementToExcel({
  transactions,
  accounts,
  fileName = `Extrato_Financeiro_${new Date().toISOString().split('T')[0]}`
}: ExportExcelOptions) {
  const accountMap = new Map(accounts.map(a => [a.id, a.name]));

  const rows = transactions.map(t => ({
    'ID': t.id,
    'Data': formatDate(t.transaction_date),
    'Tipo': t.type === 'income' ? 'Receita' : 'Despesa',
    'Descrição / Fornecedor': t.title,
    'Categoria': t.category || 'Outros',
    'Conta Bancária': accountMap.get(t.account_id) || 'Conta Padrão',
    'Forma de Pagamento': t.payment_method || 'PIX',
    'Status': t.status === 'paid' ? 'Pago' : 'Pendente',
    'Valor (R$)': t.type === 'income' ? t.amount : -t.amount,
    'Comprovante URL': t.receipt_url || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 15 }, // ID
    { wch: 12 }, // Data
    { wch: 10 }, // Tipo
    { wch: 35 }, // Descrição
    { wch: 25 }, // Categoria
    { wch: 20 }, // Conta
    { wch: 18 }, // Forma de Pagamento
    { wch: 12 }, // Status
    { wch: 15 }, // Valor
    { wch: 40 }, // Comprovante URL
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Lançamentos Financeiros');

  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
