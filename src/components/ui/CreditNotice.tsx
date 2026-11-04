import type { Formula } from '@/lib/finance'
import { getSettings } from '@/lib/payload'
import { representativeExample } from '@/lib/representative-example'

/** Bloc légal à placer sous toute section qui affiche une mensualité (CONF-01). */
export async function CreditNotice({
  formulas = ['loa', 'lld', 'credit'],
  className = '',
}: {
  formulas?: Formula[]
  className?: string
}) {
  const settings = await getSettings()
  const examples = formulas.map((f) => representativeExample(settings, f)).filter(Boolean)
  const notice = settings.financing?.legalNotice

  return (
    <div className={`text-[11px] leading-relaxed text-ink-3 ${className}`}>
      {notice && <p className="mb-1.5 font-bold text-primary">{notice}</p>}
      {examples.map((text) => (
        <p key={text} className="mb-1">
          {text}
        </p>
      ))}
      <p>
        * Mensualités indicatives, sous réserve d’acceptation du dossier par l’organisme prêteur. Vous disposez d’un
        délai de rétractation de 14 jours.
        {settings.company?.orias && ` ${settings.company.name}, intermédiaire en opérations de banque, ORIAS n° ${settings.company.orias}.`}
      </p>
    </div>
  )
}
