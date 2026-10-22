import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FinancialTransaction, FinancialAccount } from '../types/financial';
import { formatCurrency, formatDate } from './formatters';

interface ExportPDFOptions {
  transactions: FinancialTransaction[];
  accounts: FinancialAccount[];
  title?: string;
  periodLabel?: string;
  companyName?: string;
}

export function generateFinancialStatementPDF({
  transactions,
  accounts,
  title = 'EXTRATO FINANCEIRO GERENCIAL',
  periodLabel = 'Período Completo',
  companyName = 'AURA FINANCE'
}: ExportPDFOptions) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Background (Dark sleek)
  doc.setFillColor(13, 16, 23); // #0d1017
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Gold accent bar
  doc.setFillColor(250, 204, 21); // #facc15
  doc.rect(0, 39, pageWidth, 1.5, 'F');

  // Logo / Brand
  doc.setTextColor(250, 204, 21);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName.toUpperCase(), 14, 18);

  // Document Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 14, 26);

  // Period & Generation Date
  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFontSize(9);
  doc.text(`Período: ${periodLabel}`, 14, 33);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth - 14, 33, { align: 'right' });

  // Summary Metrics calculations
  const totalIncome = transactions
    .filter(t => t.type === 'income' && t.status === 'paid')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense' && t.status === 'paid')
    .reduce((acc, t) => acc + t.amount, 0);

  const pendingExpenses = transactions
    .filter(t => t.type === 'expense' && t.status !== 'paid')
    .reduce((acc, t) => acc + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Metric Cards
  let yPos = 48;
  const cardWidth = (pageWidth - 28 - 9) / 4;

  // Helper to draw metric card
  const drawMetricCard = (x: number, label: string, val: string, color: [number, number, number]) => {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, yPos, cardWidth, 18, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, yPos, cardWidth, 18, 2, 2, 'S');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(label.toUpperCase(), x + 4, yPos + 6);

    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(val, x + 4, yPos + 13.5);
  };

  drawMetricCard(14, 'Total Entradas', formatCurrency(totalIncome), [22, 163, 74]); // Green
  drawMetricCard(14 + cardWidth + 3, 'Total Saídas', formatCurrency(totalExpense), [220, 38, 38]); // Red
  drawMetricCard(14 + (cardWidth + 3) * 2, 'Saldo Líquido', formatCurrency(netBalance), netBalance >= 0 ? [22, 163, 74] : [220, 38, 38]);
  drawMetricCard(14 + (cardWidth + 3) * 3, 'A Pagar (Pendente)', formatCurrency(pendingExpenses), [202, 138, 4]); // Gold/Amber

  // Accounts Map
  const accountMap = new Map(accounts.map(a => [a.id, a.name]));

  // AutoTable
  const tableRows = transactions.map(t => [
    formatDate(t.transaction_date),
    t.title,
    t.category || 'Geral',
    accountMap.get(t.account_id) || 'Conta Principal',
    t.status === 'paid' ? 'Pago' : 'Pendente',
    `${t.type === 'income' ? '+ ' : '- '} ${formatCurrency(t.amount)}`
  ]);

  autoTable(doc, {
    startY: 72,
    head: [['Data', 'Descrição / Fornecedor', 'Categoria', 'Conta', 'Status', 'Valor']],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [18, 22, 32], // Dark obsidian
      textColor: [250, 204, 21], // Gold
      fontStyle: 'bold',
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 22, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 32 },
      3: { cellWidth: 28 },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      // Color value cells red/green
      if (data.section === 'body' && data.column.index === 5) {
        const text = String(data.cell.raw);
        if (text.startsWith('+')) {
          data.cell.styles.textColor = [22, 163, 74];
        } else {
          data.cell.styles.textColor = [220, 38, 38];
        }
      }
      // Status badge color
      if (data.section === 'body' && data.column.index === 4) {
        const text = String(data.cell.raw);
        if (text === 'Pago') {
          data.cell.styles.textColor = [22, 163, 74];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [202, 138, 4];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    foot: [
      ['', '', '', '', 'SALDO:', formatCurrency(netBalance)]
    ],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: netBalance >= 0 ? [22, 163, 74] : [220, 38, 38],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'right'
    }
  });

  // Footer page numbers
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Página ${i} de ${totalPages} | ${companyName} - Sistema Financeiro`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
  }

  // Save PDF
  const filename = `Extrato_Financeiro_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
