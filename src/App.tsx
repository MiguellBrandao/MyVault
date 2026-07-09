import { Outlet, useLocation } from 'react-router-dom'
import { TabBar } from '@/components/tab-bar'
import { Toaster } from '@/components/ui/sonner'

export default function App() {
  const { pathname } = useLocation()
  // O ecrã de confirmação da Wallet é focado: sem barra de navegação.
  const hideTabBar = pathname === '/add'

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <main className={`flex-1 px-4 pt-safe ${hideTabBar ? 'pb-8' : 'pb-32'}`}>
        <Outlet />
      </main>
      {!hideTabBar && <TabBar />}
      <Toaster position="top-center" theme="dark" />
    </div>
  )
}
