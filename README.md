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
  - **Simulador de Juros Compostos com Presets Animados:** Cenários rápidos ("Iniciante", "Construtor de Renda", "Liberdade Financeira") com transição fluida dos sliders e curva de patrimônio em tempo real via `requestAnimationFrame`.
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
* **v1.4.0 (23/10/2026):**
  * **Simulador de Juros Compostos & Viver de Renda:** Ferramenta interativa de projeção patrimonial com 4 sliders em tempo real (Aporte Inicial, Aporte Mensal, Prazo em Anos e Taxa Selic/Anual), gráfico de curva exponencial com Recharts e cálculo de renda passiva mensal estimada.
  * **Delegação Arquitetural para Cline:** Criação do arquivo de tarefa estruturada `CLINE_TASK.md` para execução desacoplada de alertas no Dashboard.
* **v1.5.0 (23/10/2026):**
  * **Alerta Inteligente de Contas a Vencer (`UpcomingBillsAlert`):** Widget destacado no Dashboard avisando o usuário sobre boletos e despesas com vencimento previsto para hoje ou nos próximos 3 dias, prevenindo juros e atrasos.
  * **Compatibilidade com Modo Privacidade:** Valores ofuscados dinamicamente quando a privacidade estiver ativada, com navegação em 1 clique direto para o Extrato filtrado.
* **v1.6.0 (23/10/2026):**
  * **Score de Saúde Financeira (`FinancialHealthScore`):** Diagnóstico executivo (0 a 1000 pontos) com régua de 4 níveis (Excelente, Bom, Atenção, Crítico) baseada em taxa de poupança e regularidade de lançamentos, com recomendação personalizada e suporte ao Modo Privacidade.
  * **Configuração Tri-Agent (Antigravity + Cline + Gemini):** Integração do Antigravity IDE com otimização de RAM, Tailwind CSS IntelliSense, Prettier auto-format e execução ágil via tarefas estruturadas.
* **v1.7.0 (23/10/2026):**
  * **Atalhos Rápidos de Simulação (Presets) no Simulador de Juros Compostos:** Inclusão de 3 cards interativos no topo dos sliders (`Iniciante`, `Construtor de Renda`, `Liberdade Financeira`) para carregamento instantâneo de perfis patrimoniais consagrados.
  * **Animação Suave com Interpolação Matemática:** Mecanismo de transição com easing quadrático via `requestAnimationFrame` que anima simultaneamente os sliders, os números formatados, os indicadores de KPI e o gráfico Recharts sem travamentos.
  * **Ajuste Fino de Resolução:** Atualização do `step` do slider de aporte inicial para permitir valores menores a partir de R$ 100 de forma precisa.
* **v1.8.0 (23/10/2026):**
  * **Filtro de Período Rápido em Pílulas Black & Gold no Extrato (`StatementPage`):** Barra horizontal de botões arredondados posicionada logo acima dos campos de data inicial e final (`Hoje`, `Últimos 7 dias`, `Este Mês`, `Mês Anterior`, `Todo o Período`).
  * **Sincronização Bidirecional e Destaque Visual:** Pílula ativa destacada em borda dourada (`border-gold-400`), fundo `bg-gold-400/20` e brilho `shadow-gold-glow`, mantendo compatibilidade total com os inputs manuais de data e exportação em PDF e Excel.
* **v1.9.0 (23/10/2026):**
  * **Widget de Comparativo Mensal ("Mês Atual vs Mês Anterior") no Dashboard (`MonthlyComparisonWidget`):** Comparação executiva em tempo real entre receitas e despesas do mês corrente contra o mês anterior, com badges dinâmicos de variação percentual (verde com `TrendingDown` para economia e vermelho com `TrendingUp` para aumento de despesas), e suporte nativo ao Modo Privacidade.
* **v1.10.0 (23/10/2026):**
  * **Card Resumo da "Regra 50/30/20" no Rodapé do Orçamento (`CategoryBudgetWidget`):** Análise e enquadramento automático das despesas do mês corrente nos 3 pilares consagrados da metodologia: **50% Necessidades** (Moradia, Alimentação, Saúde), **30% Estilo de Vida** (Lazer, Compras, Transporte) e **20% Futuro** (Investimentos e Poupança).
  * **Barra de Progresso Trifásica Colorida:** Visualização com preenchimento em 3 cores distintas (Azul para Necessidades, Ouro para Estilo de Vida e Esmeralda para Futuro), indicando as porcentagens reais atingidas no mês e os valores monetários calculados, com compatibilidade com o Modo Privacidade.
