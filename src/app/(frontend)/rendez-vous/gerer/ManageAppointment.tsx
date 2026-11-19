'use client'

import { CalendarClock, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { ActionForm } from '@/components/forms/Form'
import type { DaySlots } from '@/lib/agenda'

import { cancelMyAppointment, moveMyAppointment } from './actions'

/** Choix d'un autre créneau, ou annulation, depuis le lien reçu par e-mail. */
export function ManageAppointment({ id, token, slots }: { id: number; token: string; slots: DaySlots[] }) {
  const [mode, setMode] = useState<'choice' | 'move' | 'cancel'>('choice')
  const [day, setDay] = useState(slots[0]?.date)
  const [time, setTime] = useState<string>()
  const current = slots.find((d) => d.date === day)
  const hidden = (
    <>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="t" value={token} />
    </>
  )
  const done = (title: string) =>
    function Done(r: { message?: string }) {
      return (
        <>
          <p className="mb-2 text-2xl font-black text-primary">{title}</p>
          <p className="text-ink-2">{r.message}</p>
          <Link href="/" className="btn-ghost mt-6">
            Retour au site
          </Link>
        </>
      )
    }

  if (mode === 'choice') {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => setMode('move')} className="btn-primary">
          <CalendarClock className="size-4" aria-hidden /> Choisir un autre créneau
        </button>
        <button type="button" onClick={() => setMode('cancel')} className="btn-ghost">
          <X className="size-4" aria-hidden /> Annuler le rendez-vous
        </button>
      </div>
    )
  }

  if (mode === 'cancel') {
    return (
      <ActionForm action={cancelMyAppointment} success={done('Rendez-vous annulé')} className="space-y-4">
        {hidden}
        <p className="font-bold text-primary">Vous confirmez l’annulation ?</p>
        <p className="text-sm text-ink-2">Le créneau sera libéré. Vous pourrez reprendre rendez-vous à tout moment.</p>
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn-primary">
            Oui, annuler
          </button>
          <button type="button" onClick={() => setMode('choice')} className="btn-ghost">
            Retour
          </button>
        </div>
      </ActionForm>
    )
  }

  if (!slots.length) {
    return (
      <div className="space-y-4">
        <p className="text-ink-2">Aucun autre créneau n’est disponible en ligne pour le moment : appelez-nous pour convenir d’un nouvel horaire.</p>
        <button type="button" onClick={() => setMode('choice')} className="btn-ghost">
          Retour
        </button>
      </div>
    )
  }

  return (
    <ActionForm action={moveMyAppointment} success={done('Nouveau créneau confirmé')} className="space-y-5">
      {hidden}
      <input type="hidden" name="startsAt" value={time ?? ''} />
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
      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn-primary" disabled={!time}>
          Confirmer ce créneau
        </button>
        <button type="button" onClick={() => setMode('choice')} className="btn-ghost">
          Retour
        </button>
      </div>
    </ActionForm>
  )
}
