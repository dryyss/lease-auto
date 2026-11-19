'use client'

import { Check, FolderOpen, MailCheck, Phone, UserX, X } from 'lucide-react'
import Link from 'next/link'

import { resendAppointmentConfirmation, setAppointmentStatus } from '@/app/(gestion)/gestion/rendez-vous/actions'
import { btn } from '@/components/gestion/ui'
import { fmtDateTime, telHref } from '@/lib/gestion/labels'

import { ConfirmAction } from './dialog'
import { MoveAppointment } from './MoveAppointment'
import type { Appt } from './types'

const small = btn.small

/** Appeler, ouvrir la demande liée, et clôturer : « Honoré » / « Pas venu » une fois passé ; « Décaler », « Renvoyer la confirmation », « Annuler » avant. */
export function AppointmentActions({ a }: { a: Appt }) {
  const when = fmtDateTime(a.startsAt)
  return (
    <div className="flex flex-wrap items-center gap-2">
      <a href={telHref(a.phone)} className={`${btn.ghost} ${small}`}>
        <Phone className="size-3.5" aria-hidden /> Appeler
      </a>
      {a.request && (
        <Link href={`/gestion/demandes/${a.request.id}`} className={`${btn.ghost} ${small}`}>
          <FolderOpen className="size-3.5" aria-hidden /> Demande {a.request.reference}
        </Link>
      )}
      {a.status === 'confirmed' && a.past && (
        <>
          <ConfirmAction
            className={`${btn.dark} ${small}`}
            icon={<Check className="size-3.5" aria-hidden />}
            label="Honoré"
            title="Rendez-vous honoré ?"
            text={`${a.name} est bien venu le ${when}.`}
            cta="Oui, il est venu"
            run={() => setAppointmentStatus(a.id, 'done')}
          />
          <ConfirmAction
            className={`${btn.danger} ${small}`}
            icon={<UserX className="size-3.5" aria-hidden />}
            label="Pas venu"
            title="Le client n’est pas venu ?"
            text={`Le rendez-vous de ${a.name} du ${when} passera en « Annulé ».`}
            cta="Oui, pas venu"
            danger
            run={() => setAppointmentStatus(a.id, 'cancelled')}
          />
        </>
      )}
      {a.status === 'confirmed' && !a.past && (
        <>
          <MoveAppointment a={a} />
          {a.emails && (
            <ConfirmAction
              className={`${btn.ghost} ${small}`}
              icon={<MailCheck className="size-3.5" aria-hidden />}
              label="Renvoyer la confirmation"
              title="Renvoyer la confirmation ?"
              text={`${a.name} reçoit de nouveau l’e-mail de confirmation du ${when} à l’adresse ${a.email}.`}
              cta="Renvoyer l’e-mail"
              run={() => resendAppointmentConfirmation(a.id)}
            />
          )}
          <ConfirmAction
            className={`${btn.danger} ${small}`}
            icon={<X className="size-3.5" aria-hidden />}
            label="Annuler"
            title="Annuler ce rendez-vous ?"
            text={
              a.emails
                ? `Le rendez-vous de ${a.name} du ${when} sera annulé et le créneau libéré. Le client est prévenu par e-mail, avec un lien pour reprendre rendez-vous.`
                : `Le rendez-vous de ${a.name} du ${when} sera annulé et le créneau libéré. Les e-mails ne sont pas encore branchés : appelez le client pour le prévenir.`
            }
            cta="Annuler le rendez-vous"
            danger
            run={() => setAppointmentStatus(a.id, 'cancelled')}
          />
        </>
      )}
    </div>
  )
}
