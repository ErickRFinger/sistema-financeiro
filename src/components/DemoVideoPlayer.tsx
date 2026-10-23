import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Download, 
  Sparkles, 
  CheckCircle2,
  Tv
} from 'lucide-react';

interface Scene {
  id: string;
  audioKey: string;
  title: string;
  badge: string;
  duration: number;
  narration: string;
  draw: (ctx: CanvasRenderingContext2D, t: number) => void;
}

export const DemoVideoPlayer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [currentSceneIdx, setCurrentSceneIdx] = useState<number>(0);
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(true);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [subtitle, setSubtitle] = useState<string>('Bem-vindo ao Aura Finance PRO: o seu ecossistema financeiro definitivo com design Black and Cyber Gold.');

  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameId = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const currentTimeRef = useRef<number>(0);
  const currentSceneIdxRef = useRef<number>(-1);
  const isVoiceActiveRef = useRef<boolean>(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // -------------------------------------------------------------
  // CANVAS DRAWING HELPERS
  // -------------------------------------------------------------
  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    const grad = ctx.createRadialGradient(640, 360, 50, 640, 360, 750);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1280, 720);

    // Subtle golden cyber grid lines
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1280; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 720);
      ctx.stroke();
    }
    for (let y = 0; y < 720; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1280, y);
      ctx.stroke();
    }
  };

  const drawHeaderBadge = (ctx: CanvasRenderingContext2D, title: string, badge: string) => {
    ctx.fillStyle = 'rgba(250, 204, 21, 0.15)';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.5;
    roundRect(ctx, 60, 45, 230, 32, 16);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ ' + badge, 175, 66);

    ctx.font = '900 28px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(title, 60, 125);
  };

  const drawMetricCard = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label: string, value: string, sub: string, color: string) => {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.2)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, w, h, 20);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'left';
    ctx.fillText(label.toUpperCase(), x + 24, y + 36);

    ctx.font = '900 28px Inter, sans-serif';
    ctx.fillStyle = color;
    ctx.fillText(value, x + 24, y + 80);

    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(sub, x + 24, y + 108);
  };

  const drawFeatureCard = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, title: string, desc: string) => {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.2)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, w, h, 18);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.textAlign = 'left';
    ctx.fillText(title, x + 24, y + 45);

    ctx.font = '14px Inter, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(desc, x + 24, y + 85);
  };

  const drawInvoiceItem = (ctx: CanvasRenderingContext2D, x: number, y: number, date: string, name: string, price: string) => {
    ctx.fillStyle = 'rgba(30, 41, 59, 0.6)';
    roundRect(ctx, x, y, 500, 50, 10);
    ctx.fill();

    ctx.font = '12px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'left';
    ctx.fillText(date, x + 16, y + 30);

    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(name, x + 70, y + 30);

    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.textAlign = 'right';
    ctx.fillText(price, x + 480, y + 30);
  };

  const drawCheckItem = (ctx: CanvasRenderingContext2D, x: number, y: number, name: string, price: string) => {
    ctx.fillStyle = 'rgba(30, 41, 59, 0.5)';
    roundRect(ctx, x, y, 920, 46, 12);
    ctx.fill();

    ctx.font = '18px Inter, sans-serif';
    ctx.fillStyle = '#34d399';
    ctx.textAlign = 'left';
    ctx.fillText('☑', x + 16, y + 30);

    ctx.font = '15px Inter, sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(name, x + 50, y + 30);

    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.textAlign = 'right';
    ctx.fillText(price, x + 900, y + 30);
  };

  const drawInvoiceRow = (ctx: CanvasRenderingContext2D, x: number, y: number, month: string, due: string, amount: string, status: string, statusColor: string) => {
    ctx.fillStyle = 'rgba(30, 41, 59, 0.4)';
    roundRect(ctx, x, y, 1020, 45, 10);
    ctx.fill();

    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(month, x + 20, y + 28);

    ctx.font = '13px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Vencimento: ' + due, x + 250, y + 28);

    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.fillText(amount, x + 550, y + 28);

    ctx.fillStyle = statusColor;
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('● ' + status, x + 850, y + 28);
  };

  // -------------------------------------------------------------
  // SCENE RENDERERS
  // -------------------------------------------------------------
  const drawDashboardScene = (ctx: CanvasRenderingContext2D, t: number) => {
    drawBackground(ctx);
    drawHeaderBadge(ctx, 'Dashboard Executivo & Patrimônio', 'AURA FINANCE PRO');

    drawMetricCard(ctx, 60, 160, 360, 170, 'Saldo Consolidado', 'R$ 84.520,00', '+18.4% este mês', '#facc15');
    drawMetricCard(ctx, 460, 160, 360, 170, 'Entradas Mensais', 'R$ 13.700,00', '12 recebimentos', '#34d399');
    drawMetricCard(ctx, 860, 160, 360, 170, 'Selic Meta (BACEN)', '13,75% a.a.', 'Cotação em tempo real', '#38bdf8');

    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.2)';
    ctx.lineWidth = 2;
    roundRect(ctx, 60, 360, 1160, 270, 24);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'left';
    ctx.fillText('EVOLUÇÃO DO FLUXO DE CAIXA MENSAL', 90, 405);

    ctx.beginPath();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 4;
    const points = [
      { x: 90, y: 560 }, { x: 260, y: 530 }, { x: 440, y: 480 },
      { x: 620, y: 510 }, { x: 800, y: 440 }, { x: 980, y: 470 }, { x: 1160, y: 410 }
    ];

    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const xc = (points[i].x + points[i - 1].x) / 2;
      const yc = (points[i].y + points[i - 1].y) / 2;
      ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.stroke();

    const p = points[points.length - 1];
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 8 + Math.sin(t * 5) * 3, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawPWAScene = (ctx: CanvasRenderingContext2D) => {
    drawBackground(ctx);
    drawHeaderBadge(ctx, 'Aplicativo PWA para Celular', 'DOWNLOAD & OFFLINE');

    const phoneX = 220;
    const phoneY = 160;
    ctx.fillStyle = '#020617';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 6;
    roundRect(ctx, phoneX, phoneY, 280, 480, 40);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#090d16';
    roundRect(ctx, phoneX + 8, phoneY + 8, 264, 464, 32);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    roundRect(ctx, phoneX + 90, phoneY + 16, 100, 18, 9);
    ctx.fill();

    ctx.fillStyle = 'rgba(250, 204, 21, 0.15)';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    roundRect(ctx, phoneX + 42, phoneY + 140, 180, 180, 36);
    ctx.fill();
    ctx.stroke();

    ctx.font = '70px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚡', phoneX + 132, phoneY + 250);

    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Aura Finance PRO', phoneX + 132, phoneY + 360);

    drawFeatureCard(ctx, 560, 180, 620, 120, '📱 Instalação Nativa Sem Lojas', 'Instale com 1 clique diretamente no navegador do iOS ou Android.');
    drawFeatureCard(ctx, 560, 330, 620, 120, '⚡ Ícone na Tela Inicial', 'Abre em modo standalone de tela cheia como um app nativo.');
    drawFeatureCard(ctx, 560, 480, 620, 120, '🔄 Acesso Rápido & Offline', 'Carregamento instantâneo de saldos com Service Worker.');
  };

  const drawCardsScene = (ctx: CanvasRenderingContext2D) => {
    drawBackground(ctx);
    drawHeaderBadge(ctx, 'Controle de Cartões & Leitura de Fatura', 'LEITOR OCR POR IA');

    const cardX = 100;
    const cardY = 190;
    const cardW = 460;
    const cardH = 270;

    const gradCard = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    gradCard.addColorStop(0, '#2e1065');
    gradCard.addColorStop(0.5, '#0f172a');
    gradCard.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = gradCard;
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
    ctx.lineWidth = 3;
    roundRect(ctx, cardX, cardY, cardW, cardH, 28);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    roundRect(ctx, cardX + 50, cardY + 70, 55, 42, 8);
    ctx.fill();

    ctx.font = '900 18px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText('NUBANK ULTRAVIOLETA', cardX + 50, cardY + 45);

    ctx.font = 'bold 22px Courier New, monospace';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('•••• •••• •••• 4892', cardX + 50, cardY + 160);

    ctx.font = '14px Inter, sans-serif';
    ctx.fillStyle = '#a855f7';
    ctx.fillText('LIMITE: R$ 25.000,00', cardX + 50, cardY + 220);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    roundRect(ctx, 620, 190, 560, 420, 24);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.fillText('📄 ITENS RECONHECIDOS DA FATURA (PDF)', 650, 235);

    drawInvoiceItem(ctx, 650, 270, '15/10', 'Supermercado Tauste', 'R$ 342,10');
    drawInvoiceItem(ctx, 650, 340, '16/10', 'Auto Posto Ipiranga', 'R$ 180,00');
    drawInvoiceItem(ctx, 650, 410, '18/10', 'Amazon Brasil (02/05)', 'R$ 189,90');
    drawInvoiceItem(ctx, 650, 480, '20/10', 'Uber * Viagem Urbana', 'R$ 24,90');

    ctx.fillStyle = '#facc15';
    roundRect(ctx, 650, 550, 500, 40, 12);
    ctx.fill();
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillStyle = '#020617';
    ctx.textAlign = 'center';
    ctx.fillText('✓ IMPORTAR 4 GASTOS NO CARTÃO (R$ 736,90)', 900, 575);
  };

  const drawPiggyScene = (ctx: CanvasRenderingContext2D) => {
    drawBackground(ctx);
    drawHeaderBadge(ctx, 'IA Multimodal: Prints de Porquinho & Caixinha', 'RECONHECIMENTO ÓPTICO');

    const shotX = 100;
    const shotY = 180;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2;
    roundRect(ctx, shotX, shotY, 480, 440, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#7c3aed';
    roundRect(ctx, shotX + 24, shotY + 24, 432, 70, 16);
    ctx.fill();

    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText('🐷 Nu Caixinha • Reserva de Emergência', shotX + 45, shotY + 65);

    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('SALDO TOTAL GUARDADO NO PORQUINHO:', shotX + 45, shotY + 160);

    ctx.font = '900 48px Inter, sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.fillText('R$ 45.000,00', shotX + 45, shotY + 230);

    ctx.font = '14px Inter, sans-serif';
    ctx.fillStyle = '#34d399';
    ctx.fillText('📈 Rendimento 100% do CDI • Liquidez Imediata', shotX + 45, shotY + 280);

    ctx.font = '40px Inter, sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.textAlign = 'center';
    ctx.fillText('➔', 650, 400);

    const chatX = 720;
    const chatY = 180;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    roundRect(ctx, chatX, chatY, 460, 440, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    roundRect(ctx, chatX + 25, chatY + 30, 410, 300, 18);
    ctx.fill();

    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.textAlign = 'left';
    ctx.fillText('🤖 Aura Copiloto IA:', chatX + 45, chatY + 65);

    ctx.font = '14px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Reconheci seu Porquinho Nubank:', chatX + 45, chatY + 105);

    ctx.font = '900 32px Inter, sans-serif';
    ctx.fillStyle = '#34d399';
    ctx.fillText('R$ 45.000,00', chatX + 45, chatY + 155);

    ctx.font = '13px Inter, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('✓ Lançado na Carteira de Investimentos', chatX + 45, chatY + 205);
    ctx.fillText('✓ Saldo consolidado atualizado na hora', chatX + 45, chatY + 235);
    ctx.fillText('✓ Aporte registrado no extrato', chatX + 45, chatY + 265);

    ctx.fillStyle = 'rgba(250, 204, 21, 0.2)';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.5;
    roundRect(ctx, chatX + 25, chatY + 355, 410, 45, 12);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.textAlign = 'center';
    ctx.fillText('VER EM INVESTIMENTOS & PATRIMÔNIO →', chatX + 230, chatY + 383);
  };

  const drawShoppingScene = (ctx: CanvasRenderingContext2D) => {
    drawBackground(ctx);
    drawHeaderBadge(ctx, 'Listas de Compras Inteligentes', 'MERCADO & CASA');

    const listX = 140;
    const listY = 180;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    roundRect(ctx, listX, listY, 1000, 440, 24);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText('🛒 Supermercado Semanal', listX + 40, listY + 50);

    ctx.font = '14px Inter, sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.fillText('Total no Carrinho: R$ 285,40 (8 de 10 itens)', listX + 40, listY + 85);

    drawCheckItem(ctx, listX + 40, listY + 120, 'Arroz Tio João 5kg', 'R$ 28,90');
    drawCheckItem(ctx, listX + 40, listY + 180, 'Feijão Carioca 1kg', 'R$ 8,50');
    drawCheckItem(ctx, listX + 40, listY + 240, 'Café Torrado e Moído', 'R$ 19,90');
    drawCheckItem(ctx, listX + 40, listY + 300, 'Azeite de Oliva Extra Virgem', 'R$ 42,00');

    ctx.fillStyle = '#facc15';
    roundRect(ctx, listX + 40, listY + 365, 920, 50, 16);
    ctx.fill();

    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.fillStyle = '#020617';
    ctx.textAlign = 'center';
    ctx.fillText('✓ FINALIZAR COMPRA & LANÇAR NO FLUXO DE CAIXA (R$ 285,40)', listX + 500, listY + 396);
  };

  const drawInvoicesScene = (ctx: CanvasRenderingContext2D) => {
    drawBackground(ctx);
    drawHeaderBadge(ctx, 'Faturas do Sistema & Vencimento Dia 10', 'MENSALIDADE R$ 9,90');

    drawMetricCard(ctx, 100, 180, 320, 130, 'Plano Ativo', 'Aura Finance PRO', 'Acesso Completo', '#ffffff');
    drawMetricCard(ctx, 480, 180, 320, 130, 'Valor Mensal', 'R$ 9,90 / mês', 'Vencimento todo dia 10', '#facc15');
    drawMetricCard(ctx, 860, 180, 320, 130, 'Forma de Pagamento', 'Mercado Pago PIX', 'Liberação Instantânea', '#38bdf8');

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    roundRect(ctx, 100, 340, 1080, 280, 20);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.textAlign = 'left';
    ctx.fillText('HISTÓRICO DE MENSALIDADES', 130, 380);

    drawInvoiceRow(ctx, 130, 410, 'Outubro 2026', '10/10/2026', 'R$ 9,90', 'PAGA', '#34d399');
    drawInvoiceRow(ctx, 130, 470, 'Novembro 2026', '10/11/2026', 'R$ 9,90', 'PENDENTE', '#facc15');
    drawInvoiceRow(ctx, 130, 530, 'Dezembro 2026', '10/12/2026', 'R$ 9,90', 'A VENCER', '#94a3b8');
  };

  const scenes: Scene[] = [
    {
      id: 'intro_dashboard',
      audioKey: 'scene_1',
      title: 'Dashboard Executivo & Patrimônio',
      badge: 'CYBER GOLD DESIGN',
      duration: 12.5,
      narration: 'Bem-vindo ao Aura Finance PRO: o seu ecossistema financeiro definitivo com design Black and Cyber Gold, controle de saldo consolidado e cotações ao vivo do Banco Central com a taxa Selic em 13,75% ao ano.',
      draw: drawDashboardScene
    },
    {
      id: 'pwa_mobile',
      audioKey: 'scene_2',
      title: 'Aplicativo PWA para Celular',
      badge: 'INSTALAÇÃO 1-CLIQUE',
      duration: 11.5,
      narration: 'Com tecnologia Progressive Web App, você baixa o Aura Finance direto no seu celular iOS ou Android com um clique. Tenha acesso instantâneo na tela inicial, funcionamento rápido e modo offline.',
      draw: drawPWAScene
    },
    {
      id: 'credit_cards',
      audioKey: 'scene_3',
      title: 'Cartões de Crédito & Leitura de Fatura',
      badge: 'LEITURA PDF & OCR',
      duration: 12.0,
      narration: 'Tenha controle completo dos seus cartões de crédito Nubank, Inter, BTG e XP com visual 3D holográfico, acompanhamento de limites e leitor inteligente de faturas em PDF para importar todos os seus gastos na hora.',
      draw: drawCardsScene
    },
    {
      id: 'ai_piggy',
      audioKey: 'scene_4',
      title: 'IA Multimodal & Prints de Bancos',
      badge: 'PORQUINHO R$ 45.000',
      duration: 13.8,
      narration: 'Envie prints de porquinhos e caixinhas diretamente para a IA! Você manda o print da tela com o seu porquinho de 45 mil reais, e a inteligência artificial faz a leitura óptica e lança automaticamente no seu patrimônio e investimentos.',
      draw: drawPiggyScene
    },
    {
      id: 'shopping_lists',
      audioKey: 'scene_5',
      title: 'Listas de Compras Inteligentes',
      badge: 'MERCADO & CASA',
      duration: 12.2,
      narration: 'Crie listas inteligentes para supermercado e casa com sugestões rápidas. Conforme você coloca os produtos no carrinho, o sistema calcula os totais e permite lançar a compra final no seu fluxo de caixa com apenas um toque.',
      draw: drawShoppingScene
    },
    {
      id: 'subscription_invoices',
      audioKey: 'scene_6',
      title: 'Faturas de Assinatura & Vencimento Dia 10',
      badge: 'MENSALIDADE R$ 9,90',
      duration: 11.2,
      narration: 'Gerencie sua assinatura de apenas 9 reais e 90 por mês em uma aba exclusiva de faturas, com vencimento todo dia 10, status em tempo real e desbloqueio imediato via PIX do Mercado Pago.',
      draw: drawInvoicesScene
    }
  ];

  const totalDuration = scenes.reduce((acc, s) => acc + s.duration, 0);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Preload Audio Elements on Mount
  useEffect(() => {
    for (let i = 1; i <= 6; i++) {
      const key = `scene_${i}`;
      const audio = new Audio(`/audio/${key}.mp3`);
      audio.preload = 'auto';
      audioRefs.current[key] = audio;
    }

    // Initial first-frame canvas render
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        scenes[0].draw(ctx, 0);
      }
    }

    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      Object.values(audioRefs.current).forEach(a => a.pause());
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, []);

  // Sync refs with state
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    isVoiceActiveRef.current = isVoiceActive;
  }, [isVoiceActive]);

  // Audio switcher helper
  const playSceneAudio = (sceneIdx: number, offsetSec: number = 0) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    }

    if (!isVoiceActiveRef.current || sceneIdx < 0 || sceneIdx >= scenes.length) return;

    const key = scenes[sceneIdx].audioKey;
    const audio = audioRefs.current[key];
    if (audio) {
      audio.currentTime = offsetSec;
      audio.play().catch(() => {});
      currentAudioRef.current = audio;
    }
  };

  const stopAllAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }
  };

  // Main Render Loop
  useEffect(() => {
    const renderLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      if (isPlayingRef.current) {
        currentTimeRef.current += delta;
        if (currentTimeRef.current >= totalDuration) {
          currentTimeRef.current = totalDuration;
          setIsPlaying(false);
          stopAllAudio();
        }
        setCurrentTime(currentTimeRef.current);
      }

      // Determine active scene
      let accumulated = 0;
      let activeIdx = 0;
      let sceneLocalTime = 0;

      for (let i = 0; i < scenes.length; i++) {
        if (currentTimeRef.current >= accumulated && currentTimeRef.current < accumulated + scenes[i].duration) {
          activeIdx = i;
          sceneLocalTime = currentTimeRef.current - accumulated;
          break;
        }
        accumulated += scenes[i].duration;
      }

      if (currentTimeRef.current >= totalDuration) {
        activeIdx = scenes.length - 1;
        sceneLocalTime = scenes[activeIdx].duration;
      }

      // Check scene transition
      if (activeIdx !== currentSceneIdxRef.current) {
        currentSceneIdxRef.current = activeIdx;
        setCurrentSceneIdx(activeIdx);
        setSubtitle(scenes[activeIdx].narration);

        if (isPlayingRef.current && isVoiceActiveRef.current) {
          playSceneAudio(activeIdx, sceneLocalTime);
        }
      }

      // Draw canvas
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 1280, 720);
          scenes[activeIdx].draw(ctx, sceneLocalTime);
        }
      }

      animFrameId.current = requestAnimationFrame(renderLoop);
    };

    animFrameId.current = requestAnimationFrame(renderLoop);
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, []);

  const handlePlay = () => {
    if (currentTimeRef.current >= totalDuration) {
      currentTimeRef.current = 0;
      setCurrentTime(0);
      currentSceneIdxRef.current = -1;
    }
    lastTimeRef.current = 0;
    setIsPlaying(true);
    playSceneAudio(currentSceneIdxRef.current >= 0 ? currentSceneIdxRef.current : 0);
  };

  const handlePause = () => {
    setIsPlaying(false);
    stopAllAudio();
  };

  const handleRestart = () => {
    currentTimeRef.current = 0;
    setCurrentTime(0);
    currentSceneIdxRef.current = -1;
    handlePlay();
  };

  const handleJumpToScene = (sceneIdx: number) => {
    let acc = 0;
    for (let i = 0; i < sceneIdx; i++) {
      acc += scenes[i].duration;
    }
    currentTimeRef.current = acc;
    setCurrentTime(acc);
    currentSceneIdxRef.current = -1;
    if (!isPlayingRef.current) {
      handlePlay();
    } else {
      playSceneAudio(sceneIdx, 0);
    }
  };

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = clickRatio * totalDuration;
    currentTimeRef.current = newTime;
    setCurrentTime(newTime);
    currentSceneIdxRef.current = -1;
  };

  const toggleVoice = () => {
    const nextVoice = !isVoiceActive;
    setIsVoiceActive(nextVoice);
    isVoiceActiveRef.current = nextVoice;
    if (nextVoice) {
      playSceneAudio(currentSceneIdxRef.current);
    } else {
      stopAllAudio();
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleRecordVideo = () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    if (!canvasRef.current) return;

    try {
      const stream = (canvasRef.current as any).captureStream(30);
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
      recordedChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Aura_Finance_PRO_Apresentacao_Oficial.webm';
        a.click();
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      handleRestart();
    } catch {
      alert('Seu navegador não suporta captura direta em WebM. Você pode assistir o vídeo diretamente aqui na plataforma!');
    }
  };

  const progressPercent = (currentTime / totalDuration) * 100;

  return (
    <div ref={containerRef} className="rounded-3xl bg-dark-950 border border-gold-400/30 overflow-hidden shadow-2xl flex flex-col">
      {/* Video Top Bar */}
      <div className="p-4 sm:p-5 bg-dark-900 border-b border-dark-800 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gold-400 to-amber-600 text-dark-950 flex items-center justify-center font-black text-lg shadow-md">
            <Tv size={20} className="text-dark-950" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>Aura Finance PRO</span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-gold-400/20 text-gold-300 border border-gold-400/40 uppercase font-black">
                Locução Neural Studio HD
              </span>
            </h2>
            <p className="text-xs text-slate-400">Locução Comercial em Alta Definição (Sem Voz Robótica)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 border border-dark-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Modo Tela Cheia"
          >
            <Maximize2 size={15} className="text-gold-400" />
            <span className="hidden sm:inline">Tela Cheia</span>
          </button>

          <button
            onClick={handleRecordVideo}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm border ${
              isRecording 
                ? 'bg-rose-600 text-white border-rose-500 animate-pulse' 
                : 'bg-dark-800 hover:bg-dark-750 text-slate-200 border-dark-700'
            }`}
          >
            <Download size={14} className={isRecording ? 'text-white' : 'text-gold-400'} />
            <span>{isRecording ? 'Gravando... (Clique p/ Salvar)' : 'Baixar Vídeo (.webm)'}</span>
          </button>
        </div>
      </div>

      {/* Video Canvas Container (16:9 aspect ratio) */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden border-b border-dark-800 select-none">
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="w-full h-full object-contain"
        />

        {/* Overlay Play Button when Paused */}
        {!isPlaying && (
          <div 
            onClick={handlePlay}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer transition-opacity z-20 group"
          >
            <button className="w-20 h-20 rounded-full bg-gradient-to-tr from-gold-500 via-yellow-400 to-amber-300 text-dark-950 flex items-center justify-center text-3xl font-black shadow-gold-glow group-hover:scale-110 active:scale-95 transition-transform">
              <Play size={34} className="fill-dark-950 ml-1 text-dark-950" />
            </button>
            <p className="text-base sm:text-lg font-black text-white mt-4 drop-shadow text-center px-4">
              Clique para Assistir com Locução Neural em Estúdio
            </p>
            <p className="text-xs text-gold-300/90 mt-1">Voz Humana Natural • Qualidade Comercial • 70s</p>
          </div>
        )}
      </div>

      {/* Dedicated Subtitle & Studio Sound Visualizer Ribbon (Never overlaps video) */}
      <div className="px-4 py-3 bg-dark-900 border-b border-dark-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gold-400/15 border border-gold-400/30 flex items-center justify-center text-gold-400 shrink-0">
            {isPlaying && isVoiceActive ? (
              <div className="flex items-center gap-0.5 h-4">
                {[0.1, 0.3, 0.5, 0.2].map((delay, idx) => (
                  <span
                    key={idx}
                    className="w-1 bg-gold-400 rounded-full animate-pulse"
                    style={{
                      height: `${6 + (idx % 2) * 8}px`,
                      animationDuration: `${0.5 + delay}s`
                    }}
                  />
                ))}
              </div>
            ) : (
              <Volume2 size={16} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-gold-400">
                Capítulo {currentSceneIdx + 1} de {scenes.length} • {scenes[currentSceneIdx]?.badge}
              </span>
              {isPlaying && isVoiceActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-200 leading-snug">
              "{subtitle}"
            </p>
          </div>
        </div>
      </div>

      {/* Video Player Controls */}
      <div className="p-4 sm:p-5 bg-dark-950 flex flex-col gap-3">
        {/* Timeline Scrub Bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400 min-w-[36px]">{formatTime(currentTime)}</span>
          <div
            ref={progressBarRef}
            onClick={handleScrubberClick}
            className="flex-1 h-3 rounded-full bg-dark-800 relative cursor-pointer group"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold-400 to-amber-500 transition-all pointer-events-none"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-mono text-slate-400 min-w-[36px]">{formatTime(totalDuration)}</span>
        </div>

        {/* Bottom Buttons Bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            {isPlaying ? (
              <button
                onClick={handlePause}
                className="px-4 sm:px-5 py-2 rounded-xl bg-gold-400 hover:bg-gold-300 text-dark-950 font-black text-xs transition-all shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <Pause size={15} className="fill-dark-950" />
                <span>Pausar</span>
              </button>
            ) : (
              <button
                onClick={handlePlay}
                className="px-4 sm:px-5 py-2 rounded-xl bg-gold-400 hover:bg-gold-300 text-dark-950 font-black text-xs transition-all shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <Play size={15} className="fill-dark-950 ml-0.5" />
                <span>{currentTime > 0 ? 'Continuar' : 'Iniciar'}</span>
              </button>
            )}

            <button
              onClick={handleRestart}
              className="p-2 rounded-xl bg-dark-900 hover:bg-dark-850 text-slate-300 text-xs font-semibold transition-colors border border-dark-800"
              title="Reiniciar do começo"
            >
              <RotateCcw size={15} />
            </button>

            <button
              onClick={toggleVoice}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border ${
                isVoiceActive 
                  ? 'bg-dark-900 text-gold-400 border-gold-400/30' 
                  : 'bg-dark-900 text-slate-400 border-dark-800'
              }`}
            >
              {isVoiceActive ? <Volume2 size={16} /> : <VolumeX size={16} />}
              <span className="hidden sm:inline">{isVoiceActive ? 'Voz Neural Ativa' : 'Sem Som'}</span>
            </button>
          </div>

          {/* Chapter Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-semibold text-slate-400 max-w-full pb-1 sm:pb-0">
            {scenes.map((scene, idx) => (
              <button
                key={scene.id}
                onClick={() => handleJumpToScene(idx)}
                className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition-all ${
                  idx === currentSceneIdx
                    ? 'border-gold-400 text-gold-300 bg-gold-400/10 font-bold'
                    : 'bg-dark-900 border-dark-800 hover:text-slate-200'
                }`}
              >
                {idx + 1}. {scene.title.split('&')[0].trim()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
