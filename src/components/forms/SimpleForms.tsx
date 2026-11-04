'use client'

import { Bell, CalendarCheck, Camera, Mail, PhoneCall, Send } from 'lucide-react'
import { useState } from 'react'

import { bookAppointment, submitRequest, subscribe } from '@/app/(frontend)/actions'
import type { DaySlots } from '@/lib/agenda'

import { ActionForm, compressImage, Consents, Field, Select, SubmitButton } from './Form'

/** PUB-03 : message ou demande de rappel. */
export function ContactForm({ callback = false, vehicleId }: { callback?: boolean; vehicleId?: number }) {
  const [isCallback, setIsCallback] = useState(callback)
  return (
    <ActionForm
      action={submitRequest}
      success={() => (
        <>
          <p className="mb-2 text-2xl font-black text-primary">{isCallback ? 'C’est noté, on vous rappelle !' : 'Message envoyé !'}</p>
          <p className="text-ink-2">Un conseiller revient vers vous très vite, en général dans la journée ouvrée.</p>
        </>
      )}
      className="space-y-4"
    >
      <input type="hidden" name="type" value={isCallback ? 'callback' : 'contact'} />
      {vehicleId && <input type="hidden" name="vehicle" value={vehicleId} />}
      <div role="tablist" className="grid grid-cols-2 rounded-2xl bg-soft p-1 text-sm font-bold">
        {[
          [false, 'Écrire un message', Mail],
          [true, 'Être rappelé', PhoneCall],
        ].map(([value, label, Icon]) => {
          const I = Icon as typeof Mail
          return (
            <button
              key={String(value)}
              type="button"
              role="tab"
              aria-selected={isCallback === value}
              onClick={() => setIsCallback(value as boolean)}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 transition ${isCallback === value ? 'bg-white text-primary shadow-sm' : 'text-ink-3'}`}
            >
              <I className="size-4" aria-hidden /> {label as string}
            </button>
          )
        })}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prénom" name="firstName" required autoComplete="given-name" />
        <Field label="Nom" name="lastName" required autoComplete="family-name" />
        <Field label="Téléphone" name="phone" type="tel" required autoComplete="tel" inputMode="tel" />
        <Field label="E-mail" name="email" type="email" required autoComplete="email" inputMode="email" />
      </div>
      <Field
        label={isCallback ? 'Quand vous rappeler ? (facultatif)' : 'Votre message'}
        name="message"
        type="textarea"
        required={!isCallback}
        placeholder={isCallback ? 'Ex. demain matin, après 18 h…' : 'Ex. je cherche un SUV hybride, budget 350 €/mois…'}
      />
      <Consents />
      <SubmitButton>
        <Send className="size-4" aria-hidden /> {isCallback ? 'Être rappelé' : 'Envoyer'}
      </SubmitButton>
    </ActionForm>
  )
}

/** PUB-13 : estimation de reprise avec photos. */
export function TradeInForm() {
  return (
    <ActionForm
      action={submitRequest}
      prepare={async (form) => {
        const photos = form.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0)
        form.delete('photos')
        for (const p of photos.slice(0, 8)) form.append('photos', await compressImage(p, 1400, 0.78))
      }}
      success={(r) => (
        <>
          <p className="mb-2 text-2xl font-black text-primary">Demande d’estimation envoyée</p>
          <p className="text-ink-2">Référence {r.reference}. Nous revenons vers vous avec une estimation sous 48 h ouvrées.</p>
        </>
      )}
      className="space-y-4"
    >
      <input type="hidden" name="type" value="tradein" />
      <p className="eyebrow">Votre véhicule actuel</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Marque" name="tiBrand" required placeholder="Ex. Renault" />
        <Field label="Modèle et version" name="tiModel" required placeholder="Ex. Clio 1.0 TCe 90 Zen" />
        <Field label="Année" name="tiYear" type="number" inputMode="numeric" required min={1990} max={2100} />
        <Field label="Kilométrage" name="tiMileage" type="number" inputMode="numeric" required min={0} />
      </div>
      <Field label="État, entretien, options (facultatif)" name="message" type="textarea" placeholder="Ex. carnet d’entretien à jour, rayure sur l’aile arrière…" />
      <label className="card flex cursor-pointer flex-col gap-2 p-4 text-sm">
        <span className="flex items-center gap-2 font-bold text-primary">
          <Camera className="size-4 text-accent" aria-hidden /> Photos (8 maximum : avant, arrière, côtés, intérieur, compteur)
        </span>
        <input type="file" name="photos" accept="image/*" multiple className="text-xs file:mr-3 file:rounded-xl file:border-0 file:bg-accent-soft file:px-3 file:py-2 file:font-bold file:text-accent" />
      </label>
      <p className="eyebrow pt-2">Vos coordonnées</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prénom" name="firstName" required autoComplete="given-name" />
        <Field label="Nom" name="lastName" required autoComplete="family-name" />
        <Field label="Téléphone" name="phone" type="tel" required autoComplete="tel" />
        <Field label="E-mail" name="email" type="email" required autoComplete="email" />
      </div>
      <Consents />
      <SubmitButton>
        <Send className="size-4" aria-hidden /> Demander mon estimation
      </SubmitButton>
    </ActionForm>
  )
}

/** PUB-14 : choix d'un créneau parmi ceux définis dans l'administration. */
export function AppointmentForm({ slots, vehicleId, vehicleTitle }: { slots: DaySlots[]; vehicleId?: number; vehicleTitle?: string }) {
  const [day, setDay] = useState(slots[0]?.date)
  const [time, setTime] = useState<string>()
  const current = slots.find((d) => d.date === day)

  if (!slots.length) {
    return <p className="card p-6 text-ink-2">Aucun créneau en ligne pour le moment : appelez-nous pour convenir d’un rendez-vous.</p>
  }

  return (
    <ActionForm
      action={bookAppointment}
      success={(r) => (
        <>
          <p className="mb-2 text-2xl font-black text-primary">Rendez-vous confirmé</p>
          <p className="text-ink-2">{r.message}</p>
        </>
      )}
      className="space-y-5"
    >
      {vehicleId && <input type="hidden" name="vehicle" value={vehicleId} />}
      <input type="hidden" name="startsAt" value={time ?? ''} />
      {vehicleTitle && <p className="pill">Véhicule : {vehicleTitle}</p>}
      <Select
        label="Motif"
        name="kind"
        defaultValue={vehicleId ? 'test-drive' : 'visit'}
        options={[
          { value: 'test-drive', label: 'Essayer un véhicule' },
          { value: 'visit', label: 'Passer à l’agence' },
        ]}
      />
      <div>
        <p className="mb-2 text-xs font-bold text-ink-2">Jour</p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {slots.map((d) => (
            <button
              key={d.date}
              type="button"
              onClick={() => {
                setDay(d.date)
                setTime(undefined)
              }}
              aria-pressed={day === d.date}
              className={`shrink-0 rounded-2xl border px-4 py-3 text-sm font-bold capitalize transition ${day === d.date ? 'border-accent bg-accent-soft text-accent' : 'border-line text-ink-2 hover:border-ink-3'}`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-bold text-ink-2">Heure</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {current?.times.map((t) => (
            <button
              key={t.iso}
              type="button"
              onClick={() => setTime(t.iso)}
              aria-pressed={time === t.iso}
              className={`rounded-xl border py-2.5 text-sm font-bold transition ${time === t.iso ? 'border-accent bg-accent text-white' : 'border-line text-primary hover:border-accent'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Nom" name="name" required autoComplete="name" />
        <Field label="Téléphone" name="phone" type="tel" required autoComplete="tel" />
        <Field label="E-mail" name="email" type="email" required autoComplete="email" />
      </div>
      <Consents marketing={false} />
      <button type="submit" disabled={!time} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
        <CalendarCheck className="size-4" aria-hidden /> {time ? 'Confirmer le rendez-vous' : 'Choisissez une heure'}
      </button>
    </ActionForm>
  )
}

/** PUB-15 : alerte e-mail sur critères. */
export function AlertForm({ brands, defaults }: { brands: { id: number; name: string }[]; defaults?: { brand?: number; maxPrice?: string; maxMonthly?: string } }) {
  return (
    <ActionForm
      action={subscribe}
      success={(r) => <p className="font-bold text-primary">{r.message}</p>}
      className="space-y-4"
    >
      <input type="hidden" name="mode" value="alert" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Marque" name="brands" defaultValue={defaults?.brand ? String(defaults.brand) : ''} options={[{ value: '', label: 'Toutes' }, ...brands.map((b) => ({ value: String(b.id), label: b.name }))]} />
        <Select
          label="Carburant"
          name="fuels"
          options={[
            { value: '', label: 'Tous' },
            { value: 'essence', label: 'Essence' },
            { value: 'diesel', label: 'Diesel' },
            { value: 'hybride', label: 'Hybride' },
            { value: 'electrique', label: 'Électrique' },
          ]}
        />
        <Field label="Prix max (€)" name="maxPrice" type="number" inputMode="numeric" defaultValue={defaults?.maxPrice} />
        <Field label="Mensualité max (€)" name="maxMonthly" type="number" inputMode="numeric" defaultValue={defaults?.maxMonthly} />
      </div>
      <Field label="E-mail" name="email" type="email" required autoComplete="email" />
      <label className="flex items-start gap-2.5 text-[13px] text-ink-2">
        <input type="checkbox" name="consent" required className="mt-0.5 size-4 accent-accent" />
        J’accepte de recevoir un e-mail quand un véhicule correspond (désinscription en un clic).
      </label>
      <SubmitButton>
        <Bell className="size-4" aria-hidden /> Créer mon alerte
      </SubmitButton>
    </ActionForm>
  )
}

/** Inscription newsletter du pied de page. */
export function NewsletterForm() {
  return (
    <ActionForm action={subscribe} success={(r) => <p className="text-sm font-bold text-primary">{r.message}</p>}>
      <input type="hidden" name="mode" value="newsletter" />
      <div className="flex gap-2">
        <label className="sr-only" htmlFor="newsletter-email">
          E-mail
        </label>
        <input id="newsletter-email" type="email" name="email" required placeholder="Votre e-mail" autoComplete="email" className="input-field min-w-0 flex-1 border-white/15! bg-white/5! text-white! placeholder:text-white/40" />
        <button type="submit" className="btn-primary shrink-0 px-4!" aria-label="S’inscrire">
          <Send className="size-4" aria-hidden />
        </button>
      </div>
      <label className="mt-2.5 flex items-start gap-2 text-[11px] text-white/55">
        <input type="checkbox" name="consent" required className="mt-0.5 accent-accent" />
        J’accepte de recevoir les nouveautés et offres Lease Auto.
      </label>
    </ActionForm>
  )
}
