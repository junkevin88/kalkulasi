import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { TickerLink } from './TickerLink'
import { FloatScreener } from './FloatScreener'
import { escapeHtml } from '../utils/format'

const PAGE_SIZE = 15

export function MarketOverview({ onSearch }: { onSearch?: (q: string, type: 'ticker' | 'investor') => void }) {
  const [floatPreview, setFloatPreview] = useState<{ code?: string; emiten?: string; topHolder?: string; totalHeldPercent?: number; freeFloatPercent?: number }[]>([])
  const [conglomerates, setConglomerates] = useState<{ name: string; tickerCount: number }[]>([])
  const [topForeign, setTopForeign] = useState<{ investor: string; stockCount: number }[]>([])
  const [floatOpen, setFloatOpen] = useState(false)

  useEffect(() => {
    api.float(0, 15).then(setFloatPreview).catch(() => setFloatPreview([]))
    api.conglomerates().then(setConglomerates).catch(() => setConglomerates([]))
    api.topForeignInvestors(50).then(setTopForeign).catch(() => setTopForeign([]))
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-4">
      <h2 className="section-heading text-lg font-semibold text-slate-900 dark:text-white mb-5 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
        Market Overview
      </h2>

      <div className="grid lg:grid-cols-3 gap-6 mb-10">
        <section
          className="card-hover bg-white dark:bg-slate-800 dark:border-slate-600 rounded-2xl border border-slate-200 p-6 opacity-0 animate-fade-in-up shadow-sm dark:shadow-none dark:ring-1 dark:ring-slate-600/50"
          style={{ animationDelay: '0.4s' }}
        >
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-100 uppercase mb-4 tracking-wide">Float Screener</h3>
          <p className="text-slate-500 dark:text-slate-300 text-sm mb-4">Screen stocks by estimated free float.</p>
          <div className="space-y-2.5 text-sm">
            {floatPreview.slice(0, 8).map((row, i) => {
              const ff = row.freeFloatPercent ?? (100 - (row.totalHeldPercent ?? 0))
              const warn = ff < 5 ? ' text-amber-400' : ''
              return (
                <div
                  key={row.code ?? i}
                  className="flex justify-between py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700/80 rounded-lg px-2 -mx-2 transition-colors duration-150"
                >
                  <span className="mono font-medium text-slate-900 dark:text-slate-100">
                    <TickerLink code={row.code ?? ''} />
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 truncate max-w-[140px]" title={row.topHolder}>
                    {escapeHtml((row.topHolder ?? '').slice(0, 25))}...
                  </span>
                  <span className={`text-slate-700 dark:text-slate-200 ${warn}`}>{ff.toFixed(1)}%</span>
                </div>
              )
            })}
          </div>
          <button
            type="button"
            onClick={() => {
              setFloatOpen(true)
              setTimeout(() => document.getElementById('floatSection')?.scrollIntoView(), 100)
            }}
            className="inline-block mt-4 text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 text-sm font-medium transition-colors duration-200"
          >
            Open Screener →
          </button>
        </section>

        <section
          className="card-hover bg-white dark:bg-slate-800 dark:border-slate-600 rounded-2xl border border-slate-200 p-6 opacity-0 animate-fade-in-up shadow-sm dark:shadow-none dark:ring-1 dark:ring-slate-600/50"
          style={{ animationDelay: '0.45s' }}
        >
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-100 uppercase mb-4 tracking-wide">Conglomerates</h3>
          <div className="space-y-2.5 text-sm">
            {conglomerates.slice(0, PAGE_SIZE).map((c) => (
              <div
                key={c.name}
                className="flex justify-between py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700/80 rounded-lg px-2 -mx-2 transition-colors duration-150 text-slate-900 dark:text-slate-100"
              >
                <span>{escapeHtml(c.name)}</span>
                <span className="text-slate-500 dark:text-slate-400">{c.tickerCount} tickers</span>
              </div>
            ))}
          </div>
        </section>

        <section
          className="card-hover bg-white dark:bg-slate-800 dark:border-slate-600 rounded-2xl border border-slate-200 p-6 opacity-0 animate-fade-in-up shadow-sm dark:shadow-none dark:ring-1 dark:ring-slate-600/50"
          style={{ animationDelay: '0.55s' }}
        >
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-100 uppercase mb-4 tracking-wide">Top Foreign Investors</h3>
          <div className="space-y-2 text-sm">
            {topForeign.slice(0, PAGE_SIZE).map((item) => (
              <button
                key={item.investor}
                type="button"
                className="w-full flex items-center justify-between py-2 hover:bg-slate-100 dark:hover:bg-slate-700/80 rounded-xl px-3 -mx-1 cursor-pointer transition-all duration-200 text-left text-slate-900 dark:text-slate-100"
                onClick={() => onSearch?.(item.investor, 'investor')}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-blue-500/30 text-blue-400 text-xs font-medium flex items-center justify-center">
                    F
                  </span>
                  <span className="truncate" title={escapeHtml(item.investor)}>{escapeHtml(item.investor)}</span>
                </div>
                <span className="text-blue-400 text-sm flex-shrink-0 ml-2">{item.stockCount} stocks</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      {floatOpen && (
        <div id="floatSection" className="mb-10 animate-fade-in">
          <FloatScreener />
        </div>
      )}
    </div>
  )
}
