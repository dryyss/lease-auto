import type { Setting } from '@/payload-types'

import { computeMonthly, type Formula } from './finance'
import { formatEUR, formatEURCents, formatPercent } from './format'

const EXAMPLE_PRICE = 20_000

/**
 * CONF-01 / Lenbox nov. 2026 : exemple représentatif obligatoire sur toute publicité chiffrée.
 * Texte saisi dans les Réglages s'il existe, sinon calculé avec les mêmes taux que le simulateur.
 */
export function representativeExample(settings: Setting, formula: Formula): string | null {
  const conf = settings.financing?.[formula]
  if (!conf?.enabled) return null
  if (conf.representativeExample) return conf.representativeExample
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
  const financed = EXAMPLE_PRICE - deposit

  if (formula === 'credit') {
    return (
      `Exemple représentatif : pour un crédit affecté de ${formatEUR(financed)} sur ${n} mois, ` +
      `${n} mensualités de ${formatEURCents(r.monthly)}. Taux débiteur fixe ${formatPercent(conf.annualRate)}, ` +
      `TAEG fixe ${formatPercent(conf.taeg)}. Coût du crédit : ${formatEURCents(r.creditCost)}. ` +
      `Montant total dû : ${formatEURCents(r.totalCost - deposit)}. Hors assurance facultative.`
    )
  }

  const first = deposit > 0 ? `un premier loyer majoré de ${formatEUR(deposit)}, puis ` : ''
  if (formula === 'loa') {
    return (
      `Exemple représentatif en location avec option d’achat pour un véhicule de ${formatEUR(EXAMPLE_PRICE)} TTC sur ${n} mois : ` +
      `${first}${n} loyers de ${formatEURCents(r.monthly)}. Montant du crédit : ${formatEUR(financed)}. ` +
      `Taux débiteur fixe ${formatPercent(conf.annualRate)}, TAEG fixe ${formatPercent(conf.taeg)}. ` +
      `Option d'achat finale : ${formatEUR(r.residualValue)}. Coût du crédit : ${formatEURCents(r.creditCost)}. ` +
      `Coût total en cas d'acquisition : ${formatEURCents(r.totalCost)}. Hors assurance facultative.`
    )
  }

  return (
    `Exemple représentatif en location longue durée pour un véhicule de ${formatEUR(EXAMPLE_PRICE)} TTC sur ${n} mois : ` +
    `${first}${n} loyers de ${formatEURCents(r.monthly)}. Montant total des loyers : ${formatEURCents(r.totalCost)}. ` +
    `Véhicule restitué en fin de contrat. Hors assurances et prestations facultatives.`
  )
}
