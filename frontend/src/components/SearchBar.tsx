import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import { useNavigate } from 'react-router-dom'

type Suggestion = { type: 'ticker'; code: string; emiten: string } | { type: 'investor'; name: string }

export function SearchBar({ onSearch }: { onSearch?: (q: string, type: 'ticker' | 'investor') => void }) {
  const [q, setQ] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const navigate = useNavigate()

  const runSearch = useCallback(
    (query: string, type: 'ticker' | 'investor') => {
      setQ(query)
      setOpen(false)
      if (onSearch) onSearch(query, type)
      else navigate('/')
    },
    [onSearch, navigate]
  )

  const goToTickerProfile = useCallback(
    (code: string) => {
      setOpen(false)
      setQ('')
      navigate(`/profile/${code.toUpperCase()}`)
    },
    [navigate]
  )

  useEffect(() => {
    const trimmed = q.trim()
    if (trimmed.length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const [tickers, investors] = await Promise.all([
          api.searchTicker(trimmed, 5),
          api.searchInvestor(trimmed, 5),
        ])
        const list: Suggestion[] = [
          ...tickers.map((t) => ({ type: 'ticker' as const, code: t.code, emiten: t.emiten })),
          ...investors.map((name) => ({ type: 'investor' as const, name })),
        ]
        setSuggestions(list)
        setOpen(list.length > 0)
      } catch {
        setSuggestions([])
        setOpen(false)
      }
    }, 200)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [q])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (q.trim()) {
        const codeMatch = q.trim().match(/^[A-Z]{2,5}$/i)
        runSearch(q.trim(), codeMatch ? 'ticker' : 'investor')
      }
      setOpen(false)
    }
  }

  return (
    <div className="mb-8 relative z-10 opacity-0 animate-fade-in-up stagger-1 max-w-6xl mx-auto px-4">
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search investors, tickers, companies..."
        className="w-full px-5 py-3.5 rounded-2xl bg-white dark:bg-slate-800 dark:border-slate-600 border border-slate-300 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 dark:focus:ring-emerald-500/30 transition-colors duration-200"
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-600 border border-slate-200 shadow-2xl dark:shadow-none dark:ring-1 dark:ring-slate-600 z-50 max-h-80 overflow-y-auto animate-slide-down">
          {suggestions.some((s) => s.type === 'ticker') && (
            <div className="px-4 py-2 text-slate-500 dark:text-slate-300 text-xs font-semibold uppercase tracking-wide">Ticker</div>
          )}
          {suggestions.map((s, i) =>
            s.type === 'ticker' ? (
              <button
                key={'t-' + s.code + i}
                type="button"
                className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 block text-sm"
                onClick={() => goToTickerProfile(s.code)}
              >
                {s.code} — {s.emiten}
              </button>
            ) : (
              <button
                key={'i-' + s.name + i}
                type="button"
                className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 block text-sm border-t border-slate-200 dark:border-slate-600"
                onClick={() => runSearch(s.name, 'investor')}
              >
                {s.name}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}
