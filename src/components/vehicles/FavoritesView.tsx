'use client'

import { Heart, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { FUEL_LABELS, GEARBOX_LABELS, formatEUR, formatKm } from '@/lib/format'
import { mediaSrc } from '@/lib/media'
import type { Vehicle } from '@/payload-types'

import { MAX_COMPARE, useFavorites } from './Favorites'

/** PUB-08 : liste des favoris et comparaison côte à côte (3 véhicules maximum). */
export function FavoritesView() {
  const { ids, toggle } = useFavorites()
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null)
  const [compare, setCompare] = useState<number[]>([])
  const key = ids.join(',')

  useEffect(() => {
    if (!key) {
      setVehicles([])
      return
    }
    const qs = new URLSearchParams({ depth: '1', limit: '50', 'where[id][in]': key })
    fetch(`/api/vehicles?${qs}`)
      .then((r) => r.json())
      .then((d) => setVehicles(d.docs ?? []))
      .catch(() => setVehicles([]))
  }, [key])

  if (vehicles === null) return <p className="text-ink-2">Chargement…</p>
  if (!vehicles.length)
    return (
      <div className="card p-10 text-center">
        <Heart className="mx-auto mb-4 size-10 text-accent" aria-hidden />
        <p className="mb-2 text-lg font-black text-primary">Aucun favori pour l’instant</p>
        <p className="mb-6 text-sm text-ink-2">Touchez le cœur sur une annonce pour la retrouver ici et la comparer.</p>
        <Link href="/vehicules" className="btn-primary">Voir les véhicules</Link>
      </div>
    )

  const selected = vehicles.filter((v) => compare.includes(v.id))
  const rows: [string, (v: Vehicle) => string][] = [
    ['Prix', (v) => formatEUR(v.price)],
    ['Dès', (v) => (v.monthlyFrom ? `${formatEUR(v.monthlyFrom)}/mois*` : '–')],
    ['Année', (v) => String(v.year)],
    ['Kilométrage', (v) => formatKm(v.mileage)],
    ['Carburant', (v) => FUEL_LABELS[v.fuel] ?? ''],
    ['Boîte', (v) => GEARBOX_LABELS[v.gearbox] ?? ''],
    ['Puissance', (v) => (v.powerHp ? `${v.powerHp} ch` : '–')],
    ['Garantie', (v) => `${v.warrantyMonths ?? 12} mois`],
  ]

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((v) => {
          const checked = compare.includes(v.id)
          const src = mediaSrc(v.gallery?.[0], 'thumb')
          return (
            <li key={v.id} className="card flex gap-4 p-3">
              <Link href={`/vehicule/${v.slug}`} className="relative aspect-3/2 w-28 shrink-0 overflow-hidden rounded-xl bg-soft">
                {src && <Image src={src} alt="" fill sizes="112px" className="object-cover" />}
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/vehicule/${v.slug}`} className="line-clamp-2 text-sm font-bold text-primary hover:text-accent">{v.title}</Link>
                <p className="text-sm font-black text-primary">{formatEUR(v.price)}</p>
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-1.5 font-semibold text-ink-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!checked && compare.length >= MAX_COMPARE}
                      onChange={() => setCompare((c) => (checked ? c.filter((i) => i !== v.id) : [...c, v.id]))}
                      className="accent-accent"
                    />
                    Comparer
                  </label>
                  <button type="button" onClick={() => toggle(v.id)} className="flex items-center gap-1 font-semibold text-ink-3 hover:text-accent">
                    <X className="size-3.5" aria-hidden /> Retirer
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      <section className="mt-12">
        <h2 className="mb-2 text-2xl font-black text-primary">Comparateur</h2>
        <p className="mb-6 text-sm text-ink-2">Cochez jusqu’à {MAX_COMPARE} véhicules pour les comparer côte à côte.</p>
        {selected.length >= 2 ? (
          <div className="overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="bg-soft">
                  <th className="p-4 text-left text-xs text-ink-3 uppercase" scope="col">
                    <span className="sr-only">Critère</span>
                  </th>
                  {selected.map((v) => (
                    <th key={v.id} scope="col" className="p-4 text-left font-black text-primary">
                      <Link href={`/vehicule/${v.slug}`} className="hover:text-accent">{v.title}</Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, get]) => (
                  <tr key={label} className="border-t border-line">
                    <th scope="row" className="p-4 text-left text-xs font-semibold text-ink-3 uppercase">{label}</th>
                    {selected.map((v) => (
                      <td key={v.id} className="p-4 font-semibold text-primary">{get(v)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="card p-6 text-sm text-ink-2">Sélectionnez au moins 2 véhicules.</p>
        )}
      </section>
    </>
  )
}
