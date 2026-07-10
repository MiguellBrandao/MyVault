# MyVault

Gestão financeira pessoal, mobile-first, feita para o meu iPhone. PWA com dados
no Supabase (Postgres + Row Level Security), protegidos por login.

**App:** https://miguellbrandao.github.io/MyVault/

## Funcionalidades

- **Saldo total** — quanto tenho agora, dividido em «disponível para gastar» e
  «guardado em metas»
- **Movimentos** — despesas e ganhos com categorias (ícones personalizáveis),
  navegação por mês (incluindo meses futuros, para adiantar despesas/ganhos) e filtros
- **Metas** — contas secundárias de poupança: guardar/retirar dinheiro do saldo
  disponível, com validação (não dá para guardar mais do que tens)
- **Dívidas** — o que devo e o que me devem, com pagamentos parciais limitados
  ao valor em falta
- **Atalho da Wallet** — automatização do iOS que deteta pagamentos Apple Pay e
  regista-os **em segundo plano** (POST à RPC `wallet_add`); aparecem no Início
  como «Por confirmar» (guia em Ajustes → Atalho da Wallet)

## Stack

Vite + React 19 + TypeScript · Tailwind CSS 4 + shadcn/ui · Supabase
(Postgres/Auth/RLS) · TanStack Query · vite-plugin-pwa · deploy automático para
GitHub Pages via Actions.

## Migrações do Supabase

O schema vive em `supabase/migrations/` (tabelas, políticas RLS, categorias por
omissão, função `wallet_add` do Atalho). A cada push ao `main`, o workflow corre
`supabase db push` e aplica automaticamente as migrações ainda não aplicadas —
basta adicionar um novo ficheiro `AAAAMMDDHHMMSS_nome.sql` e fazer commit.

Requer os segredos `SUPABASE_ACCESS_TOKEN` e `SUPABASE_DB_PASSWORD` nas
definições de Actions do repositório.

## Desenvolvimento

```sh
npm install
npm run dev      # servidor local
npm run build    # typecheck + build de produção + service worker
node scripts/generate-icons.mjs   # regenerar ícones da PWA
```
