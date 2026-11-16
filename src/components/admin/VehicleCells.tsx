import type { DefaultCellComponentProps, DefaultServerCellComponentProps } from 'payload'

import type { Media } from '@/payload-types'

/** Liste des véhicules : première photo de la galerie (celle de l'annonce), pour s'y retrouver d'un coup d'œil. */
export async function VehicleThumbCell({ rowData, payload }: DefaultServerCellComponentProps) {
  const first = (rowData?.gallery as (number | Media)[] | undefined)?.[0]
  const media =
    typeof first === 'object'
      ? first
      : typeof first === 'number'
        ? await payload.findByID({ collection: 'media', id: first, depth: 0 }).catch(() => null)
        : null
  const src = media?.sizes?.thumb?.url || media?.url
  return (
    <span
      role={src ? 'img' : undefined}
      aria-label={media?.alt ?? undefined}
      title={src ? undefined : 'Aucune photo'}
      style={{
        display: 'block',
        width: 72,
        height: 48,
        borderRadius: 8,
        // Image en fond : si le fichier manque, la case grise reste propre (pas d'icône d'image cassée).
        background: `#e4e8f0 ${src ? `url("${src}") center / cover no-repeat` : ''}`,
        boxShadow: 'inset 0 0 0 1px rgba(13,36,73,.08)',
      }}
    />
  )
}

/** Montants en euros lisibles : « 189 900 € » au lieu de « 189900 ». */
export function EuroCell({ cellData, field }: DefaultCellComponentProps) {
  if (typeof cellData !== 'number') return <span style={{ color: '#7c8699' }}>—</span>
  const monthly = 'name' in field && field.name === 'monthlyFrom'
  const value = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(cellData))
  return (
    <span style={{ fontWeight: 700, whiteSpace: 'nowrap', color: '#0d2449' }}>
      {value} €{monthly && <span style={{ fontWeight: 500, color: '#4a5468' }}> /mois</span>}
    </span>
  )
}

/** Immatriculation façon plaque française, lisible dans la liste. */
export function PlateCell({ cellData }: DefaultCellComponentProps) {
  if (typeof cellData !== 'string' || !cellData) return <span style={{ color: '#7c8699' }}>—</span>
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'stretch',
        border: '1.5px solid #0d2449',
        borderRadius: 5,
        overflow: 'hidden',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '.04em',
        background: '#fff',
        color: '#0d2449',
        whiteSpace: 'nowrap',
      }}
    >
      <span aria-hidden style={{ width: 8, background: '#1f4fbf' }} />
      <span style={{ padding: '2px 8px' }}>{cellData}</span>
      <span aria-hidden style={{ width: 8, background: '#1f4fbf' }} />
    </span>
  )
}
