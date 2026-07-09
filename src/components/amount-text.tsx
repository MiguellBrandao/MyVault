import { cn } from '@/lib/utils'
import { formatCents } from '@/lib/money'
import type { TxType } from '@/lib/db'

interface AmountTextProps {
  cents: number
  type?: TxType
  /** Mostrar sinal +/− antes do valor. */
  signed?: boolean
  className?: string
}

export function AmountText({ cents, type, signed = true, className }: AmountTextProps) {
  const sign = !signed || !type ? '' : type === 'income' ? '+' : '−'
  return (
    <span
      className={cn(
        'amount',
        type === 'income' && 'text-income',
        type === 'expense' && 'text-expense',
        className,
      )}
    >
      {sign}
      {formatCents(Math.abs(cents))}
    </span>
  )
}
