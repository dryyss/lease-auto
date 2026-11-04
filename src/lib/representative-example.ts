import type { Setting } from '@/payload-types'

import { computeMonthly, type Formula } from './finance'
import { formatEUR, formatEURCents, formatPercent } from './format'

const EXAMPLE_PRICE = 20_000

/**
 * CONF-01 : exemple représentatif obligatoire (art. L312-8 du Code de la consommation)
 * sur toute publicité chiffrée. Texte saisi dans les Réglages s'il existe, sinon calculé
 * avec les mêmes taux que les mensualités affichées, pour qu'ils ne puissent pas diverger.
 */
export function representativeExample(settings: Setting, formula: Formula): string | null {
  const conf = settings.financing?.[formula]
  if (!conf?.enabled) return null
  if (conf.representativeExample) return conf.representativeExample
  // La LLD n'est pas un crédit : pas de TAEG. LOA et crédit en exigent un.
  if (!conf.defaultMonths || conf.annualRate == null || (formula !== 'lld' && conf.taeg == null)) return null

  const deposit = (EXAMPLE_PRICE * (conf.defaultDepositPercent ?? 0)) / 100
  const residualPercent = 'residualPercent' in conf ? (conf.residualPercent ?? 0) : 0
  const r = computeMonthly(formula, {
    price: EXAMPLE_PRICE,
    deposit,
    months: conf.defaultMonths,
    annualRate: conf.annualRate,
    residualPercent,
  })
  const n = conf.defaultMonths

  if (formula === 'credit') {
    return (
      `Exemple représentatif : pour un crédit affecté de ${formatEUR(EXAMPLE_PRICE - deposit)} sur ${n} mois, ` +
      `${n} mensualités de ${formatEURCents(r.monthly)}. Taux débiteur fixe ${formatPercent(conf.annualRate)}, ` +
      `TAEG fixe ${formatPercent(conf.taeg)}. Montant total dû : ${formatEURCents(r.totalCost - deposit)}.`
    )
  }

  const first = deposit > 0 ? `un premier loyer majoré de ${formatEUR(deposit)}, puis ` : ''
  const end =
    formula === 'loa'
      ? ` Option d'achat finale : ${formatEUR(r.residualValue)}. Coût total en cas d'acquisition : ${formatEURCents(r.totalCost)}.`
      : ` Montant total dû : ${formatEURCents(r.totalCost)}. Véhicule restitué en fin de contrat.`
  const label = formula === 'loa' ? 'location avec option d’achat' : 'location longue durée'

  return (
    `Exemple représentatif en ${label} pour un véhicule de ${formatEUR(EXAMPLE_PRICE)} TTC sur ${n} mois : ` +
    `${first}${n} loyers de ${formatEURCents(r.monthly)}.${end}` +
    (formula === 'loa' ? ` TAEG fixe ${formatPercent(conf.taeg)}.` : ' Hors assurances et prestations facultatives.')
  )
}
