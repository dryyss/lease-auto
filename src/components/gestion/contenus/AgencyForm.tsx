'use client'

import { ArrowLeft, ArrowRight, Camera, FileText, MapPinned, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { saveAgency } from '@/app/(gestion)/gestion/contenus/actions'
import { ImagePicker } from '@/components/gestion/ImagePicker'
import { MarkdownEditor } from '@/components/gestion/MarkdownEditor'
import { Card, field, PageHeader } from '@/components/gestion/ui'
import { ago } from '@/lib/gestion/labels'
import type { MediaItem } from '@/lib/gestion/media-actions'

import { aria, ErrorBanner, F, move, SaveBar, Toast, useEditor } from './kit'
import { extractMapUrl, MAP_EMBED_PREFIX } from './types'

export type AgencyState = { title: string; intro: string; content: string; photos: MediaItem[]; mapEmbedUrl: string }

export function AgencyForm({ initial, updatedAt }: { initial: AgencyState; updatedAt?: string | null }) {
  const ed = useEditor()
  const { errors, touch } = ed
  const [s, setS] = useState(initial)
  // Texte de présentation enregistré : renvoyé seulement s'il a été modifié (sa mise en forme est alors conservée).
  const [savedContent, setSavedContent] = useState(initial.content)

  function set<K extends keyof AgencyState>(key: K, value: AgencyState[K]) {
    setS((x) => ({ ...x, [key]: value }))
    touch(key)
  }

  const map = extractMapUrl(s.mapEmbedUrl)
  const mapOk = map.startsWith(MAP_EMBED_PREFIX)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (map && !mapOk) return ed.showErrors({ mapEmbedUrl: 'Ce n’est pas un lien « Intégrer une carte » de Google Maps.' }, 'Le lien de la carte est à corriger.')
    const r = await ed.run(
      'save',
      () => saveAgency({ title: s.title, intro: s.intro, content: s.content === savedContent ? null : s.content, photos: s.photos.map((p) => p.id), mapEmbedUrl: map }),
      'Page « L’agence » enregistrée',
    )
    if (r.ok) {
      setSavedContent(s.content)
      if (map !== s.mapEmbedUrl) setS((x) => ({ ...x, mapEmbedUrl: map }))
    }
  }

  const photoBtn =
    'flex size-8 items-center justify-center rounded-full bg-white/95 text-ink-2 shadow transition hover:text-primary disabled:opacity-35 focus-visible:ring-3 focus-visible:ring-accent/40 focus-visible:outline-none'

  return (
    <form onSubmit={onSubmit} noValidate>
      <PageHeader back={{ href: '/gestion/contenus', label: 'Contenus' }} title="Page « L’agence »" subtitle={`Présentation de l’agence, photos et plan d’accès${updatedAt ? ` · modifiée ${ago(updatedAt)}` : ''}.`} />
      <SaveBar editor={ed} viewHref="/agence" />
      <ErrorBanner message={ed.error} onClose={() => ed.setError('')} />

      <div className="mx-auto max-w-4xl space-y-6">
        <Card title="Présentation" icon={FileText}>
          <div className="grid gap-4">
            <F id="title" text="Titre" error={errors.title}>
              <input {...aria(errors, 'title')} className={field} value={s.title} maxLength={200} onChange={(e) => set('title', e.target.value)} />
            </F>
            <F id="intro" text="Accroche" error={errors.intro} hint="Une ou deux phrases sous le titre.">
              <textarea {...aria(errors, 'intro')} rows={3} className={field} value={s.intro} maxLength={600} onChange={(e) => set('intro', e.target.value)} />
            </F>
            <F id="content" text="Présentation" error={errors.content} hint="L’histoire de l’agence, l’équipe, la façon de travailler.">
              <MarkdownEditor id="f-content" value={s.content} onChange={(v) => set('content', v)} rows={14} />
            </F>
          </div>
        </Card>

        <Card title={`Photos de l’agence (${s.photos.length})`} icon={Camera}>
          <p className="mb-4 text-sm text-ink-2">La première photo s’affiche en grand. Utilisez les flèches pour changer l’ordre.</p>
          {s.photos.length > 0 && (
            <ul className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {s.photos.map((p, i) => (
                <li key={p.id} className="relative overflow-hidden rounded-xl border border-line bg-soft">
                  {/* eslint-disable-next-line @next/next/no-img-element -- vignette de la médiathèque */}
                  <img src={p.thumb} alt={p.alt} className="aspect-3/2 w-full object-cover" />
                  {i === 0 && <span className="absolute top-2 left-2 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-white">Principale</span>}
                  <div className="absolute right-2 bottom-2 flex gap-1">
                    <button type="button" className={photoBtn} disabled={i === 0} onClick={() => set('photos', move(s.photos, i, i - 1))} aria-label={`Avancer la photo ${i + 1}`} title="Avancer">
                      <ArrowLeft className="size-4" aria-hidden />
                    </button>
                    <button type="button" className={photoBtn} disabled={i === s.photos.length - 1} onClick={() => set('photos', move(s.photos, i, i + 1))} aria-label={`Reculer la photo ${i + 1}`} title="Reculer">
                      <ArrowRight className="size-4" aria-hidden />
                    </button>
                    <button type="button" className={`${photoBtn} hover:text-accent!`} onClick={() => set('photos', s.photos.filter((x) => x.id !== p.id))} aria-label={`Retirer la photo ${i + 1}`} title="Retirer">
                      <X className="size-4" aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <ImagePicker
            label="Ajouter une photo"
            value={null}
            defaultAlt="Agence Lease Auto à Épinay-sur-Seine"
            onChange={(m) => m && !s.photos.some((p) => p.id === m.id) && set('photos', [...s.photos, m])}
          />
        </Card>

        <Card title="Plan d’accès" icon={MapPinned}>
          <F
            id="mapEmbedUrl"
            text="Lien d’intégration Google Maps"
            error={errors.mapEmbedUrl}
            hint={
              <>
                Dans Google Maps : cherchez l’agence, puis <strong>Partager → Intégrer une carte → Copier le code HTML</strong>. Collez le code entier ici : seule l’adresse utile est gardée.
              </>
            }
          >
            <textarea
              {...aria(errors, 'mapEmbedUrl')}
              rows={3}
              className={`${field} font-mono text-xs`}
              value={s.mapEmbedUrl}
              placeholder={`${MAP_EMBED_PREFIX}?pb=…`}
              onChange={(e) => set('mapEmbedUrl', e.target.value)}
            />
          </F>
          {map && !mapOk && <p className="mt-2 text-sm font-semibold text-amber-700">Ce lien ne commence pas par {MAP_EMBED_PREFIX} : la carte ne s’afficherait pas sur le site.</p>}
          {mapOk && (
            <iframe src={map} title="Aperçu du plan d’accès" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="mt-4 aspect-video w-full rounded-2xl border border-line" />
          )}
        </Card>
      </div>
      <Toast message={ed.toast} />
    </form>
  )
}
