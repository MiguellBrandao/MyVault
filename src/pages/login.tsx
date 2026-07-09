import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  async function signIn() {
    setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) toast.error('Não foi possível entrar. Verifica o email e a palavra-passe.')
  }

  async function signUp() {
    if (password.length < 8) {
      toast.error('A palavra-passe precisa de pelo menos 8 caracteres.')
      return
    }
    setBusy(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    setBusy(false)
    if (error) {
      toast.error(error.message)
      return
    }
    if (data.user && !data.session) {
      toast.success('Conta criada! Confirma o teu email para entrar.')
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-6 pb-safe">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          My<span className="text-primary">Vault</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          As tuas contas, no teu cofre.
        </p>
      </div>

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          signIn()
        }}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="o.teu@email.com"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Palavra-passe</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <Button type="submit" size="lg" disabled={busy || !email || !password}>
          Entrar
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          disabled={busy || !email || !password}
          onClick={signUp}
        >
          Criar conta
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        Os dados ficam na tua base de dados Supabase, protegidos por Row Level Security.
      </p>
    </div>
  )
}
