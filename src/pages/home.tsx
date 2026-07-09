import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Settings, Wallet } from 'lucide-react'
import { useCategories, useGoalEntries, useGoals, useTransactions } from '@/lib/hooks'
import { formatCents, formatDate, formatMonth, todayISO } from '@/lib/money'
import type { Transaction } from '@/lib/types'
import { AmountText } from '@/components/amount-text'
import { TxRow } from '@/components/tx-row'
import { EmptyState } from '@/components/empty-state'
import { PendingDrawer } from '@/components/pending-drawer'
import { Progress } from '@/components/ui/progress'

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Faixa de fluxo: ganhos (menta) e despesas (coral) lado a lado, à escala. */
function FlowStrip({ income, expense }: { income: number; expense: number }) {
  const total = income + expense
  if (total === 0) return null
  const incomePct = Math.max(income > 0 ? 4 : 0, (income / total) * 100)
  const expensePct = Math.max(expense > 0 ? 4 : 0, (expense / total) * 100)
  return (
    <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full" role="img"
      aria-label={`Ganhos ${formatCents(income)}, despesas ${formatCents(expense)}`}>
      {income > 0 && (
        <div className="rounded-full bg-chart-2" style={{ width: `${incomePct}%` }} />
      )}
      {expense > 0 && (
        <div className="rounded-full bg-chart-3" style={{ width: `${expensePct}%` }} />
      )}
    </div>
  )
}

function PendingRow({ tx }: { tx: Transaction }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 py-2.5 text-left"
      >
        <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brass/15 text-brass">
          <Wallet className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{tx.description}</span>
          <span className="block text-xs text-muted-foreground">{formatDate(tx.date)} · por confirmar</span>
        </span>
        <AmountText cents={tx.amountCents} type="expense" className="text-sm font-medium" />
      </button>
      <PendingDrawer tx={tx} open={open} onOpenChange={setOpen} />
    </>
  )
}

export default function HomePage() {
  const today = todayISO()
  const monthKey = today.slice(0, 7)

  const { data: txs } = useTransactions()
  const { data: categories } = useCategories()
  const { data: goals } = useGoals()
  const { data: goalEntries } = useGoalEntries()

  if (!txs || !categories || !goals || !goalEntries) return null

  const catMap = new Map(categories.map((c) => [c.id, c]))
  const confirmed = txs.filter((t) => t.status === 'confirmed')
  const pending = txs.filter((t) => t.status === 'pending')

  // Saldo total: tudo o que já aconteceu (movimentos futuros só contam na data).
  const balance = confirmed
    .filter((t) => t.date <= today)
    .reduce((s, t) => s + (t.type === 'income' ? t.amountCents : -t.amountCents), 0)
  const inGoals = goalEntries.reduce((s, e) => s + e.amountCents, 0)
  const available = balance - inGoals

  const monthTxs = confirmed.filter((t) => t.date.startsWith(monthKey))
  const income = monthTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amountCents, 0)
  const expense = monthTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amountCents, 0)

  const byCategory = new Map<string, number>()
  for (const t of monthTxs) {
    if (t.type !== 'expense' || !t.categoryId) continue
    byCategory.set(t.categoryId, (byCategory.get(t.categoryId) ?? 0) + t.amountCents)
  }
  const topCategories = [...byCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxCat = topCategories[0]?.[1] ?? 0

  const savedByGoal = new Map<string, number>()
  for (const e of goalEntries) {
    savedByGoal.set(e.goalId, (savedByGoal.get(e.goalId) ?? 0) + e.amountCents)
  }
  const previewGoals = goals.slice(0, 2)

  const recent = [...confirmed]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between pt-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            My<span className="text-primary">Vault</span>
          </h1>
          <p className="text-sm text-muted-foreground">{capitalize(formatMonth(monthKey))}</p>
        </div>
        <Link
          to="/ajustes"
          aria-label="Ajustes"
          className="flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground"
        >
          <Settings className="size-5" />
        </Link>
      </header>

      <section className="rounded-3xl bg-card p-5">
        <p className="text-sm text-muted-foreground">Saldo total</p>
        <p className="amount mt-1 text-4xl font-semibold">
          {balance < 0 ? '−' : ''}
          {formatCents(Math.abs(balance))}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-secondary/50 p-3">
            <p className="text-xs text-muted-foreground">Disponível para gastar</p>
            <p className="amount mt-0.5 font-semibold">
              {available < 0 ? '−' : ''}
              {formatCents(Math.abs(available))}
            </p>
          </div>
          <Link to="/metas" className="rounded-2xl bg-brass/10 p-3">
            <p className="text-xs text-muted-foreground">Guardado em metas</p>
            <p className="amount mt-0.5 font-semibold text-brass">{formatCents(inGoals)}</p>
          </Link>
        </div>
      </section>

      {pending.length > 0 && (
        <section>
          <h2 className="mb-1 text-lg font-semibold">Por confirmar</h2>
          <div className="divide-y divide-border rounded-3xl border border-brass/30 bg-card px-4 py-1">
            {pending.map((t) => (
              <PendingRow key={t.id} tx={t} />
            ))}
          </div>
        </section>
      )}

      <section className="rounded-3xl bg-card p-5">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Este mês</h2>
          <AmountText
            cents={Math.abs(income - expense)}
            type={income - expense >= 0 ? 'income' : 'expense'}
            className="text-sm"
          />
        </div>
        <FlowStrip income={income} expense={expense} />
        <div className="mt-3 flex justify-between text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span aria-hidden className="size-2 rounded-full bg-chart-2" />
            Ganhos <AmountText cents={income} type="income" signed={false} className="text-foreground" />
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span aria-hidden className="size-2 rounded-full bg-chart-3" />
            Despesas <AmountText cents={expense} type="expense" signed={false} className="text-foreground" />
          </span>
        </div>
      </section>

      {topCategories.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Onde gastei</h2>
          <div className="flex flex-col gap-3 rounded-3xl bg-card p-5">
            {topCategories.map(([catId, cents]) => {
              const cat = catMap.get(catId)
              return (
                <div key={catId}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>
                      <span aria-hidden className="mr-1.5">{cat?.emoji}</span>
                      {cat?.name ?? 'Sem categoria'}
                    </span>
                    <span className="amount text-muted-foreground">{formatCents(cents)}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-chart-3"
                      style={{ width: `${(cents / maxCat) * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {previewGoals.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Metas</h2>
            <Link to="/metas" className="text-sm text-primary">Ver todas</Link>
          </div>
          <div className="flex flex-col gap-3">
            {previewGoals.map((g) => {
              const saved = savedByGoal.get(g.id) ?? 0
              const pct = g.targetCents > 0 ? Math.min(100, (saved / g.targetCents) * 100) : 0
              return (
                <Link to="/metas" key={g.id} className="rounded-3xl bg-card p-4">
                  <div className="mb-2 flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate font-medium">{g.name}</span>
                    <span className="amount shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                      {formatCents(saved)} / {formatCents(g.targetCents)}
                    </span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <section>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Últimos movimentos</h2>
          <Link to="/movimentos" className="text-sm text-primary">Ver tudo</Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState
            emoji="🧾"
            title="Ainda não há movimentos"
            hint="Toca no botão + para registar a primeira despesa ou ganho."
          />
        ) : (
          <div className="divide-y divide-border rounded-3xl bg-card px-4 py-1">
            {recent.map((t) => (
              <TxRow key={t.id} tx={t} categories={catMap} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
