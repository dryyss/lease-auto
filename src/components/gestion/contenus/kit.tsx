'use client'

import { ArrowDown, ArrowUp, CheckCircle2, ExternalLink, Loader2, Save, Trash2, TriangleAlert, Undo2, Upload, X } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'

import { Dialog } from '@/components/gestion/Dialog'
import { Badge, btn, label as labelCls } from '@/components/gestion/ui'

import type { FieldErrors, Result } from './types'

// Briques des écrans « Contenus » : état d'édition, barre d'actions collante, champ, liste réordonnable, suppression.

const OFFLINE = 'La connexion a été interrompue. Vos saisies sont toujours là : réessayez.'

let seq = 0
/** Clé d'affichage d'une nouvelle ligne de liste. */
export const newKey = () => `n${++seq}`

/** Déplace un élément d'une liste (monter / descendre). */
export function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

/** État commun d'un écran d'édition : modifications, attente, erreurs, toast, alerte avant de quitter. */
export function useEditor(justSaved = false) {
  const router = useRouter()
  const pathname = usePathname()
  const [dirty, setDirty] = useState(false)
  const [toast, setToast] = useState(justSaved ? 'Enregistré' : '')
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})

  // Après une création : on retire ?enregistre=1 de l'adresse.
  useEffect(() => {
    if (justSaved) router.replace(pathname, { scroll: false })
  }, [justSaved, pathname, router])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(t)
  }, [toast])
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  /** Une saisie : la page a des modifications, l'erreur du champ disparaît. */
  const touch = (key?: string) => {
    setDirty(true)
    if (key && errors[key]) setErrors(({ [key]: _, ...rest }) => rest)
  }

  /** Affiche les erreurs et place le curseur sur le premier champ fautif. */
  const showErrors = (fields: FieldErrors, message: string) => {
    setErrors(fields)
    setError(message)
    const first = Object.keys(fields)[0]
    const el = first ? document.getElementById(`f-${first}`) : null
    if (el) requestAnimationFrame(() => el.focus())
    else window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /**
   * Lance une action serveur : attente, erreurs, puis rafraîchissement de la page et toast.
   * `quiet` : l'appelant affiche lui-même l'erreur (ex. dans une fenêtre).
   */
  async function run<T extends object>(key: string, action: () => Promise<Result<T>>, success?: string, quiet = false): Promise<Result<T>> {
    setPending(key)
    setError('')
    const r: Result<T> = await action().catch(() => ({ ok: false as const, error: OFFLINE }))
    setPending(null)
    if (!r.ok) {
      if (!quiet) showErrors(r.fields ?? {}, r.error)
      return r
    }
    setErrors({})
    setDirty(false)
    if (success) setToast(success)
    router.refresh()
    return r
  }

  return { router, dirty, setDirty, touch, toast, setToast, pending, busy: pending !== null, error, setError, errors, showErrors, run }
}

export const Spin = ({ on, icon }: { on: boolean; icon: ReactNode }) => (on ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <>{icon}</>)

