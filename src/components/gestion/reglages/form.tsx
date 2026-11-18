'use client'

import { CheckCircle2, Loader2, Save, TriangleAlert, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'

import { btn, label as labelCls } from '@/components/gestion/ui'

// Briques communes aux formulaires « Réglages » et « Créneaux » (même allure que la fiche véhicule).

/** Libellé + champ + aide ou erreur. Le champ porte l'id `id`. */
export function F({ id, text, hint, error, className = '', children }: { id: string; text: ReactNode; hint?: ReactNode; error?: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className={labelCls}>
        {text}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs font-semibold text-accent">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-ink-3">{hint}</p>
      )}
    </div>
  )
}

/** Attributs d'accessibilité d'un champ selon son erreur. */
export const errAria = (id: string, error?: string) => ({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': error ? `${id}-error` : undefined })

/** Saisie numérique → nombre ou null (virgule acceptée). */
export const toNum = (s: string) => (s.trim() === '' ? null : Number(s.replace(',', '.')))

/** Barre collante : raccourcis vers les sections, état et bouton « Enregistrer ». */
export function SaveBar({ nav = [], dirty, pending }: { nav?: { href: string; label: string }[]; dirty: boolean; pending: boolean }) {
  return (
    <div className="sticky top-16 z-20 -mx-4 mb-6 border-y border-line bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:-mx-6 sm:px-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        {nav.length > 0 && (
          <nav aria-label="Sections" className="-mx-1 flex min-w-0 flex-1 gap-1 overflow-x-auto">
            {nav.map((n) => (
              <a key={n.href} href={n.href} className="rounded-lg px-2.5 py-1.5 text-xs font-bold whitespace-nowrap text-ink-2 hover:bg-soft hover:text-primary">
                {n.label}
              </a>
            ))}
          </nav>
        )}
        <div className="ml-auto flex items-center gap-3">
          {dirty && <span className="text-xs font-semibold text-amber-700">Modifications non enregistrées</span>}
          <button type="submit" className={btn.primary} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />} Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}

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

/** Message de confirmation en bas à droite (zone toujours présente pour les lecteurs d'écran). */
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

/** Toast qui s'efface tout seul. */
export function useToast() {
  const [toast, setToast] = useState('')
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(t)
  }, [toast])
  return [toast, setToast] as const
}

/** Alerte du navigateur si on quitte la page avec des modifications non enregistrées. */
export function useLeaveWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
}

/** Encadré d'aide (info) ou d'alerte (warn). */
export function Note({ tone = 'info', children, className = '' }: { tone?: 'info' | 'warn' | 'ok'; children: ReactNode; className?: string }) {
  const cls = { info: 'bg-soft text-ink-2', warn: 'bg-amber-50 text-amber-900 ring-1 ring-amber-200', ok: 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200' }[tone]
  return <div className={`rounded-xl px-4 py-3 text-sm ${cls} ${className}`}>{children}</div>
}
