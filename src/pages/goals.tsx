import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Pencil } from 'lucide-react'
import * as api from '@/lib/api'
import { useAppMutation, useGoalEntries, useGoals, useTransactions } from '@/lib/hooks'
import type { Goal } from '@/lib/types'
import { formatCents, formatDate, parseAmount, todayISO } from '@/lib/money'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { AmountText } from '@/components/amount-text'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

function GoalFormDrawer({
  goal,
  open,
  onOpenChange,
}: {
  goal?: Goal
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [name, setName] = useState('')
  const [targetStr, setTargetStr] = useState('')
  const [deadline, setDeadline] = useState('')

  useEffect(() => {
    if (!open) return
    setName(goal?.name ?? '')
    setTargetStr(goal ? (goal.targetCents / 100).toFixed(2).replace('.', ',') : '')
    setDeadline(goal?.deadline ?? '')
  }, [open, goal])

  const save = useAppMutation(async () => {
    const targetCents = parseAmount(targetStr)
    if (!name.trim()) throw new Error('Dá um nome à meta.')
    if (!targetCents) throw new Error('Indica o valor a poupar.')
    const input = { name: name.trim(), targetCents, deadline: deadline || null }
    if (goal) {
      await api.updateGoal(goal.id, input)
    } else {
      await api.addGoal(input)
    }
  })

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="overflow-y-auto px-4 pb-safe">
          <DrawerHeader className="px-0">
            <DrawerTitle>{goal ? 'Editar meta' : 'Nova meta'}</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-4 pb-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="goal-name">Nome</Label>
              <Input
                id="goal-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Férias no Japão"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="goal-target">Valor a poupar (€)</Label>
              <Input
                id="goal-target"
                inputMode="decimal"
                value={targetStr}
                onChange={(e) => setTargetStr(e.target.value)}
                placeholder="0,00"
                className="amount"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="goal-deadline">Data limite (opcional)</Label>
              <Input
                id="goal-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
            <Button
              size="lg"
              disabled={save.isPending}
              onClick={() =>
                save.mutate(undefined, {
                  onSuccess: () => {
                    toast.success(goal ? 'Meta atualizada.' : 'Meta criada.')
                    onOpenChange(false)
                  },
                })
              }
            >
              {goal ? 'Guardar alterações' : 'Criar meta'}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function GoalDetailDrawer({
  goal,
  saved,
  availableCents,
  open,
  onOpenChange,
  onEdit,
}: {
  goal: Goal
  saved: number
  /** Saldo disponível fora das metas — limite para guardar mais. */
  availableCents: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: () => void
}) {
  const [amountStr, setAmountStr] = useState('')
  const { data: entries } = useGoalEntries()

  useEffect(() => {
    if (open) setAmountStr('')
  }, [open])

  const goalEntries = (entries ?? []).filter((e) => e.goalId === goal.id)

  const addEntry = useAppMutation(async (sign: 1 | -1) => {
    const cents = parseAmount(amountStr)
    if (!cents) throw new Error('Indica um valor válido.')
    if (sign > 0 && cents > availableCents) {
      throw new Error(`Só tens ${formatCents(Math.max(0, availableCents))} disponíveis.`)
    }
    if (sign < 0 && cents > saved) {
      throw new Error(`Esta meta só tem ${formatCents(saved)} guardados.`)
    }
    await api.addGoalEntry(goal.id, cents * sign)
  })

  const removeGoal = useAppMutation(async () => {
    await api.deleteGoal(goal.id)
  }, 'Meta apagada — o dinheiro voltou ao disponível.')

  const pct = goal.targetCents > 0 ? Math.min(100, (saved / goal.targetCents) * 100) : 0

  function move(sign: 1 | -1) {
    addEntry.mutate(sign, {
      onSuccess: () => {
        setAmountStr('')
        toast.success(sign > 0 ? 'Dinheiro guardado na meta.' : 'Dinheiro devolvido ao disponível.')
      },
    })
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="overflow-y-auto px-4 pb-safe">
          <DrawerHeader className="px-0">
            <DrawerTitle>{goal.name}</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-4 pb-6">
            <div>
              <p className="amount text-3xl font-semibold">
                {formatCents(saved)}
                <span className="text-base text-muted-foreground"> / {formatCents(goal.targetCents)}</span>
              </p>
              <Progress value={pct} className="mt-3 h-2" />
              <p className="mt-2 text-sm text-muted-foreground">
                {pct >= 100
                  ? 'Meta atingida! 🎉'
                  : `Faltam ${formatCents(goal.targetCents - saved)}${goal.deadline ? ` até ${formatDate(goal.deadline)}` : ''}`}
              </p>
            </div>

            <div className="rounded-2xl bg-secondary/40 p-3">
              <p className="mb-2 text-xs text-muted-foreground">
                Tens <span className="amount text-foreground">{formatCents(Math.max(0, availableCents))}</span> disponíveis
                para guardar
              </p>
              <div className="flex gap-2">
                <Input
                  inputMode="decimal"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="0,00"
                  aria-label="Valor"
                  className="amount flex-1"
                />
                <Button disabled={addEntry.isPending} onClick={() => move(1)}>Guardar</Button>
                <Button variant="secondary" disabled={addEntry.isPending} onClick={() => move(-1)}>
                  Retirar
                </Button>
              </div>
            </div>

            {goalEntries.length > 0 && (
              <div className="divide-y divide-border rounded-2xl bg-secondary/40 px-4">
                {goalEntries.map((e) => (
                  <div key={e.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-muted-foreground">{formatDate(e.date)}</span>
                    <AmountText
                      cents={Math.abs(e.amountCents)}
                      type={e.amountCents >= 0 ? 'income' : 'expense'}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={onEdit}>
                <Pencil className="size-4" /> Editar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="flex-1 text-destructive">
                    <Trash2 className="size-4" /> Apagar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Apagar esta meta?</AlertDialogTitle>
                    <AlertDialogDescription>
                      O dinheiro guardado ({formatCents(saved)}) volta ao teu saldo disponível.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => removeGoal.mutate(undefined, { onSuccess: () => onOpenChange(false) })}
                    >
                      Apagar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export default function GoalsPage() {
  const today = todayISO()
  const { data: goals } = useGoals()
  const { data: entries } = useGoalEntries()
  const { data: txs } = useTransactions()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Goal | undefined>()
  const [detailId, setDetailId] = useState<string | undefined>()

  if (!goals || !entries || !txs) return null

  const savedByGoal = new Map<string, number>()
  for (const e of entries) {
    savedByGoal.set(e.goalId, (savedByGoal.get(e.goalId) ?? 0) + e.amountCents)
  }
  const inGoals = entries.reduce((s, e) => s + e.amountCents, 0)
  const balance = txs
    .filter((t) => t.status === 'confirmed' && t.date <= today)
    .reduce((s, t) => s + (t.type === 'income' ? t.amountCents : -t.amountCents), 0)
  const available = balance - inGoals

  const detailGoal = goals.find((g) => g.id === detailId)

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Metas"
        action={
          <Button
            size="sm"
            onClick={() => {
              setEditing(undefined)
              setFormOpen(true)
            }}
          >
            <Plus className="size-4" /> Nova
          </Button>
        }
      />

      <div className="flex items-baseline justify-between rounded-3xl bg-card px-5 py-4">
        <div>
          <p className="text-xs text-muted-foreground">Guardado em metas</p>
          <p className="amount mt-0.5 text-xl font-semibold text-brass">{formatCents(inGoals)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Disponível</p>
          <p className="amount mt-0.5 text-xl font-semibold">
            {available < 0 ? '−' : ''}
            {formatCents(Math.abs(available))}
          </p>
        </div>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          emoji="🎯"
          title="Ainda não tens metas"
          hint="Cria uma meta e vai guardando dinheiro do teu saldo — como uma conta secundária."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {goals.map((g) => {
            const saved = savedByGoal.get(g.id) ?? 0
            const pct = g.targetCents > 0 ? Math.min(100, (saved / g.targetCents) * 100) : 0
            return (
              <button
                type="button"
                key={g.id}
                onClick={() => setDetailId(g.id)}
                className="rounded-3xl bg-card p-4 text-left"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate font-medium">{g.name}</span>
                  <span className="shrink-0 text-sm text-muted-foreground">{Math.round(pct)}%</span>
                </div>
                <Progress value={pct} className="h-1.5" />
                <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                  <span className="amount">
                    {formatCents(saved)} / {formatCents(g.targetCents)}
                  </span>
                  {g.deadline && <span>até {formatDate(g.deadline)}</span>}
                </div>
              </button>
            )
          })}
        </div>
      )}

      <GoalFormDrawer goal={editing} open={formOpen} onOpenChange={setFormOpen} />
      {detailGoal && (
        <GoalDetailDrawer
          goal={detailGoal}
          saved={savedByGoal.get(detailGoal.id) ?? 0}
          availableCents={available}
          open={detailId !== undefined}
          onOpenChange={(o) => !o && setDetailId(undefined)}
          onEdit={() => {
            setEditing(detailGoal)
            setDetailId(undefined)
            setFormOpen(true)
          }}
        />
      )}
    </div>
  )
}
