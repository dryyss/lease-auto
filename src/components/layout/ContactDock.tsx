import { MessageCircle, Phone, PhoneCall } from 'lucide-react'
import Link from 'next/link'

/** PUB-03 : appel, WhatsApp et demande de rappel sur toutes les pages. */
export function ContactDock({ phoneHref, whatsappHref }: { phoneHref?: string; whatsappHref?: string }) {
  return (
    <>
      {/* Mobile : barre fixe en bas d'écran */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg sm:hidden">
        {phoneHref && (
          <a href={phoneHref} className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-bold text-primary">
            <Phone className="size-5 text-accent" aria-hidden />
            Appeler
          </a>
        )}
        {whatsappHref && (
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-bold text-primary">
            <MessageCircle className="size-5 text-[#1fa855]" aria-hidden />
            WhatsApp
          </a>
        )}
        <Link href="/contact?rappel=1" className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-bold text-primary">
          <PhoneCall className="size-5 text-accent" aria-hidden />
          Être rappelé
        </Link>
      </div>

      {/* Ordinateur : boutons flottants */}
      <div className="fixed right-5 bottom-5 z-40 hidden flex-col items-end gap-2.5 sm:flex">
        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Nous écrire sur WhatsApp"
            className="flex size-13 items-center justify-center rounded-full bg-[#1fa855] text-white shadow-lg transition hover:scale-105"
          >
            <MessageCircle className="size-6" aria-hidden />
          </a>
        )}
        <Link href="/contact?rappel=1" className="btn-primary rounded-full! px-5! shadow-lg ring-2 ring-white">
          <PhoneCall className="size-4" aria-hidden />
          Être rappelé
        </Link>
      </div>
    </>
  )
}
