import { CREDIT_WARNING } from '@/lib/credit-legal'
import type { Formula } from '@/lib/finance'
import { getSettings } from '@/lib/payload'
import { representativeExample } from '@/lib/representative-example'

/** Bloc légal à placer sous toute section qui affiche une mensualité (CONF-01 / Lenbox nov. 2026). */
export async function CreditNotice({
  formulas = ['loa', 'lld', 'credit'],
  className = '',
}: {
  formulas?: Formula[]
  className?: string
}) {
  const settings = await getSettings()
  const examples = formulas.map((f) => representativeExample(settings, f)).filter(Boolean)
  // Toujours la mention Lenbox : l’ancienne phrase en base ne doit plus s’afficher après le 20/11/2026.
  const notice = CREDIT_WARNING

  return (
    <div className={`text-[11px] leading-relaxed text-ink-3 ${className}`}>
      <p className="mb-1.5 font-bold text-primary">{notice}</p>
      {examples.map((text) => (
        <p key={text} className="mb-1">
          {text}
        </p>
      ))}
      <p>
        * Montants hors assurance facultative, sous réserve d’acceptation du dossier par l’organisme prêteur. Vous
        disposez d’un délai de rétractation de 14 jours.
        {settings.company?.orias && ` ${settings.company.name}, intermédiaire en opérations de banque, ORIAS n° ${settings.company.orias}.`}
      </p>
    </div>
  )
}
