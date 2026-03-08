import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, type CompanyProfileResponse, type GraphData } from '../api/client'
import { RelationGraph } from '../components/RelationGraph'
import { escapeHtml } from '../utils/format'
import { formatDate } from '../utils/format'

const API = import.meta.env.VITE_API ?? ''

function TableSection({
  title,
  headers,
  rows,
}: {
  title: string
  headers: [string, string]
  rows: [string, string][]
}) {
  if (!rows.length) return null
  return (
    <div>
      <h4 className="text-slate-600 dark:text-slate-200 font-semibold uppercase text-sm mb-2 tracking-wide">{title}</h4>
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-600">
              {headers.map((h) => (
                <th key={h} className="px-3 py-1.5 text-left text-slate-500 dark:text-slate-300 font-semibold text-xs uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={i}
                className={`border-b border-slate-200 dark:border-slate-700/60 ${i % 2 ? 'bg-slate-50 dark:bg-slate-800/60' : ''}`}
              >
                <td className="px-3 py-1.5 text-slate-700 dark:text-slate-200">{r[0]}</td>
                <td className="px-3 py-1.5 text-slate-700 dark:text-slate-200">{r[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function Profile() {
  const { code } = useParams<{ code: string }>()
  const [profile, setProfile] = useState<CompanyProfileResponse | null>(null)
  const [graph, setGraph] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const ticker = (code ?? '').toUpperCase()

  useEffect(() => {
    if (!ticker) return
    setLoading(true)
    setError(null)
    api
      .companyProfile(ticker)
      .then((data) => {
        setProfile(data)
        document.title = `${data.profile?.code ?? ticker} — ${data.profile?.name ?? 'Profil'} | Analisis Ordal`
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Gagal memuat profil')
        setProfile(null)
      })
      .finally(() => setLoading(false))
  }, [ticker])

  useEffect(() => {
    if (!ticker || !profile) return
    api
      .ownershipGraph(ticker)
      .then(setGraph)
      .catch(() => setGraph(null))
  }, [ticker, profile])

  if (!code) return null
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-4">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-4 transition-colors text-sm font-medium">
          <span>←</span> Kembali ke Dashboard
        </Link>
        <p className="text-slate-500 dark:text-slate-400 text-center py-16">Memuat profil...</p>
      </div>
    )
  }
  if (error || !profile) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-4">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-4 transition-colors text-sm font-medium">
          <span>←</span> Kembali ke Dashboard
        </Link>
        <p className="text-red-400 text-center py-16">{error === 'HTTP 404' ? 'Profil tidak ditemukan' : 'Gagal memuat profil'}</p>
      </div>
    )
  }

  const p = profile.profile ?? {}
  const logoUrl = `${API}/api/img/${ticker}.svg`
  const field = (label: string, value: string | undefined | null, preWrap = false) => (
    <div className="py-1">
      <span className="text-slate-500 dark:text-slate-400 text-xs block">{escapeHtml(label)}</span>
      <span className={`text-slate-700 dark:text-slate-200 ${preWrap ? 'whitespace-pre-wrap' : ''}`}>
        {escapeHtml(String(value ?? '-'))}
      </span>
    </div>
  )

  const dirs = (profile.directors ?? []).map((d) => [escapeHtml(d.name), escapeHtml(d.position)] as [string, string])
  const comms = (profile.commissioners ?? []).map((c) => [escapeHtml(c.name), escapeHtml(c.position)] as [string, string])
  const shareholders = (profile.shareholders ?? [])
    .slice(0, 10)
    .map((s) => [escapeHtml(s.name), `${s.percentage?.toFixed(2) ?? '-'}%`] as [string, string])

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 animate-fade-in">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-4 transition-colors text-sm"
      >
        <span>←</span> Kembali ke Dashboard
      </Link>

      <div className="flex items-start gap-6 mb-6 pb-6 border-b border-slate-200 dark:border-slate-600">
        <div className="flex-shrink-0 w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 flex items-center justify-center overflow-hidden">
          <img
            src={logoUrl}
            alt={ticker}
            className="w-16 h-16 object-contain"
            onError={(e) => {
              const t = e.currentTarget
              t.style.display = 'none'
              t.nextElementSibling?.classList.remove('hidden')
            }}
          />
          <span className="hidden text-2xl font-bold text-slate-500 dark:text-slate-400 mono">{ticker}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{escapeHtml(p.name ?? ticker)}</h1>
          <p className="text-slate-500 dark:text-slate-400 mono mt-1">{ticker}</p>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-slate-600 dark:text-slate-200 font-semibold uppercase text-sm mb-2 tracking-wide">Profil</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-0">
          <div>{field('Sektor', p.sector)}</div>
          <div>{field('Industri', p.industry)}</div>
          <div>{field('Papan', p.board)}</div>
          <div>{field('Tanggal Pencatatan', formatDate(p.listingDate))}</div>
          <div className="col-span-2 lg:col-span-4">{field('Kegiatan Usaha', p.businessActivity, true)}</div>
          <div className="col-span-2 lg:col-span-4">{field('Alamat', p.address, true)}</div>
        </div>
      </div>

      {(dirs.length > 0 || comms.length > 0 || shareholders.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {dirs.length > 0 && <TableSection title="Direksi" headers={['Nama', 'Jabatan']} rows={dirs} />}
          {comms.length > 0 && <TableSection title="Komisaris" headers={['Nama', 'Jabatan']} rows={comms} />}
          {shareholders.length > 0 && (
            <TableSection title="Pemegang Saham Utama" headers={['Nama', '%']} rows={shareholders} />
          )}
        </div>
      )}

      <div className="mb-6">
        <h4 className="text-slate-600 dark:text-slate-200 font-semibold uppercase text-sm mb-3 tracking-wide">Peta Relasi Kepemilikan</h4>
        <div className="flex flex-wrap items-center gap-4 mb-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 dark:bg-orange-400" /> Investor
          </span>
          <span className="flex items-center gap-2">
            <span className="w-4 h-2.5 rounded bg-sky-400 dark:bg-sky-400" /> Emiten
          </span>
          <span className="flex items-center gap-2">
            <span className="w-4 h-2.5 rounded bg-emerald-500 dark:bg-emerald-400" /> Emiten utama
          </span>
          <span className="text-slate-400 dark:text-slate-500">• Ukuran ∝ % kepemilikan</span>
          <span className="text-slate-400 dark:text-slate-500">• Scroll untuk zoom</span>
        </div>
        {graph?.nodes?.length ? (
          <RelationGraph data={graph} centerTicker={ticker} />
        ) : (
          <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-center text-slate-500 dark:text-slate-300 text-sm" style={{ height: 560 }}>
            {graph === null ? 'Memuat grafik...' : 'Tidak ada data kepemilikan KSEI untuk emiten ini'}
          </div>
        )}
      </div>
    </div>
  )
}
