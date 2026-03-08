/** API base URL. Kosong = same origin. Set VITE_API untuk deploy frontend terpisah (e.g. Vercel → Deno Deploy). */
const API = import.meta.env.VITE_API ?? ''

export async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const r = await fetch(`${API}${path}`, { ...options, headers: { Accept: 'application/json', ...options?.headers } })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json() as Promise<T>
}

export const api = {
  stats: () => fetchJson<StatsResponse>('/api/stats'),
  ownershipByTicker: (code: string) => fetchJson<OwnershipRow[]>('/api/ownership/ticker/' + encodeURIComponent(code.toUpperCase())),
  ownershipByInvestor: (name: string) => fetchJson<OwnershipRow[]>('/api/ownership/investor/' + encodeURIComponent(name)),
  searchTicker: (q: string, limit = 20) => fetchJson<{ code: string; emiten: string }[]>('/api/ownership/search/ticker?q=' + encodeURIComponent(q) + '&limit=' + limit),
  searchInvestor: (q: string, limit = 20) => fetchJson<string[]>('/api/ownership/search/investor?q=' + encodeURIComponent(q) + '&limit=' + limit),
  float: (min: number, max: number) => fetchJson<FloatRow[]>('/api/ownership/float?min=' + min + '&max=' + max),
  conglomerates: () => fetchJson<{ name: string; tickerCount: number }[]>('/api/ownership/conglomerates'),
  topForeignInvestors: (limit = 10) => fetchJson<{ investor: string; stockCount: number }[]>('/api/ownership/top-foreign-investors?limit=' + limit),
  publicFigures: (limit = 20) => fetchJson<PublicFigure[]>('/api/ownership/public-figures?limit=' + limit),
  ownershipGraph: (code: string, maxInvestors = 12, maxTickers = 8) =>
    fetchJson<GraphData>('/api/ownership/graph/' + encodeURIComponent(code) + '?maxInvestors=' + maxInvestors + '&maxTickersPerInvestor=' + maxTickers),
  companyProfile: (code: string) => fetchJson<CompanyProfileResponse>('/api/company/profile/' + encodeURIComponent(code.toUpperCase())),
  heatmap: () => fetchJson<HeatmapEntry[]>('/api/market/heatmap'),
}

export interface HeatmapEntry {
  code: string
  name: string
  sector: string
  marketCap: number
  changePercent: number
}

export interface StatsResponse {
  tickerCount?: number
  investorCount?: number
  positionCount?: number
  localPercent?: number
  foreignPercent?: number
  conglomerateCount?: number
  publicFigureCount?: number
  lowFloatCount?: number
}

export interface OwnershipRow {
  investor?: string
  code?: string
  emiten?: string
  localForeign?: string
  shares?: number
  percent?: number
}

export interface FloatRow {
  code?: string
  emiten?: string
  topHolder?: string
  totalHeldPercent?: number
  freeFloatPercent?: number
}

export interface PublicFigure {
  investor: string
  positionCount: number
  topTicker?: string
  topPercent?: number
}

export interface GraphData {
  nodes: { id: string; label: string; type: 'investor' | 'ticker'; percent?: number }[]
  links: { source: string; target: string; percent?: number }[]
}

export interface CompanyProfileResponse {
  profile?: {
    code?: string
    name?: string
    sector?: string
    industry?: string
    board?: string
    listingDate?: string
    businessActivity?: string
    address?: string
  }
  directors?: { name: string; position: string }[]
  commissioners?: { name: string; position: string }[]
  shareholders?: { name: string; percentage?: number }[]
}
