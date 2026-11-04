import type { FormulaRates } from '@/components/home/QuickSimulator'

import type { Formula } from './finance'
import { getSettings } from './payload'

/** Taux des formules actives (Réglages), pour les simulateurs. */
export async function getFormulaRates(only?: Formula[]): Promise<FormulaRates[]> {
  const settings = await getSettings()
  return ((only ?? ['loa', 'lld', 'credit']) as Formula[]).flatMap((formula) => {
    const c = settings.financing?.[formula]
    if (!c?.enabled || c.annualRate == null) return []
    return [
      {
        formula,
        annualRate: c.annualRate,
        taeg: c.taeg ?? null,
        minMonths: c.minMonths ?? 12,
        maxMonths: c.maxMonths ?? 72,
        defaultMonths: c.defaultMonths ?? 48,
        residualPercent: 'residualPercent' in c ? (c.residualPercent ?? 0) : 0,
      },
    ]
  })
}
