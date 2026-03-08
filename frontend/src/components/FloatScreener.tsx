import { useCallback, useEffect, useState } from 'react'
import { api, type FloatRow } from '../api/client'
import { TickerLink } from './TickerLink'
import { escapeHtml } from '../utils/format'

const FLOAT_PAGE_SIZE = 25
const RANGES = [
  { min: 0, max: 5, label: 'Low (<5%)', className: 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30' },
  { min: 5, max: 15, label: 'Below 15%', className: 'bg-red-400/15 text-red-300 border-red-400/30 hover:bg-red-400/25' },
  { min: 15, max: 40, label: 'Mid (15-40%)', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30' },
  { min: 40, max: 100, label: 'High (40%++)', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30' },
  { min: 0, max: 100, label: 'All', className: 'bg-slate-200 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600/50 hover:bg-slate-300 dark:hover:bg-slate-600/50' },
] as const

function sortFloat(data: FloatRow[], col: number, dir: 'asc' | 'desc'): FloatRow[] {
  const arr = [...data]
  const mult = dir === 'asc' ? 1 : -1
  arr.sort((a, b) => {
    let va: string | number, vb: string | number
    if (col === 0) { va = (a.code ?? '').toLowerCase(); vb = (b.code ?? '').toLowerCase() }
    else if (col === 1) { va = (a.emiten ?? '').toLowerCase(); vb = (b.emiten ?? '').toLowerCase() }
    else if (col === 2) { va = (a.topHolder ?? '').toLowerCase(); vb = (b.topHolder ?? '').toLowerCase() }
    else if (col === 3) { va = a.totalHeldPercent ?? 0; vb = b.totalHeldPercent ?? 0 }
    else { va = a.freeFloatPercent ?? (100 - (a.totalHeldPercent ?? 0)); vb = b.freeFloatPercent ?? (100 - (b.totalHeldPercent ?? 0)) }
    if (typeof va === 'number' && typeof vb === 'number') return mult * (va - vb)
    return mult * String(va).localeCompare(String(vb))
  })
  return arr
}

export function FloatScreener() {
  const [data, setData] = useState<FloatRow[]>([])
  const [loading, setLoading] = useState(false)
  const [activeRange, setActiveRange] = useState<(typeof RANGES)[number]>(RANGES[0])
  const [sort, setSort] = useState({ col: 4, dir: 'asc' as 'asc' | 'desc' })
  const [page, setPage] = useState(1)

  const load = useCallback(async (min: number, max: number) => {
    setLoading(true)
    try {
      const res = await api.float(min, max)
      setData(res)
      setPage(1)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(RANGES[0].min, RANGES[0].max)
  }, [load])

  const handleRange = (r: (typeof RANGES)[number]) => {
    setActiveRange(r)
    load(r.min, r.max)
  }

  const sorted = sortFloat(data, sort.col, sort.dir)
  const totalPages = Math.ceil(sorted.length / FLOAT_PAGE_SIZE)
  const start = (page - 1) * FLOAT_PAGE_SIZE
  const chunk = sorted.slice(start, start + FLOAT_PAGE_SIZE)
  const headers = ['Ticker', 'Emiten', 'Top Holder', 'Total Held', 'Est. Free Float']

  return (
    <>
      <h2 className="section-heading text-xl font-semibold text-slate-900 dark:text-white mb-4">Float Screener</h2>
      <div className="flex gap-3 mb-5 flex-wrap">
        {RANGES.map((r) => (
          <button
            key={r.label}
            type="button"
            onClick={() => handleRange(r)}
            className={`float-btn btn-transition px-4 py-2.5 rounded-xl border ${r.className} ${activeRange === r ? ' ring-2 ring-emerald-500' : ''}`}
          >
            {r.label}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg dark:ring-1 dark:ring-slate-600/50">
        {loading ? (
          <p className="p-6 text-slate-500 dark:text-slate-300 text-center">Loading...</p>
        ) : !data.length ? (
          <p className="p-6 text-slate-500 dark:text-slate-400 text-center">No data in this range</p>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-600">
                  {headers.map((h, i) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-slate-500 dark:text-slate-300 font-medium cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 select-none"
                      onClick={() => setSort({ col: i, dir: sort.col === i && sort.dir === 'desc' ? 'asc' : 'desc' })}
                    >
                      {h} {sort.col === i ? (sort.dir === 'asc' ? '↑' : '↓') : '↕'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chunk.map((row, i) => {
                  const ff = row.freeFloatPercent ?? (100 - (row.totalHeldPercent ?? 0))
                  const warn = ff < 5 ? ' text-amber-400' : ''
                  return (
                    <tr
                      key={row.code ?? i}
                      className={`border-b border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors duration-150 ${i % 2 ? 'bg-slate-50 dark:bg-slate-800/60' : ''}`}
                    >
                      <td className="px-4 py-3 mono font-medium">
                        <TickerLink code={row.code ?? ''} />
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{escapeHtml(row.emiten ?? '')}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-300">{escapeHtml(row.topHolder ?? '-')}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{(row.totalHeldPercent ?? 0).toFixed(1)}%</td>
                      <td className={`px-4 py-3 font-medium text-slate-900 dark:text-slate-100${warn}`}>{ff.toFixed(1)}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/80 rounded-b-2xl">
              <span className="text-slate-500 dark:text-slate-400 text-xs">
                {start + 1}-{start + chunk.length} of {sorted.length}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="px-2 py-1 rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs disabled:opacity-40"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ←
                </button>
                <span className="px-2 py-1 text-slate-500 dark:text-slate-400 text-xs">
                  {page}/{totalPages}
                </span>
                <button
                  type="button"
                  className="px-2 py-1 rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs disabled:opacity-40"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
