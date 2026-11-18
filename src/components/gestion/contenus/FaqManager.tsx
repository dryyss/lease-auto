'use client'

import { ArrowDown, ArrowUp, HelpCircle, Pencil, Plus, Save, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { deleteFaq, reorderFaqs, saveFaq } from '@/app/(gestion)/gestion/contenus/actions'
import { Dialog } from '@/components/gestion/Dialog'
import { MarkdownEditor } from '@/components/gestion/MarkdownEditor'
import { btn, Card, Empty, field, PageHeader } from '@/components/gestion/ui'

import { aria, ConfirmDelete, ErrorBanner, F, move, Spin, Toast, useEditor } from './kit'
import { FAQ_CATEGORIES, type FaqCategory, type FaqItem, type FieldErrors } from './types'

type Draft = { id?: number; question: string; answer: string; category: FaqCategory; order: number | null }

/** Ordre d'affichage d'un thème : champ « Ordre », puis ordre de création. */
const sortFaq = (a: FaqItem, b: FaqItem) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id

/** Aperçu en texte brut d'une réponse en Markdown. */
const plain = (md: string) =>
  md
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_>`]+/g, '')
    .replace(/^\s*(?:-|\d+\.)\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()

export function FaqManager({ items }: { items: FaqItem[] }) {
  const ed = useEditor()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [formErrors, setFormErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [toDelete, setToDelete] = useState<FaqItem | null>(null)
  const [deleteError, setDeleteError] = useState('')

  const groups = FAQ_CATEGORIES.map((c) => ({ ...c, items: items.filter((f) => f.category === c.value).sort(sortFaq) }))
  const nextOrder = (category: FaqCategory) => Math.max(0, ...items.filter((f) => f.category === category).map((f) => f.order ?? 0)) + 10
  const original = draft?.id ? items.find((f) => f.id === draft.id) : undefined

  const openNew = (category: FaqCategory = 'general') => {
    setFormErrors({})
    setFormError('')
    setDraft({ question: '', answer: '', category, order: nextOrder(category) })
  }
  const openEdit = (f: FaqItem) => {
    setFormErrors({})
    setFormError('')
    setDraft({ id: f.id, question: f.question, answer: f.answer, category: f.category, order: f.order })
  }
  const edit = (patch: Partial<Draft>, key?: string) => {
    setDraft((d) => (d ? { ...d, ...patch } : d))
    if (key && formErrors[key]) setFormErrors(({ [key]: _, ...rest }) => rest)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!draft) return
    const local: FieldErrors = {}
    if (!draft.question.trim()) local.question = 'Écrivez la question.'
    if (!draft.answer.trim()) local.answer = 'Écrivez la réponse.'
    if (Object.keys(local).length) {
      setFormErrors(local)
      document.getElementById(`f-${Object.keys(local)[0]}`)?.focus()
      return
    }
    const input = { ...draft, answer: original && draft.answer === original.answer ? null : draft.answer }
    setFormError('')
    // Erreurs affichées dans la fenêtre plutôt que derrière.
    const r = await ed.run('faq', () => saveFaq(input), draft.id ? 'Question enregistrée' : 'Question ajoutée', true)
    if (r.ok) return setDraft(null)
    setFormErrors(r.fields ?? {})
    setFormError(r.error)
  }

  async function reorder(group: FaqItem[], from: number, to: number) {
    await ed.run('order', () => reorderFaqs(move(group, from, to).map((f) => f.id)), 'Ordre enregistré')
  }

  async function confirmDelete() {
    if (!toDelete) return
    setDeleteError('')
    const r = await ed.run('delete', () => deleteFaq(toDelete.id), 'Question supprimée', true)
    if (r.ok) setToDelete(null)
    else setDeleteError(r.error)
  }

  const moveBtn =
    'flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-ink-2 transition hover:text-primary disabled:opacity-35 focus-visible:ring-3 focus-visible:ring-accent/40 focus-visible:outline-none'

  return (
    <>
      <PageHeader
        back={{ href: '/gestion/contenus', label: 'Contenus' }}
        title="FAQ"
        subtitle={`${items.length} question${items.length > 1 ? 's' : ''}, regroupées par thème. Elles s’affichent sur la page FAQ, l’accueil et les pages des formules.`}
        actions={
          <>
            <a href="/faq" target="_blank" rel="noopener noreferrer" className={btn.ghost}>
              Voir sur le site<span className="sr-only"> (nouvel onglet)</span>
            </a>
            <button type="button" className={btn.primary} onClick={() => openNew()}>
              <Plus className="size-4" aria-hidden /> Ajouter une question
            </button>
          </>
        }
      />
      <ErrorBanner message={ed.error} onClose={() => ed.setError('')} />

      {items.length === 0 ? (
        <Card>
          <Empty
            icon={HelpCircle}
            title="Aucune question pour le moment."
            text="Ajoutez les questions que vos clients posent le plus souvent."
            action={
              <button type="button" className={btn.primary} onClick={() => openNew()}>
                <Plus className="size-4" aria-hidden /> Ajouter une question
              </button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <Card
              key={g.value}
              title={`${g.label} (${g.items.length})`}
              icon={HelpCircle}
              padded={false}
              action={
                <button type="button" className={`${btn.ghost} ${btn.small}`} onClick={() => openNew(g.value)}>
                  <Plus className="size-3.5" aria-hidden /> Ajouter<span className="sr-only"> une question au thème {g.label}</span>
                </button>
              }
            >
              {g.items.length === 0 ? (
                <p className="px-5 py-4 text-sm text-ink-3">Aucune question dans ce thème.</p>
              ) : (
                <ol className="divide-y divide-line">
                  {g.items.map((f, i) => (
                    <li key={f.id} className="flex flex-wrap items-start gap-3 px-5 py-4 sm:flex-nowrap">
                      <div className="flex gap-1 sm:flex-col">
                        <button type="button" className={moveBtn} disabled={ed.busy || i === 0} onClick={() => reorder(g.items, i, i - 1)} aria-label={`Monter « ${f.question} »`} title="Monter">
                          <ArrowUp className="size-4" aria-hidden />
                        </button>
                        <button type="button" className={moveBtn} disabled={ed.busy || i === g.items.length - 1} onClick={() => reorder(g.items, i, i + 1)} aria-label={`Descendre « ${f.question} »`} title="Descendre">
                          <ArrowDown className="size-4" aria-hidden />
                        </button>
                      </div>
                      <div className="min-w-0 flex-1 basis-60">
                        <p className="font-bold text-primary">{f.question}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-ink-2">{plain(f.answer) || <em className="text-ink-3">Réponse vide</em>}</p>
                        <p className="mt-1 text-xs text-ink-3">Ordre : {f.order ?? 0}</p>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" className={`${btn.ghost} ${btn.small}`} onClick={() => openEdit(f)}>
                          <Pencil className="size-3.5" aria-hidden /> Modifier<span className="sr-only"> « {f.question} »</span>
                        </button>
                        <button
                          type="button"
                          className={`${btn.danger} ${btn.small}`}
                          onClick={() => {
                            setDeleteError('')
                            setToDelete(f)
                          }}
                        >
                          <Trash2 className="size-3.5" aria-hidden /> Supprimer<span className="sr-only"> « {f.question} »</span>
                        </button>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={draft !== null} onClose={() => setDraft(null)} title={draft?.id ? 'Modifier la question' : 'Nouvelle question'} wide>
        {draft && (
          <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-[1fr_10rem]">
            <F id="question" text="Question" required error={formErrors.question} className="sm:col-span-2">
              <input {...aria(formErrors, 'question')} className={field} value={draft.question} maxLength={300} autoFocus onChange={(e) => edit({ question: e.target.value }, 'question')} />
            </F>
            <F id="category" text="Thème" required error={formErrors.category}>
              <select
                {...aria(formErrors, 'category')}
                className={field}
                value={draft.category}
                onChange={(e) => {
                  const category = e.target.value as FaqCategory
                  // Nouvelle question : placée à la fin du thème choisi.
                  edit({ category, ...(draft.id ? {} : { order: nextOrder(category) }) }, 'category')
                }}
              >
                {FAQ_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </F>
            <F id="order" text="Ordre" error={formErrors.order} hint="Plus petit = plus haut.">
              <input
                {...aria(formErrors, 'order')}
                type="number"
                inputMode="numeric"
                step="1"
                className={field}
                value={draft.order ?? ''}
                onChange={(e) => edit({ order: e.target.value === '' ? null : Number(e.target.value) }, 'order')}
              />
            </F>
            <F id="answer" text="Réponse" required error={formErrors.answer} className="sm:col-span-2">
              <MarkdownEditor id="f-answer" value={draft.answer} onChange={(v) => edit({ answer: v }, 'answer')} rows={9} />
            </F>
            {formError && (
              <p role="alert" className="text-sm font-semibold text-accent sm:col-span-2">
                {formError}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
              <button type="button" className={btn.ghost} onClick={() => setDraft(null)}>
                Annuler
              </button>
              <button type="submit" className={btn.primary} disabled={ed.busy}>
                <Spin on={ed.pending === 'faq'} icon={<Save className="size-4" aria-hidden />} /> {draft.id ? 'Enregistrer' : 'Ajouter la question'}
              </button>
            </div>
          </form>
        )}
      </Dialog>

      <ConfirmDelete
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title="Supprimer cette question ?"
        text={<p>« {toDelete?.question} » sera supprimée définitivement du site (page FAQ, accueil et pages des formules).</p>}
        error={deleteError}
        pending={ed.pending === 'delete'}
        onConfirm={confirmDelete}
      />
      <Toast message={ed.toast} />
    </>
  )
}
