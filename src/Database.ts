import { drizzle } from 'drizzle-orm/libsql/node'
import * as schemas from '@app/Backend/Schemas/index.ts'

const dbUrl = import.meta.resolve('@data/database.sqlite')

/**
 * Database access instance.
 * @description Exports the Drizzle ORM instance for database operations.
 */
export default drizzle(dbUrl, { schema: schemas })
