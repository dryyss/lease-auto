'use client'

import { ArrowRight, Ban, Loader2 } from 'lucide-react'
import { useId, useState } from 'react'

import { advance, assign, refuse } from '@/app/(gestion)/gestion/demandes/actions'
import { btn, field, label } from '@/components/gestion/ui'
import { reasonsFor } from '@/lib/refusal-reasons'
import type { Request } from '@/payload-types'

import { ErrorText, Modal, ModalFooter } from './Modal'
import { useAction } from './useAction'

type Step = { label: string; confirm?: { title: string; text: string } }

/** Action principale selon l'étape du dossier (une seule à la fois). */
function mainStep(type: Request['type'], status: Request['status']): Step | null {
  if (status === 'new') return { label: 'Prendre en charge' }
  if (type === 'financing') {
    if (status === 'review')
      return { label: 'Accorder', confirm: { title: 'Accorder le financement ?', text: 'Le dossier passe en « Accord » et le client reçoit un e-mail lui annonçant la bonne nouvelle.' } }
    if (status === 'approved')
      return { label: 'Marquer livrée', confirm: { title: 'Le véhicule a été remis au client ?', text: 'Le dossier passe en « Livrée » et le client reçoit un e-mail de confirmation.' } }
    return null
  }
  if (status === 'review' || status === 'approved')
    return { label: 'Clôturer', confirm: { title: 'Clôturer la demande ?', text: 'La demande est marquée « Traitée » et quitte la liste des dossiers en cours.' } }
  return null
}

export function RequestActions({ id, type, status }: { id: number; type: Request['type']; status: Request['status'] }) {
  const step = mainStep(type, status)
  const canRefuse = status !== 'refused' && status !== 'delivered'
  if (!step && !canRefuse) return null
  return (
    <>
      {canRefuse && <RefuseButton id={id} financing={type === 'financing'} />}
      {step && <MainAction id={id} status={status} step={step} />}
    </>
  )
}

function MainAction({ id, status, step }: { id: number; status: Request['status']; step: Step }) {
  const { pending, error, setError, run } = useAction()
  const [open, setOpen] = useState(false)
  const go = async () => {
    if (await run(() => advance(id, status))) setOpen(false)
  }
  return (
    <span className="flex flex-col items-end gap-1">
      <button type="button" className={btn.primary} disabled={pending} onClick={() => (step.confirm ? setOpen(true) : void go())}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ArrowRight className="size-4" aria-hidden />}
        {pending ? 'En cours…' : step.label}
      </button>
      {!open && <ErrorText>{error}</ErrorText>}
      {step.confirm && (
        <Modal
          open={open}
          onClose={() => {
            setOpen(false)
            setError('')
          }}
          title={step.confirm.title}
        >
          <p className="text-sm text-ink-2">{step.confirm.text}</p>
          <ModalFooter error={error} pending={pending} onCancel={() => setOpen(false)} submitLabel={step.label} submitType="button" onSubmit={() => void go()} />
        </Modal>
      )}
    </span>
  )
}

function RefuseButton({ id, financing }: { id: number; financing: boolean }) {
  const { pending, error, setError, run } = useAction()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const noteId = useId()
  const title = financing ? 'Refuser le dossier' : 'Classer sans suite'
  const close = () => {
    setOpen(false)
    setError('')
  }

  return (
    <>
      <button type="button" className={btn.danger} onClick={() => setOpen(true)}>
        <Ban className="size-4" aria-hidden /> {financing ? 'Refuser' : 'Classer sans suite'}
      </button>
      <Modal open={open} onClose={close} title={title}>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            if (await run(() => refuse(id, reason, note))) close()
          }}
        >
          <fieldset>
            <legend className={label}>Motif</legend>
            <div className="grid gap-1.5">
              {reasonsFor(financing ? 'financing' : 'other').map((r) => (
                <label key={r.value} className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-line px-3 py-2 text-sm has-checked:border-primary has-checked:bg-soft">
                  <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} required className="accent-accent" />
                  {r.label}
                </label>
              ))}
            </div>
          </fieldset>
          <label htmlFor={noteId} className={`${label} mt-4`}>
            Précision {reason === 'other' ? '(obligatoire)' : '(facultatif)'}
          </label>
          <textarea id={noteId} value={note} onChange={(e) => setNote(e.target.value)} rows={3} required={reason === 'other'} maxLength={1000} className={field} />
          <p className="mt-2 text-xs text-ink-3">Usage interne : le motif n’est jamais montré au client.</p>
          <ModalFooter error={error} pending={pending} onCancel={close} submitLabel={title} tone="danger" />
        </form>
      </Modal>
    </>
  )
}

/** Choix du conseiller qui suit le dossier. */
export function AssignSelect({ id, current, members }: { id: number; current: number | null; members: { id: number; name: string }[] }) {
  const { pending, error, run } = useAction()
  const selectId = useId()
  return (
    <span className="flex flex-col gap-1">
      <span className="flex items-center gap-2">
        <label htmlFor={selectId} className="text-xs font-bold text-ink-2">
          Conseiller
        </label>
        <select
          id={selectId}
          value={current ?? ''}
          disabled={pending}
          onChange={(e) => void run(() => assign(id, e.target.value ? Number(e.target.value) : null))}
          className={`${field} w-auto! py-2!`}
        >
          <option value="">Personne</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        {pending && <Loader2 className="size-4 animate-spin text-ink-3" aria-label="En cours…" />}
      </span>
      <ErrorText>{error}</ErrorText>
    </span>
  )
}
