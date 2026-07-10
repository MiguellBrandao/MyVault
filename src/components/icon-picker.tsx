import { useState } from 'react'
import { Search } from 'lucide-react'
import { CATEGORY_ICONS } from '@/lib/category-icons'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

interface IconPickerProps {
  value: string
  onChange: (name: string) => void
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const filtered = q
    ? CATEGORY_ICONS.filter(
        (d) => d.label.toLowerCase().includes(q) || d.name.includes(q),
      )
    : CATEGORY_ICONS

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pesquisar ícone…"
          aria-label="Pesquisar ícone"
          className="pl-9"
        />
      </div>
      <div className="grid max-h-48 grid-cols-8 gap-1 overflow-y-auto rounded-2xl bg-secondary/40 p-2">
        {filtered.map(({ name, label, Icon }) => (
          <button
            key={name}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={value === name}
            onClick={() => onChange(name)}
            className={cn(
              'flex aspect-square items-center justify-center rounded-xl transition-colors',
              value === name
                ? 'bg-brass/20 text-brass'
                : 'text-muted-foreground hover:bg-secondary',
            )}
          >
            <Icon className="size-5" />
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-8 py-4 text-center text-sm text-muted-foreground">
            Nenhum ícone encontrado.
          </p>
        )}
      </div>
    </div>
  )
}
