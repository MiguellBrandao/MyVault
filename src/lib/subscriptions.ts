import { todayISO } from './money'
import type { Subscription, SubscriptionFrequency } from './types'

export const WEEKDAY_LABELS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

const MONTH_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export const FREQUENCY_LABELS: Record<SubscriptionFrequency, string> = {
  weekly: 'Semanal',
  monthly: 'Mensal',
  yearly: 'Anual',
}

/** Ex.: "Mensal · dia 5", "Semanal · sexta", "Anual · 15 mar". */
export function scheduleLabel(s: Subscription): string {
  if (s.frequency === 'weekly') {
    return `Semanal · ${WEEKDAY_LABELS[s.dayOfWeek ?? 0]}`
  }
  if (s.frequency === 'monthly') {
    return `Mensal · dia ${s.dayOfMonth ?? 1}`
  }
  return `Anual · ${s.dayOfMonth ?? 1} ${MONTH_SHORT[(s.monthOfYear ?? 1) - 1]}`
}

/** Custo mensal equivalente em cêntimos (semanal ×52/12, anual ÷12). */
export function monthlyEquivalentCents(s: Subscription): number {
  if (s.frequency === 'weekly') return Math.round((s.amountCents * 52) / 12)
  if (s.frequency === 'yearly') return Math.round(s.amountCents / 12)
  return s.amountCents
}

/**
 * Deriva os campos de recorrência a partir da data da primeira cobrança.
 * A data escolhida define o dia (semana/mês/ano) e é a próxima cobrança.
 */
export function recurrenceFromFirstDate(frequency: SubscriptionFrequency, firstDate: string) {
  const d = new Date(`${firstDate}T12:00:00`)
  return {
    frequency,
    dayOfWeek: frequency === 'weekly' ? d.getDay() : null,
    dayOfMonth: frequency === 'weekly' ? null : d.getDate(),
    monthOfYear: frequency === 'yearly' ? d.getMonth() + 1 : null,
    nextDate: firstDate,
  }
}

export function isFirstDateValid(firstDate: string): boolean {
  return firstDate >= todayISO()
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Cobrança seguinte a `fromISO` (espelha subscription_next_date do Postgres). */
export function nextChargeAfter(s: Subscription, fromISO: string): string {
  const d = new Date(`${fromISO}T12:00:00`)
  if (s.frequency === 'weekly') {
    d.setDate(d.getDate() + 7)
    return toISO(d)
  }
  if (s.frequency === 'monthly') {
    const y = d.getFullYear()
    const nextMonth = d.getMonth() + 1 // índice 0-based do mês seguinte
    const daysInMonth = new Date(y, nextMonth + 1, 0).getDate()
    return toISO(new Date(y, nextMonth, Math.min(s.dayOfMonth ?? 1, daysInMonth)))
  }
  const y = d.getFullYear() + 1
  const month = (s.monthOfYear ?? 1) - 1
  const daysInMonth = new Date(y, month + 1, 0).getDate()
  return toISO(new Date(y, month, Math.min(s.dayOfMonth ?? 1, daysInMonth)))
}

/**
 * Soma das cobranças de subscrições ativas ainda por acontecer até ao fim
 * do mês corrente (depois de hoje — as de hoje já são movimentos reais).
 */
export function upcomingThisMonth(
  subs: Subscription[],
  today: string,
): { expense: number; income: number } {
  const monthKey = today.slice(0, 7)
  let expense = 0
  let income = 0
  for (const s of subs) {
    if (!s.active) continue
    let date = s.nextDate
    let guard = 0
    while (date.slice(0, 7) <= monthKey && guard++ < 8) {
      if (date > today && date.startsWith(monthKey)) {
        if (s.type === 'expense') expense += s.amountCents
        else income += s.amountCents
      }
      date = nextChargeAfter(s, date)
    }
  }
  return { expense, income }
}
