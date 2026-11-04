'use client'

import { Cookie } from 'lucide-react'
import Link from 'next/link'
import Script from 'next/script'
import { useEffect, useState } from 'react'

const KEY = 'lease-auto:cookies'
const EVENT = 'lease-auto:cookies'
type Choice = 'accepted' | 'refused'

const readChoice = (): Choice | null => {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'accepted' || v === 'refused' ? v : null
  } catch {
    return null
  }
}
const saveChoice = (v: Choice | null) => {
  try {
    if (v) localStorage.setItem(KEY, v)
    else localStorage.removeItem(KEY)
  } catch {
    /* stockage bloqué : le bandeau réapparaîtra */
  }
  window.dispatchEvent(new Event(EVENT))
}

/**
 * CONF-02 / SEO-07 : bandeau de consentement. Google Analytics n'est chargé qu'après
 * acceptation, et seulement si NEXT_PUBLIC_GA_ID est défini. Refuser est aussi simple qu'accepter.
 */
export function CookieBanner({ gaId }: { gaId?: string }) {
  const [choice, setChoice] = useState<Choice | null | undefined>(undefined)

  useEffect(() => {
    const sync = () => setChoice(readChoice())
    sync()
    window.addEventListener(EVENT, sync)
    return () => window.removeEventListener(EVENT, sync)
  }, [])

  return (
    <>
      {choice === 'accepted' && gaId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true});`}
          </Script>
        </>
      )}
      {choice === null && (
        <div role="dialog" aria-label="Cookies" className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[60] mx-auto max-w-xl rounded-3xl border border-line bg-white p-4 shadow-2xl sm:bottom-5 sm:left-5 sm:right-auto sm:p-5">
          <p className="mb-2 flex items-center gap-2 font-black text-primary">
            <Cookie className="size-5 text-accent" aria-hidden /> Cookies
          </p>
          <p className="mb-4 text-sm text-ink-2">
            Avec votre accord, nous mesurons la fréquentation du site pour l’améliorer. Aucun cookie publicitaire.{' '}
            <Link href="/cookies" className="font-semibold text-accent underline">En savoir plus</Link>
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => saveChoice('refused')} className="btn-ghost flex-1 py-2.5!">
              Refuser
            </button>
            <button type="button" onClick={() => saveChoice('accepted')} className="btn-primary flex-1 py-2.5!">
              Accepter
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export function CookieSettingsButton() {
  return (
    <button type="button" onClick={() => saveChoice(null)} className="btn-ghost">
      Modifier mon choix de cookies
    </button>
  )
}
