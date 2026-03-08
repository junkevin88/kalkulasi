import { Link } from 'react-router-dom'

export function TickerLink({ code }: { code: string }) {
  if (!code) return <>-</>
  const c = String(code).toUpperCase()
  return (
    <Link
      to={`/profile/${c}`}
      className="ticker-link text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors underline decoration-emerald-500/40 dark:decoration-emerald-400/50 hover:decoration-emerald-500 dark:hover:decoration-emerald-300"
      title="Lihat profil"
    >
      {c}
    </Link>
  )
}
