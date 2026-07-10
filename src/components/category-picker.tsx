import { useCategories } from '@/lib/hooks'
import { getCategoryIcon } from '@/lib/category-icons'
import type { TxType } from '@/lib/types'
import { cn } from '@/lib/utils'

interface CategoryPickerProps {
  type: TxType
  /** Categorias selecionadas (multi-seleção). */
  values: string[]
  onToggle: (id: string) => void
}

/** Escolha de categorias. A categoria de sistema («Subscrições») nunca aparece. */
export function CategoryPicker({ type, values, onToggle }: CategoryPickerProps) {
  const { data: categories } = useCategories()

  if (!categories) return null

  return (
    <div className="flex flex-wrap gap-2">
      {categories
        .filter((c) => c.type === type && !c.isSystem)
        .map((c) => {
          const Icon = getCategoryIcon(c.icon)
          const selected = values.includes(c.id)
          return (
            <button
              type="button"
              key={c.id}
              role="checkbox"
              aria-checked={selected}
              onClick={() => onToggle(c.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm transition-colors',
                selected
                  ? 'border-brass/60 bg-brass/15 font-medium text-foreground'
                  : 'border-border bg-secondary/40 text-muted-foreground',
              )}
            >
              <Icon aria-hidden className="size-4" />
              {c.name}
            </button>
          )
        })}
    </div>
  )
}
