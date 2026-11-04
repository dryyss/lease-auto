'use client'

import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Mode = 'budget' | 'monthly'

/** PUB-01 : recherche rapide par marque, budget total ou mensualité. Envoie vers le catalogue filtré. */
export function QuickSearch({ brands }: { brands: { name: string; slug: string }[] }) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('monthly')
  const [brand, setBrand] = useState('')
  const [max, setMax] = useState('')

  const options =
    mode === 'monthly'
      ? [200, 250, 300, 400, 500, 700].map((v) => ({ value: v, label: `${v} €/mois max` }))
      : [10_000, 15_000, 20_000, 25_000, 30_000, 40_000].map((v) => ({ value: v, label: `${v.toLocaleString('fr-FR')} € max` }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (max) params.set(mode === 'monthly' ? 'mensualiteMax' : 'prixMax', max)
    const qs = params.toString()
    router.push(`/vehicules${brand ? `/${brand}` : ''}${qs ? `?${qs}` : ''}`)
  }

  return (
    <form onSubmit={submit} className="card p-5 shadow-2xl shadow-primary/10 sm:p-7">
      <p className="mb-4 text-lg font-black text-primary">Trouvez votre véhicule</p>

      <div role="tablist" aria-label="Type de recherche" className="mb-5 grid grid-cols-2 rounded-2xl bg-soft p-1 text-sm font-bold">
        {(
          [
            ['monthly', 'Par mensualité'],
            ['budget', 'Par budget total'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => {
              setMode(value)
              setMax('')
            }}
            className={`rounded-xl py-2.5 transition ${mode === value ? 'bg-white text-primary shadow-sm' : 'text-ink-3 hover:text-primary'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-ink-2">Marque</span>
          <select value={brand} onChange={(e) => setBrand(e.target.value)} className="input-field">
            <option value="">Toutes les marques</option>
            {brands.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-ink-2">{mode === 'monthly' ? 'Mensualité' : 'Budget'}</span>
          <select value={max} onChange={(e) => setMax(e.target.value)} className="input-field">
            <option value="">Indifférent</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button type="submit" className="btn-primary mt-5 w-full">
        <Search className="size-4" aria-hidden />
        Voir les véhicules
      </button>
    </form>
  )
}
