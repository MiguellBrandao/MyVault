import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  ChevronRight,
  LogOut,
  Plus,
  Tags,
  Trash2,
  Wallet,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import * as api from '@/lib/api'
import { useAppMutation, useCategories } from '@/lib/hooks'
import { getCategoryIcon } from '@/lib/category-icons'
import type { TxType } from '@/lib/types'
import { PageHeader } from '@/components/page-header'
import { IconPicker } from '@/components/icon-picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'

function CategoriesDrawer() {
  const { data: categories } = useCategories()
  const [icon, setIcon] = useState('tag')
  const [iconOpen, setIconOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<TxType>('expense')
  const SelectedIcon = getCategoryIcon(icon)

  const add = useAppMutation(async () => {
    if (!name.trim()) throw new Error('Dá um nome à categoria.')
    const maxOrder = (categories ?? [])
      .filter((c) => c.type === type)
      .reduce((m, c) => Math.max(m, c.sortOrder), -1)
    await api.addCategory({
      name: name.trim(),
      icon,
      type,
      sortOrder: maxOrder + 1,
    })
  }, 'Categoria criada.')

  const remove = useAppMutation(
    (id: string) => api.deleteCategory(id),
    'Categoria apagada. Os movimentos antigos ficam «Sem categoria».',
  )

  function section(title: string, sectionType: TxType) {
    return (
      <section>
        <h3 className="mb-1 px-1 text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="divide-y divide-border rounded-2xl bg-secondary/40 px-3">
          {(categories ?? [])
            .filter((c) => c.type === sectionType)
            .map((c) => {
              const Icon = getCategoryIcon(c.icon)
              return (
                <div key={c.id} className="flex items-center gap-2.5 py-2 text-sm">
                  <Icon aria-hidden className="size-4 text-muted-foreground" />
                  <span className="flex-1">{c.name}</span>
                  <button
                    type="button"
                    onClick={() => remove.mutate(c.id)}
                    aria-label={`Apagar categoria ${c.name}`}
                    className="p-1 text-muted-foreground"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              )
            })}
        </div>
      </section>
    )
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button type="button" className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
          <Tags className="size-5 text-muted-foreground" />
          <span className="flex-1 font-medium">Categorias</span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="overflow-y-auto px-4 pb-safe">
          <DrawerHeader className="px-0">
            <DrawerTitle>Categorias</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-4 pb-6">
            <div className="flex flex-col gap-3 rounded-2xl bg-secondary/40 p-3">
              <div className="grid grid-cols-2 rounded-full bg-secondary p-1" role="radiogroup" aria-label="Tipo de categoria">
                <button
                  type="button"
                  role="radio"
                  aria-checked={type === 'expense'}
                  onClick={() => setType('expense')}
                  className={cn(
                    'rounded-full py-1.5 text-sm font-medium',
                    type === 'expense' ? 'bg-expense/20 text-expense' : 'text-muted-foreground',
                  )}
                >
                  Despesa
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={type === 'income'}
                  onClick={() => setType('income')}
                  className={cn(
                    'rounded-full py-1.5 text-sm font-medium',
                    type === 'income' ? 'bg-income/20 text-income' : 'text-muted-foreground',
                  )}
                >
                  Ganho
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label="Escolher ícone"
                  aria-expanded={iconOpen}
                  onClick={() => setIconOpen((o) => !o)}
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors',
                    iconOpen
                      ? 'border-brass/60 bg-brass/15 text-brass'
                      : 'border-input text-muted-foreground',
                  )}
                >
                  <SelectedIcon className="size-4" />
                </button>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome da categoria"
                  aria-label="Nome"
                  className="flex-1"
                />
                <Button
                  size="icon"
                  aria-label="Adicionar categoria"
                  disabled={add.isPending}
                  onClick={() =>
                    add.mutate(undefined, {
                      onSuccess: () => {
                        setName('')
                        setIcon('tag')
                        setIconOpen(false)
                      },
                    })
                  }
                >
                  <Plus className="size-4" />
                </Button>
              </div>
              {iconOpen && (
                <IconPicker
                  value={icon}
                  onChange={(n) => {
                    setIcon(n)
                    setIconOpen(false)
                  }}
                />
              )}
            </div>
            {section('Despesas', 'expense')}
            {section('Ganhos', 'income')}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export default function SettingsPage() {
  const queryClient = useQueryClient()

  async function signOut() {
    await supabase.auth.signOut()
    queryClient.clear()
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Ajustes" backTo="/" />

      <div className="divide-y divide-border rounded-3xl bg-card">
        <Link to="/ajustes/atalho" className="flex items-center gap-3 px-4 py-3.5">
          <Wallet className="size-5 text-muted-foreground" />
          <span className="flex-1 font-medium">Atalho da Wallet</span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
        <CategoriesDrawer />
      </div>

      <div className="rounded-3xl bg-card">
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
        >
          <LogOut className="size-5 text-muted-foreground" />
          <span className="flex-1 font-medium">Terminar sessão</span>
        </button>
      </div>

      <p className="px-2 text-xs text-muted-foreground">
        Os dados vivem na tua base de dados Supabase, protegidos por Row Level Security.
      </p>
    </div>
  )
}
