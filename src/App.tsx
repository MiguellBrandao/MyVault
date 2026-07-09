import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { TabBar } from '@/components/tab-bar'
import { Toaster } from '@/components/ui/sonner'
import LoginPage from '@/pages/login'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <h1 className="text-2xl font-bold tracking-tight">
          My<span className="text-primary">Vault</span>
        </h1>
      </div>
    )
  }

  return (
    <>
      {session ? (
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
          <main className="flex-1 px-4 pt-safe pb-32">
            <Outlet />
          </main>
          <TabBar />
        </div>
      ) : (
        <LoginPage />
      )}
      <Toaster position="top-center" theme="dark" />
    </>
  )
}
