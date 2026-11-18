'use client'

import { Loader2, Pencil } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import {
  loadEntry,
  saveEntry,
  type CatalogEntry,
  type Kind,
} from '@/app/(gestion)/gestion/marques/actions'
import { Dialog } from '@/components/gestion/Dialog'
import { ImagePicker } from '@/components/gestion/ImagePicker'
import { MarkdownEditor } from '@/components/gestion/MarkdownEditor'
import { ErrorText, safeRun } from '@/components/gestion/rendez-vous/dialog'
import { SeoFields, type Seo } from '@/components/gestion/SeoFields'
import { btn, field, label } from '@/components/gestion/ui'
import { slugify } from '@/fields/slug'

/** Bouton « Modifier » d'une marque ou d'un modèle : nom, logo, texte de présentation, référencement. */
export function EntryEditor({ kind, id, name }: { kind: Kind; id: number; name: string }) {
  const [open, setOpen] = useState(false)
  const [entry, setEntry] = useState<CatalogEntry | null>(null)
  const [error, setError] = useState('')

  const show = async () => {
    setOpen(true)
    setEntry(null)
    setError('')
    const r = await safeRun(() => loadEntry(kind, id))
    if (r.ok) setEntry(r.entry)
    else setError(r.error)
  }

  return (
    <>
      <button
        type="button"
        className={`${btn.ghost} ${btn.small}`}
        onClick={() => void show()}
        aria-label={`Modifier ${kind === 'brand' ? 'la marque' : 'le modèle'} ${name}`}
      >
        <Pencil className="size-3.5" aria-hidden /> Modifier
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={`${kind === 'brand' ? 'Marque' : 'Modèle'} « ${name} »`}
        wide
      >
        {/* Formulaire monté seulement fenêtre ouverte : SeoFields utilise des identifiants fixes. */}
        {!open ? null : entry ? (
          <EntryForm
            key={`${entry.id}-${entry.slug}`}
            entry={entry}
            onDone={() => setOpen(false)}
          />
        ) : error ? (
          <ErrorText>{error}</ErrorText>
        ) : (
          <p className="flex items-center gap-2 text-sm text-ink-2">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Chargement…
          </p>
        )}
      </Dialog>
    </>
  )
}

function EntryForm({ entry, onDone }: { entry: CatalogEntry; onDone: () => void }) {
  const router = useRouter()
  const [name, setName] = useState(entry.name)
  const [renameSlug, setRenameSlug] = useState(false)
  const [logo, setLogo] = useState(entry.logo)
  const [intro, setIntro] = useState(entry.intro)
  const [seo, setSeo] = useState<Seo>(entry.seo)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const brand = entry.kind === 'brand'
  const newSlug = slugify(name)
  const base = brand ? '/vehicules/' : `/vehicules/${entry.brandSlug ?? '…'}/`
  const slug = renameSlug && newSlug ? newSlug : entry.slug

  const submit = async () => {
    setPending(true)
    setError('')
    const r = await safeRun(() =>
      saveEntry({
        kind: entry.kind,
        id: entry.id,
        name,
        renameSlug: renameSlug && newSlug !== entry.slug,
        logo: logo?.id ?? null,
        intro: intro === entry.intro ? null : intro,
        seo: { title: seo.title, description: seo.description, image: seo.image?.id ?? null },
      }),
    )
    setPending(false)
    if (!r.ok) return setError(r.error)
    onDone()
    router.refresh()
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
    >
      <div>
        <label htmlFor={`nom-${entry.kind}-${entry.id}`} className={label}>
          Nom
        </label>
        <input
          id={`nom-${entry.kind}-${entry.id}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={80}
          className={field}
        />
        <p className="mt-1 text-xs text-ink-3">
          Adresse de la page :{' '}
          <span className="font-semibold text-primary">
            {base}
            {slug}
          </span>
        </p>
        {newSlug && newSlug !== entry.slug && (
          <label className="mt-2 flex items-start gap-2 text-sm text-primary">
            <input
              type="checkbox"
              checked={renameSlug}
              onChange={(e) => setRenameSlug(e.target.checked)}
              className="mt-0.5 size-4 accent-accent"
            />
            <span>
              Changer aussi l’adresse en <strong>{base + newSlug}</strong>.{' '}
              <span className="text-ink-2">
                À éviter si la page est déjà connue de Google : les liens vers l’ancienne adresse ne
                fonctionneront plus.
              </span>
            </span>
          </label>
        )}
      </div>

      {brand && (
        <ImagePicker label="Logo" value={logo} onChange={setLogo} defaultAlt={`Logo ${name}`} />
      )}

      <div>
        <label htmlFor={`intro-${entry.kind}-${entry.id}`} className={label}>
          Texte de présentation (en haut de la page {brand ? 'de la marque' : 'du modèle'})
        </label>
        <MarkdownEditor
          id={`intro-${entry.kind}-${entry.id}`}
          value={intro}
          onChange={setIntro}
          rows={8}
          placeholder="Facultatif. Quelques phrases utiles pour le client et pour Google."
        />
      </div>

      <fieldset className="rounded-xl border border-line p-4">
        <legend className="px-1 text-sm font-black text-primary">Référencement Google</legend>
        <SeoFields value={seo} onChange={setSeo} fallbackTitle={name} />
      </fieldset>

      {error && <ErrorText>{error}</ErrorText>}
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" className={btn.ghost} onClick={onDone} disabled={pending}>
          Annuler
        </button>
        <button
          type="submit"
          className={btn.primary}
          disabled={pending || !name.trim()}
          aria-busy={pending}
        >
          {pending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}
