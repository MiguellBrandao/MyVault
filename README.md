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

## Setup do Supabase

Executar `supabase/schema.sql` uma vez no SQL Editor do projeto. Cria as tabelas,
as políticas RLS (cada utilizador só acede às suas linhas), as categorias por
omissão para novos utilizadores, e a função `wallet_add` usada pelo Atalho.

Bases de dados criadas antes das migrações: correr também
`supabase/fix-wallet-add.sql` e `supabase/migrate-icons.sql` (uma vez cada).

## Desenvolvimento

```sh
npm install
npm run dev      # servidor local
npm run build    # typecheck + build de produção + service worker
node scripts/generate-icons.mjs   # regenerar ícones da PWA
```
