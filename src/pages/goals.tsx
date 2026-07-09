import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { toast } from 'sonner'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { db, type Goal } from '@/lib/db'
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
  const [emoji, setEmoji] = useState('🎯')
  const [name, setName] = useState('')
  const [targetStr, setTargetStr] = useState('')
  const [deadline, setDeadline] = useState('')

  useEffect(() => {
    if (!open) return
    setEmoji(goal?.emoji ?? '🎯')
    setName(goal?.name ?? '')
    setTargetStr(goal ? (goal.targetCents / 100).toFixed(2).replace('.', ',') : '')
    setDeadline(goal?.deadline ?? '')
  }, [open, goal])

  async function save() {
    const targetCents = parseAmount(targetStr)
    if (!name.trim()) {
      toast.error('Dá um nome à meta.')
      return
    }
    if (!targetCents) {
      toast.error('Indica o valor a poupar.')
      return
    }
    const data = {
      emoji: emoji.trim() || '🎯',
      name: name.trim(),
      targetCents,
      deadline: deadline || undefined,
    }
    if (goal) {
      await db.goals.update(goal.id, data)
      toast.success('Meta atualizada.')
    } else {
      await db.goals.add({ ...data, createdAt: Date.now() } as Goal)
      toast.success('Meta criada.')
    }
    onOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="overflow-y-auto px-4 pb-safe">
          <DrawerHeader className="px-0">
            <DrawerTitle>{goal ? 'Editar meta' : 'Nova meta'}</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-4 pb-6">
            <div className="flex gap-3">
              <div className="flex w-20 flex-col gap-2">
                <Label htmlFor="goal-emoji">Emoji</Label>
                <Input
                  id="goal-emoji"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="text-center text-lg"
                />
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <Label htmlFor="goal-name">Nome</Label>
                <Input
                  id="goal-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex.: Férias no Japão"
                />
              </div>
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
            <Button size="lg" onClick={save}>
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
  open,
  onOpenChange,
  onEdit,
}: {
  goal: Goal
  saved: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: () => void
}) {
  const [amountStr, setAmountStr] = useState('')
  const entries = useLiveQuery(
    () => db.goalEntries.where('goalId').equals(goal.id).reverse().sortBy('date'),
    [goal.id],
  )

  useEffect(() => {
    if (open) setAmountStr('')
  }, [open])

  async function addEntry(sign: 1 | -1) {
    const cents = parseAmount(amountStr)
    if (!cents) {
      toast.error('Indica um valor válido.')
      return
    }
    await db.goalEntries.add({
      goalId: goal.id,
      amountCents: cents * sign,
      date: todayISO(),
    })
    setAmountStr('')
    toast.success(sign > 0 ? 'Depósito registado.' : 'Levantamento registado.')
  }

  async function removeGoal() {
    await db.transaction('rw', db.goals, db.goalEntries, async () => {
      await db.goalEntries.where('goalId').equals(goal.id).delete()
      await db.goals.delete(goal.id)
    })
    toast.success('Meta apagada.')
    onOpenChange(false)
  }

  const pct = goal.targetCents > 0 ? Math.min(100, (saved / goal.targetCents) * 100) : 0

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="overflow-y-auto px-4 pb-safe">
          <DrawerHeader className="px-0">
            <DrawerTitle>
              <span aria-hidden className="mr-1.5">{goal.emoji}</span>
              {goal.name}
            </DrawerTitle>
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

            <div className="flex gap-2">
              <Input
                inputMode="decimal"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0,00"
                aria-label="Valor"
                className="amount flex-1"
              />
              <Button onClick={() => addEntry(1)}>Depositar</Button>
              <Button variant="secondary" onClick={() => addEntry(-1)}>
                Levantar
              </Button>
            </div>

            {entries && entries.length > 0 && (
              <div className="divide-y divide-border rounded-2xl bg-secondary/40 px-4">
                {entries.map((e) => (
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
                      O histórico de depósitos desta meta também será apagado.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={removeGoal}>Apagar</AlertDialogAction>
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
  const goals = useLiveQuery(() => db.goals.orderBy('createdAt').reverse().toArray(), [])
  const entries = useLiveQuery(() => db.goalEntries.toArray(), [])
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Goal | undefined>()
  const [detailId, setDetailId] = useState<number | undefined>()

  if (!goals || !entries) return null

  const savedByGoal = new Map<number, number>()
  for (const e of entries) {
    savedByGoal.set(e.goalId, (savedByGoal.get(e.goalId) ?? 0) + e.amountCents)
  }
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

      {goals.length === 0 ? (
        <EmptyState
          emoji="🎯"
          title="Ainda não tens metas"
          hint="Cria uma meta de poupança e acompanha o progresso."
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
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium">
                    <span aria-hidden className="mr-1.5">{g.emoji}</span>
                    {g.name}
                  </span>
                  <span className="text-sm text-muted-foreground">{Math.round(pct)}%</span>
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
