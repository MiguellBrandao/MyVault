const eur = new Intl.NumberFormat('pt-PT', {
  style: 'currency',
  currency: 'EUR',
})

export function formatCents(cents: number): string {
  return eur.format(cents / 100)
}

/**
 * Converte texto introduzido pelo utilizador ou vindo do Atalho da Wallet
 * ("12,50", "12.50", "1 234,56", "12,50 €") em cêntimos.
 * Devolve null se não for um valor válido.
 */
export function parseAmount(input: string): number | null {
  const s = input.replace(/[^0-9.,]/g, '')
  if (!s) return null
  const lastComma = s.lastIndexOf(',')
  const lastDot = s.lastIndexOf('.')
  const sepIndex = Math.max(lastComma, lastDot)
  let normalized: string
  if (sepIndex === -1) {
    normalized = s
  } else {
    // O separador que aparece mais à direita é o decimal; os restantes são de milhares.
    const intPart = s.slice(0, sepIndex).replace(/[.,]/g, '')
    const decPart = s.slice(sepIndex + 1)
    // "1.234" é milhares (3 dígitos após um único separador), não decimal.
    normalized = decPart.length === 3 && !s.slice(0, sepIndex).match(/[.,]/)
      ? `${intPart}${decPart}`
      : `${intPart}.${decPart}`
  }
  const value = Number(normalized)
  if (!Number.isFinite(value) || value <= 0) return null
  return Math.round(value * 100)
}

/** Data de hoje em formato ISO `yyyy-MM-dd`, no fuso local. */
export function todayISO(): string {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

/** Primeiro dia do mês de uma data ISO (`yyyy-MM-01`). */
export function monthStart(iso: string): string {
  return `${iso.slice(0, 7)}-01`
}

const monthFormatter = new Intl.DateTimeFormat('pt-PT', {
  month: 'long',
  year: 'numeric',
})

export function formatMonth(isoMonth: string): string {
  return monthFormatter.format(new Date(`${isoMonth}-01T12:00:00`))
}

const dateFormatter = new Intl.DateTimeFormat('pt-PT', {
  day: 'numeric',
  month: 'short',
})

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(`${iso}T12:00:00`))
}

const fullDateFormatter = new Intl.DateTimeFormat('pt-PT', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

export function formatFullDate(iso: string): string {
  return fullDateFormatter.format(new Date(`${iso}T12:00:00`))
}
