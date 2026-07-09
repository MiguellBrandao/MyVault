import { useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { db, type Transaction, type TxType } from '@/lib/db'
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
  const [categoryId, setCategoryId] = useState<number | undefined>()
  const [date, setDate] = useState(todayISO())

  useEffect(() => {
    if (!isOpen) return
    setType(tx?.type ?? defaultType)
    setAmountStr(tx ? (tx.amountCents / 100).toFixed(2).replace('.', ',') : '')
    setDescription(tx?.description ?? '')
    setCategoryId(tx?.categoryId)
    setDate(tx?.date ?? todayISO())
  }, [isOpen, tx, defaultType])

  async function save() {
    const amountCents = parseAmount(amountStr)
    if (!amountCents) {
      toast.error('Indica um valor válido.')
      return
    }
    let finalDescription = description.trim()
    if (!finalDescription && categoryId) {
      const cat = await db.categories.get(categoryId)
      finalDescription = cat?.name ?? ''
    }
    if (!finalDescription) {
      toast.error('Indica uma descrição ou escolhe uma categoria.')
      return
    }
    if (tx) {
      await db.transactions.update(tx.id, {
        type,
        amountCents,
        description: finalDescription,
        categoryId,
        date,
      })
      toast.success('Movimento atualizado.')
    } else {
      await db.transactions.add({
        type,
        amountCents,
        description: finalDescription,
        categoryId,
        date,
        source: 'manual',
        createdAt: Date.now(),
      } as Transaction)
      toast.success(type === 'expense' ? 'Despesa registada.' : 'Ganho registado.')
    }
    setOpen(false)
  }

  async function remove() {
    if (!tx) return
    await db.transactions.delete(tx.id)
    toast.success('Movimento apagado.')
    setOpen(false)
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
                onClick={() => { setType('expense'); setCategoryId(undefined) }}
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
                onClick={() => { setType('income'); setCategoryId(undefined) }}
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
              <Label>Categoria</Label>
              <CategoryPicker type={type} value={categoryId} onChange={setCategoryId} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="tx-date">Data</Label>
              <Input
                id="tx-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <Button size="lg" onClick={save}>
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
                      <AlertDialogAction onClick={remove}>Apagar</AlertDialogAction>
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
