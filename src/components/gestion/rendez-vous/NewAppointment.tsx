'use client'

import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useId, useRef, useState } from 'react'

import { createAppointment } from '@/app/(gestion)/gestion/rendez-vous/actions'
import { btn, field, label } from '@/components/gestion/ui'
import { APPOINTMENT_KINDS } from '@/lib/gestion/labels'

import { ErrorText, Modal, safeRun } from './dialog'

/** « Nouveau rendez-vous » : rendez-vous pris au téléphone ou en agence. */
export function NewAppointment({ today, vehicles }: { today: string; vehicles: { id: number; title: string }[] }) {
  const router = useRouter()
  const ref = useRef<HTMLDialogElement>(null)
  const form = useRef<HTMLFormElement>(null)
  const id = useId()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState(false)

  const reset = () => {
    setError('')
    setWarning(false)
  }

  const submit = async (data: FormData) => {
    setPending(true)
    setError('')
    if (warning) data.set('force', '1')
    const r = await safeRun(() => createAppointment(data))
    setPending(false)
    if (!r.ok) {
      setError(r.error)
      setWarning('warning' in r && !!r.warning)
      return
    }
    ref.current?.close()
    form.current?.reset()
    reset()
    router.push(`/gestion/rendez-vous?semaine=${r.date}`)
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        className={btn.primary}
        onClick={() => {
          reset()
          ref.current?.showModal()
        }}
      >
        <Plus className="size-4" aria-hidden /> Nouveau rendez-vous
      </button>
      <Modal dialogRef={ref} wide title="Nouveau rendez-vous" description="Le client reçoit aussitôt un e-mail de confirmation.">
        <form
          ref={form}
          onChange={() => warning && reset()}
          onSubmit={(e) => {
            e.preventDefault()
            void submit(new FormData(e.currentTarget))
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <label className={label} htmlFor={`${id}-name`}>
              Nom du client
            </label>
            <input id={`${id}-name`} name="name" required maxLength={120} autoComplete="off" className={field} />
          </div>
          <div>
            <label className={label} htmlFor={`${id}-phone`}>
              Téléphone
            </label>
            <input id={`${id}-phone`} name="phone" type="tel" required maxLength={30} className={field} />
          </div>
          <div>
            <label className={label} htmlFor={`${id}-email`}>
              E-mail
            </label>
            <input id={`${id}-email`} name="email" type="email" required maxLength={160} className={field} />
          </div>
          <div>
            <label className={label} htmlFor={`${id}-date`}>
              Date
            </label>
            <input id={`${id}-date`} name="date" type="date" required min={today} defaultValue={today} className={field} />
          </div>
          <div>
            <label className={label} htmlFor={`${id}-time`}>
              Heure
            </label>
            <input id={`${id}-time`} name="time" type="time" required step={300} defaultValue="10:00" className={field} />
          </div>
          <div>
            <label className={label} htmlFor={`${id}-kind`}>
              Motif
            </label>
            <select id={`${id}-kind`} name="kind" required defaultValue="visit" className={field}>
              {Object.entries(APPOINTMENT_KINDS).map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor={`${id}-vehicle`}>
              Véhicule (facultatif)
            </label>
            <select id={`${id}-vehicle`} name="vehicle" defaultValue="" className={field}>
              <option value="">Aucun véhicule précis</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            {error && <ErrorText tone={warning ? 'warning' : 'error'}>{error}</ErrorText>}
            <div className="mt-2 flex flex-wrap justify-end gap-2">
              <button type="button" className={btn.ghost} onClick={() => ref.current?.close()} disabled={pending}>
                Fermer
              </button>
              <button type="submit" className={btn.primary} disabled={pending} aria-busy={pending}>
                {pending ? 'En cours…' : warning ? 'Créer quand même' : 'Créer le rendez-vous'}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </>
  )
}
