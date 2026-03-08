import { useEffect, useState } from 'react'
import { api, type PublicFigure } from '../api/client'
import { TickerLink } from './TickerLink'
import { escapeHtml } from '../utils/format'

const PAGE_SIZE = 8

export function PublicFigures({ onSearch }: { onSearch?: (q: string, type: 'investor') => void }) {
  const [data, setData] = useState<PublicFigure[]>([])
  const [page, setPage] = useState(1)

  useEffect(() => {
    api.publicFigures(50).then(setData).catch(() => setData([]))
  }, [])

  const totalPages = Math.ceil(data.length / PAGE_SIZE)
  const start = (page - 1) * PAGE_SIZE
  const chunk = data.slice(start, start + PAGE_SIZE)

  return (
    <section className="mb-10 opacity-0 animate-fade-in-up max-w-6xl mx-auto px-4" style={{ animationDelay: '0.55s' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-heading text-sm font-semibold text-slate-600 dark:text-slate-100 uppercase tracking-wide">Public Figures</h3>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 text-xs tabular-nums">
              {page}/{totalPages}
            </span>
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
              <button
                type="button"
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                ←
              </button>
              <button
                type="button"
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border-l border-slate-200 dark:border-slate-600"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next page"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {chunk.map((pf, i) => (
          <button
            key={pf.investor}
            type="button"
            className="bg-slate-50 dark:bg-slate-800 dark:border-slate-600 rounded-2xl p-4 border border-slate-200 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-lg hover:bg-slate-100 dark:hover:bg-slate-700/80 text-left"
            onClick={() => onSearch?.(pf.investor, 'investor')}
            style={{ animation: `fadeInUp 0.4s ease-out ${i * 0.03}s forwards`, opacity: 0 }}
          >
            <div className="font-medium text-slate-900 dark:text-slate-100 truncate" title={escapeHtml(pf.investor)}>
              {escapeHtml(pf.investor)}
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-xs mt-1">{pf.positionCount} pos</div>
            <div className="text-emerald-600 dark:text-emerald-400 text-sm mt-1 mono">
              {pf.topTicker ? <TickerLink code={pf.topTicker} /> : '-'} {pf.topPercent?.toFixed(2) ?? ''}%
            </div>
          </button>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
          <span className="text-slate-500 dark:text-slate-400 text-xs">
            {start + 1}–{start + chunk.length} of {data.length}
          </span>
        </div>
      )}
    </section>
  )
}
