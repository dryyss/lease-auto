'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import type { Result } from '@/app/(gestion)/gestion/demandes/actions'

/** Appel d'une action serveur : état « En cours… », message d'erreur, puis actualisation de la page. */
export function useAction() {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const run = async (call: () => Promise<Result>): Promise<boolean> => {
    setPending(true)
    setError('')
    try {
      const r = await call()
      if (!r.ok) {
        setError(r.error)
        return false
      }
      router.refresh()
      return true
    } catch {
      setError('Connexion impossible. Vérifiez le réseau et réessayez.')
      return false
    } finally {
      setPending(false)
    }
  }

  return { pending, error, setError, run }
}
