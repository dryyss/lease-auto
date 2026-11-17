'use client'

import { Check, Loader2, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { compressImage } from '@/components/forms/Form'

import { addCustomerDocuments } from './actions'

type Doc = { label: string; kind?: string; note?: string }

/** Une ligne par pièce attendue : état (reçue ou non) et bouton d'envoi. Les photos sont compressées avant l'envoi. */
export function DocumentUpload({ requestId, docs, receivedKinds }: { requestId: number; docs: Doc[]; receivedKinds: Record<string, number> }) {
  return (
    <ul className="divide-y divide-line rounded-2xl border border-line">
      {docs.map((d) => (
        <DocRow key={d.label} requestId={requestId} doc={d} received={d.kind ? (receivedKinds[d.kind] ?? 0) : 0} />
      ))}
    </ul>
  )
}

function DocRow({ requestId, doc, received }: { requestId: number; doc: Doc; received: number }) {
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const send = async (list: FileList | null) => {
    if (!list?.length) return
    setState('sending')
    setError('')
    const form = new FormData()
    form.set('request', String(requestId))
    form.set('kind', doc.kind ?? 'other')
    for (const f of Array.from(list)) form.append('files', await compressImage(f))
    try {
      const r = await addCustomerDocuments(form)
      if (!r.ok) {
        setError(r.error)
        setState('idle')
      } else {
        setMessage(r.message ?? 'Reçu')
        setState('done')
        router.refresh()
      }
    } catch {
      setError('Envoi impossible. Vérifiez votre connexion et réessayez.')
      setState('idle')
    }
    if (input.current) input.current.value = ''
  }

  const ok = received > 0 || state === 'done'
  return (
    <li className="flex flex-wrap items-center gap-3 p-3.5 sm:flex-nowrap">
      <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-soft text-ink-3'}`}>
        {ok ? <Check className="size-4" aria-hidden /> : <Upload className="size-4" aria-hidden />}
      </span>
      <span className="min-w-0 flex-1 text-sm">
        <span className="block font-bold text-primary">{doc.label}</span>
        <span className={`block text-xs ${error ? 'font-semibold text-accent' : 'text-ink-3'}`} role={error ? 'alert' : undefined}>
          {error || (state === 'done' ? message : received ? `${received} fichier${received > 1 ? 's' : ''} reçu${received > 1 ? 's' : ''}` : 'À envoyer : PDF ou photo')}
        </span>
      </span>
      <label className={`btn-ghost cursor-pointer px-4! py-2! text-sm ${state === 'sending' ? 'pointer-events-none opacity-60' : ''}`}>
        {state === 'sending' ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />}
        {state === 'sending' ? 'Envoi…' : ok ? 'Ajouter' : 'Envoyer'}
        <input
          ref={input}
          type="file"
          accept="application/pdf,image/*"
          multiple
          className="sr-only"
          disabled={state === 'sending'}
          onChange={(e) => void send(e.target.files)}
          aria-label={`Envoyer : ${doc.label}`}
        />
      </label>
    </li>
  )
}