* **v2.0.0 (23/10/2026):**
  * **Card "Disponível para Gastar Hoje" (*Safe to Spend* - Inspirado no Copilot Money & Nubank):** Widget de alto impacto no topo do Dashboard que calcula matematicamente o valor máximo seguro que o usuário pode desembolsar por dia até o último dia do mês corrente (`(Saldo Atual - Contas Comprometidas) / Dias Restantes`).
  * **Tooltip Flutuante com Fórmula Matemática:** Tooltip interativo executivo em estilo Black Obsidian & Gold ao passar o mouse ou tocar na badge *Safe to Spend*, exibindo a equação exata `(Saldo Atual - Contas a Vencer) ÷ Dias Restantes` e a decomposição analítica dos valores em tempo real.
  * **Blindagem de Caixa & Modo Privacidade:** Detecção automática de dias restantes, status dinâmico (Verde se positivo, Vermelho com alerta se negativo) e suporte completo à ocultação de valores sensíveis com o olhinho (`isPrivate`).
* **v2.1.0 (23/10/2026):**
  * **Radar de Assinaturas & Recorrências (`SubscriptionHubWidget`):** Controle visual de serviços recorrentes (Netflix, Spotify, ChatGPT, SmartFit, Internet, etc.) com cálculo dinâmico de custo mensal e impacto anual acumulado, dias restantes para o próximo débito e cadastro de novas assinaturas persistido no LocalStorage.
  * **Atalhos de Teclado Globais no Modal de Transação (`TransactionModal`):** Suporte nativo a `Cmd + Enter` / `Ctrl + Enter` para confirmar lançamento, `Cmd + Shift + Enter` para o modo contínuo "Salvar e Novo", e `Escape` para fechar, com legenda de rodapé.
* **v2.2.0 (23/10/2026):**
  * **Central de Notificações & Alertas Rápidos na Navbar (`Navbar.tsx`):** Botão com ícone de sino (`Bell` da `lucide-react`) posicionado ao lado do botão de Privacidade (olho), com badge animado (`animate-pulse`) exibindo o contador de avisos pendentes.
  * **Dropdown Flutuante Executivo Black Obsidian & Gold:** Menu flutuante suspenso com backdrop blur, borda dourada (`border-gold-400/30`) e sombra profunda contendo:
    * *Alerta de Contas a Vencer:* Detecção de contas com vencimento hoje ou nos próximos 3 dias, com clique direto para visualização filtrada no Extrato.
    * *Alerta de Fatura do Sistema:* Lembrete da mensalidade de R$ 9,90 com vencimento no dia 10, com acesso direto ao checkout PIX do Mercado Pago.
  * **Comportamento Click-Outside & Auto-Dismiss:** Listener inteligente via `useRef` para fechar o dropdown ao clicar fora ou no botão novamente sem vazamento de memória.
* **v2.3.0 (23/10/2026):**
  * **Simulador de Quitação Acelerada de Dívidas (`DebtSnowballSimulator.tsx`):** Calculadora matemática avançada inspirada nos melhores apps de finanças internacionais para eliminar dívidas com base em duas consagradas estratégias:
    * ⚡ **Método Avalanche (Maior Juro Primeiro):** Amortiza agressivamente as dívidas mais caras (cartão rotativo, cheque especial), minimizando os juros totais pagos ao banco.
    * ⛄ **Método Bola de Neve (Menor Saldo Primeiro):** Foca nas dívidas de menor saldo para quitá-las rapidamente, liberando fluxo de caixa e gerando vitórias emocionais imediatas.
  * **Motor Matemático de Efeito Bola de Neve:** À medida que cada dívida é liquidada, o valor de sua parcela mínima é automaticamente incorporado ao aporte extra mensal, acelerando exponencialmente a quitação das dívidas subsequentes.
  * **Painel Executivo de Indicadores de Impacto:** Exibição do prazo exato para quitação total (com contador de meses antecipados), economia monetária em juros evitados, data da liberdade financeira e lista priorizada com destaque para o alvo ativo ("🎯 Alvo Atual").
  * **Aba Dupla na Página de Investimentos (`InvestmentsPage.tsx`):** Seletor elegante em abas Black Obsidian & Gold permitindo alternar entre o "Multiplicador de Patrimônio (Juros Compostos)" e a "Quitação de Dívidas".
