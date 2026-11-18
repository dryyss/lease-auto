'use client'

import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { addBrand, addModel } from '@/app/(gestion)/gestion/marques/actions'
import { Dialog } from '@/components/gestion/Dialog'
import { ErrorText, safeRun } from '@/components/gestion/rendez-vous/dialog'
import { btn, field, label } from '@/components/gestion/ui'

/** Bouton « Ajouter une marque » et sa fenêtre. */
export function AddBrand() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className={btn.primary} onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden /> Ajouter une marque
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Ajouter une marque">
        {open && (
          <NameForm
            id="nouvelle-marque"
            fieldLabel="Nom de la marque"
            placeholder="Ex. Peugeot"
            cta="Ajouter la marque"
            run={addBrand}
            onDone={() => setOpen(false)}
          />
        )}
      </Dialog>
    </>
  )
}

/** Champ « Ajouter un modèle » sous une marque. */
export function AddModel({ brandId, brandName }: { brandId: number; brandName: string }) {
  return (
    <NameForm
      id={`modele-${brandId}`}
      fieldLabel={`Nouveau modèle ${brandName}`}
      placeholder="Ex. 3008"
      cta="Ajouter"
      run={(n) => addModel(brandId, n)}
      inline
    />
  )
}

function NameForm({
  id,
  fieldLabel,
  placeholder,
  cta,
  run,
  onDone,
  inline = false,
}: {
  id: string
  fieldLabel: string
  placeholder: string
  cta: string
  run: (name: string) => Promise<{ ok: true } | { ok: false; error: string }>
  onDone?: () => void
  inline?: boolean
}) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setPending(true)
    setError('')
    const r = await safeRun(() => run(name))
    setPending(false)
    if (!r.ok) return setError(r.error)
    setName('')
    onDone?.()
    router.refresh()
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
    >
      <label htmlFor={id} className={inline ? 'sr-only' : label}>
        {fieldLabel}
      </label>
      <div className={inline ? 'flex gap-2' : ''}>
        <input
          id={id}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          required
          placeholder={
            inline ? `${fieldLabel} (ex. ${placeholder.replace('Ex. ', '')})` : placeholder
          }
          className={field}
        />
        <div className={inline ? 'shrink-0' : 'mt-5 flex justify-end'}>
          <button
            type="submit"
            className={inline ? btn.dark : btn.primary}
            disabled={pending || !name.trim()}
            aria-busy={pending}
          >
            {pending ? (
              'En cours…'
            ) : inline ? (
              <>
                <Plus className="size-4" aria-hidden /> {cta}
              </>
            ) : (
              cta
            )}
          </button>
        </div>
      </div>
      {error && <ErrorText>{error}</ErrorText>}
    </form>
  )
}
