import { db } from './db'
import { todayISO } from './money'

const TABLES = [
  'transactions',
  'categories',
  'debts',
  'debtPayments',
  'goals',
  'goalEntries',
] as const

export async function exportBackup() {
  const data: Record<string, unknown[]> = {}
  for (const name of TABLES) {
    data[name] = await db.table(name).toArray()
  }
  const payload = {
    app: 'myvault',
    version: 1,
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
  await db.transaction('rw', db.tables, async () => {
    for (const name of TABLES) {
      await db.table(name).clear()
      const rows = json.data[name]
      if (Array.isArray(rows) && rows.length > 0) {
        await db.table(name).bulkAdd(rows)
      }
    }
  })
}
