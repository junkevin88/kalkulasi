/**
 * Ownership web server.
 * @description API + static frontend for KSEI ownership data.
 *
 * Usage: deno task web
 */
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { fromFileUrl, join, dirname } from '@std/path'
import { eq } from 'drizzle-orm'
import CompanyModule from '@app/Company/index.ts'
import OwnershipModule from '@app/Ownership/index.ts'
import Database from '@app/Database.ts'
import * as schemas from '@app/Backend/Schemas/index.ts'
import type { CompanyDetailResponse } from '@app/Company/Types.ts'

const ownership = new OwnershipModule()
const company = new CompanyModule()
const app = new Hono()
const projectRoot = dirname(dirname(fromFileUrl(import.meta.url)))
/** React app build output (after: cd frontend && npm run build) */
const reactAppDir = join(projectRoot, 'frontend', 'dist')

app.use('/*', cors())

// API: ownership by ticker
app.get('/api/ownership/ticker/:code', async (c) => {
  const code = c.req.param('code')
  const data = await ownership.getByTicker(code)
  return c.json(data)
})

// API: ownership by investor
app.get('/api/ownership/investor/:name', async (c) => {
  const name = decodeURIComponent(c.req.param('name'))
  const data = await ownership.getByInvestor(name)
  return c.json(data)
})

// API: search ticker
app.get('/api/ownership/search/ticker', async (c) => {
  const q = c.req.query('q') ?? ''
  const limit = parseInt(c.req.query('limit') ?? '20', 10)
  const data = await ownership.searchTicker(q, limit)
  return c.json(data)
})

// API: search investor
app.get('/api/ownership/search/investor', async (c) => {
  const q = c.req.query('q') ?? ''
  const limit = parseInt(c.req.query('limit') ?? '20', 10)
  const data = await ownership.searchInvestor(q, limit)
  return c.json(data)
})

// API: float screener
app.get('/api/ownership/float', async (c) => {
  const min = parseFloat(c.req.query('min') ?? '0')
  const max = parseFloat(c.req.query('max') ?? '100')
  const data = await ownership.getFloatScreener(min, max)
  return c.json(data)
})

// API: local/foreign split
app.get('/api/ownership/split/:code', async (c) => {
  const code = c.req.param('code')
  const data = await ownership.getLocalForeignSplit(code)
  return c.json(data)
})

// API: ownership relation graph (for profile page)
app.get('/api/ownership/graph/:code', async (c) => {
  const code = c.req.param('code')
  const maxInvestors = parseInt(c.req.query('maxInvestors') ?? '12', 10)
  const maxTickers = parseInt(c.req.query('maxTickersPerInvestor') ?? '8', 10)
  const data = await ownership.getOwnershipGraph(code, maxInvestors, maxTickers)
  return c.json(data)
})

// API: conglomerates
app.get('/api/ownership/conglomerates', async (c) => {
  const data = await ownership.getConglomerates()
  return c.json(data)
})

// API: top foreign investors
app.get('/api/ownership/top-foreign-investors', async (c) => {
  const limit = parseInt(c.req.query('limit') ?? '10', 10)
  const data = await ownership.getTopForeignInvestors(limit)
  return c.json(data)
})

// API: public figures
app.get('/api/ownership/public-figures', async (c) => {
  const limit = parseInt(c.req.query('limit') ?? '20', 10)
  const data = await ownership.getPublicFigures(limit)
  return c.json(data)
})

