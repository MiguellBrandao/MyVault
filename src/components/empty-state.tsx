import type { ReactNode } from 'react'

interface EmptyStateProps {
  emoji: string
  title: string
  hint?: string
  action?: ReactNode
}

export function EmptyState({ emoji, title, hint, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-border px-6 py-10 text-center">
      <span className="text-3xl" aria-hidden>
        {emoji}
      </span>
      <p className="font-medium">{title}</p>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
