'use client'

import { ArrowRight, Calculator } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import { computeMonthly, type Formula } from '@/lib/finance'
import { FORMULA_LABELS, formatEUR, formatPercent } from '@/lib/format'

export type FormulaRates = {
  formula: Formula
  annualRate: number
  taeg: number | null
  minMonths: number
  maxMonths: number
  defaultMonths: number
  residualPercent: number
}

/** PUB-10 (version accueil) : mensualité selon la formule, l'apport et la durée, avec TAEG et coût total. */
export function QuickSimulator({ rates }: { rates: FormulaRates[] }) {
  const [formula, setFormula] = useState<Formula>(rates[0]?.formula ?? 'loa')
  const [price, setPrice] = useState(20_000)
  const [deposit, setDeposit] = useState(2_000)
  const conf = rates.find((r) => r.formula === formula) ?? rates[0]
  const [months, setMonths] = useState(conf?.defaultMonths ?? 48)

  const clampedMonths = conf ? Math.min(Math.max(months, conf.minMonths), conf.maxMonths) : months
  const result = useMemo(
    () =>
      conf &&
      computeMonthly(formula, {
        price,
        deposit: Math.min(deposit, price),
        months: clampedMonths,
        annualRate: conf.annualRate,
        residualPercent: conf.residualPercent,
      }),
    [conf, formula, price, deposit, clampedMonths],
  )

  if (!conf || !result) return null

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="card space-y-7 p-6 shadow-xl sm:p-8 lg:col-span-3">
        <div role="tablist" aria-label="Formule" className="grid grid-cols-3 rounded-2xl bg-soft p-1 text-sm font-bold">
          {rates.map((r) => (
            <button
              key={r.formula}
              type="button"
              role="tab"
              aria-selected={formula === r.formula}
              onClick={() => setFormula(r.formula)}
              className={`rounded-xl py-2.5 transition ${formula === r.formula ? 'bg-white text-primary shadow-sm' : 'text-ink-3 hover:text-primary'}`}
            >
              {FORMULA_LABELS[r.formula]}
            </button>
          ))}
        </div>

        <Slider label="Prix du véhicule" value={price} onChange={setPrice} min={5_000} max={80_000} step={500} format={formatEUR} />
        <Slider
          label={formula === 'credit' ? 'Apport' : 'Premier loyer majoré'}
          value={Math.min(deposit, price)}
          onChange={setDeposit}
          min={0}
          max={Math.round(price * 0.5)}
          step={250}
          format={formatEUR}
        />
        <Slider
          label="Durée"
          value={clampedMonths}
          onChange={setMonths}
          min={conf.minMonths}
          max={conf.maxMonths}
          step={6}
          format={(v) => `${v} mois`}
        />
      </div>

      <div className="flex flex-col gap-4 lg:col-span-2">
        <div className="gradient-cta flex-1 rounded-3xl p-6 shadow-2xl sm:p-7" aria-live="polite">
          <div className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-accent/35 blur-3xl" aria-hidden />
          <div className="relative">
            <p className="mb-2 flex items-center gap-2 text-xs font-bold tracking-widest text-white/70 uppercase">
              <Calculator className="size-4 text-accent-on-dark" aria-hidden />
              {formula === 'credit' ? 'Mensualité estimée' : 'Loyer estimé'}
            </p>
            <p className="text-4xl font-black tracking-tight tabular-nums sm:text-5xl">
              {formatEUR(result.monthly)}
              <span className="text-lg font-bold text-white/70">/mois*</span>
            </p>
            <p className="mt-1 text-xs text-white/60">pendant {clampedMonths} mois</p>
            <div className="my-5 h-px bg-white/10" />
            <dl className="grid grid-cols-2 gap-4 text-sm">
              {formula === 'lld' ? (
                <div>
                  <dt className="text-[10px] tracking-wider text-white/55 uppercase">En fin de contrat</dt>
                  <dd className="text-lg font-bold">Restitution</dd>
                </div>
              ) : (
                <div>
                  <dt className="text-[10px] tracking-wider text-white/55 uppercase">TAEG fixe</dt>
                  <dd className="text-lg font-bold">{conf.taeg != null ? formatPercent(conf.taeg) : 'Sur devis'}</dd>
                </div>
              )}
              <div>
                <dt className="text-[10px] tracking-wider text-white/55 uppercase">
                  {formula === 'lld' ? 'Total des loyers' : 'Coût total'}
                </dt>
                <dd className="text-lg font-bold">{formatEUR(result.totalCost)}</dd>
              </div>
              {formula === 'loa' && (
                <div className="col-span-2">
                  <dt className="text-[10px] tracking-wider text-white/55 uppercase">Option d’achat finale</dt>
                  <dd className="text-lg font-bold">{formatEUR(result.residualValue)}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
        <Link
          href={`/demande?formule=${formula}&prix=${price}&apport=${deposit}&duree=${clampedMonths}`}
          className="btn-primary group w-full py-4!"
        >
          Faire ma demande avec ces chiffres
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      </div>
    </div>
  )
}

function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  format: (v: number) => string
}) {
  const id = `slider-${label.replace(/\W+/g, '-').toLowerCase()}`
  const percent = max > min ? ((value - min) / (max - min)) * 100 : 0
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-sm font-bold text-ink-2">
          {label}
        </label>
        <span className="text-xl font-black text-primary tabular-nums">{format(value)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full accent-accent"
        style={{ background: `linear-gradient(90deg, #de1d22 ${percent}%, #e4e8f0 ${percent}%)` }}
      />
      <div className="mt-1.5 flex justify-between text-[11px] text-ink-3">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  )
}
