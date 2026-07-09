import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Pencil } from 'lucide-react'
import * as api from '@/lib/api'
import { useAppMutation, useDebtPayments, useDebts } from '@/lib/hooks'
import type { Debt, DebtDirection } from '@/lib/types'
import { formatCents, formatDate, parseAmount } from '@/lib/money'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { AmountText } from '@/components/amount-text'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
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

function DebtFormDrawer({
  debt,
  open,
  onOpenChange,
}: {
  debt?: Debt
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [direction, setDirection] = useState<DebtDirection>('owe')
  const [name, setName] = useState('')
  const [person, setPerson] = useState('')
  const [totalStr, setTotalStr] = useState('')
  const [dueDate, setDueDate] = useState('')

  useEffect(() => {
    if (!open) return
    setDirection(debt?.direction ?? 'owe')
    setName(debt?.name ?? '')
    setPerson(debt?.person ?? '')
    setTotalStr(debt ? (debt.totalCents / 100).toFixed(2).replace('.', ',') : '')
    setDueDate(debt?.dueDate ?? '')
  }, [open, debt])

  const save = useAppMutation(async () => {
    const totalCents = parseAmount(totalStr)
    if (!name.trim()) throw new Error('Dá um nome à dívida.')
    if (!totalCents) throw new Error('Indica o valor total.')
    const input = {
      direction,
      name: name.trim(),
      person: person.trim() || null,
      totalCents,
      dueDate: dueDate || null,
    }
    if (debt) {
      await api.updateDebt(debt.id, input)
    } else {
      await api.addDebt(input)
    }
  })

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="overflow-y-auto px-4 pb-safe">
          <DrawerHeader className="px-0">
            <DrawerTitle>{debt ? 'Editar dívida' : 'Nova dívida'}</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-4 pb-6">
            <div className="grid grid-cols-2 rounded-full bg-secondary p-1" role="radiogroup" aria-label="Direção da dívida">
              <button
                type="button"
                role="radio"
                aria-checked={direction === 'owe'}
                onClick={() => setDirection('owe')}
                className={cn(
                  'rounded-full py-2 text-sm font-medium transition-colors',
                  direction === 'owe' ? 'bg-expense/20 text-expense' : 'text-muted-foreground',
                )}
              >
                Eu devo
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={direction === 'owed'}
                onClick={() => setDirection('owed')}
                className={cn(
                  'rounded-full py-2 text-sm font-medium transition-colors',
                  direction === 'owed' ? 'bg-income/20 text-income' : 'text-muted-foreground',
                )}
              >
                Devem-me
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="debt-name">Descrição</Label>
              <Input
                id="debt-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Empréstimo do carro"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="debt-person">
                {direction === 'owe' ? 'A quem devo (opcional)' : 'Quem me deve (opcional)'}
              </Label>
              <Input
                id="debt-person"
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                placeholder="Ex.: Banco, João…"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="debt-total">Valor total (€)</Label>
              <Input
                id="debt-total"
                inputMode="decimal"
                value={totalStr}
                onChange={(e) => setTotalStr(e.target.value)}
                placeholder="0,00"
                className="amount"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="debt-due">Data limite (opcional)</Label>
              <Input
                id="debt-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <Button
              size="lg"
              disabled={save.isPending}
              onClick={() =>
                save.mutate(undefined, {
                  onSuccess: () => {
                    toast.success(debt ? 'Dívida atualizada.' : 'Dívida registada.')
                    onOpenChange(false)
                  },
                })
              }
            >
              {debt ? 'Guardar alterações' : 'Registar dívida'}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function DebtDetailDrawer({
  debt,
  paid,
  open,
  onOpenChange,
  onEdit,
}: {
  debt: Debt
  paid: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: () => void
}) {
  const [amountStr, setAmountStr] = useState('')
  const { data: payments } = useDebtPayments()

  useEffect(() => {
    if (open) setAmountStr('')
  }, [open])

  const debtPayments = (payments ?? []).filter((p) => p.debtId === debt.id)
  const remaining = Math.max(0, debt.totalCents - paid)
  const pct = debt.totalCents > 0 ? Math.min(100, (paid / debt.totalCents) * 100) : 0

  const addPayment = useAppMutation(async () => {
    const cents = parseAmount(amountStr)
    if (!cents) throw new Error('Indica um valor válido.')
    if (cents > remaining) {
      throw new Error(`Só faltam ${formatCents(remaining)} — não podes pagar mais do que isso.`)
    }
    await api.addDebtPayment(debt.id, cents)
  })

  const removeDebt = useAppMutation(async () => {
    await api.deleteDebt(debt.id)
  }, 'Dívida apagada.')

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="overflow-y-auto px-4 pb-safe">
          <DrawerHeader className="px-0">
            <DrawerTitle>{debt.name}</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-4 pb-6">
            <div>
              <p className="amount text-3xl font-semibold">
                {formatCents(remaining)}
                <span className="text-base text-muted-foreground"> por liquidar</span>
              </p>
              <Progress value={pct} className="mt-3 h-2" />
              <p className="mt-2 text-sm text-muted-foreground">
                {remaining === 0
                  ? 'Dívida liquidada! ✅'
                  : `Pago ${formatCents(paid)} de ${formatCents(debt.totalCents)}${debt.person ? ` · ${debt.person}` : ''}${debt.dueDate ? ` · até ${formatDate(debt.dueDate)}` : ''}`}
              </p>
            </div>

            {remaining > 0 && (
              <div className="flex gap-2">
                <Input
                  inputMode="decimal"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="0,00"
                  aria-label="Valor do pagamento"
                  className="amount flex-1"
                />
                <Button
                  disabled={addPayment.isPending}
                  onClick={() =>
                    addPayment.mutate(undefined, {
                      onSuccess: () => {
                        setAmountStr('')
                        toast.success('Pagamento registado.')
                      },
                    })
                  }
                >
                  Registar pagamento
                </Button>
              </div>
            )}

            {debtPayments.length > 0 && (
              <div className="divide-y divide-border rounded-2xl bg-secondary/40 px-4">
                {debtPayments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-muted-foreground">{formatDate(p.date)}</span>
                    <AmountText cents={p.amountCents} signed={false} />
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
                    <AlertDialogTitle>Apagar esta dívida?</AlertDialogTitle>
                    <AlertDialogDescription>
                      O histórico de pagamentos desta dívida também será apagado.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => removeDebt.mutate(undefined, { onSuccess: () => onOpenChange(false) })}
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

function DebtCard({
  debt,
  paid,
  onClick,
}: {
  debt: Debt
  paid: number
  onClick: () => void
}) {
  const remaining = Math.max(0, debt.totalCents - paid)
  const pct = debt.totalCents > 0 ? Math.min(100, (paid / debt.totalCents) * 100) : 0
  const settled = remaining === 0
  return (
    <button type="button" onClick={onClick} className="rounded-3xl bg-card p-4 text-left">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="min-w-0 truncate font-medium">{debt.name}</span>
        {settled ? (
          <Badge variant="secondary" className="shrink-0">Liquidada</Badge>
        ) : (
          <AmountText
            cents={remaining}
            signed={false}
            className={cn('shrink-0 text-sm', debt.direction === 'owe' ? 'text-expense' : 'text-income')}
          />
        )}
      </div>
      <Progress value={pct} className="h-1.5" />
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{debt.person ?? (debt.direction === 'owe' ? 'Eu devo' : 'Devem-me')}</span>
        {debt.dueDate && !settled && <span>até {formatDate(debt.dueDate)}</span>}
      </div>
    </button>
  )
}

export default function DebtsPage() {
  const { data: debts } = useDebts()
  const { data: payments } = useDebtPayments()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Debt | undefined>()
  const [detailId, setDetailId] = useState<string | undefined>()

  if (!debts || !payments) return null

  const paidByDebt = new Map<string, number>()
  for (const p of payments) {
    paidByDebt.set(p.debtId, (paidByDebt.get(p.debtId) ?? 0) + p.amountCents)
  }

  const iOwe = debts.filter((d) => d.direction === 'owe')
  const owedToMe = debts.filter((d) => d.direction === 'owed')
  const detailDebt = debts.find((d) => d.id === detailId)

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Dívidas"
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

      {debts.length === 0 ? (
        <EmptyState
          emoji="🤝"
          title="Sem dívidas registadas"
          hint="Regista o que deves e o que te devem, com pagamentos parciais."
        />
      ) : (
        <>
          {iOwe.length > 0 && (
            <section>
              <h2 className="mb-2 px-1 text-sm font-medium text-muted-foreground">Eu devo</h2>
              <div className="flex flex-col gap-3">
                {iOwe.map((d) => (
                  <DebtCard
                    key={d.id}
                    debt={d}
                    paid={paidByDebt.get(d.id) ?? 0}
                    onClick={() => setDetailId(d.id)}
                  />
                ))}
              </div>
            </section>
          )}
          {owedToMe.length > 0 && (
            <section>
              <h2 className="mb-2 px-1 text-sm font-medium text-muted-foreground">Devem-me</h2>
              <div className="flex flex-col gap-3">
                {owedToMe.map((d) => (
                  <DebtCard
                    key={d.id}
                    debt={d}
                    paid={paidByDebt.get(d.id) ?? 0}
                    onClick={() => setDetailId(d.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <DebtFormDrawer debt={editing} open={formOpen} onOpenChange={setFormOpen} />
      {detailDebt && (
        <DebtDetailDrawer
          debt={detailDebt}
          paid={paidByDebt.get(detailDebt.id) ?? 0}
          open={detailId !== undefined}
          onOpenChange={(o) => !o && setDetailId(undefined)}
          onEdit={() => {
            setEditing(detailDebt)
            setDetailId(undefined)
            setFormOpen(true)
          }}
        />
      )}
    </div>
  )
}
