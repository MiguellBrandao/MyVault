import { House, ReceiptText, Target, HandCoins, Plus, type LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { TxDrawer } from '@/components/tx-drawer'

function Tab({ to, icon: Icon, label }: { to: string; icon: LucideIcon; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex flex-col items-center gap-0.5 rounded-2xl py-1.5 transition-colors',
          isActive ? 'text-primary' : 'text-muted-foreground',
        )
      }
    >
      <Icon className="size-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  )
}

export function TabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40">
      <div className="mx-auto w-full max-w-md px-4 pb-safe">
        <div className="mb-3 grid grid-cols-5 items-center rounded-3xl border border-border bg-card/90 px-2 py-1.5 shadow-lg shadow-black/30 backdrop-blur">
          <Tab to="/" icon={House} label="Início" />
          <Tab to="/movimentos" icon={ReceiptText} label="Movimentos" />
          <TxDrawer
            trigger={
              <button
                aria-label="Adicionar movimento"
                className="mx-auto flex size-12 -translate-y-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-black/40 ring-4 ring-background transition-transform active:scale-95"
              >
                <Plus className="size-6" />
              </button>
            }
          />
          <Tab to="/metas" icon={Target} label="Metas" />
          <Tab to="/dividas" icon={HandCoins} label="Dívidas" />
        </div>
      </div>
    </nav>
  )
}