* **v2.4.0 (23/10/2026):**
  * **Importador Universal de Extratos Bancários OFX & CSV (`BankStatementImporterModal.tsx`):** Ferramenta de conciliação bancária completa que permite arrastar ou carregar extratos bancários de qualquer instituição (Nubank, Itaú, Inter, Bradesco, Santander, Caixa, Banco do Brasil).
  * **Parser Inteligente Dual (OFX & CSV):** Extração de dados nativa sem bibliotecas pesadas, tratando blocos `<STMTTRN>` e separadores de planilhas CSV, convertendo datas e sinais de movimentação com precisão cirúrgica.
  * **Auto-Categorização Heurística Brasileira:** Reconhecimento automático de despesas e receitas por termos populares (*Supermercado, iFood, Posto, Uber, Netflix, Aluguel, Salário*), atribuindo instantaneamente as categorias correspondentes.
  * **Tabela de Conciliação em Lote no Extrato (`StatementPage.tsx`):** Revisão antes de importar, com seleção em massa, personalização de categoria por item, métricas consolidadas (Total de Entradas vs Saídas) e destinação para a conta bancária escolhida.
* **v2.4.1 (23/10/2026):**
  * **Atalho Global de Teclado 'P' para Modo Privacidade (`Navbar.tsx`):** Pressionar a tecla `P` no teclado agora alterna instantaneamente o Modo Privacidade entre visível e oculto (`••••••`), com proteção contextual que ignora disparos acidentais enquanto o usuário digita em `input`, `textarea`, `select` ou elementos editáveis, preservando também atalhos nativos do sistema (como `Cmd+P` de impressão).
  * **Badge Visual `[P]` no Botão da Navbar:** Exibição de uma pílula sutil em estilo mono `[P]` integrada ao botão de privacidade ao lado do ícone de olho, tornando a descoberta do atalho rápida e intuitiva.
* **v2.5.0 (23/10/2026):**
  * **Radar de Metas & Caixinhas com Anéis Circulares SVG (`FinancialGoalsWidget.tsx`):** Monitoramento visual de metas de vida (Reserva de Emergência, Viagem, Troca de Carro) posicionado no Dashboard com anéis circulares SVG animados (`ProgressRing`), porcentagem de atingimento no centro e cores dinâmicas customizáveis.
  * **Micro-Animação de Celebração & Brilho Dourado:** Efeito de pulso luminoso dourado (`animate-pulse`), aura externa iluminada (`shadow-gold-glow`), filtro `drop-shadow` nos traços do SVG e badge de celebração especial (`🎉 Meta Atingida!`) renderizado automaticamente nos anéis circulares que alcançarem 100% ou mais da meta.
  * **Aporte Rápido de Liquidez:** Botões de incremento imediato (`+R$ 100`, `+R$ 250`, `+R$ 500` e valor livre) para alimentar as caixinhas sem fricção.
  * **Formulário de Novos Objetivos:** Cadastro completo de título, valor alvo, aporte inicial, categoria com ícones automáticos (*Escudo, Avião, Carro, Gráfico*) e color picker nativo.
  * **Modo Privacidade:** Valores monetários das metas e saldos restantes protegidos dinamicamente com `••••••` ao ativar o atalho `P` ou botão de olho.
