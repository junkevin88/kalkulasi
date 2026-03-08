/**
 * Sync ticker_conglomerate_mapping from CSV to database (Turso / SQLite).
 *
 * Usage:
 *   deno run --allow-read --allow-write scripts/sync-conglomerate-mapping.ts
 *
 * Or via task:
 *   deno task conglomerate:sync
 *
 * Requires DATABASE_URL (+ DATABASE_AUTH_TOKEN for Turso) when syncing to remote DB.
 */
import { parse } from '@std/csv/parse'
import * as schemas from '@app/Backend/Schemas/index.ts'
import Database from '@app/Database.ts'

const CSV_PATH = new URL('../data/ticker_conglomerate_mapping.csv', import.meta.url)

async function run() {
  console.log('[Conglomerate] Reading', CSV_PATH.pathname, '...')
  const content = await Deno.readTextFile(CSV_PATH)
  const rows = parse(content, { skipFirstRow: true }) as Record<string, string>[]

  const records = rows
    .filter((r) => r['Kode']?.trim() && r['Conglomerate']?.trim())
    .map((r) => ({
      code: r['Kode']!.trim(),
      conglomerate: r['Conglomerate']!.trim()
    }))

  if (!records.length) {
    console.warn('[Conglomerate] No valid rows found.')
    return
  }

  console.log('[Conglomerate] Upserting', records.length, 'records...')
  for (const r of records) {
    await Database.insert(schemas.tickerConglomerateMapping)
      .values(r)
      .onConflictDoNothing({
        target: [schemas.tickerConglomerateMapping.code, schemas.tickerConglomerateMapping.conglomerate]
      })
  }

  console.log('[Conglomerate] Done!')
}

run().catch((err) => {
  console.error('[Conglomerate] Error:', err)
  Deno.exit(1)
})
