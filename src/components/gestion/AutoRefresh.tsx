'use client'

import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useTransition } from 'react'

const EVERY = 60_000
/** Sans souris ni clavier depuis ce délai, on arrête d'interroger le serveur (onglet oublié ouvert toute la journée). */
const IDLE = 5 * 60_000

/**
 * « Mis à jour à 14:32 » : la page se recharge seule toutes les minutes tant que quelqu'un la regarde,
 * et dès qu'on y revient après une pause. Un clic force l'actualisation. `at` vient du serveur (heure de Paris).
 * Sur le tableau de bord : une demande ou une pièce déposée par un client apparaît sans recharger la page.
 */
export function AutoRefresh({ at }: { at: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const last = useRef(Date.now())
  const active = useRef(Date.now())

  const refresh = useCallback(() => {
    last.current = Date.now()
    start(() => router.refresh())
  }, [router])

  useEffect(() => {
    const due = () => {
      // Jamais pendant une fenêtre de confirmation ou une saisie : on ne change pas la page sous les doigts.
      if (document.visibilityState !== 'visible' || document.querySelector('dialog[open], [aria-modal="true"]')) return false
      const el = document.activeElement
      if ((el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) && el.value) return false
      return Date.now() - last.current >= EVERY
    }
    const tick = () => {
      if (Date.now() - active.current < IDLE && due()) refresh()
    }
    const wake = () => {
      active.current = Date.now()
      if (due()) refresh()
    }
    const timer = window.setInterval(tick, 15_000)
    const events = ['pointermove', 'pointerdown', 'keydown', 'focus'] as const
    for (const e of events) window.addEventListener(e, wake, { passive: true })
    document.addEventListener('visibilitychange', wake)
    return () => {
      window.clearInterval(timer)
      for (const e of events) window.removeEventListener(e, wake)
      document.removeEventListener('visibilitychange', wake)
    }
  }, [refresh])

  return (
    <button type="button" onClick={refresh} disabled={pending} title="Actualiser maintenant" className="inline-flex items-center gap-1.5 text-ink-3 transition hover:text-primary disabled:cursor-default">
      <RefreshCw className={`size-3.5 ${pending ? 'animate-spin' : ''}`} aria-hidden />
      {pending ? 'Actualisation…' : `Mis à jour à ${at}`}
    </button>
  )
}
