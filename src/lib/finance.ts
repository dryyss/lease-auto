// Calcul des mensualités (ADM-03, PUB-10). Utilisé par l'administration et par le simulateur public.

export type Formula = 'loa' | 'lld' | 'credit'

export type FinanceInput = {
  price: number
  /** Apport ou premier loyer majoré, en euros */
  deposit: number
  months: number
  /** Taux annuel en %, ex. 5.9 */
  annualRate: number
  /** Valeur résiduelle en % du prix (LOA : option d'achat, LLD : valeur de reprise) */
  residualPercent?: number
}

export type FinanceResult = {
  monthly: number
  totalCost: number
  /** Coût total des intérêts / loyers au-delà du prix financé */
  creditCost: number
  residualValue: number
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** Mensualité d'un capital avec valeur résiduelle (annuité constante). */
export function computeMonthly(formula: Formula, input: FinanceInput): FinanceResult {
  const { price, deposit, months, annualRate } = input
  const residualValue = formula === 'credit' ? 0 : (price * (input.residualPercent ?? 0)) / 100
  const financed = Math.max(price - deposit, 0)
  const r = annualRate / 100 / 12

  const monthly =
    r === 0
      ? (financed - residualValue) / months
      : ((financed - residualValue / Math.pow(1 + r, months)) * r) / (1 - Math.pow(1 + r, -months))

  // LOA : le client paie l'option d'achat en fin de contrat. LLD : il restitue le véhicule.
  const paid = deposit + monthly * months + (formula === 'loa' ? residualValue : 0)
  const totalCost = formula === 'lld' ? deposit + monthly * months : paid

  return {
    monthly: round2(monthly),
    totalCost: round2(totalCost),
    creditCost: round2(formula === 'lld' ? totalCost : paid - price),
    residualValue: round2(residualValue),
  }
}
