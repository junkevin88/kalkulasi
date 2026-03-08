import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'

export function Layout({ children }: { children: React.ReactNode }) {
  const { theme, toggle } = useTheme()
  const location = useLocation()
  const isHeatmap = location.pathname === '/heatmap'

  return (
    <div className="gradient-bg min-h-screen text-slate-700 dark:text-slate-200 transition-colors duration-300">
      <header className="flex items-center justify-between mb-8 opacity-0 animate-fade-in-up max-w-6xl mx-auto px-4 pt-8 pb-6 border-b border-transparent dark:border-slate-700/80">
        <div className="flex items-center gap-4">
          <img
            src="/kalkulasi.png"
            alt="Kalkulasi"
            className="h-14 w-auto object-contain"
          />
          <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            Analisis Ordal
          </h1>
          <p className="text-slate-500 dark:text-slate-200 text-base mt-1">
            Stock ownership data (Cari siapa pegang apa 🤝)
          </p>
          <nav className="flex items-center gap-3 mt-3">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              Dashboard
            </Link>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <Link
              to="/heatmap"
              className={`text-sm font-medium transition-colors ${isHeatmap ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              Stock Heatmap
            </Link>
          </nav>
          </div>
        </div>
        <button
          type="button"
          onClick={toggle}
          className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-100 transition-all duration-200 border border-transparent dark:border-slate-600"
          aria-label="Toggle theme"
        >
          <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
        </button>
      </header>
      {children}
    </div>
  )
}
