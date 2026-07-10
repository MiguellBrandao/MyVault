export type TxType = 'expense' | 'income'
export type TxSource = 'manual' | 'wallet'
export type TxStatus = 'confirmed' | 'pending'

export interface Transaction {
  id: string
  type: TxType
  /** Valor em cêntimos, sempre positivo; o sinal vem de `type`. */
  amountCents: number
  description: string
  categoryId: string | null
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

export interface GoalEntry {
  id: string
  goalId: string
  /** Positivo = guardar na meta; negativo = retirar. */
  amountCents: number
  date: string
}