* **v2.6.0 (23/10/2026):**
  * **Command Palette Executivo & Spotlight Global (`Cmd + K` / `Ctrl + K` - Inspirado no Linear & Raycast):** Barra de comando centralizada flutuante (`CommandPalette.tsx`) com backdrop blur escuro (`backdrop-blur-md bg-black/80`), acionada de qualquer lugar do sistema via teclado (`Cmd + K`, `Ctrl + K`) ou pelo botão de busca com badge mono `⌘K` na Navbar.
  * **Navegação Expressa por Abas:** Salto instantâneo entre Dashboard, Extrato, Cartões de Crédito, Contas Bancárias, Investimentos & Quitação de Dívidas, Listas de Compras e Tutoriais.
  * **Ações Imediatas sem Fricção:** Disparo com 1 toque no teclado para `+ Nova Despesa`, `+ Nova Receita`, `📥 Importar Extrato (OFX/CSV)`, `📸 Escanear Fatura com IA`, `🤖 Abrir CFO Virtual` e `👁️ Alternar Modo Privacidade`.
  * **Busca Dinâmica de Transações:** Digite o nome de qualquer estabelecimento ou valor (ex: *Uber, iFood, Mercado, Aluguel*) para filtrar despesas e receitas em tempo real, navegando com as setas `↑` `↓` e abrindo o detalhe com `Enter`.
  * **Credenciais de Teste Executivo (Gabriely Tosin):** Usuária `gabrielytosin06@gmail.com` cadastrada e ativada no Supabase Auth com plano `lifetime` (Acesso PRO Vitalício Permanente, isenta de paywall e expiração de trial).
* **v2.7.0 (23/10/2026):**
  * **IA com Controle Autônomo Total & Comandos de Zeramento Flexíveis:** Aprimoramento completo do motor de processamento em linguagem natural (`geminiAssistant.ts` e `AIAssistantChat.tsx`) para compreender e executar qualquer ordem de zeramento ou ajuste de saldos sem ambiguidade.
  * **Zerar Saldo dos Bancos:** Reconhecimento imediato de comandos como *"zerar o saldo dos bancos"*, *"zerar saldo"*, *"zera os bancos"*, *"zerar contas"*, disparando atualização sincronizada no Supabase e no estado local com feedback visual.
  * **Zerar ou Definir Banco Específico:** Capacidade de zerar ou alterar o saldo de uma conta bancária individualmente (*"zerar banco inter"*, *"zera o btg"*, *"coloca 500 no inter"*, *"ajustar saldo do sicredi para 1500"*).
  * **Zerar Extrato & Despesas:** Comandos como *"zerar extrato"*, *"limpar lançamentos"*, *"apagar todas as despesas"* limpam o histórico de movimentações mantendo as contas bancárias preservadas.
  * **Execução Autônoma sem Bloqueio de UI:** Bypassa diálogos síncronos de confirmação do navegador quando comandado diretamente pelo chat da IA, permitindo operações instantâneas com histórico de `Desfazer` (*Undo*).
  * **Endpoints Serverless Resilientes:** Adição de rotas em `api/financial.js` (`reset_all_account_balances`, `reset_all_transactions`, `reset_all_investments`) com Service Role para execução segura em produção.
* **v2.8.0 (23/10/2026):**
  * **Cockpit Oficial "Chat IA (Copiloto)" — O Carro-Chefe da Plataforma (`AIChatPage.tsx`):** Criação de uma página dedicada em tela cheia posicionada como recurso central do sistema, oferecendo controle operacional 100% autônomo sobre todo o ecossistema financeiro.
  * **Acesso e Autonomia Irrestrita no Sistema:**
    * *Lançar & Criar:* Adiciona receitas e despesas com categorização inteligente e vínculo bancário automático por voz ou texto.
    * *Excluir & Modificar:* Altera valores, status de lançamentos (`pago` / `pendente`) e remove transações com histórico de *Desfazer* imediato.
    * *Saldos Bancários:* Zera ou ajusta saldos de todos os bancos ou contas específicas (*"coloca 1500 no inter"*, *"zerar saldo dos bancos"*).
    * *Carteira de Investimentos & Caixinhas:* Cria, ajusta montantes e gerencia reservas em renda fixa, Selic e Porquinhos digitais.
    * *Prints de Bancos & Comprovantes:* Suporte a upload, arrastar e soltar (drag & drop) e colar direto do clipboard (`Ctrl+V`) de extratos e telas de bancos com leitura automática multimodal.
  * **Navegação & Posicionamento de Destaque:**
    * *Sidebar Desktop:* Posicionada logo abaixo do Dashboard com ícone de robô, efeito Glow Dourado e badge de prestígio `"Carro-Chefe"`.
    * *Navegação Mobile (`MobileBottomNav.tsx`):* Botão fixo com ícone e ponto luminoso pulsante acessível com o polegar.
    * *Command Palette (`Cmd + K`):* Atalho de salto direto `"Copiloto IA (Chat Autônomo)"`.
    * *Mini-Chat Flutuante:* Botão de expansão em tela cheia (`Maximize2`) para transitar do widget para o Cockpit completo.
  * **Interação por Voz:** Botão de microfone integrado com a API nativa Web Speech Recognition com feedback e animação de fala em tempo real.
