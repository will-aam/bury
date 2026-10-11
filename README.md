# Sistema de Gestão da Bolaria 🎂

Sistema simples, ágil e robusto desenvolvido em **Next.js (App Router)**, **React 19**, **Prisma ORM**, **Tailwind CSS** e **PostgreSQL no Neon**.

Projetado especialmente para operação ágil em balcão/entregas, com foco em simplicidade, navegação por teclado (`Tab`/`Enter`), controle de fiados em tempo real e eliminação de inconsistências de planilhas.

---

## 🚀 Como Rodar Localmente

1. **Instalar dependências** (utilizando `pnpm`):
   ```bash
   pnpm install
   ```

2. **Configurar variáveis de ambiente**:
   O arquivo `.env` já está configurado com o banco Neon da Bolaria:
   ```env
   DATABASE_URL="postgresql://neondb_owner:npg_0CzfJwHxkps1@ep-muddy-resonance-b6gn9ze9.c-2.sa-east-1.aws.neon.tech/neondb?sslmode=require"
   DIRECT_URL="postgresql://neondb_owner:npg_0CzfJwHxkps1@ep-muddy-resonance-b6gn9ze9.c-2.sa-east-1.aws.neon.tech/neondb?sslmode=require"
   AUTH_SECRET="bolaria-segredo-super-seguro-troque-em-producao-2026-neon-bury"
   ```

3. **Popular o banco de dados (Seed inicial)**:
   ```bash
   pnpm exec tsx prisma/seed.ts
   ```
   *Já foram cadastrados a usuária Dona, o cliente "Consumidor avulso", categorias e catálogo inicial de bolos.*

4. **Rodar a aplicação**:
   ```bash
   pnpm dev
   ```
   Acesse: [http://localhost:3000](http://localhost:3000)

---

## 🔑 Credenciais Padrão de Acesso

- **E-mail**: `dona@bolaria.com`
- **Senha**: `bolo1234`
- **Perfil**: `DONA` (Acesso total a vendas, custos, margens e relatórios)

---

## 🧪 Como Rodar os Testes Automatizados

As regras financeiras (cálculos de centavos, saldos, status de venda, quitações em cascata e parcelamentos) possuem cobertura de testes automatizados com **Vitest**:

```bash
pnpm exec vitest run
```

---

## 🚢 Deploy na Vercel com Neon

1. Suba o repositório no seu Git (GitHub / GitLab / Bitbucket).
2. Na [Vercel](https://vercel.com):
   - Importe o repositório `bury`.
   - Configure o **Framework Preset** como `Next.js`.
   - Adicione as variáveis de ambiente:
     - `DATABASE_URL` (URL do Neon)
     - `DIRECT_URL` (URL direta do Neon)
     - `AUTH_SECRET` (Uma chave forte gerada para produção)
   - Clique em **Deploy**.

---

## 📌 O que foi entregue no MVP e Fase 2

- [x] **Autenticação segura e perfis**: Dona e Ajudante com proteção de rotas via Middleware e JWT `httpOnly`.
- [x] **Painel / Dashboard**: Faturamento mensal, despesas, balanço líquido, comparativo vs mês anterior, total a receber em fiado e bolos mais vendidos.
- [x] **Lançamento Ultra-rápido de Vendas**: Otimizado para teclado (`Tab`/`Enter`), com produtos pré-carregados, preços automáticos editáveis e seleção imediata de pagamento (À vista Pix/Dinheiro/Cartão ou Fiado).
- [x] **Controle de Fiados & Pagamentos**: Histórico por venda, abatimento parcial/total e bloqueio de pagamentos maiores que o saldo.
- [x] **Clientes & Pontos de Venda**: Cadastro de revendedores e consumidor final, cliente padrão "Consumidor avulso", histórico de compras e ticket médio.
- [x] **Produtos**: Cadastro de bolos tradicionais e bolos BB (pequenos) com controle de status ativo/inativo.
- [x] **Despesas**: Lançamento rápido de gastos diários por categoria.
- [x] **Relatórios & Grade Mensal**: Grade completa de produtos por dia (substitui as antigas abas da planilha), filtros por mês/ano/cliente e exportação em CSV.
- [x] **Fase 2 (Início)**: Cadastro de ingredientes com conversão de embalagens (kg → g, l → ml) e custo unitário por unidade base.
