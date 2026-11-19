'use client'

import { CalendarClock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useId, useRef, useState } from 'react'

import { moveAppointment } from '@/app/(gestion)/gestion/rendez-vous/actions'
import { btn, field, label } from '@/components/gestion/ui'
import { fmtDateTime } from '@/lib/gestion/labels'

import { ErrorText, Modal, safeRun } from './dialog'
import type { Appt } from './types'

/** Date (AAAA-MM-JJ) et heure (HH:MM) à Paris, pour pré-remplir le formulaire. */
const parisParts = (iso: string) => {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' }),
    time: d.toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' }),
  }
}

/** « Décaler » : choisir un nouvel horaire. Le client reçoit le nouveau créneau par e-mail. */
export function MoveAppointment({ a }: { a: Appt }) {
  const router = useRouter()
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState(false)
  const initial = parisParts(a.startsAt)
  const today = new Date().toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' })

  const reset = () => {
    setError('')
    setWarning(false)
  }

  const submit = async (data: FormData) => {
    setPending(true)
    setError('')
    data.set('id', String(a.id))
    if (warning) data.set('force', '1')
    const r = await safeRun(() => moveAppointment(data))
    setPending(false)
    if (!r.ok) {
      setError(r.error)
      setWarning('warning' in r && !!r.warning)
      return
    }
    ref.current?.close()
    reset()
    router.push(`/gestion/rendez-vous?semaine=${r.date}`)
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        className={`${btn.ghost} ${btn.small}`}
        onClick={() => {
          reset()
          ref.current?.showModal()
        }}
      >
        <CalendarClock className="size-3.5" aria-hidden /> Décaler
      </button>
      <Modal
        dialogRef={ref}
        title={`Décaler le rendez-vous de ${a.name}`}
        description={
          <>
            Prévu {fmtDateTime(a.startsAt)}.{' '}
            {a.emails ? 'Le client reçoit le nouvel horaire par e-mail.' : 'Les e-mails ne sont pas encore branchés : prévenez le client par téléphone.'}
          </>
        }
      >
        <form
          onChange={() => warning && reset()}
          onSubmit={(e) => {
            e.preventDefault()
            void submit(new FormData(e.currentTarget))
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div>
            <label className={label} htmlFor={`${id}-date`}>
              Nouvelle date
            </label>
            <input id={`${id}-date`} name="date" type="date" required min={today} defaultValue={initial.date} className={field} />
          </div>
          <div>
            <label className={label} htmlFor={`${id}-time`}>
              Nouvelle heure
            </label>
            <input id={`${id}-time`} name="time" type="time" required step={300} defaultValue={initial.time} className={field} />
          </div>
          <div className="sm:col-span-2">
            {error && <ErrorText tone={warning ? 'warning' : 'error'}>{error}</ErrorText>}
            <div className="mt-2 flex flex-wrap justify-end gap-2">
              <button type="button" className={btn.ghost} onClick={() => ref.current?.close()} disabled={pending}>
                Retour
              </button>
              <button type="submit" className={btn.primary} disabled={pending} aria-busy={pending}>
                {pending ? 'En cours…' : warning ? 'Décaler quand même' : 'Décaler le rendez-vous'}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </>
  )
}
