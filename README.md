# MyVault

Gestão financeira pessoal, mobile-first, feita para o meu iPhone. PWA 100% local —
os dados vivem em IndexedDB no dispositivo, sem contas nem servidores.

**App:** https://miguellbrandao.github.io/MyVault/

## Funcionalidades

- **Movimentos** — despesas e ganhos com categorias (emoji), navegação por mês e filtros
- **Metas** — objetivos de poupança com depósitos/levantamentos e progresso
- **Dívidas** — o que devo e o que me devem, com pagamentos parciais
- **Atalho da Wallet** — automatização do iOS que deteta pagamentos Apple Pay e abre
  o ecrã de confirmação com valor e comerciante preenchidos (guia em Ajustes → Atalho da Wallet)
- **Backup** — exportar/importar tudo em JSON (é a única cópia de segurança!)
- **Offline** — service worker com precache; funciona sem rede

## Stack

Vite + React 19 + TypeScript · Tailwind CSS 4 + shadcn/ui · Dexie (IndexedDB) ·
vite-plugin-pwa · deploy automático para GitHub Pages via Actions.

## Desenvolvimento

```sh
npm install
npm run dev      # servidor local com dados de exemplo (seed só em DEV)
npm run build    # typecheck + build de produção + service worker
node scripts/generate-icons.mjs   # regenerar ícones da PWA
```

## Nota importante (iOS)

O Safari e uma web app instalada («Abrir como Web App») guardam dados em locais
**separados**. Como o Atalho da Wallet abre URLs no Safari, recomenda-se adicionar
a app ao ecrã principal com «Abrir como Web App» **desligado** — o ícone abre no
Safari, o mesmo sítio onde o atalho regista as despesas.
