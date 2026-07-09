import { useCategories } from '@/lib/hooks'
import type { TxType } from '@/lib/types'
import { cn } from '@/lib/utils'

interface CategoryPickerProps {
  type: TxType
  value: string | null
  onChange: (id: string) => void
}

export function CategoryPicker({ type, value, onChange }: CategoryPickerProps) {
  const { data: categories } = useCategories()

  if (!categories) return null

  return (
    <div className="flex flex-wrap gap-2">
      {categories
        .filter((c) => c.type === type)
        .map((c) => (
          <button
            type="button"
            key={c.id}
            onClick={() => onChange(c.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm transition-colors',
              value === c.id
                ? 'border-brass/60 bg-brass/15 font-medium text-foreground'
                : 'border-border bg-secondary/40 text-muted-foreground',
            )}
          >
            <span aria-hidden>{c.emoji}</span>
            {c.name}
          </button>
        ))}
    </div>
  )
}
