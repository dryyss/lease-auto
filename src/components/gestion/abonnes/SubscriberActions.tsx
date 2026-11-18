'use client'

import { BellOff, Trash2 } from 'lucide-react'

import { deleteSubscriber, unsubscribe } from '@/app/(gestion)/gestion/abonnes/actions'
import { ConfirmButton } from '@/components/gestion/medias/ConfirmButton'
import { btn } from '@/components/gestion/ui'

/** Désinscrire (newsletter et alerte) ou supprimer la fiche d'un abonné. */
export function SubscriberActions({
  id,
  email,
  active,
}: {
  id: number
  email: string
  active: boolean
}) {
  return (
    <span className="flex flex-wrap gap-2">
      {active && (
        <ConfirmButton
          className={`${btn.ghost} ${btn.small}`}
          icon={<BellOff className="size-3.5" aria-hidden />}
          label={
            <>
              Désinscrire<span className="sr-only"> {email}</span>
            </>
          }
          title="Désinscrire cet abonné ?"
          cta="Désinscrire"
          danger={false}
          run={() => unsubscribe(id)}
        >
          <p>
            {email} ne recevra plus ni la newsletter ni les alertes véhicule. Sa fiche et la preuve
            de son consentement sont conservées.
          </p>
        </ConfirmButton>
      )}
      <ConfirmButton
        className={`${btn.danger} ${btn.small}`}
        icon={<Trash2 className="size-3.5" aria-hidden />}
        label={
          <>
            Supprimer<span className="sr-only"> {email}</span>
          </>
        }
        title="Supprimer cet abonné ?"
        cta="Supprimer définitivement"
        run={() => deleteSubscriber(id)}
      >
        <p>
          La fiche de {email} sera effacée, avec la preuve de son consentement. À réserver aux
          demandes d’effacement des données.
        </p>
        <p>Pour simplement arrêter les envois, utilisez plutôt « Désinscrire ».</p>
      </ConfirmButton>
    </span>
  )
}
