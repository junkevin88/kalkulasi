export function escapeHtml(s: string | undefined | null): string {
  if (!s) return ''
  const div = document.createElement('div')
  div.textContent = s
  return div.innerHTML
}

export function formatNum(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return String(n)
}

export function formatDate(s: string | undefined | null): string {
  if (!s) return '-'
  try {
    const d = new Date(s)
    return isNaN(d.getTime()) ? s : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return s
  }
}
