import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ChevronRight,
  Download,
  LogOut,
  Plus,
  Tags,
  Trash2,
  Upload,
  Wallet,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import * as api from '@/lib/api'
import { useAppMutation, useCategories } from '@/lib/hooks'
import type { TxType } from '@/lib/types'
import { exportBackup, importBackup } from '@/lib/backup'
import { PageHeader } from '@/components/page-header'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

function CategoriesDrawer() {
  const { data: categories } = useCategories()
  const [emoji, setEmoji] = useState('')
  const [name, setName] = useState('')
  const [type, setType] = useState<TxType>('expense')

  const add = useAppMutation(async () => {
    if (!name.trim()) throw new Error('Dá um nome à categoria.')
    const maxOrder = (categories ?? [])
      .filter((c) => c.type === type)
      .reduce((m, c) => Math.max(m, c.sortOrder), -1)
    await api.addCategory({
      name: name.trim(),
      emoji: emoji.trim() || '🏷️',
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
            .map((c) => (
              <div key={c.id} className="flex items-center gap-2 py-2 text-sm">
                <span aria-hidden>{c.emoji}</span>
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
            ))}
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
            <div className="flex flex-col gap-2 rounded-2xl bg-secondary/40 p-3">
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
                <Input
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  placeholder="🏷️"
                  aria-label="Emoji"
                  className="w-16 text-center"
                />
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
                        setEmoji('')
                        setName('')
                      },
                    })
                  }
                >
                  <Plus className="size-4" />
                </Button>
              </div>
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
  const fileRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const queryClient = useQueryClient()

  async function confirmImport() {
    if (!pendingFile) return
    try {
      await importBackup(pendingFile)
      queryClient.invalidateQueries()
      toast.success('Backup restaurado.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível importar o backup.')
    } finally {
      setPendingFile(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

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

      <div className="divide-y divide-border rounded-3xl bg-card">
        <button
          type="button"
          onClick={() =>
            exportBackup().then(
              () => toast.success('Backup exportado.'),
              (err) => toast.error(err instanceof Error ? err.message : 'Falha ao exportar.'),
            )
          }
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
        >
          <Download className="size-5 text-muted-foreground" />
          <span className="flex-1 font-medium">Exportar backup</span>
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
        >
          <Upload className="size-5 text-muted-foreground" />
          <span className="flex-1 font-medium">Importar backup</span>
        </button>
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

      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
      />

      <p className="px-2 text-xs text-muted-foreground">
        Os dados vivem na tua base de dados Supabase, protegidos por Row Level Security.
        O backup JSON é uma rede de segurança extra.
      </p>

      <AlertDialog open={pendingFile !== null} onOpenChange={(o) => !o && setPendingFile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar este backup?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os dados atuais serão substituídos pelos do ficheiro
              {pendingFile ? ` «${pendingFile.name}»` : ''}. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport}>Restaurar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
