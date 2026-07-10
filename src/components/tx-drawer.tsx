import { useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import * as api from '@/lib/api'
import { useAppMutation, useCategories } from '@/lib/hooks'
import type { Transaction, TxType } from '@/lib/types'
import { parseAmount, todayISO } from '@/lib/money'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CategoryPicker } from '@/components/category-picker'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
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

interface TxDrawerProps {
  trigger?: ReactNode
  /** Movimento existente — ativa o modo de edição. */
  tx?: Transaction
  defaultType?: TxType
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function TxDrawer({ trigger, tx, defaultType = 'expense', open, onOpenChange }: TxDrawerProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = open ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  const [type, setType] = useState<TxType>(defaultType)
  const [amountStr, setAmountStr] = useState('')
  const [description, setDescription] = useState('')
  const [categoryIds, setCategoryIds] = useState<string[]>([])
  const [date, setDate] = useState(todayISO())

  const { data: categories } = useCategories()

  useEffect(() => {
    if (!isOpen) return
    setType(tx?.type ?? defaultType)
    setAmountStr(tx ? (tx.amountCents / 100).toFixed(2).replace('.', ',') : '')
    setDescription(tx?.description ?? '')
    setCategoryIds(tx?.categoryIds ?? [])
    setDate(tx?.date ?? todayISO())
  }, [isOpen, tx, defaultType])

  function toggleCategory(id: string) {
    setCategoryIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]))
  }

  const save = useAppMutation(async () => {
    const amountCents = parseAmount(amountStr)
    if (!amountCents) throw new Error('Indica um valor válido.')
    let finalDescription = description.trim()
    if (!finalDescription && categoryIds.length > 0) {
      finalDescription = categories?.find((c) => c.id === categoryIds[0])?.name ?? ''
    }
    if (!finalDescription) throw new Error('Indica uma descrição ou escolhe uma categoria.')
    const input = { type, amountCents, description: finalDescription, categoryIds, date }
    if (tx) {
      await api.updateTransaction(tx.id, input)
    } else {
      await api.addTransaction(input)
    }
  })

  const remove = useAppMutation(async () => {
    if (tx) await api.deleteTransaction(tx.id)
  }, 'Movimento apagado.')

  function submit() {
    save.mutate(undefined, {
      onSuccess: () => {
        toast.success(
          tx ? 'Movimento atualizado.' : type === 'expense' ? 'Despesa registada.' : 'Ganho registado.',
        )
        setOpen(false)
      },
    })
  }

  return (
    <Drawer open={isOpen} onOpenChange={setOpen}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent>
        <div className="overflow-y-auto px-4 pb-safe">
          <DrawerHeader className="px-0">
            <DrawerTitle>{tx ? 'Editar movimento' : 'Novo movimento'}</DrawerTitle>
          </DrawerHeader>

          <div className="flex flex-col gap-5 pb-6">
            <div className="grid grid-cols-2 rounded-full bg-secondary p-1" role="radiogroup" aria-label="Tipo de movimento">
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

            <div className="flex items-baseline justify-center gap-1">
              <input
                inputMode="decimal"
                autoComplete="off"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0,00"
                aria-label="Valor"
                className="amount w-40 bg-transparent text-right text-5xl font-semibold text-foreground outline-none placeholder:text-muted-foreground/30"
              />
              <span className="text-2xl text-muted-foreground">€</span>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="tx-desc">Descrição</Label>
              <Input
                id="tx-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={type === 'expense' ? 'Ex.: Continente' : 'Ex.: Salário de julho'}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Categorias</Label>
              <CategoryPicker type={type} values={categoryIds} onToggle={toggleCategory} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="tx-date">Data</Label>
              <Input
                id="tx-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              {date > todayISO() && (
                <p className="text-xs text-muted-foreground">
                  Movimento futuro: só conta para o saldo a partir dessa data.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <Button size="lg" onClick={submit} disabled={save.isPending}>
                {tx ? 'Guardar alterações' : type === 'expense' ? 'Registar despesa' : 'Registar ganho'}
              </Button>
              {tx && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="lg" className="text-destructive">
                      <Trash2 className="size-4" /> Apagar movimento
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Apagar este movimento?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => remove.mutate(undefined, { onSuccess: () => setOpen(false) })}
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
