import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as d3 from 'd3'
import { api, type HeatmapEntry } from '../api/client'
import { escapeHtml } from '../utils/format'
import { useTheme } from '../hooks/useTheme'

function formatCap(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T'
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  return n.toFixed(0)
}

/** Recursive type for d3 hierarchy: node has either children (sector/root) or value (stock leaf). */
type HeatmapDatum =
  | { name: string; children: HeatmapDatum[] }
  | { name: string; value: number; code: string; emitenName: string; changePercent: number; marketCap: number }

function getChildren(d: HeatmapDatum): HeatmapDatum[] | undefined {
  return 'children' in d ? d.children : undefined
}

/** Node with treemap layout (x0, y0, x1, y1) added by d3.treemap(). */
type TreemapLeaf = d3.HierarchyNode<HeatmapDatum> & { x0: number; y0: number; x1: number; y1: number }

export function Heatmap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [data, setData] = useState<HeatmapEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sectorFilter, setSectorFilter] = useState<string>('')
  const { theme } = useTheme()
  const navigate = useNavigate()

  useEffect(() => {
    api
      .heatmap()
      .then((list) => setData(Array.isArray(list) ? list : []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Gagal memuat data'))
      .finally(() => setLoading(false))
  }, [])

  const sectors = useCallback(() => {
    const set = new Set(data.map((d) => d.sector).filter(Boolean))
    return Array.from(set).sort()
  }, [data])

  const filtered = sectorFilter ? data.filter((d) => d.sector === sectorFilter) : data
  const top100 = useMemo(
    () => [...filtered].sort((a, b) => b.marketCap - a.marketCap).slice(0, 100),
    [filtered]
  )

  useEffect(() => {
    if (!containerRef.current || !svgRef.current || top100.length === 0) return

    const isDark = theme === 'dark'
    const width = containerRef.current.clientWidth
    const height = 560

    const bySector = d3.group(top100, (d) => d.sector)
    const hierarchyData: HeatmapDatum = {
      name: 'root',
      children: Array.from(bySector.entries()).map(([sector, items]) => ({
        name: sector,
        children: items.map((item) => ({
          name: item.code,
          value: Math.max(item.marketCap, 1),
          code: item.code,
          emitenName: item.name,
          changePercent: item.changePercent,
          marketCap: item.marketCap
        }))
      }))
    }
    const root = d3.hierarchy(hierarchyData, getChildren).sum((d) => ('value' in d ? d.value : 0) ?? 0)

    const treemap = d3.treemap<HeatmapDatum>().size([width, height]).padding(2).round(true)
    treemap(root)

    const leaves = root.leaves() as TreemapLeaf[]
    // Gradasi: merah/hijau "full" sudah di ±5%
    const scaleRed = d3.scaleLinear<string>().domain([-5, 0]).range(isDark ? ['#b91c1c', '#fca5a5'] : ['#dc2626', '#fecaca']).clamp(true)
    const scaleGreen = d3.scaleLinear<string>().domain([0, 5]).range(isDark ? ['#86efac', '#15803d'] : ['#bbf7d0', '#16a34a']).clamp(true)
    const getColor = (pct: number): string => {
      const v = pct ?? 0
      return v < 0 ? scaleRed(Math.max(v, -5)) : scaleGreen(Math.min(v, 5))
    }

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', width).attr('height', height)

    const g = svg.append('g')

    const container = containerRef.current
    const tooltip = d3
      .select(container)
      .append('div')
      .attr('class', 'heatmap-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('z-index', '50')
      .style('padding', '10px 14px')
      .style('border-radius', '10px')
      .style('font-size', '13px')
      .style('font-family', 'Plus Jakarta Sans, sans-serif')
      .style('pointer-events', 'none')
      .style('box-shadow', '0 4px 16px rgba(0,0,0,0.2)')
      .style('max-width', '280px')
      .style('white-space', 'nowrap')
    tooltip
      .style('background', isDark ? 'rgb(30, 41, 59)' : 'rgb(255, 255, 255)')
      .style('border', `1px solid ${isDark ? 'rgb(71, 85, 105)' : 'rgb(226, 232, 240)'}`)

    g.selectAll('rect')
      .data(leaves)
      .join('rect')
      .attr('x', (d) => d.x0)
      .attr('y', (d) => d.y0)
      .attr('width', (d) => d.x1 - d.x0)
      .attr('height', (d) => d.y1 - d.y0)
      .attr('fill', (d) => getColor((d.data as { changePercent?: number }).changePercent ?? 0))
      .attr('stroke', isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)')
      .attr('stroke-width', 1)
      .attr('rx', 5)
      .attr('ry', 5)
      .style('cursor', 'pointer')
      .on('click', (_e, d) => {
        const code = (d.data as { code?: string }).code
        if (code) navigate(`/profile/${code}`)
      })
      .on('mouseenter', function (_e, d) {
        d3.select(this).attr('stroke-width', 2).attr('stroke', isDark ? '#94a3b8' : '#64748b')
        const node = d.data as { emitenName?: string; code?: string; changePercent?: number; marketCap?: number }
        const pct = node.changePercent ?? 0
        const pctStr = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%'
        const html = `<div style="font-weight:700;color:${isDark ? '#f1f5f9' : '#0f172a'};margin-bottom:6px">${escapeHtml(node.emitenName ?? node.code ?? '')}</div><div style="font-size:12px;color:${isDark ? '#94a3b8' : '#64748b'}">${pctStr} · Cap ${formatCap(node.marketCap ?? 0)}</div>`
        tooltip.style('visibility', 'visible').html(html)
      })
      .on('mousemove', function (e: MouseEvent) {
        const rect = container.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const offset = 12
        let left = x + offset
        let top = y + offset
        if (left + 260 > rect.width) left = x - 260 - offset
        if (top + 80 > rect.height) top = y - 80 - offset
        tooltip.style('left', `${left}px`).style('top', `${top}px`)
      })
      .on('mouseleave', function () {
        d3.select(this).attr('stroke-width', 1).attr('stroke', isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)')
        tooltip.style('visibility', 'hidden')
      })

    const minW = 64
    const minH = 48
    const minWLogo = 80
    const minHLogo = 60
    const withLabel = leaves.filter((d) => (d.x1 - d.x0) >= minW && (d.y1 - d.y0) >= minH)
    const logoSizeMin = 22
    const logoSizeMax = 44
    const logoSizeFor = (w: number, h: number) =>
      Math.min(logoSizeMax, Math.max(logoSizeMin, Math.min(w, h) * 0.5))
    const padTop = 8
    const gapLogoText = 6
    const fontSize = (d: TreemapLeaf) => Math.min(12, Math.max(10, (d.x1 - d.x0) / 5))
    withLabel.forEach((d) => {
      const code = (d.data as { code?: string }).code ?? ''
      const pct = (d.data as { changePercent?: number }).changePercent ?? 0
      const sign = pct >= 0 ? '+' : ''
      const pctStr = `${sign}${pct.toFixed(1)}%`
      const cx = (d.x0 + d.x1) / 2
      const w = d.x1 - d.x0
      const h = d.y1 - d.y0
      const showLogo = w >= minWLogo && h >= minHLogo
      const logoSize = showLogo ? logoSizeFor(w, h) : 0
      const size = fontSize(d)
      let textCy: number
      if (showLogo) {
        const logoY = d.y0 + padTop
        const logoX = cx - logoSize / 2
        g.append('image')
          .attr('href', `/api/img/${code}.svg`)
          .attr('x', logoX)
          .attr('y', logoY)
          .attr('width', logoSize)
          .attr('height', logoSize)
          .attr('preserveAspectRatio', 'xMidYMid meet')
          .attr('pointer-events', 'none')
        const textBlockTop = d.y0 + padTop + logoSize + gapLogoText
        textCy = textBlockTop + (d.y1 - textBlockTop) / 2
      } else {
        textCy = (d.y0 + d.y1) / 2
      }
      const gText = g
        .append('text')
        .attr('x', cx)
        .attr('y', textCy)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('fill', '#ffffff')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('font-weight', 600)
        .attr('pointer-events', 'none')
        .attr('font-size', size)
      gText.append('tspan').attr('x', cx).attr('dy', '-0.55em').text(code)
      gText.append('tspan').attr('x', cx).attr('dy', '1.35em').text(pctStr)
    })

    return () => {
      svg.selectAll('*').remove()
      tooltip.remove()
    }
  }, [top100, theme, navigate])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-4">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-4 text-sm font-medium">
          ← Kembali
        </Link>
        <p className="text-slate-500 dark:text-slate-400 py-16 text-center">Memuat heatmap...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-4">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-4 text-sm font-medium">
          ← Kembali
        </Link>
        <p className="text-red-500 dark:text-red-400 py-16 text-center">{error}</p>
      </div>
    )
  }

  const sectorList = sectors()

  if (data.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-4">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-4 text-sm font-medium">
          ← Kembali
        </Link>
        <p className="text-slate-500 dark:text-slate-400 py-16 text-center">
          Data heatmap belum tersedia. Pastikan koneksi ke IDX atau coba lagi nanti.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-sm font-medium">
          ← Kembali
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Stock Heatmap</h1>
        <select
          aria-label="Filter by sector"
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50"
        >
          <option value="">Semua sektor</option>
          {sectorList.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">
        100 emiten terbesar (by market cap) · Ukuran kotak ∝ market cap · Merah = turun, hijau = naik · Klik tile ke profil
      </p>

      <div ref={containerRef} className="w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-900/50 shadow-sm">
        <svg ref={svgRef} className="w-full" preserveAspectRatio="xMidYMid meet" />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span>{top100.length} emiten{filtered.length > 100 ? ` terbesar (dari ${filtered.length})` : ''}</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <span className="inline-block w-5 h-3 rounded-sm bg-red-500 shadow-sm" /> Turun
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-5 h-3 rounded-sm bg-green-500 shadow-sm" /> Naik
          </span>
        </div>
      </div>
    </div>
  )
}
