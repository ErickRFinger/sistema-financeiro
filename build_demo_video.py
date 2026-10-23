import json
import os

with open('public/audio/audio_data.json', 'r') as f:
    audio_data = json.load(f)

html_template = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Aura Finance PRO - Vídeo Narrado com Voz Neural</title>
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
  <style>
    @keyframes pulse-wave {
      0%, 100% { height: 6px; }
      50% { height: 26px; }
    }
    .wave-bar {
      width: 3px;
      background: #facc15;
      border-radius: 9999px;
      animation: pulse-wave 0.8s ease-in-out infinite;
    }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 antialiased p-4 sm:p-6 flex flex-col items-center justify-center min-h-screen font-sans">
  <div class="max-w-4xl w-full bg-slate-900/95 border border-amber-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
    <!-- Top Bar -->
    <div class="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between flex-wrap gap-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 flex items-center justify-center font-black text-lg shadow-md">
          ⚡
        </div>
        <div>
          <h1 class="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <span>Aura Finance PRO</span>
            <span class="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase font-black">Voz Neural de Estúdio</span>
          </h1>
          <p class="text-xs text-slate-400">Locução Comercial em Alta Definição (Sem Voz Robótica)</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button id="recordBtn" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm">
          <span id="recordIcon">⏺️</span>
          <span id="recordLabel">Gravar / Baixar Vídeo (.webm)</span>
        </button>
      </div>
    </div>

    <!-- Video Canvas Display (16:9 aspect ratio) -->
    <div class="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden border-b border-slate-800 select-none">
      <canvas id="videoCanvas" width="1280" height="720" class="w-full h-full object-contain"></canvas>

      <!-- Overlay Play Button when Paused -->
      <div id="playOverlay" class="absolute inset-0 bg-black/65 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer transition-opacity">
        <button id="bigPlayBtn" class="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 text-slate-950 flex items-center justify-center text-3xl font-black shadow-2xl hover:scale-110 active:scale-95 transition-all">
          ▶
        </button>
        <p class="text-base font-extrabold text-white mt-4 drop-shadow">Clique para Iniciar o Vídeo com Locução de Estúdio</p>
        <p class="text-xs text-amber-300/90 mt-1">Voz Humana Neural • Duração: ~70 segundos</p>
      </div>

      <!-- Subtitle Ribbon with Sound Visualizer at Bottom of Screen -->
      <div class="absolute bottom-4 left-6 right-6 pointer-events-none">
        <div id="subtitleBox" class="bg-black/90 backdrop-blur-md border border-amber-400/40 rounded-2xl px-6 py-3 text-center shadow-2xl flex flex-col items-center gap-2">
          <!-- Voice Visualizer Waves -->
          <div id="visualizer" class="flex items-center gap-1.5 h-6">
            <span class="wave-bar" style="animation-delay: 0.1s"></span>
            <span class="wave-bar" style="animation-delay: 0.3s"></span>
            <span class="wave-bar" style="animation-delay: 0.5s"></span>
            <span class="wave-bar" style="animation-delay: 0.2s"></span>
            <span class="wave-bar" style="animation-delay: 0.4s"></span>
            <span class="wave-bar" style="animation-delay: 0.6s"></span>
            <span class="wave-bar" style="animation-delay: 0.25s"></span>
          </div>

          <p id="subtitleText" class="text-xs sm:text-sm font-bold text-slate-100 max-w-2xl leading-relaxed">
            Bem-vindo ao Aura Finance PRO: o seu ecossistema financeiro definitivo com design Black and Cyber Gold.
          </p>
        </div>
      </div>
    </div>

    <!-- Video Player Controls -->
    <div class="p-4 sm:p-5 bg-slate-950 flex flex-col gap-3">
      <!-- Timeline Scrub Bar -->
      <div class="flex items-center gap-3">
        <span id="currentTime" class="text-xs font-mono text-slate-400">00:00</span>
        <div class="flex-1 h-2.5 rounded-full bg-slate-800 relative cursor-pointer group" id="progressBarContainer">
          <div id="progressBar" class="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 w-0 transition-all"></div>
        </div>
        <span id="totalTime" class="text-xs font-mono text-slate-400">01:10</span>
      </div>

      <!-- Bottom Buttons Bar -->
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div class="flex items-center gap-2">
          <button id="playPauseBtn" class="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 flex items-center gap-1.5">
            <span id="playPauseIcon">▶</span>
            <span id="playPauseLabel">Iniciar</span>
          </button>

          <button id="restartBtn" class="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors" title="Reiniciar do começo">
            🔄
          </button>

          <button id="voiceToggleBtn" class="px-3.5 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5">
            <span id="voiceIcon">🎙️</span>
            <span id="voiceLabel">Voz Neural Ativa</span>
          </button>
        </div>

        <!-- Chapter Selector Pills -->
        <div class="flex items-center gap-1.5 overflow-x-auto text-[11px] font-semibold text-slate-400">
          <button class="scene-pill px-2.5 py-1 rounded-lg hover:text-amber-300 bg-slate-900 border border-slate-800" data-scene="0">1. Dashboard</button>
          <button class="scene-pill px-2.5 py-1 rounded-lg hover:text-amber-300 bg-slate-900 border border-slate-800" data-scene="1">2. PWA App</button>
          <button class="scene-pill px-2.5 py-1 rounded-lg hover:text-amber-300 bg-slate-900 border border-slate-800" data-scene="2">3. Cartões</button>
          <button class="scene-pill px-2.5 py-1 rounded-lg hover:text-amber-300 bg-slate-900 border border-slate-800" data-scene="3">4. Porquinho 45k</button>
          <button class="scene-pill px-2.5 py-1 rounded-lg hover:text-amber-300 bg-slate-900 border border-slate-800" data-scene="4">5. Compras</button>
          <button class="scene-pill px-2.5 py-1 rounded-lg hover:text-amber-300 bg-slate-900 border border-slate-800" data-scene="5">6. Assinatura</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    // -------------------------------------------------------------
    // HIGH-DEFINITION NEURAL AUDIO ASSETS (BASE64 EMBEDDED)
    // -------------------------------------------------------------
    const AUDIO_DATA = __AUDIO_DATA_PLACEHOLDER__;

    // Preload Audio Elements
    const audioElements = {};
    for (let i = 1; i <= 6; i++) {
      const key = 'scene_' + i;
      const audio = new Audio(AUDIO_DATA[key]);
      audio.preload = 'auto';
      audioElements[key] = audio;
    }

    // -------------------------------------------------------------
    // SCENE & SCRIPT DEFINITION
    // -------------------------------------------------------------
    const SCENES = [
      {
        id: 'intro_dashboard',
        audioKey: 'scene_1',
        title: 'Dashboard Executivo & Patrimônio',
        badge: 'CYBER GOLD DESIGN',
        duration: 12.5,
        narration: 'Bem-vindo ao Aura Finance PRO: o seu ecossistema financeiro definitivo com design Black and Cyber Gold, controle de saldo consolidado e cotações ao vivo do Banco Central com a taxa Selic em 13,75% ao ano.',
        draw: (ctx, t) => drawDashboardScene(ctx, t)
      },
      {
        id: 'pwa_mobile',
        audioKey: 'scene_2',
        title: 'Aplicativo PWA para Celular',
        badge: 'INSTALAÇÃO 1-CLIQUE',
        duration: 11.5,
        narration: 'Com tecnologia Progressive Web App, você baixa o Aura Finance direto no seu celular iOS ou Android com um clique. Tenha acesso instantâneo na tela inicial, funcionamento rápido e modo offline.',
        draw: (ctx, t) => drawPWAScene(ctx, t)
      },
      {
        id: 'credit_cards',
        audioKey: 'scene_3',
        title: 'Cartões de Crédito & Leitura de Fatura',
        badge: 'LEITURA PDF & OCR',
        duration: 12.0,
        narration: 'Tenha controle completo dos seus cartões de crédito Nubank, Inter, BTG e XP com visual 3D holográfico, acompanhamento de limites e leitor inteligente de faturas em PDF para importar todos os seus gastos na hora.',
        draw: (ctx, t) => drawCardsScene(ctx, t)
      },
      {
        id: 'ai_piggy',
        audioKey: 'scene_4',
        title: 'IA Multimodal & Prints de Bancos',
        badge: 'PORQUINHO R$ 45.000',
        duration: 13.8,
        narration: 'Envie prints de porquinhos e caixinhas diretamente para a IA! Você manda o print da tela com o seu porquinho de 45 mil reais, e a inteligência artificial faz a leitura óptica e lança automaticamente no seu patrimônio e investimentos.',
        draw: (ctx, t) => drawPiggyScene(ctx, t)
      },
      {
        id: 'shopping_lists',
        audioKey: 'scene_5',
        title: 'Listas de Compras Inteligentes',
        badge: 'MERCADO & CASA',
        duration: 12.2,
        narration: 'Crie listas inteligentes para supermercado e casa com sugestões rápidas. Conforme você coloca os produtos no carrinho, o sistema calcula os totais e permite lançar a compra final no seu fluxo de caixa com apenas um toque.',
        draw: (ctx, t) => drawShoppingScene(ctx, t)
      },
      {
        id: 'subscription_invoices',
        audioKey: 'scene_6',
        title: 'Faturas de Assinatura & Vencimento Dia 10',
        badge: 'MENSALIDADE R$ 9,90',
        duration: 11.2,
        narration: 'Gerencie sua assinatura de apenas 9 reais e 90 por mês em uma aba exclusiva de faturas, com vencimento todo dia 10, status em tempo real e desbloqueio imediato via PIX do Mercado Pago.',
        draw: (ctx, t) => drawInvoicesScene(ctx, t)
      }
    ];

    const TOTAL_DURATION = SCENES.reduce((acc, s) => acc + s.duration, 0);

    // -------------------------------------------------------------
    // CONTROLS & STATE
    // -------------------------------------------------------------
    const canvas = document.getElementById('videoCanvas');
    const ctx = canvas.getContext('2d');
    let isPlaying = false;
    let currentTime = 0;
    let voiceEnabled = true;
    let lastTimestamp = 0;
    let currentSceneIndex = -1;
    let currentActiveAudio = null;

    let mediaRecorder = null;
    let recordedChunks = [];
    let isRecording = false;

    const playOverlay = document.getElementById('playOverlay');
    const bigPlayBtn = document.getElementById('bigPlayBtn');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const playPauseIcon = document.getElementById('playPauseIcon');
    const playPauseLabel = document.getElementById('playPauseLabel');
    const restartBtn = document.getElementById('restartBtn');
    const voiceToggleBtn = document.getElementById('voiceToggleBtn');
    const voiceIcon = document.getElementById('voiceIcon');
    const voiceLabel = document.getElementById('voiceLabel');
    const subtitleText = document.getElementById('subtitleText');
    const progressBar = document.getElementById('progressBar');
    const progressBarContainer = document.getElementById('progressBarContainer');
    const currentTimeEl = document.getElementById('currentTime');
    const totalTimeEl = document.getElementById('totalTime');
    const recordBtn = document.getElementById('recordBtn');
    const recordLabel = document.getElementById('recordLabel');
    const visualizer = document.getElementById('visualizer');

    totalTimeEl.textContent = formatTime(TOTAL_DURATION);

    function formatTime(sec) {
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    // Play scene audio
    function playSceneAudio(sceneIdx, offsetSec = 0) {
      if (currentActiveAudio) {
        currentActiveAudio.pause();
        currentActiveAudio.currentTime = 0;
      }

      if (!voiceEnabled || sceneIdx < 0 || sceneIdx >= SCENES.length) return;

      const audio = audioElements[SCENES[sceneIdx].audioKey];
      if (audio) {
        audio.currentTime = offsetSec;
        audio.play().catch(() => {});
        currentActiveAudio = audio;
      }
    }

    function stopAllAudio() {
      if (currentActiveAudio) {
        currentActiveAudio.pause();
      }
    }

    // -------------------------------------------------------------
    // RENDER LOOP
    // -------------------------------------------------------------
    function render(timestamp) {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const delta = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      if (isPlaying) {
        currentTime += delta;
        if (currentTime >= TOTAL_DURATION) {
          currentTime = TOTAL_DURATION;
          pause();
        }
      }

      // Determine active scene
      let accumulated = 0;
      let activeIdx = 0;
      let sceneLocalTime = 0;

      for (let i = 0; i < SCENES.length; i++) {
        if (currentTime >= accumulated && currentTime < accumulated + SCENES[i].duration) {
          activeIdx = i;
          sceneLocalTime = currentTime - accumulated;
          break;
        }
        accumulated += SCENES[i].duration;
      }

      if (currentTime >= TOTAL_DURATION) {
        activeIdx = SCENES.length - 1;
        sceneLocalTime = SCENES[activeIdx].duration;
      }

      // On scene change, trigger studio voice
      if (activeIdx !== currentSceneIndex) {
        currentSceneIndex = activeIdx;
        if (isPlaying && voiceEnabled) {
          playSceneAudio(currentSceneIndex, sceneLocalTime);
        }
      }

      // Draw active scene
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      SCENES[activeIdx].draw(ctx, sceneLocalTime);

      // Update Subtitles & Visualizer
      subtitleText.textContent = SCENES[activeIdx].narration;
      if (isPlaying && voiceEnabled) {
        visualizer.style.display = 'flex';
      } else {
        visualizer.style.display = 'none';
      }

      // Update Timeline
      currentTimeEl.textContent = formatTime(currentTime);
      const progressPercent = (currentTime / TOTAL_DURATION) * 100;
      progressBar.style.width = `${progressPercent}%`;

      // Update scene pills highlight
      document.querySelectorAll('.scene-pill').forEach((pill, idx) => {
        if (idx === activeIdx) {
          pill.classList.add('border-amber-400', 'text-amber-300', 'bg-slate-800');
        } else {
          pill.classList.remove('border-amber-400', 'text-amber-300', 'bg-slate-800');
        }
      });

      requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

    // -------------------------------------------------------------
    // CANVAS RENDERING ENGINES
    // -------------------------------------------------------------
    function drawBackground(ctx) {
      const grad = ctx.createRadialGradient(640, 360, 50, 640, 360, 750);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1280, 720);

      // Cyber Gold Grid Lines
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
    }

    function drawHeaderBadge(ctx, title, badge) {
      ctx.fillStyle = 'rgba(250, 204, 21, 0.15)';
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5;
      roundRect(ctx, 60, 50, 210, 32, 16);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.fillStyle = '#facc15';
      ctx.textAlign = 'center';
      ctx.fillText(badge, 165, 71);

      ctx.font = '900 36px Inter, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(title, 60, 125);
    }

    function drawDashboardScene(ctx, t) {
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
    }

    function drawPWAScene(ctx, t) {
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
    }

    function drawCardsScene(ctx, t) {
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
    }

    function drawPiggyScene(ctx, t) {
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
    }

    function drawShoppingScene(ctx, t) {
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
    }

    function drawInvoicesScene(ctx, t) {
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
    }

    // Helper functions
    function roundRect(ctx, x, y, width, height, radius) {
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
    }

    function drawMetricCard(ctx, x, y, w, h, label, value, sub, color) {
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
    }

    function drawFeatureCard(ctx, x, y, w, h, title, desc) {
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
    }

    function drawInvoiceItem(ctx, x, y, date, name, price) {
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
    }

    function drawCheckItem(ctx, x, y, name, price) {
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
    }

    function drawInvoiceRow(ctx, x, y, month, due, amount, status, statusColor) {
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
    }

    // -------------------------------------------------------------
    // PLAYBACK LISTENERS
    // -------------------------------------------------------------
    function play() {
      if (currentTime >= TOTAL_DURATION) {
        currentTime = 0;
        currentSceneIndex = -1;
      }
      isPlaying = true;
      lastTimestamp = 0;
      playOverlay.classList.add('opacity-0', 'pointer-events-none');
      playPauseIcon.textContent = '⏸';
      playPauseLabel.textContent = 'Pausar';
    }

    function pause() {
      isPlaying = false;
      playOverlay.classList.remove('opacity-0', 'pointer-events-none');
      playPauseIcon.textContent = '▶';
      playPauseLabel.textContent = 'Continuar';
      stopAllAudio();
    }

    bigPlayBtn.addEventListener('click', play);
    playOverlay.addEventListener('click', play);

    playPauseBtn.addEventListener('click', () => {
      if (isPlaying) pause();
      else play();
    });

    restartBtn.addEventListener('click', () => {
      currentTime = 0;
      currentSceneIndex = -1;
      play();
    });

    voiceToggleBtn.addEventListener('click', () => {
      voiceEnabled = !voiceEnabled;
      if (voiceEnabled) {
        voiceIcon.textContent = '🎙️';
        voiceLabel.textContent = 'Voz Neural Ativa';
        playSceneAudio(currentSceneIndex);
      } else {
        voiceIcon.textContent = '🔇';
        voiceLabel.textContent = 'Sem Voz';
        stopAllAudio();
      }
    });

    progressBarContainer.addEventListener('click', (e) => {
      const rect = progressBarContainer.getBoundingClientRect();
      const clickRatio = (e.clientX - rect.left) / rect.width;
      currentTime = clickRatio * TOTAL_DURATION;
      currentSceneIndex = -1; // force audio retrigger
    });

    document.querySelectorAll('.scene-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const sceneNum = parseInt(pill.getAttribute('data-scene'), 10);
        let acc = 0;
        for (let i = 0; i < sceneNum; i++) {
          acc += SCENES[i].duration;
        }
        currentTime = acc;
        currentSceneIndex = -1;
        if (!isPlaying) play();
      });
    });

    // -------------------------------------------------------------
    // VIDEO RECORDING (EXPORT TO WEBM WITH AUDIO STREAM)
    // -------------------------------------------------------------
    recordBtn.addEventListener('click', () => {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    });

    function startRecording() {
      try {
        const canvasStream = canvas.captureStream(30);

        // Mix audio if available
        let finalStream = canvasStream;
        try {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const dest = audioCtx.createMediaStreamDestination();
          for (let key in audioElements) {
            const source = audioCtx.createMediaElementSource(audioElements[key]);
            source.connect(dest);
            source.connect(audioCtx.destination);
          }
          finalStream = new MediaStream([...canvasStream.getVideoTracks(), ...dest.stream.getAudioTracks()]);
        } catch (e) {
          console.warn('Audio mixing fallback:', e);
        }

        mediaRecorder = new MediaRecorder(finalStream, { mimeType: 'video/webm;codecs=vp9' });
        recordedChunks = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) recordedChunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'Aura_Finance_PRO_Apresentacao_Neural.webm';
          a.click();
          isRecording = false;
          recordLabel.textContent = 'Gravar / Baixar Vídeo (.webm)';
          recordBtn.classList.remove('bg-rose-600', 'text-white');
        };

        mediaRecorder.start();
        isRecording = true;
        recordLabel.textContent = 'Gravando... (Clique para Salvar)';
        recordBtn.classList.add('bg-rose-600', 'text-white');

        currentTime = 0;
        currentSceneIndex = -1;
        play();
      } catch (err) {
        alert('Seu navegador não suporta gravação direta. Você pode assistir o vídeo diretamente aqui com áudio!');
      }
    }

    function stopRecording() {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    }
  </script>
</body>
</html>
"""

final_html = html_template.replace('__AUDIO_DATA_PLACEHOLDER__', json.dumps(audio_data))

# Save to public/demo-video.html
with open('public/demo-video.html', 'w', encoding='utf-8') as f:
    f.write(final_html)

# Save to artifact folder
artifact_path = r'C:\Users\Erick Finger\.gemini\antigravity\brain\2613054c-8978-492e-bcba-aeaf465c5f56\video_demo_aura_finance.html'
with open(artifact_path, 'w', encoding='utf-8') as f:
    f.write(final_html)

print("Saved both files successfully! Size:", len(final_html), "bytes")
