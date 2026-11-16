'use client'

import { LogIn } from 'lucide-react'
import { useEffect } from 'react'

import { ActionForm, Field, SubmitButton } from '@/components/forms/Form'

import { openSpace } from './actions'

function Opening() {
  // Le cookie vient d'être posé : rechargement complet pour afficher l'espace.
  useEffect(() => window.location.assign('/mon-espace'), [])
  return <p className="font-bold text-primary">Ouverture de votre espace…</p>
}

export function SpaceLogin({ reference }: { reference?: string }) {
  return (
    <ActionForm action={openSpace} success={() => <Opening />} className="space-y-4">
      <Field label="Référence de votre demande" name="reference" required placeholder="LA-202611-AB12C" defaultValue={reference} autoComplete="off" />
      <Field label="E-mail utilisé pour la demande" name="email" type="email" required autoComplete="email" inputMode="email" />
      <SubmitButton>
        <LogIn className="size-4" aria-hidden /> Ouvrir mon espace
      </SubmitButton>
    </ActionForm>
  )
}
