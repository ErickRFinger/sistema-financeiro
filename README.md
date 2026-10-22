# ⚡ Aura Finance | Sistema de Gestão Financeira Black & Gold (SaaS)

Um sistema financeiro profissional, moderno e completo, desenvolvido sob medida para **comercialização e revenda (White-Label)**. O sistema possui identidade visual de alto padrão em **Preto e Dourado/Amarelo (#0D1017 & #FACC15)** e é **100% responsivo** em todos os tipos de dispositivos: smartphones, tablets, notebooks e computadores desktop.

---

## 🌟 Principais Recursos

### 1. 🤖 Leitor Inteligente de Nota Fiscal com IA (OCR & Visão Computacional)
- **Upload e Câmera Instantânea**: No celular ou tablet, tire fotos diretamente com a câmera (`capture="environment"`). No computador, arraste PDFs ou fotos de comprovantes.
- **Efeito Visual Laser Scanner**: Animação em tempo real com barra de progresso durante a leitura dos dados.
- **Extração Fisiológica de Documentos Brasileiros**:
  - Reconhecimento de Razão Social / Nome Fantasia do Fornecedor
  - CNPJ do Emissor (formatado automaticamente)
  - Data de Emissão da Nota
  - Chave de Acesso da NF-e (44 dígitos)
  - Valor Total Líquido (R$)
  - Itens detectados e descrição
  - Sugestão inteligente de categoria e forma de pagamento
- **Modo Híbrido**:
  - **Modo Gratuito Integrado**: Tesseract.js com dicionário em português + heurísticas de NF-e / NFC-e / DANFE (sem custos adicionais de API).
  - **Modo Turbo Vision (Google Gemini)**: Ativado opcionalmente ao inserir a API key nas Configurações.
- **Armazenamento no Supabase**: As notas e comprovantes são salvos automaticamente no bucket `notas_fiscais` com link público associado ao lançamento.

---

### 2. 📊 Extrato de Gastos e Movimentações
- **Filtros Rápidos e Dinâmicos**: Hoje, Últimos 7 Dias, Este Mês, Mês Passado, Este Ano, Todos ou Personalizado com calendário.
- **Filtros Multidimensionais**: Tipo (Receitas/Despesas), Situação (Pago/Pendente), Categoria e Conta Bancária.
- **Barra de Resumo Dinâmico**: Total de despesas filtradas, receitas e saldo líquido calculados em tempo real.
- **Exportação Profissional**:
  - **PDF Executivo**: Relatório pronto para impressão ou envio por WhatsApp/E-mail com design Black & Gold.
  - **Planilha Excel (.xlsx / .csv)**: Tabela completa para contabilidade ou conferência.
- **Ações Rápidas**: Alternância de status com 1 clique (Pago ⟷ Pendente), visualização de comprovante e exclusão com recálculo automático de saldo.

---

### 3. 🏦 Painel e Gestão de Contas Bancárias
- **Sincronização com Supabase**: Conectado diretamente à tabela `financial_accounts` (ex: BTG Pactual, Banco Inter, Sicredi, Mercado Pago).
- **Transferência entre Contas**: Movimentação interna com atualização automática de saldos.
- **Investimentos & Reservas**: Integração com a tabela `financial_investments` para acompanhamento de patrimônio.

---

### 4. 📱 Experiência Multi-Dispositivo (Mobile First & Desktop)
- **Smartphones**: Barra de navegação inferior estilo aplicativo nativo (iOS / Android), botão central flutuante para ler NF, cards de leitura rápida.
- **Tablets e Laptops**: Layout híbrido em colunas e gráficos interativos de fluxo de caixa (Recharts).
- **Desktop**: Sidebar recolhível, tabelas analíticas com atalhos de teclado e visualização de comprovantes em alta resolução.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 19 + TypeScript + Vite
- **Estilização**: Tailwind CSS v3 (paleta customizada Black Obsidian & Gold Glow)
- **Banco de Dados & Storage**: Supabase (`https://hnfhrjgzeivzrcpumkyk.supabase.co`)
- **Tabelas do Supabase**:
  - `financial_transactions` (Lançamentos de caixa)
  - `financial_accounts` (Contas bancárias)
  - `financial_investments` (Investimentos)
  - `compras` (Integração de compras)
  - Bucket `notas_fiscais` (Armazenamento de comprovantes e arquivos de NF)
- **Inteligência Artificial & OCR**: Tesseract.js (motor local) + Gemini 1.5/2.0 Flash Vision (opcional)
- **Relatórios**: jsPDF + jsPDF-AutoTable + XLSX
- **Ícones & Gráficos**: Lucide React + Recharts + Canvas Confetti

---

## 🚀 Como Executar Localmente

1. Abra o terminal na pasta do projeto:
   ```bash
   cd "C:\Users\Erick Finger\Desktop\SISTEMA FINANCEIRO"
   ```

2. Instale as dependências (já instaladas):
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. Acesse pelo navegador:
   - No computador: `http://localhost:5173`
   - No celular ou tablet (mesma rede Wi-Fi): `http://192.168.0.131:5173` ou pelo Tailscale / Radmin VPN.

---

## ☁️ Deploy na Vercel e GitHub

1. **Commit inicial no Git**:
   ```bash
   git add .
   git commit -m "feat: Sistema Financeiro Black and Gold com Leitor de NF por IA e Supabase"
   ```

2. **Deploy na Vercel com 1 comando**:
   ```bash
   vercel
   ```
   Ou vincule o repositório GitHub diretamente na dashboard da [Vercel](https://vercel.com).
