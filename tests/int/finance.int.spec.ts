import { describe, expect, it } from 'vitest'

import { computeMonthly } from '@/lib/finance'

describe('computeMonthly', () => {
  it('crédit classique : 10 000 € sur 12 mois à 0 %', () => {
    const r = computeMonthly('credit', { price: 10_000, deposit: 0, months: 12, annualRate: 0 })
    expect(r.monthly).toBeCloseTo(833.33, 2)
    expect(r.creditCost).toBeCloseTo(0, 0)
  })

  it('crédit : 20 000 € sur 48 mois à 5 % (annuité standard)', () => {
    const r = computeMonthly('credit', { price: 20_000, deposit: 0, months: 48, annualRate: 5 })
    expect(r.monthly).toBeCloseTo(460.59, 1)
  })

  it('LOA : la valeur résiduelle baisse la mensualité et reste due en fin de contrat', () => {
    const credit = computeMonthly('credit', { price: 20_000, deposit: 2_000, months: 48, annualRate: 5 })
    const loa = computeMonthly('loa', { price: 20_000, deposit: 2_000, months: 48, annualRate: 5, residualPercent: 35 })
    expect(loa.residualValue).toBe(7_000)
    expect(loa.monthly).toBeLessThan(credit.monthly)
    expect(loa.totalCost).toBeGreaterThan(20_000)
  })

  it('apport supérieur au prix : mensualité nulle, pas négative', () => {
    const r = computeMonthly('credit', { price: 5_000, deposit: 6_000, months: 12, annualRate: 4 })
    expect(r.monthly).toBe(0)
  })
})
