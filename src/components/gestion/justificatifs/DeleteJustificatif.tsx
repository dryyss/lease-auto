'use client'

import { Trash2 } from 'lucide-react'

import { deleteJustificatif } from '@/app/(gestion)/gestion/justificatifs/actions'
import { ConfirmButton } from '@/components/gestion/medias/ConfirmButton'

/** Suppression d'un justificatif (administrateur). */
export function DeleteJustificatif({ id, filename }: { id: number; filename: string }) {
  return (
    <ConfirmButton
      className="inline-flex items-center gap-1 text-sm font-bold text-ink-3 hover:text-accent"
      icon={<Trash2 className="size-3.5" aria-hidden />}
      label={
        <>
          Supprimer<span className="sr-only"> {filename}</span>
        </>
      }
      title="Supprimer ce justificatif ?"
      cta="Supprimer définitivement"
      run={() => deleteJustificatif(id)}
    >
      <p>
        « {filename} » sera supprimé définitivement. Le client devra le renvoyer si vous en avez
        encore besoin.
      </p>
    </ConfirmButton>
  )
}
