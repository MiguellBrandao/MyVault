import { useState } from 'react'
import { CreditCard, HandCoins } from 'lucide-react'
import type { Category, Transaction } from '@/lib/types'
import { getCategoryIcon } from '@/lib/category-icons'
import { formatDate, todayISO } from '@/lib/money'
import { AmountText } from '@/components/amount-text'
import { TxDrawer } from '@/components/tx-drawer'

interface TxRowProps {
  tx: Transaction
  categories: Map<string, Category>
  /** Esconde a data (usado quando a lista já está agrupada por dia). */
  hideDate?: boolean
}

export function TxRow({ tx, categories, hideDate }: TxRowProps) {
  const [open, setOpen] = useState(false)
  const cat = tx.categoryId ? categories.get(tx.categoryId) : undefined
  const isFuture = tx.date > todayISO()
  const Icon = cat ? getCategoryIcon(cat.icon) : tx.type === 'income' ? HandCoins : CreditCard

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 py-2.5 text-left"
      >
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground"
        >
          <Icon className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{tx.description}</span>
          <span className="block text-xs text-muted-foreground">
            {[
              hideDate ? null : formatDate(tx.date),
              cat?.name,
              tx.source === 'wallet' ? 'Wallet' : tx.source === 'subscription' ? 'Subscrição' : null,
              isFuture ? 'Agendado' : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </span>
        <AmountText cents={tx.amountCents} type={tx.type} className="text-sm font-medium" />
      </button>
      <TxDrawer tx={tx} open={open} onOpenChange={setOpen} />
    </>
  )
}
