'use client'

import { ArrowLeft, ArrowRight, FileUp, Send } from 'lucide-react'
import Link from 'next/link'
import { useRef, useState } from 'react'

import { submitRequest } from '@/app/(frontend)/actions'

import { ActionForm, compressImage, Consents, Field, Select } from './Form'

type VehicleOption = { id: number; title: string; price: number }

const STEPS = ['Votre projet', 'Votre situation', 'Vos coordonnées', 'Justificatifs'] as const

const DOCS = [
  { kind: 'id', label: 'Pièce d’identité (recto/verso)' },
  { kind: 'address', label: 'Justificatif de domicile de moins de 3 mois' },
  { kind: 'payslips', label: '3 derniers bulletins de salaire' },
  { kind: 'tax', label: 'Dernier avis d’imposition' },
  { kind: 'rib', label: 'RIB' },
  { kind: 'kbis', label: 'Kbis ou avis SIREN (pros)' },
] as const

/** PUB-12 : demande de financement en 4 étapes, avec envoi facultatif des justificatifs. */
export function FinancingForm({
  vehicles,
  defaults,
}: {
  vehicles: VehicleOption[]
  defaults: { vehicle?: string; formula?: string; months?: string; deposit?: string }
}) {
  const [step, setStep] = useState(0)
  const steps = useRef<(HTMLDivElement | null)[]>([])

  const next = () => {
    const current = steps.current[step]
    const invalid = current?.querySelector<HTMLInputElement>(':invalid')
    if (invalid) {
      invalid.reportValidity()
      return
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <ActionForm
      action={submitRequest}
      prepare={async (form) => {
        form.delete('documents')
        form.delete('documentKinds')
        const inputs = steps.current[3]?.querySelectorAll<HTMLInputElement>('input[type=file]') ?? []
        for (const input of inputs) {
          for (const file of Array.from(input.files ?? [])) {
            form.append('documents', await compressImage(file))
            form.append('documentKinds', input.dataset.kind ?? 'other')
          }
        }
      }}
      success={(r) => (
        <>
          <p className="mb-2 text-2xl font-black text-primary">Demande envoyée !</p>
          <p className="text-ink-2">
            Votre référence : <strong className="text-primary">{r.reference}</strong>. Un récapitulatif vous a été envoyé par e-mail et un conseiller vous
            répond sous 48 h ouvrées.
          </p>
          <Link href="/vehicules" className="btn-ghost mt-6">
            Retour aux véhicules
          </Link>
        </>
      )}
    >
      <input type="hidden" name="type" value="financing" />
      <input type="hidden" name="source" value="formulaire-demande" />

      <ol className="mb-8 grid grid-cols-4 gap-1.5 sm:gap-2" aria-label="Étapes">
        {STEPS.map((label, i) => (
          <li key={label} aria-current={i === step ? 'step' : undefined}>
            <span className={`block h-1.5 rounded-full ${i <= step ? 'bg-accent' : 'bg-line'}`} />
            <span className={`mt-2 hidden text-xs font-bold sm:block ${i === step ? 'text-primary' : 'text-ink-3'}`}>
              {i + 1}. {label}
            </span>
          </li>
        ))}
      </ol>
      <p className="mb-6 text-xl font-black text-primary sm:hidden">
        {step + 1}. {STEPS[step]}
      </p>

      <div ref={(el) => void (steps.current[0] = el)} hidden={step !== 0} className="space-y-4">
        <Select
          label="Véhicule souhaité"
          name="vehicle"
          defaultValue={defaults.vehicle}
          options={[{ value: '', label: 'Je n’ai pas encore choisi' }, ...vehicles.map((v) => ({ value: String(v.id), label: `${v.title} · ${v.price.toLocaleString('fr-FR')} €` }))]}
        />
        <fieldset>
          <legend className="mb-1.5 text-xs font-bold text-ink-2">Formule</legend>
          <div className="grid grid-cols-3 gap-2">
            {[
              ['loa', 'LOA'],
              ['lld', 'LLD'],
              ['credit', 'Crédit'],
            ].map(([value, label]) => (
              <label key={value} className="cursor-pointer">
                <input type="radio" name="formula" value={value} defaultChecked={(defaults.formula ?? 'loa') === value} className="peer sr-only" />
                <span className="block rounded-2xl border border-line py-3 text-center text-sm font-bold text-ink-2 transition peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:text-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
                  {label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Durée souhaitée (mois)" name="months" type="number" inputMode="numeric" min={12} max={84} defaultValue={defaults.months ?? 48} />
          <Field label="Apport (€)" name="deposit" type="number" inputMode="numeric" min={0} defaultValue={defaults.deposit ?? 0} />
        </div>
      </div>

      <div ref={(el) => void (steps.current[1] = el)} hidden={step !== 1} className="space-y-4">
        <Select
          label="Situation professionnelle"
          name="profile"
          required
          options={[
            { value: '', label: 'Choisir…' },
            { value: 'cdi', label: 'Salarié en CDI' },
            { value: 'cdd', label: 'Salarié en CDD ou intérim' },
            { value: 'independant', label: 'Indépendant, VTC, artisan' },
            { value: 'societe', label: 'Société' },
            { value: 'retraite', label: 'Retraité' },
            { value: 'autre', label: 'Autre' },
          ]}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Revenus nets mensuels (€)" name="monthlyIncome" type="number" inputMode="numeric" min={0} />
          <Field label="Mensualité maximale souhaitée (€)" name="monthlyBudget" type="number" inputMode="numeric" min={0} />
        </div>
      </div>

      <div ref={(el) => void (steps.current[2] = el)} hidden={step !== 2} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom" name="firstName" required autoComplete="given-name" />
          <Field label="Nom" name="lastName" required autoComplete="family-name" />
          <Field label="E-mail" name="email" type="email" required autoComplete="email" inputMode="email" />
          <Field label="Téléphone" name="phone" type="tel" required autoComplete="tel" inputMode="tel" />
          <Field label="Code postal" name="postalCode" autoComplete="postal-code" inputMode="numeric" />
        </div>
        <Field label="Précisions (facultatif)" name="message" type="textarea" placeholder="Ex. reprise de mon véhicule actuel, date de livraison souhaitée…" />
      </div>

      <div ref={(el) => void (steps.current[3] = el)} hidden={step !== 3} className="space-y-4">
        <p className="rounded-2xl bg-soft p-4 text-sm text-ink-2">
          Facultatif, mais cela accélère l’étude. Photos ou PDF lisibles, 4 Mo au total (les photos sont compressées automatiquement). Vous pourrez
          aussi les envoyer plus tard en réponse à notre e-mail.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {DOCS.map((d) => (
            <label key={d.kind} className="card flex cursor-pointer flex-col gap-2 p-4 text-sm transition hover:border-accent">
              <span className="flex items-center gap-2 font-bold text-primary">
                <FileUp className="size-4 text-accent" aria-hidden />
                {d.label}
              </span>
              <input type="file" data-kind={d.kind} accept="application/pdf,image/*" multiple className="text-xs text-ink-2 file:mr-3 file:rounded-xl file:border-0 file:bg-accent-soft file:px-3 file:py-2 file:font-bold file:text-accent" />
            </label>
          ))}
        </div>
        <Consents />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        {step > 0 ? (
          <button type="button" onClick={() => setStep((s) => s - 1)} className="btn-ghost">
            <ArrowLeft className="size-4" aria-hidden /> Retour
          </button>
        ) : (
          <span />
        )}
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={next} className="btn-primary">
            Continuer <ArrowRight className="size-4" aria-hidden />
          </button>
        ) : (
          <button type="submit" className="btn-primary">
            <Send className="size-4" aria-hidden /> Envoyer ma demande
          </button>
        )}
      </div>
    </ActionForm>
  )
}
