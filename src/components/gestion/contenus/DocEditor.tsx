'use client'

import { FileText, Search, Settings2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { deleteDoc, saveDoc } from '@/app/(gestion)/gestion/contenus/actions'
import { ImagePicker } from '@/components/gestion/ImagePicker'
import { MarkdownEditor } from '@/components/gestion/MarkdownEditor'
import { SeoFields, type Seo } from '@/components/gestion/SeoFields'
import { Card, field, PageHeader } from '@/components/gestion/ui'
import { slugify } from '@/fields/slug'
import { ago } from '@/lib/gestion/labels'
import type { MediaItem } from '@/lib/gestion/media-actions'

import { aria, ConfirmDelete, ErrorBanner, F, SaveBar, Toast, useEditor } from './kit'
import { CONSOLE_BASE, PUBLIC_BASE, type DocKind, type FieldErrors } from './types'

export type DocState = {
  id?: number
  slug: string
  content: string
  seo: Seo
  title: string
  publishedAt: string
  cover: MediaItem | null
  excerpt: string
  city: string
  headline: string
  distanceNote: string
}

const WORDS: Record<DocKind, { list: string; one: string; new: string; deleted: string }> = {
  articles: { list: 'Guides et articles', one: 'ce guide', new: 'Nouveau guide', deleted: 'Le guide' },
  'local-pages': { list: 'Pages locales', one: 'cette page', new: 'Nouvelle page locale', deleted: 'La page' },
}

/** Écran d'édition d'un guide (articles) ou d'une page locale. Brouillon ou en ligne, comme les annonces. */
export function DocEditor({
  kind,
  initial,
  published,
  publicSlug,
  justSaved = false,
  updatedAt,
}: {
  kind: DocKind
  initial: DocState
  published: boolean
  publicSlug?: string | null
  justSaved?: boolean
  updatedAt?: string
}) {
  const ed = useEditor(justSaved)
  const { errors, touch } = ed
  const [s, setS] = useState(initial)
  const [savedContent, setSavedContent] = useState(initial.content)
  const [online, setOnline] = useState(published)
  const [slugOnline, setSlugOnline] = useState(publicSlug ?? null)
  const [confirm, setConfirm] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const isArticle = kind === 'articles'
  const w = WORDS[kind]
  const id = s.id
  const name = isArticle ? s.title : s.city

  function set<K extends keyof DocState>(key: K, value: DocState[K]) {
    setS((x) => ({ ...x, [key]: value }))
    touch(key)
  }

  function validate(publish: boolean): FieldErrors {
    const f: FieldErrors = {}
    if (isArticle && !s.title.trim()) f.title = 'Indiquez le titre.'
    if (!isArticle && !s.city.trim()) f.city = 'Indiquez la ville ou la zone.'
    if (!isArticle && publish && !s.headline.trim()) f.headline = 'Indiquez le titre de la page.'
    if (publish && !s.content.trim()) f.content = 'Écrivez le texte avant de publier.'
    return f
  }

  async function save(publish: boolean, key: string) {
    const local = validate(publish)
    if (Object.keys(local).length) return ed.showErrors(local, publish ? 'Pour mettre la page en ligne, complétez les champs signalés.' : 'Quelques champs sont à corriger.')
    const r = await ed.run(
      key,
      () =>
        saveDoc(kind, {
          id,
          publish,
          slug: s.slug,
          // Texte inchangé : la version enregistrée est gardée telle quelle.
          content: id && s.content === savedContent ? null : s.content,
          meta: { title: s.seo.title, description: s.seo.description, image: s.seo.image?.id ?? null },
          title: s.title,
          publishedAt: s.publishedAt,
          cover: s.cover?.id ?? null,
          excerpt: s.excerpt,
          city: s.city,
          headline: s.headline,
          distanceNote: s.distanceNote,
        }),
      key === 'publish' ? 'Page mise en ligne' : key === 'unpublish' ? 'Page repassée en brouillon' : 'Enregistré',
    )
    if (!r.ok) return
    if (!id) {
      ed.router.replace(`${CONSOLE_BASE[kind]}/${r.id}?enregistre=1`)
      return
    }
    setSavedContent(s.content)
    setOnline(publish)
    setSlugOnline(publish ? r.slug : null)
    setS((x) => ({ ...x, slug: r.slug ?? x.slug }))
  }

  async function onDelete() {
    if (!id) return
    setDeleteError('')
    const r = await ed.run('delete', () => deleteDoc(kind, id), undefined, true)
    if (!r.ok) return setDeleteError(r.error)
    setConfirm(false)
    ed.router.push(CONSOLE_BASE[kind])
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void save(online, 'save')
  }

  const suggested = slugify(name)

  return (
    <form onSubmit={onSubmit} noValidate>
      <PageHeader
        back={{ href: CONSOLE_BASE[kind], label: w.list }}
        title={name || (id ? 'Sans titre' : w.new)}
        subtitle={id ? (updatedAt ? `Modifiée ${ago(updatedAt)}.` : undefined) : 'Enregistrez en brouillon autant de fois que nécessaire, puis publiez.'}
      />
      <SaveBar
        editor={ed}
        published={online}
        canPublish={Boolean(id)}
        onPublish={() => save(true, 'publish')}
        onUnpublish={() => save(false, 'unpublish')}
        viewHref={online && slugOnline ? `${PUBLIC_BASE[kind]}${slugOnline}` : null}
        onDelete={
          id
            ? () => {
                setDeleteError('')
                setConfirm(true)
              }
            : undefined
        }
      />
      <ErrorBanner message={ed.error} onClose={() => ed.setError('')} />

      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-6">
          <Card title="Texte" icon={FileText}>
            <div className="grid gap-4">
              {isArticle ? (
                <>
                  <F id="title" text="Titre" required error={errors.title}>
                    <input {...aria(errors, 'title')} className={field} value={s.title} maxLength={200} onChange={(e) => set('title', e.target.value)} />
                  </F>
                  <F id="excerpt" text="Résumé" error={errors.excerpt} hint="Deux ou trois phrases : affiché sous le titre et dans la liste des guides.">
                    <textarea {...aria(errors, 'excerpt')} rows={3} className={field} value={s.excerpt} maxLength={600} onChange={(e) => set('excerpt', e.target.value)} />
                  </F>
                </>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <F id="city" text="Ville ou zone" required error={errors.city} hint="Ex. Saint-Denis, Val-d’Oise (95).">
                      <input {...aria(errors, 'city')} className={field} value={s.city} maxLength={120} onChange={(e) => set('city', e.target.value)} />
                    </F>
                    <F id="distanceNote" text="Accès depuis l’agence" error={errors.distanceNote} hint="Ex. À 10 min de Saint-Denis par l’A86.">
                      <input {...aria(errors, 'distanceNote')} className={field} value={s.distanceNote} maxLength={200} onChange={(e) => set('distanceNote', e.target.value)} />
                    </F>
                  </div>
                  <F id="headline" text="Titre de la page" required error={errors.headline} hint="Ex. Voiture d’occasion en LOA à Saint-Denis.">
                    <input {...aria(errors, 'headline')} className={field} value={s.headline} maxLength={200} onChange={(e) => set('headline', e.target.value)} />
                  </F>
                </>
              )}
              <F id="content" text="Contenu" required error={errors.content}>
                <MarkdownEditor id="f-content" value={s.content} onChange={(v) => set('content', v)} rows={isArticle ? 22 : 16} />
              </F>
            </div>
          </Card>

          <Card title="Référencement Google" icon={Search}>
            <SeoFields value={s.seo} onChange={(seo) => set('seo', seo)} fallbackTitle={isArticle ? s.title : s.headline || s.city} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Publication" icon={Settings2}>
            <div className="grid gap-4">
              <F
                id="slug"
                text="Adresse de la page"
                error={errors.slug}
                hint={online ? 'Attention : changer l’adresse d’une page en ligne casse les liens déjà partagés.' : 'Laissée vide, elle est tirée du titre.'}
              >
                <div className="flex items-center overflow-hidden rounded-xl border border-line focus-within:border-accent focus-within:ring-3 focus-within:ring-accent/15">
                  <span className="shrink-0 bg-soft px-2.5 py-2.5 text-xs text-ink-3">{PUBLIC_BASE[kind]}</span>
                  <input
                    {...aria(errors, 'slug')}
                    className="w-full min-w-0 bg-white px-2.5 py-2.5 text-sm text-primary outline-none placeholder:text-ink-3"
                    value={s.slug}
                    placeholder={suggested}
                    maxLength={120}
                    onChange={(e) => set('slug', e.target.value)}
                    onBlur={() => s.slug && setS((x) => ({ ...x, slug: slugify(x.slug) }))}
                  />
                </div>
              </F>
              {isArticle && (
                <>
                  <F id="publishedAt" text="Date de publication" error={errors.publishedAt} hint="Laissée vide, la date du jour est mise à la publication.">
                    <input {...aria(errors, 'publishedAt')} type="date" className={field} value={s.publishedAt} onChange={(e) => set('publishedAt', e.target.value)} />
                  </F>
                  <ImagePicker label="Image de couverture" value={s.cover} defaultAlt={s.title} onChange={(m) => set('cover', m)} />
                </>
              )}
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDelete
        open={confirm}
        onClose={() => setConfirm(false)}
        title={`Supprimer ${w.one} ?`}
        text={
          <p>
            {w.deleted} « {name || 'Sans titre'} » sera supprimé{isArticle ? '' : 'e'} définitivement, avec son historique.{online ? ' La page disparaîtra du site.' : ''}
          </p>
        }
        error={deleteError}
        pending={ed.pending === 'delete'}
        onConfirm={onDelete}
      />
      <Toast message={ed.toast} />
    </form>
  )
}
