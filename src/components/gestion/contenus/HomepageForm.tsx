'use client'

import { BarChart3, HelpCircle, ListOrdered, Megaphone, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { saveHomepage } from '@/app/(gestion)/gestion/contenus/actions'
import { ImagePicker } from '@/components/gestion/ImagePicker'
import { btn, Card, field, label as labelCls, PageHeader } from '@/components/gestion/ui'
import { ago } from '@/lib/gestion/labels'
import type { MediaItem } from '@/lib/gestion/media-actions'

import { aria, ErrorBanner, F, move, newKey, RowControls, SaveBar, Toast, useEditor } from './kit'
import { FAQ_CATEGORIES, faqCategoryLabel, type FaqCategory, type FieldErrors, type Row } from './types'

export type HomepageState = {
  title: string
  subtitle: string
  image: MediaItem | null
  badges: Row<{ label: string }>[]
  stats: Row<{ value: string; label: string }>[]
  steps: Row<{ title: string; text: string }>[]
  faqs: number[]
}
type FaqOption = { id: number; question: string; category: FaqCategory }

const MAX = { badges: 4, stats: 4, steps: 5, faqs: 6 }

export function HomepageForm({ initial, faqOptions, updatedAt }: { initial: HomepageState; faqOptions: FaqOption[]; updatedAt?: string | null }) {
  const ed = useEditor()
  const { errors, touch } = ed
  const [s, setS] = useState(initial)

  function set<K extends keyof HomepageState>(key: K, value: HomepageState[K], errorKey: string = key) {
    setS((x) => ({ ...x, [key]: value }))
    touch(errorKey)
  }

  /** Vérifications avant envoi (le serveur refait les mêmes). */
  function validate(): FieldErrors {
    const f: FieldErrors = {}
    if (!s.title.trim()) f.heroTitle = 'Indiquez le titre de l’accroche.'
    if (s.stats.some((x) => (x.value.trim() || x.label.trim()) && !(x.value.trim() && x.label.trim()))) f.stats = 'Chaque chiffre a besoin d’une valeur et d’un libellé.'
    if (s.steps.some((x) => x.text.trim() && !x.title.trim())) f.steps = 'Chaque étape a besoin d’un titre.'
    return f
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const local = validate()
    if (Object.keys(local).length) return ed.showErrors(local, 'Quelques champs sont à corriger avant d’enregistrer.')
    await ed.run(
      'save',
      () =>
        saveHomepage({
          hero: { title: s.title, subtitle: s.subtitle, image: s.image?.id ?? null, badges: s.badges.map(({ id, label }) => ({ id, label })) },
          stats: s.stats.map(({ id, value, label }) => ({ id, value, label })),
          steps: s.steps.map(({ id, title, text }) => ({ id, title, text })),
          featuredFaqs: s.faqs,
        }),
      'Page d’accueil enregistrée',
    )
  }

  const unselected = faqOptions.filter((f) => !s.faqs.includes(f.id))

  return (
    <form onSubmit={onSubmit} noValidate>
      <PageHeader
        back={{ href: '/gestion/contenus', label: 'Contenus' }}
        title="Page d’accueil"
        subtitle={`Textes de l’accueil du site${updatedAt ? ` · modifiée ${ago(updatedAt)}` : ''}.`}
      />
      <SaveBar editor={ed} viewHref="/" />
      <ErrorBanner message={ed.error} onClose={() => ed.setError('')} />

      <div className="mx-auto max-w-4xl space-y-6">
        <Card title="Accroche" icon={Megaphone}>
          <div className="grid gap-4">
            <F id="heroTitle" text="Titre" required error={errors.heroTitle} hint="Le grand titre en haut de l’accueil.">
              <input {...aria(errors, 'heroTitle')} className={field} value={s.title} maxLength={200} onChange={(e) => set('title', e.target.value, 'heroTitle')} />
            </F>
            <F id="heroSubtitle" text="Sous-titre" error={errors.heroSubtitle}>
              <textarea {...aria(errors, 'heroSubtitle')} rows={2} className={field} value={s.subtitle} maxLength={400} onChange={(e) => set('subtitle', e.target.value, 'heroSubtitle')} />
            </F>
            <ImagePicker label="Image de l’accroche" value={s.image} defaultAlt="Voiture d’occasion Lease Auto" onChange={(m) => set('image', m)} />

            <fieldset>
              <legend className={labelCls}>
                Badges ({s.badges.length} / {MAX.badges}) : courtes mentions sous le titre
              </legend>
              <ul className="space-y-2">
                {s.badges.map((b, i) => (
                  <li key={b.key} className="flex items-center gap-2">
                    <label htmlFor={`f-badge-${b.key}`} className="sr-only">
                      Badge {i + 1}
                    </label>
                    <input
                      id={`f-badge-${b.key}`}
                      className={field}
                      value={b.label}
                      maxLength={60}
                      placeholder="Ex. Garantie 12 mois"
                      onChange={(e) =>
                        set(
                          'badges',
                          s.badges.map((x) => (x.key === b.key ? { ...x, label: e.target.value } : x)),
                        )
                      }
                    />
                    <RowControls
                      index={i}
                      count={s.badges.length}
                      name={`le badge ${i + 1}`}
                      onMove={(to) => set('badges', move(s.badges, i, to))}
                      onRemove={() => set('badges', s.badges.filter((x) => x.key !== b.key))}
                    />
                  </li>
                ))}
              </ul>
              <AddButton disabled={s.badges.length >= MAX.badges} max={MAX.badges} onClick={() => set('badges', [...s.badges, { key: newKey(), label: '' }])}>
                Ajouter un badge
              </AddButton>
            </fieldset>
          </div>
        </Card>

        <Card title={`Chiffres clés (${s.stats.length} / ${MAX.stats})`} icon={BarChart3}>
          <p className="mb-3 text-sm text-ink-2">Affichés sur l’accueil et sur la page « L’agence ». Ex. « 12 mois » / « de garantie ».</p>
          <ListError id="stats" error={errors.stats} />
          <ul className="space-y-3" id="f-stats" tabIndex={-1}>
            {s.stats.map((x, i) => (
              <li key={x.key} className="flex flex-wrap items-end gap-2 rounded-xl border border-line p-3 sm:flex-nowrap">
                <div className="w-full sm:w-40">
                  <label htmlFor={`f-stat-v-${x.key}`} className={labelCls}>
                    Valeur
                  </label>
                  <input id={`f-stat-v-${x.key}`} className={field} value={x.value} maxLength={30} placeholder="Ex. 4,8/5" onChange={(e) => set('stats', s.stats.map((y) => (y.key === x.key ? { ...y, value: e.target.value } : y)))} />
                </div>
                <div className="min-w-0 flex-1">
                  <label htmlFor={`f-stat-l-${x.key}`} className={labelCls}>
                    Libellé
                  </label>
                  <input id={`f-stat-l-${x.key}`} className={field} value={x.label} maxLength={80} placeholder="Ex. de satisfaction client" onChange={(e) => set('stats', s.stats.map((y) => (y.key === x.key ? { ...y, label: e.target.value } : y)))} />
                </div>
                <RowControls index={i} count={s.stats.length} name={`le chiffre ${i + 1}`} onMove={(to) => set('stats', move(s.stats, i, to))} onRemove={() => set('stats', s.stats.filter((y) => y.key !== x.key))} />
              </li>
            ))}
          </ul>
          <AddButton disabled={s.stats.length >= MAX.stats} max={MAX.stats} onClick={() => set('stats', [...s.stats, { key: newKey(), value: '', label: '' }])}>
            Ajouter un chiffre
          </AddButton>
        </Card>

        <Card title={`Étapes du parcours (${s.steps.length} / ${MAX.steps})`} icon={ListOrdered}>
          <p className="mb-3 text-sm text-ink-2">Le déroulé « comment ça marche », dans l’ordre.</p>
          <ListError id="steps" error={errors.steps} />
          <ol className="space-y-3" id="f-steps" tabIndex={-1}>
            {s.steps.map((x, i) => (
              <li key={x.key} className="rounded-xl border border-line p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-sm font-black text-primary">Étape {i + 1}</span>
                  <RowControls index={i} count={s.steps.length} name={`l’étape ${i + 1}`} onMove={(to) => set('steps', move(s.steps, i, to))} onRemove={() => set('steps', s.steps.filter((y) => y.key !== x.key))} />
                </div>
                <div className="grid gap-2">
                  <div>
                    <label htmlFor={`f-step-t-${x.key}`} className={labelCls}>
                      Titre
                    </label>
                    <input id={`f-step-t-${x.key}`} className={field} value={x.title} maxLength={120} onChange={(e) => set('steps', s.steps.map((y) => (y.key === x.key ? { ...y, title: e.target.value } : y)))} />
                  </div>
                  <div>
                    <label htmlFor={`f-step-x-${x.key}`} className={labelCls}>
                      Texte
                    </label>
                    <textarea id={`f-step-x-${x.key}`} rows={2} className={field} value={x.text} maxLength={600} onChange={(e) => set('steps', s.steps.map((y) => (y.key === x.key ? { ...y, text: e.target.value } : y)))} />
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <AddButton disabled={s.steps.length >= MAX.steps} max={MAX.steps} onClick={() => set('steps', [...s.steps, { key: newKey(), title: '', text: '' }])}>
            Ajouter une étape
          </AddButton>
        </Card>

        <Card title={`Questions affichées (${s.faqs.length} / ${MAX.faqs})`} icon={HelpCircle}>
          <p className="mb-3 text-sm text-ink-2">Choisies dans la FAQ. Sans choix, les 6 premières questions de la FAQ s’affichent.</p>
          <ListError id="featuredFaqs" error={errors.featuredFaqs} />
          {s.faqs.length > 0 && (
            <ol className="mb-4 space-y-2">
              {s.faqs.map((id, i) => {
                const f = faqOptions.find((o) => o.id === id)
                return (
                  <li key={id} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2">
                    <span className="min-w-0 flex-1 text-sm">
                      <span className="font-semibold text-primary">{f?.question ?? 'Question supprimée'}</span>
                      {f && <span className="block text-xs text-ink-3">{faqCategoryLabel(f.category)}</span>}
                    </span>
                    <RowControls index={i} count={s.faqs.length} name={`la question ${i + 1}`} onMove={(to) => set('faqs', move(s.faqs, i, to), 'featuredFaqs')} onRemove={() => set('faqs', s.faqs.filter((x) => x !== id), 'featuredFaqs')} />
                  </li>
                )
              })}
            </ol>
          )}
          {faqOptions.length === 0 ? (
            <p className="text-sm text-ink-3">La FAQ est vide : ajoutez d’abord des questions dans « FAQ ».</p>
          ) : (
            <div>
              <label htmlFor="f-featuredFaqs" className={labelCls}>
                Ajouter une question
              </label>
              <select
                id="f-featuredFaqs"
                className={field}
                value=""
                disabled={s.faqs.length >= MAX.faqs || unselected.length === 0}
                onChange={(e) => e.target.value && set('faqs', [...s.faqs, Number(e.target.value)], 'featuredFaqs')}
              >
                <option value="">{s.faqs.length >= MAX.faqs ? '6 questions au maximum' : unselected.length ? 'Choisir une question…' : 'Toutes les questions sont déjà choisies'}</option>
                {FAQ_CATEGORIES.map((c) => {
                  const opts = unselected.filter((f) => f.category === c.value)
                  return opts.length ? (
                    <optgroup key={c.value} label={c.label}>
                      {opts.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.question}
                        </option>
                      ))}
                    </optgroup>
                  ) : null
                })}
              </select>
            </div>
          )}
        </Card>
      </div>
      <Toast message={ed.toast} />
    </form>
  )
}

function AddButton({ disabled, max, onClick, children }: { disabled: boolean; max: number; onClick: () => void; children: string }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <button type="button" className={`${btn.ghost} ${btn.small}`} disabled={disabled} onClick={onClick}>
        <Plus className="size-3.5" aria-hidden /> {children}
      </button>
      {disabled && <span className="text-xs text-ink-3">{max} au maximum.</span>}
    </div>
  )
}

function ListError({ id, error }: { id: string; error?: string }) {
  if (!error) return null
  return (
    <p id={`f-${id}-error`} role="alert" className="mb-2 text-sm font-semibold text-accent">
      {error}
    </p>
  )
}
