import { supabase } from './supabase'
import type {
  Category,
  Debt,
  DebtDirection,
  DebtPayment,
  Goal,
  GoalEntry,
  Transaction,
  TxType,
} from './types'

function throwIf(error: { message: string } | null): void {
  if (error) throw new Error(error.message)
}

/* ── Transações ─────────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToTx(r: any): Transaction {
  return {
    id: r.id,
    type: r.type,
    amountCents: r.amount_cents,
    description: r.description,
    categoryId: r.category_id,
    date: r.date,
    source: r.source,
    status: r.status,
    createdAt: r.created_at,
  }
}

export async function listTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
  throwIf(error)
  return (data ?? []).map(rowToTx)
}

export interface TxInput {
  type: TxType
  amountCents: number
  description: string
  categoryId: string | null
  date: string
}

export async function addTransaction(input: TxInput): Promise<void> {
  const { error } = await supabase.from('transactions').insert({
    type: input.type,
    amount_cents: input.amountCents,
    description: input.description,
    category_id: input.categoryId,
    date: input.date,
  })
  throwIf(error)
}

export async function updateTransaction(id: string, input: TxInput): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .update({
      type: input.type,
      amount_cents: input.amountCents,
      description: input.description,
      category_id: input.categoryId,
      date: input.date,
    })
    .eq('id', id)
  throwIf(error)
}

/** Confirma um movimento pendente vindo do Atalho da Wallet. */
export async function confirmTransaction(
  id: string,
  input: Pick<TxInput, 'amountCents' | 'description' | 'categoryId'>,
): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .update({
      amount_cents: input.amountCents,
      description: input.description,
      category_id: input.categoryId,
      status: 'confirmed',
    })
    .eq('id', id)
  throwIf(error)
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  throwIf(error)
}

/* ── Categorias ─────────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToCategory(r: any): Category {
  return { id: r.id, name: r.name, emoji: r.emoji, type: r.type, sortOrder: r.sort_order }
}

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
  throwIf(error)
  return (data ?? []).map(rowToCategory)
}

export async function addCategory(input: {
  name: string
  emoji: string
  type: TxType
  sortOrder: number
}): Promise<void> {
  const { error } = await supabase.from('categories').insert({
    name: input.name,
    emoji: input.emoji,
    type: input.type,
    sort_order: input.sortOrder,
  })
  throwIf(error)
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  throwIf(error)
}

/* ── Dívidas ────────────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToDebt(r: any): Debt {
  return {
    id: r.id,
    name: r.name,
    person: r.person,
    direction: r.direction,
    totalCents: r.total_cents,
    dueDate: r.due_date,
    createdAt: r.created_at,
  }
}

export async function listDebts(): Promise<Debt[]> {
  const { data, error } = await supabase
    .from('debts')
    .select('*')
    .order('created_at', { ascending: false })
  throwIf(error)
  return (data ?? []).map(rowToDebt)
}

export interface DebtInput {
  name: string
  person: string | null
  direction: DebtDirection
  totalCents: number
  dueDate: string | null
}

export async function addDebt(input: DebtInput): Promise<void> {
  const { error } = await supabase.from('debts').insert({
    name: input.name,
    person: input.person,
    direction: input.direction,
    total_cents: input.totalCents,
    due_date: input.dueDate,
  })
  throwIf(error)
}

export async function updateDebt(id: string, input: DebtInput): Promise<void> {
  const { error } = await supabase
    .from('debts')
    .update({
      name: input.name,
      person: input.person,
      direction: input.direction,
      total_cents: input.totalCents,
      due_date: input.dueDate,
    })
    .eq('id', id)
  throwIf(error)
}

export async function deleteDebt(id: string): Promise<void> {
  const { error } = await supabase.from('debts').delete().eq('id', id)
  throwIf(error)
}

export async function listDebtPayments(): Promise<DebtPayment[]> {
  const { data, error } = await supabase
    .from('debt_payments')
    .select('*')
    .order('date', { ascending: false })
  throwIf(error)
  return (data ?? []).map((r) => ({
    id: r.id,
    debtId: r.debt_id,
    amountCents: r.amount_cents,
    date: r.date,
  }))
}

export async function addDebtPayment(debtId: string, amountCents: number): Promise<void> {
  const { error } = await supabase
    .from('debt_payments')
    .insert({ debt_id: debtId, amount_cents: amountCents })
  throwIf(error)
}

/* ── Metas ──────────────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToGoal(r: any): Goal {
  return {
    id: r.id,
    name: r.name,
    targetCents: r.target_cents,
    deadline: r.deadline,
    createdAt: r.created_at,
  }
}

export async function listGoals(): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .order('created_at', { ascending: false })
  throwIf(error)
  return (data ?? []).map(rowToGoal)
}

export interface GoalInput {
  name: string
  targetCents: number
  deadline: string | null
}

export async function addGoal(input: GoalInput): Promise<void> {
  const { error } = await supabase.from('goals').insert({
    name: input.name,
    target_cents: input.targetCents,
    deadline: input.deadline,
  })
  throwIf(error)
}

export async function updateGoal(id: string, input: GoalInput): Promise<void> {
  const { error } = await supabase
    .from('goals')
    .update({ name: input.name, target_cents: input.targetCents, deadline: input.deadline })
    .eq('id', id)
  throwIf(error)
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase.from('goals').delete().eq('id', id)
  throwIf(error)
}

export async function listGoalEntries(): Promise<GoalEntry[]> {
  const { data, error } = await supabase
    .from('goal_entries')
    .select('*')
    .order('date', { ascending: false })
  throwIf(error)
  return (data ?? []).map((r) => ({
    id: r.id,
    goalId: r.goal_id,
    amountCents: r.amount_cents,
    date: r.date,
  }))
}

export async function addGoalEntry(goalId: string, amountCents: number): Promise<void> {
  const { error } = await supabase
    .from('goal_entries')
    .insert({ goal_id: goalId, amount_cents: amountCents })
  throwIf(error)
}

/* ── Token do Atalho da Wallet ──────────────────────────────── */

export async function getWalletToken(): Promise<string | null> {
  const { data, error } = await supabase.from('wallet_tokens').select('token').maybeSingle()
  throwIf(error)
  return data?.token ?? null
}

export async function regenerateWalletToken(): Promise<string> {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) throw new Error('Sessão expirada.')
  const token = crypto.randomUUID()
  const { error } = await supabase
    .from('wallet_tokens')
    .upsert({ user_id: userId, token }, { onConflict: 'user_id' })
  throwIf(error)
  return token
}
