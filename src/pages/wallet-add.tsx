import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Wallet } from 'lucide-react'
import { db, type Transaction, type TxType } from '@/lib/db'
import { formatFullDate, parseAmount, todayISO } from '@/lib/money'
import { CategoryPicker } from '@/components/category-picker'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function WalletAddPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const rawAmount = params.get('amount') ?? ''
  const merchant = params.get('merchant') ?? ''
  const type: TxType = params.get('type') === 'income' ? 'income' : 'expense'

  const [amountStr, setAmountStr] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>()

  const initialCents = parseAmount(rawAmount)

  useEffect(() => {
    setAmountStr(initialCents ? (initialCents / 100).toFixed(2).replace('.', ',') : '')
    setDescription(merchant)
  }, [rawAmount, merchant]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sugere a categoria usada da última vez neste comerciante.
  useEffect(() => {
    if (!merchant) return
    let cancelled = false
    db.transactions
      .orderBy('createdAt')
      .reverse()
      .filter((t) => t.description.toLowerCase() === merchant.toLowerCase())
      .first()
      .then((prev) => {
        if (!cancelled && prev?.categoryId) setCategoryId(prev.categoryId)
      })
    return () => {
      cancelled = true
    }
  }, [merchant])

  if (!rawAmount && !merchant) {
    return (
      <div className="pt-10">
        <EmptyState
          emoji="👛"
          title="Nenhum pagamento para confirmar"
          hint="Este ecrã é aberto automaticamente pelo Atalho da Wallet."
          action={
            <Button asChild variant="secondary">
              <Link to="/">Ir para o início</Link>
            </Button>
          }
        />
      </div>
    )
  }

  async function save() {
    const amountCents = parseAmount(amountStr)
    if (!amountCents) {
      toast.error('Indica um valor válido.')
      return
    }
    await db.transactions.add({
      type,
      amountCents,
      description: description.trim() || 'Pagamento Wallet',
      categoryId,
      date: todayISO(),
      source: 'wallet',
      createdAt: Date.now(),
    } as Transaction)
    toast.success('Despesa registada.')
    navigate('/')
  }

  return (
    <div className="flex min-h-[80dvh] flex-col justify-center gap-6 py-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-brass/15 text-brass">
          <Wallet className="size-7" />
        </span>
        <h1 className="text-xl font-bold">Pagamento detetado</h1>
        <p className="text-sm text-muted-foreground">{formatFullDate(todayISO())}</p>
      </div>

      <div className="flex flex-col gap-5 rounded-3xl bg-card p-5">
        <div className="flex items-baseline justify-center gap-1">
          <input
            inputMode="decimal"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            placeholder="0,00"
            aria-label="Valor"
            className="amount w-40 bg-transparent text-right text-5xl font-semibold text-foreground outline-none placeholder:text-muted-foreground/30"
          />
          <span className="text-2xl text-muted-foreground">€</span>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="wallet-desc">Comerciante</Label>
          <Input
            id="wallet-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Categoria</Label>
          <CategoryPicker type={type} value={categoryId} onChange={setCategoryId} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button size="lg" onClick={save}>
          Registar despesa
        </Button>
        <Button variant="ghost" size="lg" onClick={() => navigate('/')}>
          Ignorar
        </Button>
      </div>
    </div>
  )
}
