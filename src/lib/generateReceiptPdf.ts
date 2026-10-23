import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency } from './formatters';

interface ReceiptData {
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  referenceMonth: string;
  amount: number;
  paymentId: string | number;
  paymentDate: string;
  paymentMethod: string;
}

/**
 * Gera Recibo Oficial de Quitação em PDF com Design Black & Gold Executivo
 */
export function generateReceiptPdf(data: ReceiptData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Background Header Banner
  doc.setFillColor(13, 16, 23); // #0D1017
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Gold accent line
  doc.setFillColor(250, 204, 21); // #FACC15
  doc.rect(0, 44, pageWidth, 1.5, 'F');

  // System Logo & Brand
  doc.setTextColor(250, 204, 21);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('⚡ AURA FINANCE PRO', 14, 22);

  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Gestão Financeira Inteligente (SaaS)', 14, 29);
  doc.text('CNPJ Emissor: 00.000.000/0001-00 • suporte@aurafinance.com.br', 14, 35);

  // Document Title Badge
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('COMPROVANTE DE QUITAÇÃO', pageWidth - 14, 22, { align: 'right' });

  doc.setFontSize(9);
  doc.setTextColor(250, 204, 21);
  doc.text(`FATURA Nº: ${data.invoiceNumber}`, pageWidth - 14, 29, { align: 'right' });

  // Status Box: PAGO & QUITADO
  doc.setFillColor(22, 101, 52); // Emerald 800
  doc.roundedRect(pageWidth - 65, 34, 51, 7, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('✓ STATUS: QUITADO / PAGO', pageWidth - 39.5, 39, { align: 'center' });

  // Body Content
  let y = 60;

  // Section 1: Dados do Cliente
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. DADOS DO ASSINANTE', 14, y);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(14, y + 2, pageWidth - 14, y + 2);

  y += 10;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Nome do Titular:', 14, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(data.customerName || 'Assinante Aura', 50, y);

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('E-mail Cadastrado:', 14, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(data.customerEmail || 'Não informado', 50, y);

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Mês de Referência:', 14, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(data.referenceMonth, 50, y);

  // Section 2: Detalhes do Pagamento
  y += 16;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('2. DETALHAMENTO DO PAGAMENTO', 14, y);
  doc.line(14, y + 2, pageWidth - 14, y + 2);

  y += 10;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Data do Pagamento:', 14, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(data.paymentDate, 55, y);

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Forma de Pagamento:', 14, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${data.paymentMethod} (Processado via Mercado Pago)`, 55, y);

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Código de Autenticação MP:', 14, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(String(data.paymentId), 55, y);

  // Summary Box with Total Amount
  y += 14;
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.roundedRect(14, y, pageWidth - 28, 26, 3, 3, 'FD');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('VALOR TOTAL PAGO E LIQUIDADO:', 22, y + 16);

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(161, 98, 7); // Gold/Dark Amber
  doc.text(formatCurrency(data.amount), pageWidth - 22, y + 17, { align: 'right' });

  // Legal Term
  y += 40;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  const legalText =
    'Declaramos para os devidos fins fiscais e contábeis que os valores acima discriminados foram devidamente quitados e compensados através da instituição parceira Mercado Pago Instituição de Pagamento LTDA. Este recibo possui validade jurídica como comprovante de prestação de serviços de software como serviço (SaaS).';
  doc.text(legalText, 14, y, { maxWidth: pageWidth - 28 });

  // Footer Signature Line
  y += 35;
  doc.setDrawColor(148, 163, 184);
  doc.line(pageWidth / 2 - 40, y, pageWidth / 2 + 40, y);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('AURA FINANCE PRO • DEPARTAMENTO FINANCEIRO', pageWidth / 2, y + 5, { align: 'center' });

  // Save/Download PDF
  const filename = `Recibo_AuraFinance_${data.referenceMonth.replace('/', '_')}_${data.invoiceNumber}.pdf`;
  doc.save(filename);
}
