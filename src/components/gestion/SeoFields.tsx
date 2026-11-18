'use client'

import type { MediaItem } from '@/lib/gestion/media-actions'

import { ImagePicker } from './ImagePicker'
import { field, label } from './ui'

export type Seo = { title: string; description: string; image: MediaItem | null }

/** Référencement Google d'une page : titre (≈ 60 signes), description (≈ 155 signes), image de partage. */
export function SeoFields({ value, onChange, fallbackTitle }: { value: Seo; onChange: (v: Seo) => void; fallbackTitle?: string }) {
  const count = (n: number, max: number) => <span className={`ml-2 font-semibold ${n > max ? 'text-accent' : 'text-ink-3'}`}>{n} / {max}</span>
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="seo-title" className={label}>
          Titre dans Google {count(value.title.length, 60)}
        </label>
        <input id="seo-title" className={field} value={value.title} placeholder={fallbackTitle ? `${fallbackTitle} | Lease Auto` : ''} onChange={(e) => onChange({ ...value, title: e.target.value })} />
      </div>
      <div>
        <label htmlFor="seo-description" className={label}>
          Description dans Google {count(value.description.length, 155)}
        </label>
        <textarea id="seo-description" rows={3} className={field} value={value.description} onChange={(e) => onChange({ ...value, description: e.target.value })} />
      </div>
      <ImagePicker label="Image de partage (réseaux sociaux)" value={value.image} onChange={(image) => onChange({ ...value, image })} />
      <p className="text-xs text-ink-3">Laissés vides, le titre et la description sont générés automatiquement.</p>
    </div>
  )
}