/** Barre d'actions collante : état en ligne / brouillon (si la page en a), lien public, suppression, enregistrement. */
export function SaveBar({
  editor,
  published,
  canPublish = true,
  onPublish,
  onUnpublish,
  viewHref,
  onDelete,
  saveLabel = 'Enregistrer',
}: {
  editor: ReturnType<typeof useEditor>
  published?: boolean
  canPublish?: boolean
  onPublish?: () => void
  onUnpublish?: () => void
  viewHref?: string | null
  onDelete?: () => void
  saveLabel?: string
}) {
  const { busy, pending, dirty } = editor
  return (
    <div className="sticky top-16 z-20 -mx-4 mb-6 border-y border-line bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:-mx-6 sm:px-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        {published !== undefined && (
          <div className="flex flex-wrap items-center gap-2">
            {published ? <Badge className="bg-primary text-white">En ligne</Badge> : <Badge className="bg-white text-ink-2 ring-1 ring-line">Brouillon</Badge>}
            {published ? (
              <button type="button" className={`${btn.ghost} ${btn.small}`} disabled={busy || !canPublish} onClick={onUnpublish}>
                <Spin on={pending === 'unpublish'} icon={<Undo2 className="size-3.5" aria-hidden />} /> Repasser en brouillon
              </button>
            ) : (
              <button type="button" className={`${btn.dark} ${btn.small}`} disabled={busy} onClick={onPublish}>
                <Spin on={pending === 'publish'} icon={<Upload className="size-3.5" aria-hidden />} /> Publier
              </button>
            )}
          </div>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {dirty && <span className="text-xs font-semibold text-amber-700">Modifications non enregistrées</span>}
          {viewHref && (
            <a href={viewHref} target="_blank" rel="noopener noreferrer" className={`${btn.ghost} ${btn.small}`}>
              <ExternalLink className="size-3.5" aria-hidden /> Voir sur le site
              <span className="sr-only"> (nouvel onglet)</span>
            </a>
          )}
          {onDelete && (
            <button type="button" className={`${btn.danger} ${btn.small}`} disabled={busy} onClick={onDelete}>
              <Trash2 className="size-3.5" aria-hidden /> Supprimer
            </button>
          )}
          <button type="submit" className={btn.primary} disabled={busy}>
            <Spin on={pending === 'save'} icon={<Save className="size-4" aria-hidden />} /> {saveLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Message d'erreur général sous la barre d'actions. */
export function ErrorBanner({ message, onClose }: { message: string; onClose: () => void }) {
  if (!message) return null
  return (
    <div role="alert" className="mb-6 flex items-start gap-3 rounded-2xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm font-semibold text-accent-dark">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p className="flex-1">{message}</p>
      <button type="button" onClick={onClose} className="rounded-lg p-0.5 hover:bg-white/60" aria-label="Fermer le message">
        <X className="size-4" aria-hidden />
      </button>
    </div>
  )
}

/** Confirmation affichée en bas à droite (zone toujours présente pour les lecteurs d'écran). */
export function Toast({ message }: { message: string }) {
  return (
    <div role="status" aria-live="polite" className="fixed right-4 bottom-4 z-50">
      {message && (
        <p className="flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-xl">
          <CheckCircle2 className="size-4 text-emerald-300" aria-hidden /> {message}
        </p>
      )}
    </div>
  )
}

/** Libellé + champ + aide ou erreur. Le champ porte l'id `f-<id>`. */
export function F({ id, text, required, error, hint, className = '', children }: { id: string; text: ReactNode; required?: boolean; error?: string; hint?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={`f-${id}`} className={labelCls}>
        {text}
        {required && (
          <span className="text-accent" title="Obligatoire">
            {' '}
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`f-${id}-error`} className="mt-1 text-xs font-semibold text-accent">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-ink-3">{hint}</p>
      )}
    </div>
  )
}

/** Attributs d'accessibilité d'un champ (id, erreur liée). */
export const aria = (errors: FieldErrors, k: string) => ({ id: `f-${k}`, 'aria-invalid': errors[k] ? true : undefined, 'aria-describedby': errors[k] ? `f-${k}-error` : undefined })

/** Boutons Monter / Descendre / Retirer d'une ligne de liste. */
export function RowControls({ index, count, name, onMove, onRemove }: { index: number; count: number; name: string; onMove: (to: number) => void; onRemove: () => void }) {
  const cls =
    'flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-ink-2 transition hover:text-primary disabled:opacity-35 focus-visible:ring-3 focus-visible:ring-accent/40 focus-visible:outline-none'
  return (
    <div className="flex gap-1">
      <button type="button" className={cls} disabled={index === 0} onClick={() => onMove(index - 1)} aria-label={`Monter ${name}`} title="Monter">
        <ArrowUp className="size-4" aria-hidden />
      </button>
      <button type="button" className={cls} disabled={index === count - 1} onClick={() => onMove(index + 1)} aria-label={`Descendre ${name}`} title="Descendre">
        <ArrowDown className="size-4" aria-hidden />
      </button>
      <button type="button" className={`${cls} text-accent! hover:bg-accent-soft`} onClick={onRemove} aria-label={`Retirer ${name}`} title="Retirer">
        <X className="size-4" aria-hidden />
      </button>
    </div>
  )
}

/** Fenêtre de confirmation de suppression. */
export function ConfirmDelete({
  open,
  onClose,
  title,
  text,
  error,
  pending,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  title: string
  text: ReactNode
  error?: string
  pending: boolean
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <div className="text-sm text-ink-2">{text}</div>
      {error && (
        <p role="alert" className="mt-3 text-sm font-semibold text-accent">
          {error}
        </p>
      )}
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button type="button" className={btn.ghost} onClick={onClose} autoFocus>
          Annuler
        </button>
        <button type="button" className={`${btn.danger} border-accent! bg-accent! text-white! hover:bg-accent-dark!`} disabled={pending} onClick={onConfirm}>
          <Spin on={pending} icon={<Trash2 className="size-4" aria-hidden />} /> Supprimer définitivement
        </button>
      </div>
    </Dialog>
  )
}
