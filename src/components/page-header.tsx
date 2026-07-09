import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

interface PageHeaderProps {
  title: string
  subtitle?: string
  backTo?: string
  action?: ReactNode
}

export function PageHeader({ title, subtitle, backTo, action }: PageHeaderProps) {
  return (
    <header className="flex items-center gap-3 pt-6 pb-4">
      {backTo && (
        <Link
          to={backTo}
          aria-label="Voltar"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground"
        >
          <ChevronLeft className="size-5" />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}
