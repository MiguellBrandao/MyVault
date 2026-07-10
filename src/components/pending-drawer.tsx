import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import * as api from '@/lib/api'
import { useAppMutation, useTransactions } from '@/lib/hooks'
import type { Transaction } from '@/lib/types'
import { formatFullDate, parseAmount } from '@/lib/money'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CategoryPicker } from '@/components/category-picker'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

interface PendingDrawerProps {
  tx: Transaction
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Confirmação de um pagamento detetado pelo Atalho da Wallet. */
export function PendingDrawer({ tx, open, onOpenChange }: PendingDrawerProps) {
  const [amountStr, setAmountStr] = useState('')
  const [description, setDescription] = useState('')
  const [categoryIds, setCategoryIds] = useState<string[]>([])
  const { data: txs } = useTransactions()

  useEffect(() => {
    if (!open) return
    setAmountStr((tx.amountCents / 100).toFixed(2).replace('.', ','))
    setDescription(tx.description)
    // Sugere as categorias usadas da última vez neste comerciante.
    const previous = txs?.find(
      (t) =>
        t.id !== tx.id &&
        t.status === 'confirmed' &&
        t.categoryIds.length > 0 &&
        t.description.toLowerCase() === tx.description.toLowerCase(),
    )
    setCategoryIds(previous?.categoryIds ?? [])
  }, [open, tx, txs])

  function toggleCategory(id: string) {
    setCategoryIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]))
  }

  const confirm = useAppMutation(async () => {
    const amountCents = parseAmount(amountStr)
    if (!amountCents) throw new Error('Indica um valor válido.')
    await api.confirmTransaction(tx.id, {
      amountCents,
      description: description.trim() || 'Pagamento Wallet',
      categoryIds,
    })
  }, 'Despesa confirmada.')

  const ignore = useAppMutation(() => api.deleteTransaction(tx.id))

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="overflow-y-auto px-4 pb-safe">
          <DrawerHeader className="px-0">
            <DrawerTitle>Pagamento detetado</DrawerTitle>
            <p className="text-sm text-muted-foreground">{formatFullDate(tx.date)}</p>
          </DrawerHeader>
          <div className="flex flex-col gap-5 pb-6">
            <div className="flex items-baseline justify-center gap-1">
              <input
                inputMode="decimal"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                aria-label="Valor"
                className="amount w-40 bg-transparent text-right text-5xl font-semibold text-foreground outline-none"
              />
              <span className="text-2xl text-muted-foreground">€</span>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="pending-desc">Comerciante</Label>
              <Input
                id="pending-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Categorias</Label>
              <CategoryPicker type="expense" values={categoryIds} onToggle={toggleCategory} />
            </div>
            <div className="flex flex-col gap-2">
              <Button
                size="lg"
                disabled={confirm.isPending}
                onClick={() => confirm.mutate(undefined, { onSuccess: () => onOpenChange(false) })}
              >
                Confirmar despesa
              </Button>
              <Button
                variant="ghost"
                size="lg"
                disabled={ignore.isPending}
                onClick={() =>
                  ignore.mutate(undefined, {
                    onSuccess: () => {
                      toast.success('Pagamento ignorado.')
                      onOpenChange(false)
                    },
                  })
                }
              >
                Ignorar
              </Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
