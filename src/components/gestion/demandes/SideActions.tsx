'use client'

import { CalendarPlus, Check, Copy, Loader2 } from 'lucide-react'
import { useId, useState } from 'react'

import { addNote, createAppointment } from '@/app/(gestion)/gestion/demandes/actions'
import { btn, field, label } from '@/components/gestion/ui'
import { APPOINTMENT_KINDS } from '@/lib/gestion/labels'

import { ErrorText, Modal, ModalFooter } from './Modal'
import { useAction } from './useAction'

/** Ajout rapide d'une note interne. */
export function NoteForm({ id }: { id: number }) {
  const { pending, error, run } = useAction()
  const [text, setText] = useState('')
  const textId = useId()
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        if (await run(() => addNote(id, text))) setText('')
      }}
      className="space-y-2"
    >
      <label htmlFor={textId} className="sr-only">
        Nouvelle note interne
      </label>
      <textarea
        id={textId}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        maxLength={4000}
        placeholder="Appel passé, pièce reçue, accord de principe… (visible seulement par l’équipe)"
        className={field}
      />
      <div className="flex items-center justify-between gap-3">
        <ErrorText>{error}</ErrorText>
        <button type="submit" disabled={pending || !text.trim()} className={`${btn.dark} ${btn.small} ml-auto`}>
          {pending && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
          {pending ? 'En cours…' : 'Ajouter'}
        </button>
      </div>
    </form>
  )
}

/** Copie le lien de suivi « Mon espace » à envoyer au client. */
export function CopyLinkButton({ url }: { url: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'error'>('idle')
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setState('copied')
      setTimeout(() => setState('idle'), 2500)
    } catch {
      setState('error')
    }
  }
  return (
    <div>
      <button type="button" onClick={() => void copy()} className={`${btn.ghost} w-full`}>
        {state === 'copied' ? <Check className="size-4 text-emerald-600" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        {state === 'copied' ? 'Lien copié' : 'Copier le lien de suivi client'}
      </button>
      <span className="sr-only" aria-live="polite">
        {state === 'copied' ? 'Lien copié dans le presse-papiers.' : ''}
      </span>
      {state === 'error' && <p className="mt-1 text-xs break-all text-ink-2">Copie impossible. Lien : {url}</p>}
    </div>
  )
}

/** Création d'un rendez-vous lié à la demande, véhicule de la demande pré-rempli. */
export function AppointmentDialog({ id, vehicleTitle }: { id: number; vehicleTitle: string | null }) {
  const { pending, error, setError, run } = useAction()
  const [open, setOpen] = useState(false)
  const whenId = useId()
  const kindId = useId()
  const close = () => {
    setOpen(false)
    setError('')
  }
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`${btn.ghost} w-full`}>
        <CalendarPlus className="size-4" aria-hidden /> Créer un rendez-vous
      </button>
      <Modal open={open} onClose={close} title="Nouveau rendez-vous">
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            const data = new FormData(e.currentTarget)
            const local = String(data.get('when') ?? '')
            const form = new FormData()
            form.set('request', String(id))
            form.set('kind', String(data.get('kind') ?? ''))
            // L'heure saisie est celle du navigateur (Paris) : on l'envoie en ISO pour que le serveur ne la décale pas.
            form.set('startsAt', local ? new Date(local).toISOString() : '')
            if (await run(() => createAppointment(form))) close()
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor={whenId} className={label}>
              Date et heure
            </label>
            <input id={whenId} name="when" type="datetime-local" required step={900} className={field} />
          </div>
          <div>
            <label htmlFor={kindId} className={label}>
              Motif
            </label>
            <select id={kindId} name="kind" required defaultValue="visit" className={field}>
              {Object.entries(APPOINTMENT_KINDS).map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </select>
          </div>
          <p className="text-sm text-ink-2">
            Véhicule : <strong className="text-primary">{vehicleTitle ?? 'aucun'}</strong>
          </p>
          <p className="text-xs text-ink-3">Le client reçoit une confirmation par e-mail.</p>
          <ModalFooter error={error} pending={pending} onCancel={close} submitLabel="Créer le rendez-vous" />
        </form>
      </Modal>
    </>
  )
}
