import Dexie, { type EntityTable } from 'dexie'

export type TxType = 'expense' | 'income'
export type TxSource = 'manual' | 'wallet'

export interface Transaction {
  id: number
  type: TxType
  /** Valor em cêntimos, sempre positivo; o sinal vem de `type`. */
  amountCents: number
  description: string
  categoryId?: number
  /** Data do movimento em formato ISO `yyyy-MM-dd`. */
  date: string
  note?: string
  source: TxSource
  createdAt: number
}

export interface Category {
  id: number
  name: string
  emoji: string
  type: TxType
  /** Ordem de apresentação nas listas de escolha. */
  order: number
}

/** 'owe' = eu devo; 'owed' = devem-me. */
export type DebtDirection = 'owe' | 'owed'

export interface Debt {
  id: number
  name: string
  person?: string
  direction: DebtDirection
  totalCents: number
  dueDate?: string
  note?: string
  createdAt: number
}

export interface DebtPayment {
  id: number
  debtId: number
  amountCents: number
  date: string
}

export interface Goal {
  id: number
  name: string
  emoji: string
  targetCents: number
  deadline?: string
  createdAt: number
}

export interface GoalEntry {
  id: number
  goalId: number
  /** Positivo = depósito, negativo = levantamento. */
  amountCents: number
  date: string
}

const db = new Dexie('myvault') as Dexie & {
  transactions: EntityTable<Transaction, 'id'>
  categories: EntityTable<Category, 'id'>
  debts: EntityTable<Debt, 'id'>
  debtPayments: EntityTable<DebtPayment, 'id'>
  goals: EntityTable<Goal, 'id'>
  goalEntries: EntityTable<GoalEntry, 'id'>
}

db.version(1).stores({
  transactions: '++id, date, type, categoryId, createdAt',
  categories: '++id, type, order',
  debts: '++id, direction, createdAt',
  debtPayments: '++id, debtId, date',
  goals: '++id, createdAt',
  goalEntries: '++id, goalId, date',
})

const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Supermercado', emoji: '🛒', type: 'expense', order: 0 },
  { name: 'Restauração', emoji: '🍽️', type: 'expense', order: 1 },
  { name: 'Transportes', emoji: '🚗', type: 'expense', order: 2 },
  { name: 'Casa', emoji: '🏠', type: 'expense', order: 3 },
  { name: 'Contas', emoji: '💡', type: 'expense', order: 4 },
  { name: 'Subscrições', emoji: '📱', type: 'expense', order: 5 },
  { name: 'Lazer', emoji: '🎉', type: 'expense', order: 6 },
  { name: 'Saúde', emoji: '🩺', type: 'expense', order: 7 },
  { name: 'Compras', emoji: '👕', type: 'expense', order: 8 },
  { name: 'Outros', emoji: '📦', type: 'expense', order: 9 },
  { name: 'Salário', emoji: '💼', type: 'income', order: 0 },
  { name: 'Freelance', emoji: '💸', type: 'income', order: 1 },
  { name: 'Presentes', emoji: '🎁', type: 'income', order: 2 },
  { name: 'Investimentos', emoji: '📈', type: 'income', order: 3 },
  { name: 'Outros', emoji: '📦', type: 'income', order: 4 },
]

db.on('populate', () => {
  db.categories.bulkAdd(DEFAULT_CATEGORIES as Category[])
  if (import.meta.env.DEV) seedDevData()
})

/** Dados de exemplo apenas para desenvolvimento local (nunca em produção). */
function seedDevData() {
  const now = Date.now()
  const month = new Date().toISOString().slice(0, 7)
  db.transactions.bulkAdd([
    { type: 'income', amountCents: 145000, description: 'Salário', categoryId: 11, date: `${month}-01`, source: 'manual', createdAt: now - 6e5 },
    { type: 'expense', amountCents: 6238, description: 'Continente', categoryId: 1, date: `${month}-03`, source: 'wallet', createdAt: now - 5e5 },
    { type: 'expense', amountCents: 1250, description: 'Galp', categoryId: 3, date: `${month}-04`, source: 'wallet', createdAt: now - 4e5 },
    { type: 'expense', amountCents: 3599, description: 'Renda garagem', categoryId: 4, date: `${month}-05`, source: 'manual', createdAt: now - 3e5 },
    { type: 'expense', amountCents: 899, description: 'Netflix', categoryId: 6, date: `${month}-06`, source: 'manual', createdAt: now - 2e5 },
    { type: 'expense', amountCents: 2340, description: 'Jantar c/ amigos', categoryId: 2, date: `${month}-07`, source: 'wallet', createdAt: now - 1e5 },
  ] as Transaction[])
  db.goals.bulkAdd([
    { name: 'Férias no Japão', emoji: '🗾', targetCents: 300000, deadline: `${new Date().getFullYear() + 1}-06-01`, createdAt: now },
    { name: 'Fundo de emergência', emoji: '🛟', targetCents: 500000, createdAt: now - 1000 },
  ] as Goal[])
  db.goalEntries.bulkAdd([
    { goalId: 1, amountCents: 85000, date: `${month}-02` },
    { goalId: 2, amountCents: 120000, date: `${month}-02` },
  ] as GoalEntry[])
  db.debts.bulkAdd([
    { name: 'Empréstimo do carro', person: 'Banco', direction: 'owe', totalCents: 850000, dueDate: `${new Date().getFullYear() + 2}-01-01`, createdAt: now },
    { name: 'Jantar adiantado', person: 'João', direction: 'owed', totalCents: 4500, createdAt: now - 1000 },
  ] as Debt[])
  db.debtPayments.bulkAdd([{ debtId: 1, amountCents: 250000, date: `${month}-01` }] as DebtPayment[])
}

export { db }