* **v2.8.1 (23/10/2026):**
  * **Blindagem de UX dos Modais & Rolagem Segura:** Fechamento por clique fora no backdrop escuro (`backdrop dismiss`), captura universal da tecla `Escape` (`Esc`) em todos os modais secundários e adição de `overflow-y-auto` para evitar cortes em telas de smartphones ou com teclados virtuais abertos.
* **v2.8.2 (23/10/2026):**
  * **Micro-interações Táteis & Acessibilidade nos Modais:** Padronização executiva em 100% dos botões de fechamento e cartões de modais do ecossistema Aura Finance PRO:
    * *Feedback Tátil Háptico Visual:* Efeito `active:scale-90 hover:bg-dark-800 transition-all duration-150` proporcionando sensação física imediata de clique tanto em desktop quanto mobile.
    * *Acessibilidade e Tooltips:* Inclusão de `title="Fechar janela (Esc)"` e `aria-label="Fechar modal"` em todos os botões de encerramento.
    * *Animação Fluida:* Transição cinematográfica `animate-in fade-in zoom-in-95 duration-150` aplicada em todos os containers de modais, garantindo abertura elegante e zero engasgos.
* **v2.8.3 (23/10/2026):**
  * **Micro-interações Táteis & Animações Premium no Leitor de Faturas (`CardInvoiceScannerModal.tsx`):**
    * *Animação Fluida de Entrada:* Transição cinematográfica `animate-in fade-in slide-in-from-bottom-4 duration-200` com suporte nativo acelerado por GPU no `index.css`.
    * *Estética Black Obsidian & Gold Glow:* Fundo em `#0D1017`, detalhes em `#FACC15` e sombra de profundidade luxuosa `shadow-2xl shadow-gold-500/10`.
    * *Feedback Tátil Háptico (`active:scale-95`):* Efeito responsivo de clique em 100% dos botões de ação (fechar, alternador de abas Upload/Texto, processamento, seleção em massa, exclusão e confirmação).
    * *Comemoração com Confetes:* Disparo de `confetti({ particleCount: 40, spread: 60 })` com origem suave (`y: 0.6`) ao clicar em *"Marcar como Pagas"* e confirmar a importação dos lançamentos da fatura.
    * *Acessibilidade & Tooltips Executivas:* Atributos `title` e `aria-label` descritivos em todos os botões, caixas de texto, selects e checkboxes.
* **v2.9.0 (23/10/2026):**
  * **Barra Flutuante de Conciliação & Ações em Massa no Extrato (`StatementPage.tsx`):**
    * *Seleção Múltipla:* Checkboxes executivos em cada linha da tabela e seleção geral no cabeçalho com cálculo dinâmico de valores em tempo real.
    * *Barra Flutuante (Bottom Floating Bar):* Container fixo na base da tela com efeito `backdrop-blur-xl`, borda dourada suave e ações em lote: *Marcar como Pagas* (com estouro comemorativo de confetes), *Exclusão em Lote* com modal de confirmação e *Cancelar Seleção*.
  * **Sistema Global de Notificações Toast Black & Gold (`Toast.tsx` & `App.tsx`):**
    * *Arquitetura Reativa:* `ToastProvider` global com hook `useToast()` e método exportado `showToast(msg, type)` para feedback instantâneo de operações.
    * *Auto-Dismiss com Barra Regressiva:* Desaparecimento automático em 3 segundos com barra animada via GPU e suporte a fechar manual.
    * *Identidade Visual Consistente:* Estilos dedicados para `success`, `error`, `warning` e `info` totalmente harmonizados com a paleta Black Obsidian & Gold Glow.
