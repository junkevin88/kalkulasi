import { primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

/**
 * Ticker–conglomerate mapping.
 * @description Maps ticker codes to conglomerate/business group names.
 * One ticker can belong to multiple conglomerates (one row per pair).
 * Synced from data/ticker_conglomerate_mapping.csv.
 */
export const tickerConglomerateMapping = sqliteTable(
  'ticker_conglomerate_mapping',
  {
    code: text('code').notNull(),
    conglomerate: text('conglomerate').notNull()
  },
  (table) => [primaryKey({ columns: [table.code, table.conglomerate] })]
)
