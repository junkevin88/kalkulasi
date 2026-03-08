import type { Config } from 'drizzle-kit'

export default {
  schema: './src/Backend/Schemas/index.ts',
  out: './data/drizzle',
  dialect: 'turso',
  dbCredentials: {
    // URL & auth token diambil dari environment:
    // DATABASE_URL dan DATABASE_AUTH_TOKEN
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN
  }
} satisfies Config