// API: company profile (profil emiten)
app.get('/api/company/profile/:code', async (c) => {
  const code = c.req.param('code')?.toUpperCase() ?? ''
  if (!code) return c.json({ error: 'Code required' }, 400)
  try {
    // 1) Coba baca dari database (Turso / SQLite) lebih dulu
    const [detail] = await Database.select().from(schemas.companyDetail).where(eq(schemas.companyDetail.code, code))
    if (detail) {
      const [basic] = await Database.select().from(schemas.companyProfile).where(eq(schemas.companyProfile.code, code))
      const listingDate =
        (basic?.listingDate instanceof Date ? basic.listingDate.toISOString() : basic?.listingDate?.toString()) ?? ''

      const parseJson = <T>(value: string | null): T[] => {
        if (!value) return []
        try {
          const parsed = JSON.parse(value)
          return Array.isArray(parsed) ? (parsed as T[]) : []
        } catch {
          return []
        }
      }

      const response: CompanyDetailResponse = {
        profile: {
          address: detail.address ?? '',
          bae: detail.bae ?? '',
          industry: detail.industry ?? '',
          subIndustri: detail.subIndustry ?? '',
          email: detail.email ?? '',
          fax: detail.fax ?? '',
          businessActivity: detail.businessActivity ?? '',
          code: code,
          name: basic?.name ?? '',
          phone: detail.phone ?? '',
          website: detail.website ?? '',
          npwp: detail.npwp ?? '',
          history: detail.history ?? '',
          listingDate,
          board: detail.board ?? '',
          sector: detail.sector ?? '',
          subSector: detail.subSector ?? '',
          status: detail.status ?? ''
        },
        secretary: parseJson(detail.secretary),
        directors: parseJson(detail.directors),
        commissioners: parseJson(detail.commissioners),
        committees: parseJson(detail.committees),
        shareholders: parseJson(detail.shareholders),
        subsidiaries: parseJson(detail.subsidiaries)
      }
      return c.json(response)
    }

    // 2) Fallback: kalau di DB belum ada, coba hit IDX langsung (untuk lokal / dev)
    const data = await company.getCompanyProfilesDetail(code)
    if (!data) return c.json({ error: 'Not found' }, 404)
    return c.json(data)
  } catch (err) {
    console.error('[Company]', err)
    return c.json({ error: 'Failed to fetch profile' }, 500)
  }
})

// API: heatmap data (sector, market cap, % change from stock screener)
app.get('/api/market/heatmap', async (c) => {
  try {
    const raw = await company.getStockScreener('', '')
    if (!raw?.results?.length) return c.json([])
    const list = raw.results.map((r: { code: string; name: string; sector?: string; marketCapital?: number; mtd?: number }) => ({
      code: r.code,
      name: r.name,
      sector: r.sector || 'MISCELLANEOUS',
      marketCap: Number(r.marketCapital) || 0,
      changePercent: typeof r.mtd === 'number' ? r.mtd : 0
    }))
    return c.json(list)
  } catch (err) {
    console.error('[Heatmap]', err)
    return c.json([], 200)
  }
})

// API: dashboard stats
app.get('/api/stats', async (c) => {
  const [stats, conglomerates, publicFigures, lowFloat] = await Promise.all([
    ownership.getStats(),
    ownership.getConglomerates(),
    ownership.getPublicFigures(100),
    ownership.getFloatScreener(0, 5)
  ])
  return c.json({
    ...stats,
    conglomerateCount: conglomerates.length,
    publicFigureCount: publicFigures.length,
    lowFloatCount: lowFloat.length
  })
})

// Serve company logos from sample/img
app.get('/api/img/:filename', async (c) => {
  const filename = c.req.param('filename') ?? ''
  const match = filename.match(/^([A-Z0-9]{2,5})\.svg$/i)
  if (!match) return c.notFound()
  const code = match[1].toUpperCase()
  try {
    const logoPath = join(projectRoot, 'sample', 'img', `${code}.svg`)
    const content = await Deno.readFile(logoPath)
    return new Response(content, {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' }
    })
  } catch {
    return c.notFound()
  }
})

// Serve Analisis Ordal React app at root (build: cd frontend && npm run build)
app.get('/*', async (c) => {
  const path = c.req.path === '/' ? '/index.html' : c.req.path
  const filePath = join(reactAppDir, path.replace(/^\//, ''))
  try {
    const content = await Deno.readFile(filePath)
    const ext = path.split('.').pop()
    const types: Record<string, string> = {
      html: 'text/html',
      js: 'application/javascript',
      css: 'text/css',
      json: 'application/json',
      ico: 'image/x-icon',
      svg: 'image/svg+xml',
      woff: 'font/woff',
      woff2: 'font/woff2'
    }
    return new Response(content, {
      headers: { 'Content-Type': types[ext ?? ''] ?? 'application/octet-stream' }
    })
  } catch {
    try {
      const indexHtml = await Deno.readFile(join(reactAppDir, 'index.html'))
      return new Response(indexHtml, { headers: { 'Content-Type': 'text/html' } })
    } catch {
      return c.notFound()
    }
  }
})

const port = parseInt(Deno.env.get('PORT') ?? '3000', 10)
console.log(`[Web] Ownership app: http://localhost:${port}`)
Deno.serve({ port }, app.fetch)
