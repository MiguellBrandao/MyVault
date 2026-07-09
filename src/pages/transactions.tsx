import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCategories, useTransactions } from '@/lib/hooks'
import type { TxType } from '@/lib/types'
import { formatFullDate, formatMonth, todayISO } from '@/lib/money'
import { AmountText } from '@/components/amount-text'
import { TxRow } from '@/components/tx-row'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
import { cn } from '@/lib/utils'

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y!, m! - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

type Filter = 'all' | TxType

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Tudo' },
  { value: 'expense', label: 'Despesas' },
  { value: 'income', label: 'Ganhos' },
]

export default function TransactionsPage() {
  const currentMonth = todayISO().slice(0, 7)
  const [month, setMonth] = useState(currentMonth)
  const [filter, setFilter] = useState<Filter>('all')

  const { data: allTxs } = useTransactions()
  const { data: categories } = useCategories()

  if (!allTxs || !categories) return null

  const catMap = new Map(categories.map((c) => [c.id, c]))
  const txs = allTxs.filter((t) => t.status === 'confirmed' && t.date.startsWith(month))
  const filtered = txs
    .filter((t) => filter === 'all' || t.type === filter)
    .sort((a, b) =>
      a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date),
    )

  const byDay = new Map<string, typeof filtered>()
  for (const t of filtered) {
    const list = byDay.get(t.date) ?? []
    list.push(t)
    byDay.set(t.date, list)
  }

  const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amountCents, 0)
  const expense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amountCents, 0)
  const net = income - expense

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Movimentos" />

      <div className="flex items-center justify-between rounded-3xl bg-card px-3 py-2">
        <button
          type="button"
          onClick={() => setMonth((m) => shiftMonth(m, -1))}
          aria-label="Mês anterior"
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground"
        >
          <ChevronLeft className="size-5" />
        </button>
        <div className="text-center">
          <p className="text-sm font-medium">
            {capitalize(formatMonth(month))}
            {month > currentMonth && (
              <span className="ml-1.5 text-xs text-brass">futuro</span>
            )}
          </p>
          <p className="amount text-xs text-muted-foreground">
            {net < 0 ? '−' : '+'}
            <AmountText cents={Math.abs(net)} signed={false} className="text-xs" />
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMonth((m) => shiftMonth(m, 1))}
          aria-label="Mês seguinte"
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="flex gap-2" role="radiogroup" aria-label="Filtrar movimentos">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            role="radio"
            aria-checked={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm transition-colors',
              filter === f.value
                ? 'border-brass/60 bg-brass/15 font-medium text-foreground'
                : 'border-border text-muted-foreground',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {byDay.size === 0 ? (
        <EmptyState
          emoji="🗓️"
          title="Sem movimentos neste mês"
          hint={
            month > currentMonth
              ? 'Podes adiantar despesas ou ganhos futuros com o botão +, escolhendo a data.'
              : 'Usa o botão + para registar despesas e ganhos.'
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {[...byDay.entries()].map(([date, dayTxs]) => {
            const dayNet = dayTxs.reduce(
              (s, t) => s + (t.type === 'income' ? t.amountCents : -t.amountCents),
              0,
            )
            return (
              <section key={date}>
                <div className="mb-1 flex items-baseline justify-between px-1">
                  <h2 className="text-sm font-medium text-muted-foreground">
                    {capitalize(formatFullDate(date))}
                  </h2>
                  <span className="amount text-xs text-muted-foreground">
                    {dayNet < 0 ? '−' : '+'}
                    <AmountText cents={Math.abs(dayNet)} signed={false} className="text-xs" />
                  </span>
                </div>
                <div className="divide-y divide-border rounded-3xl bg-card px-4 py-1">
                  {dayTxs.map((t) => (
                    <TxRow key={t.id} tx={t} categories={catMap} hideDate />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
