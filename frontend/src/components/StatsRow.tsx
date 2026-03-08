import { useEffect, useState } from 'react'
import { api, type StatsResponse } from '../api/client'

export function StatsRow() {
  const [data, setData] = useState<StatsResponse | null>(null)

  useEffect(() => {
    api.stats().then(setData).catch(console.error)
  }, [])

  const stat = (value: string | number | undefined) =>
    value != null ? (typeof value === 'number' ? value.toLocaleString() : value) : '-'

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-10 max-w-6xl mx-auto px-4">
      {[
        { id: 'statTickers', value: stat(data?.tickerCount), label: 'TICKERS', stagger: 'stagger-2' },
        { id: 'statInvestors', value: stat(data?.investorCount), label: 'INVESTORS', stagger: 'stagger-3' },
        { id: 'statPositions', value: stat(data?.positionCount), label: 'POSITIONS', stagger: 'stagger-4' },
        { id: 'statLocal', value: data?.localPercent != null ? `${data.localPercent.toFixed(1)}%` : '-', label: 'LOCAL', stagger: 'stagger-5', accent: 'text-emerald-400' },
        { id: 'statForeign', value: data?.foreignPercent != null ? `${data.foreignPercent.toFixed(1)}%` : '-', label: 'FOREIGN', stagger: 'stagger-5', accent: 'text-amber-400' },
        { id: 'statLastUpdated', value: '6 Maret 2026', label: 'LAST DATA UPDATED', stagger: 'stagger-6' },
      ].map(({ id, value, label, stagger, accent }) => (
        <div
          key={id}
          className={`stat-card bg-white/80 dark:bg-slate-800 rounded-2xl px-4 py-4 border border-slate-200 dark:border-slate-600 opacity-0 animate-fade-in-up ${stagger}`}
        >
          <div className={`text-xl font-bold text-slate-900 dark:text-white transition-all duration-300 ${accent ?? ''}`}>
            {value}
          </div>
          <div className="text-slate-500 dark:text-slate-300 text-xs mt-0.5 font-medium tracking-wide uppercase">{label}</div>
        </div>
      ))}
    </div>
  )
}
