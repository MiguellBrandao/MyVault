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
