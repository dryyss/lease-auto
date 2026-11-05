import type { DefaultCellComponentProps } from 'payload'

const COLORS: Record<string, [string, string]> = {
  new: ['#de1d22', '#fff'],
  review: ['#0d2449', '#fff'],
  approved: ['#0f7a4a', '#fff'],
  refused: ['#e4e8f0', '#4a5468'],
  delivered: ['#1b3a6b', '#fff'],
  confirmed: ['#0d2449', '#fff'],
  done: ['#0f7a4a', '#fff'],
  cancelled: ['#e4e8f0', '#4a5468'],
  available: ['#0f7a4a', '#fff'],
  reserved: ['#f59e0b', '#fff'],
  sold: ['#e4e8f0', '#4a5468'],
  draft: ['#e4e8f0', '#4a5468'],
  sent: ['#0f7a4a', '#fff'],
}

export function StatusCell({ cellData, field }: DefaultCellComponentProps) {
  if (typeof cellData !== 'string') return null
  const options = 'options' in field ? field.options : []
  const option = options.find((o) => (typeof o === 'string' ? o : o.value) === cellData)
  const label = option && typeof option === 'object' && typeof option.label === 'string' ? option.label : cellData
  const [bg, color] = COLORS[cellData] ?? ['#e4e8f0', '#0d2449']
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, background: bg, color, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}
