import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import type { GraphData } from '../api/client'
import { escapeHtml } from '../utils/format'
import { useTheme } from '../hooks/useTheme'

type GraphNode = GraphData['nodes'][number]
type Node = GraphNode & {
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

interface Link {
  source: Node | string
  target: Node | string
  percent?: number
}

export function RelationGraph({ data, centerTicker }: { data: GraphData; centerTicker: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    const container = containerRef.current
    if (!container || !data.nodes?.length) return

    const isDark = theme === 'dark'
    const width = container.clientWidth
    const height = container.clientHeight

    const percentValues = data.nodes
      .filter((n) => n.percent != null && n.percent > 0)
      .map((n) => n.percent as number)
    const minPct = percentValues.length ? Math.min(...percentValues, 1) : 1
    const maxPct = percentValues.length ? Math.max(...percentValues, 50) : 50
    const radiusScale = d3.scaleSqrt().domain([minPct, maxPct]).range([12, 28])
    const rectScale = d3.scaleSqrt().domain([minPct, maxPct]).range([40, 68])

    const nodeById = new Map<string, Node>(
      data.nodes.map((n) => [n.id, { ...n } as Node])
    )
    const nodes: Node[] = data.nodes.map((n) => nodeById.get(n.id)!)
    const links: Link[] = data.links.map((l) => ({
      source: nodeById.get(l.source) ?? l.source,
      target: nodeById.get(l.target) ?? l.target,
      percent: l.percent,
    }))

    const maxRadius = Math.max(
      28,
      ...nodes.map((n) => {
        if (n.id === centerTicker) return 24
        return n.type === 'investor' ? radiusScale(n.percent ?? 5) : rectScale(n.percent ?? 5) / 2
      })
    )

    const simulation = d3
      .forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d) => (d as Node).id).distance(95))
      .force('charge', d3.forceManyBody().strength(-180))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(() => maxRadius + 4))

    const svg = d3.select(container).append('svg').attr('width', width).attr('height', height)
    const g = svg.append('g')
    svg.call(d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.5, 3]).on('zoom', (e) => g.attr('transform', e.transform)))

    const linkColor = isDark ? 'rgba(148, 163, 184, 0.5)' : 'rgba(100, 116, 139, 0.5)'
    const linkStrokeScale = d3.scaleSqrt().domain([minPct, maxPct]).range([1, 3.5])
    const link = g
      .append('g')
      .selectAll<SVGLineElement, Link>('line')
      .data(links)
      .join('line')
      .attr('stroke', linkColor)
      .attr('stroke-width', (d) => (d.percent != null ? linkStrokeScale(d.percent) : 1.5))

    const node = g
      .append('g')
      .selectAll<SVGGElement, Node>('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'default')
    node.call(
      d3
        .drag<SVGGElement, Node>()
        .on('start', (_e, d) => {
          if (!(_e as d3.D3DragEvent<SVGGElement, Node, Node>).active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x ?? 0
          d.fy = d.y ?? 0
        })
        .on('drag', (e, d) => {
          d.fx = e.x
          d.fy = e.y
        })
        .on('end', (e, d) => {
          if (!e.active) simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        })
    )

    node.each(function (d) {
      const el = d3.select(this)
      const isInvestor = d.type === 'investor'
      const isCenter = d.id === centerTicker
      const pct = d.percent ?? 1
      if (isInvestor) {
        const r = radiusScale(pct)
        el.append('circle')
          .attr('r', r)
          .attr('fill', isDark ? '#fb923c' : '#ea580c')
          .attr('stroke', isDark ? '#fdba74' : '#f97316')
          .attr('stroke-width', 1.5)
      } else {
        const w = isCenter ? 64 : Math.max(44, Math.min(72, rectScale(pct)))
        const h = isCenter ? 34 : Math.max(26, Math.min(40, w * 0.55))
        const rect = el
          .append('rect')
          .attr('width', w)
          .attr('height', h)
          .attr('x', -w / 2)
          .attr('y', -h / 2)
          .attr('rx', 6)
          .attr('ry', 6)
          .attr('fill', isDark ? '#7dd3fc' : '#38bdf8')
          .attr('stroke', isDark ? '#0ea5e9' : '#0284c7')
          .attr('stroke-width', 1)
        if (isCenter) rect.attr('fill', isDark ? '#34d399' : '#059669').attr('stroke', isDark ? '#6ee7b7' : '#10b981')
      }
      const label = d.type === 'investor' ? (d.label.length > 32 ? d.label.slice(0, 29) + '...' : d.label) : d.label
      el.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', isInvestor ? (radiusScale(pct) || 18) + 8 : 0)
        .attr('fill', isDark ? '#e2e8f0' : '#1e293b')
        .attr('font-size', isInvestor ? 11 : 13)
        .attr('font-weight', isCenter ? 600 : 400)
        .attr('font-family', 'JetBrains Mono, monospace')
        .text(label)
    })

    const tooltip = d3
      .select(container)
      .append('div')
      .attr('class', 'graph-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('z-index', '50')
      .style('padding', '12px 16px')
      .style('border-radius', '10px')
      .style('font-size', '13px')
      .style('font-family', 'Plus Jakarta Sans, sans-serif')
      .style('pointer-events', 'none')
      .style('box-shadow', '0 4px 16px rgba(0,0,0,0.2)')
      .style('max-width', '320px')
    const tooltipBg = isDark ? 'rgb(30, 41, 59)' : 'rgb(255, 255, 255)'
    const tooltipBorder = isDark ? 'rgb(71, 85, 105)' : 'rgb(226, 232, 240)'
    tooltip.style('background', tooltipBg).style('border', `1px solid ${tooltipBorder}`)

    const getConnectedWithPercent = (nodeId: string) =>
      links
        .filter((l) => {
          const src = typeof l.source === 'object' ? l.source.id : l.source
          const tgt = typeof l.target === 'object' ? l.target.id : l.target
          return src === nodeId || tgt === nodeId
        })
        .map((l) => {
          const other = (typeof l.source === 'object' ? l.source.id : l.source) === nodeId ? l.target : l.source
          return { node: other, percent: l.percent }
        })
        .filter((x) => x.percent != null)
        .sort((a, b) => (b.percent ?? 0) - (a.percent ?? 0))

    const fmtPct = (p: number) => p.toFixed(2).replace('.', ',')

    node.on('mouseenter', function (_e, d) {
      const textColor = isDark ? '#f1f5f9' : '#0f172a'
      const subColor = isDark ? '#94a3b8' : '#64748b'
      const pctColor = isDark ? '#34d399' : '#059669'
      const connected = getConnectedWithPercent(d.id)
      let html = `<div style="font-weight:700;color:${textColor};font-size:14px;margin-bottom:6px">${escapeHtml(d.label)}</div>`
      if (connected.length > 0) {
        const subtitle = d.id === centerTicker ? 'INVESTOR' : d.type === 'investor' ? 'EMITEN' : 'INVESTOR'
        html += `<div style="font-size:10px;color:${subColor};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">${subtitle}</div>`
        html += connected
          .map((c) => {
            const label = typeof c.node === 'object' ? (c.node as Node).label : String(c.node).replace(/^inv:/, '')
            return `<div style="display:flex;justify-content:space-between;gap:16px;margin-top:4px;font-size:12px"><span style="color:${textColor}">${escapeHtml(label)}</span><span style="color:${pctColor};font-weight:600">${fmtPct(c.percent!)}%</span></div>`
          })
          .join('')
      } else if (d.percent != null) {
        html += `<div style="color:${pctColor};margin-top:4px;font-size:12px">${fmtPct(d.percent)}% kepemilikan</div>`
      }
      tooltip.style('visibility', 'visible').html(html)
    })
    node.on('mousemove', function (e) {
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const offset = 14
      let left = x + offset
      let top = y + offset
      if (left + 280 > rect.width) left = x - 280 - offset
      if (top + 120 > rect.height) top = y - 120 - offset
      tooltip.style('left', `${left}px`).style('top', `${top}px`)
    })
    node.on('mouseleave', () => tooltip.style('visibility', 'hidden'))

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (typeof d.source === 'object' ? d.source.x ?? 0 : 0))
        .attr('y1', (d) => (typeof d.source === 'object' ? d.source.y ?? 0 : 0))
        .attr('x2', (d) => (typeof d.target === 'object' ? d.target.x ?? 0 : 0))
        .attr('y2', (d) => (typeof d.target === 'object' ? d.target.y ?? 0 : 0))
      node.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
    })

    node.on('click', (_e, d) => {
      if (d.type === 'ticker' && d.id !== centerTicker) {
        window.location.href = `#/profile/${d.id}`
      }
    })
    node.filter((d) => d.type === 'ticker' && d.id !== centerTicker).attr('cursor', 'pointer')

    return () => {
      simulation.stop()
      svg.remove()
      tooltip.remove()
    }
  }, [data, centerTicker, theme])

  return (
    <div
      ref={containerRef}
      className="w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/80 overflow-hidden relative"
      style={{ height: 560 }}
    />
  )
}
