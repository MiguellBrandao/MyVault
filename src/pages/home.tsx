import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { db } from '@/lib/db'
import { formatCents, formatMonth, todayISO } from '@/lib/money'
import { AmountText } from '@/components/amount-text'
import { TxRow } from '@/components/tx-row'
import { EmptyState } from '@/components/empty-state'
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

export default function HomePage() {
  const monthKey = todayISO().slice(0, 7)

  const txs = useLiveQuery(
    () => db.transactions.where('date').startsWith(monthKey).toArray(),
    [monthKey],
  )
  const categories = useLiveQuery(() => db.categories.toArray(), [])
  const goals = useLiveQuery(() => db.goals.toArray(), [])
  const goalEntries = useLiveQuery(() => db.goalEntries.toArray(), [])
  const recent = useLiveQuery(
    () => db.transactions.orderBy('createdAt').reverse().limit(5).toArray(),
    [],
  )

  if (!txs || !categories || !goals || !goalEntries || !recent) return null

  const catMap = new Map(categories.map((c) => [c.id, c]))
  const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amountCents, 0)
  const expense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amountCents, 0)
  const net = income - expense

  const byCategory = new Map<number, number>()
  for (const t of txs) {
    if (t.type !== 'expense' || !t.categoryId) continue
    byCategory.set(t.categoryId, (byCategory.get(t.categoryId) ?? 0) + t.amountCents)
  }
  const topCategories = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  const maxCat = topCategories[0]?.[1] ?? 0

  const savedByGoal = new Map<number, number>()
  for (const e of goalEntries) {
    savedByGoal.set(e.goalId, (savedByGoal.get(e.goalId) ?? 0) + e.amountCents)
  }
  const previewGoals = goals.slice(0, 2)

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
        <p className="text-sm text-muted-foreground">Saldo do mês</p>
        <p className="amount mt-1 text-4xl font-semibold">
          {net < 0 ? '−' : ''}
          {formatCents(Math.abs(net))}
        </p>
        <div className="mt-4">
          <FlowStrip income={income} expense={expense} />
        </div>
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
                    <span className="min-w-0 truncate font-medium">
                      <span aria-hidden className="mr-1.5">{g.emoji}</span>
                      {g.name}
                    </span>
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
