export type TxType = 'expense' | 'income'
export type TxSource = 'manual' | 'wallet' | 'subscription'
export type TxStatus = 'confirmed' | 'pending'

export interface Transaction {
  id: string
  type: TxType
  /** Valor em cêntimos, sempre positivo; o sinal vem de `type`. */
  amountCents: number
  description: string
  categoryIds: string[]
  /** Data do movimento em formato ISO `yyyy-MM-dd`. */
  date: string
  source: TxSource
  /** 'pending' = veio do Atalho da Wallet e aguarda confirmação. */
  status: TxStatus
  createdAt: string
}

export interface Category {
  id: string
  name: string
  /** Nome de ícone lucide em kebab-case (ex.: 'shopping-cart'). */
  icon: string
  type: TxType
  sortOrder: number
  /** «Subscrições»: indelével, nome reservado, atribuída automaticamente. */
  isSystem: boolean
}

/** 'owe' = eu devo; 'owed' = devem-me. */
export type DebtDirection = 'owe' | 'owed'

export interface Debt {
  id: string
  name: string
  person: string | null
  direction: DebtDirection
  totalCents: number
  dueDate: string | null
  createdAt: string
}

export interface DebtPayment {
  id: string
  debtId: string
  amountCents: number
  date: string
}

export interface Goal {
  id: string
  name: string
  targetCents: number
  deadline: string | null
  createdAt: string
}

export type SubscriptionFrequency = 'weekly' | 'monthly' | 'yearly'

export interface Subscription {
  id: string
  type: TxType
  name: string
  amountCents: number
  categoryIds: string[]
  frequency: SubscriptionFrequency
  /** 0 = domingo … 6 = sábado (semanal). */
  dayOfWeek: number | null
  /** 1–31; em meses curtos ajusta para o último dia (mensal/anual). */
  dayOfMonth: number | null
  /** 1–12 (anual). */
  monthOfYear: number | null
  /** Próxima cobrança, em ISO `yyyy-MM-dd`. */
  nextDate: string
  active: boolean
  createdAt: string
}

export interface GoalEntry {
  id: string
  goalId: string
  /** Positivo = guardar na meta; negativo = retirar. */
  amountCents: number
  date: string
}
