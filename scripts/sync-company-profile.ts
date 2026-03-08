/**
 * Sync detailed company profiles into database (Turso / SQLite).
 *
 * Usage:
 *   # Pastikan DATABASE_URL (+ DATABASE_AUTH_TOKEN jika perlu) sudah diset
 *   deno run --allow-net --allow-read --allow-write scripts/sync-company-profile.ts
 *
 * Atau via task:
 *   deno task company:sync
 */
import { syncCompanyProfile } from '@app/Backend/Sync/CompanyProfile.ts'

await syncCompanyProfile()

