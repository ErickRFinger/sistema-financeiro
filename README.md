# ⚡ Aura Finance PRO | Sistema de Gestão Financeira Black & Gold (SaaS)

Um sistema financeiro profissional, moderno e completo, desenvolvido sob medida para **comercialização e revenda (White-Label)**. O sistema possui identidade visual de alto padrão em **Preto e Dourado/Amarelo (#0D1017 & #FACC15)** e é **100% responsivo** em todos os tipos de dispositivos: smartphones, tablets, notebooks e computadores desktop.

---

## 1. 🌟 Visão Geral e Objetivo

O **Aura Finance PRO** soluciona o controle financeiro de ponta a ponta para profissionais liberais, autônomos, pequenas e médias empresas, além de controle financeiro pessoal avançado.

### Principais Capacidades:
- **Leitor Inteligente de Cupons e Notas Fiscais (NFC-e / DANFE):**
  - Câmera instantânea no celular (`capture="environment"`) e drag-and-drop no computador.
  - Efeito laser scanner animado em tempo real com OCR local (Tesseract.js) e Gemini Vision opcional.
  - Reconhecimento automático de Razão Social, CNPJ, Data de Emissão, Chave de Acesso (44 dígitos), Valor Total e Itens.
  - Upload automático de comprovantes no Supabase Storage (bucket `notas_fiscais`).
- **Leitor de Faturas de Cartão em PDF / Foto:**
  - Extração inteligente de transações, datas e parcelamentos com importação em 1 clique.
- **Investimentos & Caixinhas Digitais:**
  - Leitura de prints de telas de bancos digitais (NuBank Caixinhas/Porquinho, PicPay Cofrinho, Inter Poupança).
  - Projeção e simulador de metas de rentabilidade com base na Taxa Selic a 13,75% a.a.
- **Central Oficial de Tutoriais & Vídeo com Voz Neural:**
  - 10 módulos de tutoriais detalhados, FAQ, comandos prontos para a IA e guia de instalação PWA.
  - Player em Canvas com locução de voz neural de estúdio e versão HTML standalone (`public/demo-video.html`).
- **Modelo SaaS & Régua de Cobrança:**
  - 7 dias de degustação gratuita sem exigência de cartão de crédito.
  - Mensalidade de R$ 9,90 com vencimento no dia 10.
  - Régua de alertas no Dashboard, status "Em Atraso" e bloqueio aos 30 dias de inadimplência.
  - Painel administrativo multi-tenant com gestão de planos e isolamento total por usuário.

---

## 2. 🛠️ Stack Tecnológica & Pré-requisitos

### Tecnologias:
- **Linguagem & Runtime:** TypeScript / Node.js (v18+)
- **Frontend Framework:** React 19 + Vite 8
- **Estilização:** Tailwind CSS v3 (paleta Black Obsidian `#0D1017` & Gold Glow `#FACC15`)
- **Banco de Dados & Storage:** Supabase (PostgreSQL + Supabase Storage)
- **API & Serverless:** Vercel Serverless Functions (`/api/financial.js`, `/api/create-preference.js`)
- **Inteligência Artificial & OCR:** Tesseract.js (motor local) + Google Gemini Vision (1.5 / 2.0 Flash)
- **Relatórios & Gráficos:** jsPDF, jsPDF-AutoTable, XLSX, Recharts, Lucide React
- **Áudio & Vídeo:** Python script (`build_demo_video.py`) + Canvas 2D + MP3 de voz neural

### Pré-requisitos:
- Node.js 18+ instalado
- Gerenciador de pacotes npm, pnpm ou yarn
- Conta no Supabase e credenciais de acesso

---

## 3. 🗺️ Mapa da Arquitetura & Estrutura de Arquivos

```
SISTEMA FINANCEIRO/
├── .clineignore              # Arquivos ignorados pelo assistente Cline
├── .clinerules               # Diretrizes estritas de desenvolvimento
├── .env.example              # Exemplo de variáveis de ambiente
├── .env                      # Variáveis de ambiente locais (não versionadas)
├── api/                      # Serverless Functions (Vercel)
│   ├── financial.js          # API REST com Supabase Service Role (evita bloqueios RLS)
│   └── create-preference.js  # Gerador de preferências de pagamento Mercado Pago
├── public/                   # Arquivos públicos e estáticos
│   ├── audio/                # Áudios narrados com voz neural de estúdio (cenas 1 a 6)
│   ├── demo-video.html       # Player estático independente em HTML5 + Canvas
│   ├── manifest.json         # Manifesto PWA para instalação no celular
│   └── sw.js                 # Service Worker para cache e uso offline
├── src/                      # Código-fonte principal React
│   ├── assets/               # Imagens e logotipos estáticos
│   ├── components/           # Componentes modulares reutilizáveis
│   │   ├── AIChatDrawer.tsx  # Assistente virtual com controle operacional do sistema
│   │   ├── CardInvoiceScannerModal.tsx # Scanner de faturas de cartão
│   │   ├── DemoVideoPlayer.tsx # Player interativo em Canvas com narração neural
│   │   ├── FinancialGoalTracker.tsx # Rastreador de metas com taxa Selic
│   │   ├── InvoiceModal.tsx  # Modal de scanner de cupom e nota fiscal
│   │   └── SubscriptionNoticeBanner.tsx # Banner de cobrança no dia 10
│   ├── lib/                  # Utilitários, conexões e motores de IA
│   │   ├── aiScanner.ts      # Motor OCR para notas fiscais
│   │   ├── bankPrintScanner.ts # Motor OCR para prints de caixinhas/bancos
│   │   └── supabase.ts       # Cliente Supabase com fallback de resiliência
│   ├── pages/                # Telas completas da aplicação
│   │   ├── AccountsPage.tsx  # Gestão de contas bancárias e carteiras
│   │   ├── AdminSaasPage.tsx # Painel de controle de usuários e planos SaaS
│   │   ├── CardsPage.tsx     # Cartões de crédito e faturas
│   │   ├── DashboardPage.tsx # Visão geral de saldo, receitas e despesas
│   │   ├── InvestmentsPage.tsx # Patrimônio e investimentos
│   │   ├── SettingsPage.tsx  # Configurações gerais e chave Gemini
│   │   ├── ShoppingListsPage.tsx # Listas de compras e suprimentos
│   │   ├── StatementPage.tsx # Extrato completo com filtros e exportação
│   │   ├── SubscriptionInvoicesPage.tsx # Faturas da mensalidade R$ 9,90
│   │   └── TutorialPage.tsx  # Central de tutoriais, vídeo e FAQ
│   ├── types/                # Definições TypeScript
│   ├── App.tsx               # Orquestrador de rotas e navegação
│   └── main.tsx              # Ponto de entrada da aplicação
├── build_demo_video.py       # Script Python gerador do vídeo em HTML
├── package.json              # Dependências e scripts npm
├── tailwind.config.js        # Configuração das cores temáticas Black & Gold
├── vercel.json               # Regras de roteamento e Serverless na Vercel
└── vite.config.ts            # Configuração do empacotador Vite
```

---

## 4. 🚀 Como Rodar & Como Publicar (Comandos Práticos)

### Execução Local:
1. **Entrar na pasta:**
   ```bash
   cd "SISTEMA FINANCEIRO"
   ```
2. **Instalar as dependências:**
   ```bash
   npm install
   ```
3. **Iniciar o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   * Acesso no computador: `http://localhost:5173`
   * Acesso no celular/tablet (mesma rede): `http://[SEU-IP-LOCAL]:5173`

4. **Validar integridade de build:**
   ```bash
   npm run build
   ```

### Deploy e Publicação:
- **Deploy via Vercel CLI:**
  ```bash
  vercel --prod
  ```
- **Deploy contínuo via GitHub:**
  Basta fazer o push para a branch `main`. A Vercel compila e publica automaticamente em menos de 1 minuto.

---

## 5. ⚙️ Configurações & Variáveis de Ambiente

Crie ou edite o arquivo `.env` na raiz do projeto com as chaves correspondentes:

```env
# Conexão com o Supabase
VITE_SUPABASE_URL=https://hnfhrjgzeivzrcpumkyk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...

# Nome do Sistema (White-Label)
VITE_SYSTEM_NAME=Aura Finance

# Integração de Pagamento Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...

# Opcional: Chave da Google Gemini API para IA Turbo OCR
VITE_GEMINI_API_KEY=
```

---

## 6. 📜 Histórico de Evolução & Decisões Técnicas

* **v1.0.0 (22/10/2026):**
  * Lançamento do ecossistema Black & Gold com Dashboard, Extrato analítico e Contas.
  * Integração com Supabase (tabelas `financial_accounts`, `financial_transactions`, `financial_investments`).
  * Scanner de cupom fiscal com Tesseract.js e efeito visual laser.
* **v1.1.0 (23/10/2026):**
  * Implementação da leitura de faturas em PDF e integração de prints de bancos para Caixinhas/Porquinhos NuBank.
  * Lançamento do rastreador de metas de economia com projeção de rendimento Selic a 13,75% a.a.
  * Criação da régua de cobrança SaaS: 7 dias grátis, R$ 9,90/mês, vencimento dia 10 e bloqueio em 30 dias de atraso.
  * Central oficial de tutoriais com 10 tópicos e player com locução de voz neural de estúdio.
  * Configuração de resiliência em três camadas (Serverless API -> Supabase Client -> LocalStorage cache).
* **v1.2.0 (23/10/2026):**
  * **Pagamento PIX Direto In-App:** Integração com Mercado Pago `/v1/payments` gerando QR Code dinâmico em Base64 e código Copia e Cola dentro do modal, sem redirecionar para fora do app.
  * **Detecção Automática & Webhook:** Polling em tempo real a cada 3 segundos com reconhecimento imediato de status `approved` e endpoint webhook `/api/mercadopago-webhook` com atualização automática do plano no Supabase.
  * **Emissão de Recibo Oficial em PDF:** Geração client-side de comprovante de quitação com layout Black & Gold executivo via jsPDF.
  * **Otimização de Build & Chunking:** Divisão do bundle Vite em chunks modulares (`vendor-react`, `vendor-charts`, `vendor-pdf`, `vendor-icons`), acelerando o carregamento inicial no celular.
* **v1.3.0 (23/10/2026):**
  * **Metas de Orçamento por Categoria (Budget Tracker):** Gestor interativo de teto de gastos mensais com barras de progresso dinâmicas em 4 níveis (Verde, Amarelo, Laranja, Vermelho/Alerta), cálculo de saldo restante no mês e modal de personalização rápida de tetos por categoria.
  * **Modo Privacidade (Eye / EyeOff):** Ocultação instantânea de patrimônio e saldos na Navbar e Dashboard com 1 clique (exibindo `••••••`) e persistência no LocalStorage.
  * **Auto-Categorização Inteligente de Gastos:** Detecção de categorias em tempo real conforme o usuário digita a descrição no modal de lançamento.
  * **Modo Lançamento Contínuo ("Salvar e Novo"):** Permite cadastrar múltiplos gastos e boletos em sequência sem precisar reabrir o modal.
