import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import * as api from '@/lib/api'
import { useAppMutation, useCategories, useSubscriptions } from '@/lib/hooks'
import type { Subscription, SubscriptionFrequency, TxType } from '@/lib/types'
import { formatCents, formatDate, parseAmount, todayISO } from '@/lib/money'
import {
  FREQUENCY_LABELS,
  isFirstDateValid,
  monthlyEquivalentCents,
  recurrenceFromFirstDate,
  scheduleLabel,
} from '@/lib/subscriptions'
import { getCategoryIcon } from '@/lib/category-icons'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { AmountText } from '@/components/amount-text'
import { CategoryPicker } from '@/components/category-picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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

const FREQUENCIES: SubscriptionFrequency[] = ['weekly', 'monthly', 'yearly']

function SubscriptionFormDrawer({
  sub,
  open,
  onOpenChange,
}: {
  sub?: Subscription
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [type, setType] = useState<TxType>('expense')
  const [name, setName] = useState('')
  const [amountStr, setAmountStr] = useState('')
  const [categoryIds, setCategoryIds] = useState<string[]>([])
  const [frequency, setFrequency] = useState<SubscriptionFrequency>('monthly')
  const [firstDate, setFirstDate] = useState(todayISO())
  const { data: categories } = useCategories()

  useEffect(() => {
    if (!open) return
    setType(sub?.type ?? 'expense')
    setName(sub?.name ?? '')
    setAmountStr(sub ? (sub.amountCents / 100).toFixed(2).replace('.', ',') : '')
    // A categoria de sistema não se edita — fica de fora do formulário.
    const systemIds = new Set((categories ?? []).filter((c) => c.isSystem).map((c) => c.id))
    setCategoryIds((sub?.categoryIds ?? []).filter((id) => !systemIds.has(id)))
    setFrequency(sub?.frequency ?? 'monthly')
    setFirstDate(sub?.nextDate ?? todayISO())
  }, [open, sub, categories])

  function toggleCategory(id: string) {
    setCategoryIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]))
  }

  const save = useAppMutation(async () => {
    const amountCents = parseAmount(amountStr)
    if (!name.trim()) throw new Error('Dá um nome à subscrição.')
    if (!amountCents) throw new Error('Indica um valor válido.')
    if (!isFirstDateValid(firstDate)) throw new Error('A próxima cobrança não pode ser no passado.')
    const input = {
      type,
      name: name.trim(),
      amountCents,
      categoryIds,
      ...recurrenceFromFirstDate(frequency, firstDate),
    }
    if (sub) {
      await api.updateSubscription(sub.id, input)
    } else {
      await api.addSubscription(input)
    }
  })

  const remove = useAppMutation(async () => {
    if (sub) await api.deleteSubscription(sub.id)
  }, 'Subscrição apagada. Os movimentos já registados mantêm-se.')

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="overflow-y-auto px-4 pb-safe">
          <DrawerHeader className="px-0">
            <DrawerTitle>{sub ? 'Editar subscrição' : 'Nova subscrição'}</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-4 pb-6">
            <div className="grid grid-cols-2 rounded-full bg-secondary p-1" role="radiogroup" aria-label="Tipo">
              <button
                type="button"
                role="radio"
                aria-checked={type === 'expense'}
                onClick={() => { setType('expense'); setCategoryIds([]) }}
                className={cn(
                  'rounded-full py-2 text-sm font-medium transition-colors',
                  type === 'expense' ? 'bg-expense/20 text-expense' : 'text-muted-foreground',
                )}
              >
                Despesa
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={type === 'income'}
                onClick={() => { setType('income'); setCategoryIds([]) }}
                className={cn(
                  'rounded-full py-2 text-sm font-medium transition-colors',
                  type === 'income' ? 'bg-income/20 text-income' : 'text-muted-foreground',
                )}
              >
                Ganho
              </button>
            </div>

            <div className="flex gap-3">
              <div className="flex flex-1 flex-col gap-2">
                <Label htmlFor="sub-name">Nome</Label>
                <Input
                  id="sub-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={type === 'expense' ? 'Ex.: Netflix' : 'Ex.: Salário'}
                />
              </div>
              <div className="flex w-32 flex-col gap-2">
                <Label htmlFor="sub-amount">Valor (€)</Label>
                <Input
                  id="sub-amount"
                  inputMode="decimal"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="0,00"
                  className="amount"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Frequência</Label>
              <div className="grid grid-cols-3 rounded-full bg-secondary p-1" role="radiogroup" aria-label="Frequência">
                {FREQUENCIES.map((f) => (
                  <button
                    key={f}
                    type="button"
                    role="radio"
                    aria-checked={frequency === f}
                    onClick={() => setFrequency(f)}
                    className={cn(
                      'rounded-full py-2 text-sm font-medium transition-colors',
                      frequency === f ? 'bg-brass/20 text-brass' : 'text-muted-foreground',
                    )}
                  >
                    {FREQUENCY_LABELS[f]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="sub-first">{sub ? 'Próxima cobrança' : 'Primeira cobrança'}</Label>
              <Input
                id="sub-first"
                type="date"
                min={todayISO()}
                value={firstDate}
                onChange={(e) => setFirstDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {frequency === 'weekly' && 'Repete todas as semanas nesse dia da semana.'}
                {frequency === 'monthly' && 'Repete todos os meses nesse dia (em meses curtos, no último dia).'}
                {frequency === 'yearly' && 'Repete todos os anos nessa data.'}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Categorias</Label>
              <CategoryPicker type={type} values={categoryIds} onToggle={toggleCategory} />
              <p className="text-xs text-muted-foreground">
                A categoria «Subscrições» é adicionada automaticamente.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <Button
                size="lg"
                disabled={save.isPending}
                onClick={() =>
                  save.mutate(undefined, {
                    onSuccess: () => {
                      toast.success(sub ? 'Subscrição atualizada.' : 'Subscrição criada.')
                      onOpenChange(false)
                    },
                  })
                }
              >
                {sub ? 'Guardar alterações' : 'Criar subscrição'}
              </Button>
              {sub && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="lg" className="text-destructive">
                      <Trash2 className="size-4" /> Apagar subscrição
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Apagar esta subscrição?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Deixa de haver registos automáticos. Os movimentos já criados mantêm-se.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => remove.mutate(undefined, { onSuccess: () => onOpenChange(false) })}
                      >
                        Apagar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export default function SubscriptionsPage() {
  const { data: subs } = useSubscriptions()
  const { data: categories } = useCategories()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Subscription | undefined>()

  const toggleActive = useAppMutation(
    ({ id, active }: { id: string; active: boolean }) => api.setSubscriptionActive(id, active),
  )

  if (!subs || !categories) return null

  const catMap = new Map(categories.map((c) => [c.id, c]))
  const active = subs.filter((s) => s.active)
  const expenseMonthly = active
    .filter((s) => s.type === 'expense')
    .reduce((sum, s) => sum + monthlyEquivalentCents(s), 0)
  const incomeMonthly = active
    .filter((s) => s.type === 'income')
    .reduce((sum, s) => sum + monthlyEquivalentCents(s), 0)

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Subscrições"
        backTo="/"
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

      {(expenseMonthly > 0 || incomeMonthly > 0) && (
        <div className="flex items-baseline justify-between rounded-3xl bg-card px-5 py-4">
          <div>
            <p className="text-xs text-muted-foreground">Despesas / mês</p>
            <p className="amount mt-0.5 text-xl font-semibold text-expense">
              {formatCents(expenseMonthly)}
            </p>
          </div>
          {incomeMonthly > 0 && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Ganhos / mês</p>
              <p className="amount mt-0.5 text-xl font-semibold text-income">
                {formatCents(incomeMonthly)}
              </p>
            </div>
          )}
        </div>
      )}

      {subs.length === 0 ? (
        <EmptyState
          emoji="🔄"
          title="Sem subscrições"
          hint="Cria despesas ou ganhos recorrentes — a app regista-os automaticamente no dia certo."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {subs.map((s) => {
            // Mostra a primeira categoria "real"; sem nenhuma, o loop de subscrição.
            const cat = s.categoryIds.map((id) => catMap.get(id)).find((c) => c && !c.isSystem)
            const Icon = getCategoryIcon(cat?.icon ?? 'repeat')
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setEditing(s)
                  setFormOpen(true)
                }}
                className={cn('rounded-3xl bg-card p-4 text-left', !s.active && 'opacity-55')}
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground"
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{s.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {scheduleLabel(s)}
                      {s.active ? ` · próxima: ${formatDate(s.nextDate)}` : ' · em pausa'}
                    </span>
                  </span>
                  <span className="flex flex-col items-end gap-1.5">
                    <AmountText cents={s.amountCents} type={s.type} className="text-sm font-medium" />
                    {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
                    <span onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={s.active}
                        onCheckedChange={(checked) => toggleActive.mutate({ id: s.id, active: checked })}
                        aria-label={s.active ? `Pausar ${s.name}` : `Retomar ${s.name}`}
                      />
                    </span>
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <SubscriptionFormDrawer sub={editing} open={formOpen} onOpenChange={setFormOpen} />
    </div>
  )
}
