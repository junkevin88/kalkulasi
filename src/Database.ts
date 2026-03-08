import { drizzle } from 'drizzle-orm/libsql/node'
import * as schemas from '@app/Backend/Schemas/index.ts'

const databaseUrl = Deno.env.get('DATABASE_URL')
const authToken = Deno.env.get('DATABASE_AUTH_TOKEN')

/** Local file URL when DATABASE_URL is not set (development). */
const localDbUrl = import.meta.resolve('@data/database.sqlite')

const connection = {
  url: databaseUrl ?? localDbUrl,
  authToken: authToken ?? undefined
}

/**
 * Database access instance.
 * @description Exports the Drizzle ORM instance for database operations.
 * Uses DATABASE_URL + optional DATABASE_AUTH_TOKEN when set (e.g. Turso on Deno Deploy),
 * otherwise uses local data/database.sqlite.
 */
export default drizzle({ connection }, { schema: schemas })