* **v2.9.1 (23/10/2026):**
  * **Motor de IA Autônomo Turbo — Multi-Lançamentos & Baixa Instantânea (`geminiAssistant.ts`, `AIChatPage.tsx`, `AIAssistantChat.tsx`):**
    * *Reconhecimento de Jargões Financeiros Brasileiros:* Compreensão nativa e imediata de termos como *"baixar uns valores"*, *"dar baixa na conta"*, *"baixa a gabi"*, *"quitar"*, *"liquidar"*, *"lançamento pra [pessoa]"* e *"anota/lança/cadastra"*.
    * *Baixa em Lote Inteligente (`bulk_mark_paid`):* Comandos genéricos como *"baixar uns valores"* ou *"dar baixa em tudo"* localizam automaticamente as contas com status `pending` e as marcam como pagas em lote com celebração de confetes.
    * *Multi-Lançamentos em Único Comando (Batch Parsing):* A IA agora processa múltiplos lançamentos simultâneos separados por "e", vírgula ou linha (ex: *"lança 50 pra gabi e 100 de gasolina"*), criando todas as transações de uma só vez com cálculo do total consolidado.
    * *Captura Automática de Nomes:* Frases como *"lançamento pra gabi de 150"* extraem o destinatário *"Gabi"* como título do lançamento de forma limpa e automática.
* **v3.0.0 (23/10/2026) — Edição Executiva "Carro-Chefe de Outro Mundo":**
  * **Transferência Entre Contas com Conciliação Atômica (`transfer_between_accounts`):**
    * A IA agora processa comandos como *"transfere 500 do BTG pro Inter"*, debitando da conta de origem, creditando no destino, gerando os lançamentos de débito/crédito e recalculando os saldos simultaneamente.
  * **Consultas Analíticas em Tempo Real (CFO Virtual Inteligente):**
    * *Consultas por Termo/Pessoa:* *"Quanto gastei com alimentação?"*, *"Quanto paguei pra Gabi?"* — Varre o banco em milissegundos e calcula o total acumulado com lista dos últimos itens.
    * *Detector do Maior Gasto:* *"Qual meu maior gasto?"* — Localiza a despesa de maior valor, calcula o % de representatividade no orçamento e sugere plano de contenção.
    * *Diagnóstico Dinâmico de Caixa:* *"Como tá meu fluxo de caixa?"* — Avalia receitas, despesas, contas a pagar e gera score de saúde financeira.
  * **Locução por Voz Neural Nativa (Text-to-Speech pt-BR):**
    * Botão de alto-falante (`Volume2`) integrado em cada resposta da IA, permitindo ao usuário escutar o parecer financeiro com voz neural em português do Brasil sem gastar tokens.
  * **Action Chips Dinâmicos & Contextuais:**
    * Botões de ação rápida abaixo das mensagens da IA (ex: *[📑 Ver no Extrato]*, *[📊 Abrir CFO]*, *[🔍 Qual meu maior gasto?]*) para navegação executiva com 1 toque no celular ou mouse.
* **v3.1.0 (23/10/2026) — Automações de Elite & Planejamento Financeiro:**
  * **Parcelamento Automático por Voz e Chat:**
    * A IA agora entende comandos como *"comprei um celular em 10x de 350"* ou *"lança notebook em 12x de 450 no cartão"*.
    * Ela gera automaticamente as N parcelas mensais futuras (`Notebook (1/12)`, `Notebook (2/12)`...), define a 1ª como paga e agenda as 11 restantes com status pendente nas suas respectivas datas de vencimento mês a mês.
  * **Auditoria de Duplicidades em Tempo Real:**
    * Comandos como *"auditar duplicidades"* ou *"tem algum lançamento duplicado?"* varrem o extrato em busca de despesas idênticas com o mesmo valor e descrição no intervalo de 96h, sugerindo exclusão com 1 clique.
  * **Simulador & Planejador da Regra 50/30/20:**
    * Ao perguntar *"regra 50 30 20"* ou *"plano de economia"*, a IA calcula com base no faturamento real do cliente e entrega a divisão ideal em Reais (R$) para Gastos Essenciais (50%), Estilo de Vida (30%) e Investimentos (20%), comparando com o que o cliente realmente gastou até o momento.




