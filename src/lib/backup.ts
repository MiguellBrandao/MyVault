import { supabase } from './supabase'
import { todayISO } from './money'

/** Ordem respeita as chaves estrangeiras (categorias antes de transações, etc.). */
const TABLES = [
  'categories',
  'transactions',
  'debts',
  'debt_payments',
  'goals',
  'goal_entries',
] as const

export async function exportBackup() {
  const data: Record<string, unknown[]> = {}
  for (const name of TABLES) {
    const { data: rows, error } = await supabase.from(name).select('*')
    if (error) throw new Error(error.message)
    // user_id fica de fora: no restauro é preenchido pela sessão ativa.
    data[name] = (rows ?? []).map(({ user_id: _userId, ...rest }) => rest)
  }
  const payload = {
    app: 'myvault',
    version: 2,
    exportedAt: new Date().toISOString(),
    data,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `myvault-backup-${todayISO()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** Substitui TODOS os dados atuais pelos do ficheiro de backup. */
export async function importBackup(file: File) {
  const json = JSON.parse(await file.text())
  if (json?.app !== 'myvault' || typeof json.data !== 'object' || json.data === null) {
    throw new Error('O ficheiro não é um backup válido do MyVault.')
  }
  // Apagar na ordem inversa das FKs; inserir na ordem direta.
  for (const name of [...TABLES].reverse()) {
    const { error } = await supabase.from(name).delete().neq('id', crypto.randomUUID())
    if (error) throw new Error(error.message)
  }
  for (const name of TABLES) {
    const rows = json.data[name]
    if (Array.isArray(rows) && rows.length > 0) {
      const { error } = await supabase.from(name).insert(rows)
      if (error) throw new Error(error.message)
    }
  }
}
