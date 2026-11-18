'use client'

import { Ban, RotateCcw, ShieldCheck, UserPlus, UserRound } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useId, useRef, useState } from 'react'

import { addMember, setMemberAccess, setMemberRole } from '@/app/(gestion)/gestion/equipe/actions'
import { ConfirmAction, ErrorText, Modal, safeRun } from '@/components/gestion/rendez-vous/dialog'
import { btn, field, label } from '@/components/gestion/ui'

const ROLE_HELP = {
  admin: 'Tout, y compris l’équipe et les réglages du site.',
  commercial: 'Demandes, rendez-vous, clients, véhicules et avis.',
}

/** « Ajouter un membre » : nom, e-mail, rôle. */
export function AddMember() {
  const router = useRouter()
  const ref = useRef<HTMLDialogElement>(null)
  const form = useRef<HTMLFormElement>(null)
  const id = useId()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const submit = async (data: FormData) => {
    setPending(true)
    setError('')
    const r = await safeRun(() => addMember(data))
    setPending(false)
    if (!r.ok) return setError(r.error)
    ref.current?.close()
    form.current?.reset()
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        className={btn.primary}
        onClick={() => {
          setError('')
          ref.current?.showModal()
        }}
      >
        <UserPlus className="size-4" aria-hidden /> Ajouter un membre
      </button>
      <Modal
        dialogRef={ref}
        title="Ajouter un membre"
        description="Aucun mot de passe à créer ici. Le membre se connecte avec cette adresse e-mail depuis la page de connexion de la gestion (/gestion). L’adresse doit être exactement celle qu’il utilisera pour se connecter."
      >
        <form
          ref={form}
          onSubmit={(e) => {
            e.preventDefault()
            void submit(new FormData(e.currentTarget))
          }}
          className="space-y-4"
        >
          <div>
            <label className={label} htmlFor={`${id}-name`}>
              Nom
            </label>
            <input id={`${id}-name`} name="name" required maxLength={120} autoComplete="off" className={field} />
          </div>
          <div>
            <label className={label} htmlFor={`${id}-email`}>
              E-mail de connexion
            </label>
            <input id={`${id}-email`} name="email" type="email" required maxLength={160} autoComplete="off" className={field} />
          </div>
          <fieldset>
            <legend className={label}>Rôle</legend>
            <div className="grid gap-2">
              {(['commercial', 'admin'] as const).map((r) => (
                <label key={r} className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3 has-checked:border-primary has-checked:bg-soft">
                  <input type="radio" name="role" value={r} defaultChecked={r === 'commercial'} className="mt-1 accent-accent" />
                  <span>
                    <span className="block text-sm font-bold text-primary">{r === 'admin' ? 'Administrateur' : 'Commercial'}</span>
                    <span className="block text-xs text-ink-2">{ROLE_HELP[r]}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          {error && <ErrorText>{error}</ErrorText>}
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className={btn.ghost} onClick={() => ref.current?.close()} disabled={pending}>
              Fermer
            </button>
            <button type="submit" className={btn.primary} disabled={pending} aria-busy={pending}>
              {pending ? 'En cours…' : 'Ajouter'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}

/** Changer le rôle, couper ou rétablir l'accès (jamais sur soi-même). */
export function MemberActions({ id, name, role, disabled, self }: { id: number; name: string; role: 'admin' | 'commercial'; disabled: boolean; self: boolean }) {
  const selfReason = 'Vous ne pouvez pas modifier votre propre accès.'
  const next = role === 'admin' ? 'commercial' : 'admin'
  return (
    <div className="flex flex-wrap gap-2">
      <ConfirmAction
        className={`${btn.ghost} ${btn.small}`}
        icon={next === 'admin' ? <ShieldCheck className="size-3.5" aria-hidden /> : <UserRound className="size-3.5" aria-hidden />}
        label={next === 'admin' ? 'Passer administrateur' : 'Passer commercial'}
        title={next === 'admin' ? `Passer ${name} administrateur ?` : `Passer ${name} commercial ?`}
        text={`${next === 'admin' ? 'Administrateur' : 'Commercial'} : ${ROLE_HELP[next]}`}
        cta="Changer le rôle"
        run={() => setMemberRole(id, next)}
        disabled={self}
        disabledReason={selfReason}
      />
      {disabled ? (
        <ConfirmAction
          className={`${btn.ghost} ${btn.small}`}
          icon={<RotateCcw className="size-3.5" aria-hidden />}
          label="Rétablir l’accès"
          title={`Rétablir l’accès de ${name} ?`}
          text="Il pourra de nouveau se connecter à la gestion avec son adresse e-mail."
          cta="Rétablir l’accès"
          run={() => setMemberAccess(id, false)}
        />
      ) : (
        <ConfirmAction
          className={`${btn.danger} ${btn.small}`}
          icon={<Ban className="size-3.5" aria-hidden />}
          label="Couper l’accès"
          title={`Couper l’accès de ${name} ?`}
          text="Il ne pourra plus se connecter. Ses dossiers et son historique restent en place, et vous pourrez rétablir l’accès à tout moment."
          cta="Couper l’accès"
          danger
          run={() => setMemberAccess(id, true)}
          disabled={self}
          disabledReason={selfReason}
        />
      )}
    </div>
  )
}
