import { useCallback, useEffect, useState } from 'react'
import { api, type OwnershipRow } from '../api/client'
import { TickerLink } from './TickerLink'
import { escapeHtml } from '../utils/format'
import { formatNum } from '../utils/format'

const RESULT_PAGE_SIZE = 20

type ResultType = 'ticker' | 'investor'

function sortResult(data: OwnershipRow[], type: ResultType, col: number, dir: 'asc' | 'desc'): OwnershipRow[] {
  const arr = [...data]
  const mult = dir === 'asc' ? 1 : -1
  arr.sort((a, b) => {
    let va: string | number, vb: string | number
    if (type === 'ticker') {
      if (col === 0) { va = (a.investor ?? '').toLowerCase(); vb = (b.investor ?? '').toLowerCase() }
      else if (col === 1) { va = (a.localForeign ?? ''); vb = (b.localForeign ?? '') }
      else if (col === 2) { va = a.shares ?? 0; vb = b.shares ?? 0 }
      else { va = a.percent ?? 0; vb = b.percent ?? 0 }
    } else {
      if (col === 0) { va = (a.code ?? '').toLowerCase(); vb = (b.code ?? '').toLowerCase() }
      else if (col === 1) { va = (a.emiten ?? '').toLowerCase(); vb = (b.emiten ?? '').toLowerCase() }
      else if (col === 2) { va = (a.localForeign ?? ''); vb = (b.localForeign ?? '') }
      else { va = a.percent ?? 0; vb = b.percent ?? 0 }
    }
    if (typeof va === 'number' && typeof vb === 'number') return mult * (va - vb)
    return mult * String(va).localeCompare(String(vb))
  })
  return arr
}

export function ResultSection({
  query,
  type,
  onClear,
}: {
  query: string
  type: ResultType
  onClear: () => void
}) {
  const [data, setData] = useState<OwnershipRow[]>([])
  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState({ col: 3, dir: 'desc' as 'asc' | 'desc' })
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    if (!query) return
    setLoading(true)
    try {
      const res = type === 'ticker' ? await api.ownershipByTicker(query) : await api.ownershipByInvestor(query)
      setData(Array.isArray(res) ? res : [])
      setPage(1)
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }, [query, type])

  useEffect(() => {
    load()
  }, [load])

  if (!query) return null

  const sorted = sortResult(data, type, sort.col, sort.dir)
  const totalPages = Math.ceil(sorted.length / RESULT_PAGE_SIZE)
  const start = (page - 1) * RESULT_PAGE_SIZE
  const chunk = sorted.slice(start, start + RESULT_PAGE_SIZE)
  const headers = type === 'ticker' ? ['Investor', 'L/F', 'Lembar', '%'] : ['Ticker', 'Emiten', 'L/F', '%']

  return (
    <div className="mb-10 animate-fade-in max-w-6xl mx-auto px-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-heading text-xl font-semibold text-slate-900 dark:text-white">
          {type === 'ticker' ? (
            <>Pemegang saham: <TickerLink code={query} /></>
          ) : (
            <>Portfolio: {escapeHtml(query)}</>
          )}
        </h2>
        <button
          type="button"
          onClick={onClear}
          className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-sm font-medium transition-colors duration-200"
        >
          Clear
        </button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg dark:ring-1 dark:ring-slate-600/50">
        {loading ? (
          <p className="p-6 text-slate-500 dark:text-slate-300 text-center">Loading...</p>
        ) : !data.length ? (
          <p className="p-6 text-slate-500 dark:text-slate-400 text-center">Tidak ada data</p>
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
                {chunk.map((row, i) => (
                  <tr
                    key={type === 'ticker' ? row.investor : row.code + (row.investor ?? '')}
                    className={`border-b border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors duration-150 ${i % 2 ? 'bg-slate-50 dark:bg-slate-800/60' : ''}`}
                  >
                    {type === 'ticker' ? (
                      <>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{escapeHtml(row.investor)}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{row.localForeign}</td>
                        <td className="px-4 py-3 mono text-slate-500 dark:text-slate-300">{formatNum(row.shares ?? 0)}</td>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{(row.percent ?? 0).toFixed(2)}%</td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 mono font-medium">
                          <TickerLink code={row.code ?? ''} />
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{escapeHtml(row.emiten)}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{row.localForeign}</td>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{(row.percent ?? 0).toFixed(2)}%</td>
                      </>
                    )}
                  </tr>
                ))}
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
    </div>
  )
}
