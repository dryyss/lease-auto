'use client'

import { ChevronDown, ExternalLink, Tag, Trash2 } from 'lucide-react'

import { deleteBrand, deleteModel } from '@/app/(gestion)/gestion/marques/actions'
import { ConfirmButton } from '@/components/gestion/medias/ConfirmButton'
import { Badge, btn } from '@/components/gestion/ui'
import { plural } from '@/lib/gestion/labels'

import { AddModel } from './AddBrand'
import { EntryEditor } from './EntryEditor'

export type ModelRow = { id: number; name: string; slug: string; vehicles: number }
export type BrandRow = {
  id: number
  name: string
  slug: string
  logo: { src: string; alt: string } | null
  vehicles: number
  models: ModelRow[]
}

const linkCls = `${btn.ghost} ${btn.small}`

/** Marques repliables, avec leurs modèles en sous-liste. */
export function BrandList({
  brands,
  admin,
  expanded,
}: {
  brands: BrandRow[]
  admin: boolean
  expanded: boolean
}) {
  return (
    <ul className="space-y-3">
      {brands.map((b) => (
        <li key={b.id}>
          <details
            open={expanded}
            className="group rounded-2xl border border-line bg-white shadow-sm"
          >
            <summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl px-4 py-3 hover:bg-soft focus-visible:ring-3 focus-visible:ring-accent/40 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
              <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-white">
                {b.logo?.src ? (
                  // eslint-disable-next-line @next/next/no-img-element -- logo déjà redimensionné par Payload
                  <img src={b.logo.src} alt="" className="size-full object-contain p-1" />
                ) : (
                  <Tag className="size-5 text-ink-3" aria-hidden />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold text-primary">{b.name}</span>
                <span className="block text-xs text-ink-3">/vehicules/{b.slug}</span>
              </span>
              <span className="hidden flex-wrap justify-end gap-1.5 sm:flex">
                <Badge>{plural(b.models.length, 'modèle')}</Badge>
                <Badge className={b.vehicles ? 'bg-primary text-white' : 'bg-soft text-ink-2'}>
                  {plural(b.vehicles, 'véhicule')}
                </Badge>
              </span>
              <ChevronDown
                className="size-4 shrink-0 text-ink-3 transition group-open:rotate-180"
                aria-hidden
              />
            </summary>

            <div className="border-t border-line px-4 py-4">
              <p className="mb-3 text-xs text-ink-2 sm:hidden">
                {plural(b.models.length, 'modèle')} · {plural(b.vehicles, 'véhicule')}
              </p>
              <div className="flex flex-wrap gap-2">
                <EntryEditor kind="brand" id={b.id} name={b.name} />
                <a
                  href={`/vehicules/${b.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkCls}
                >
                  <ExternalLink className="size-3.5" aria-hidden /> Voir la page{' '}
                  <span className="sr-only">(nouvel onglet)</span>
                </a>
                {admin && (
                  <ConfirmButton
                    className={`${btn.danger} ${btn.small}`}
                    icon={<Trash2 className="size-3.5" aria-hidden />}
                    label="Supprimer la marque"
                    title={`Supprimer la marque « ${b.name} » ?`}
                    cta="Supprimer la marque"
                    disabled={b.vehicles > 0}
                    disabledReason="Impossible : des véhicules sont de cette marque."
                    run={() => deleteBrand(b.id)}
                  >
                    <p>
                      {b.models.length
                        ? `La marque et ses ${plural(b.models.length, 'modèle')} seront supprimés, ainsi que leurs pages sur le site.`
                        : 'La marque et sa page sur le site seront supprimées.'}{' '}
                      Cette action est définitive.
                    </p>
                  </ConfirmButton>
                )}
              </div>
              {admin && b.vehicles > 0 && (
                <p className="mt-2 text-xs text-ink-3">
                  Suppression impossible tant que des véhicules sont de cette marque.
                </p>
              )}

              <h3 className="mt-5 mb-2 text-sm font-black text-primary">Modèles</h3>
              {b.models.length ? (
                <ul className="divide-y divide-line rounded-xl border border-line">
                  {b.models.map((m) => (
                    <li
                      key={m.id}
                      className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-primary">{m.name}</span>
                        <span className="block text-xs text-ink-3">
                          /vehicules/{b.slug}/{m.slug} · {plural(m.vehicles, 'véhicule')}
                        </span>
                      </span>
                      <span className="flex flex-wrap gap-2">
                        <EntryEditor kind="model" id={m.id} name={m.name} />
                        <a
                          href={`/vehicules/${b.slug}/${m.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={linkCls}
                          aria-label={`Voir la page ${b.name} ${m.name} (nouvel onglet)`}
                        >
                          <ExternalLink className="size-3.5" aria-hidden /> Voir
                        </a>
                        {admin && (
                          <ConfirmButton
                            className={`${btn.danger} ${btn.small}`}
                            icon={<Trash2 className="size-3.5" aria-hidden />}
                            label={<span className="sr-only sm:not-sr-only">Supprimer</span>}
                            title={`Supprimer le modèle « ${b.name} ${m.name} » ?`}
                            cta="Supprimer le modèle"
                            disabled={m.vehicles > 0}
                            disabledReason="Impossible : des véhicules utilisent ce modèle."
                            run={() => deleteModel(m.id)}
                          >
                            <p>
                              Le modèle et sa page sur le site seront supprimés. Cette action est
                              définitive.
                            </p>
                          </ConfirmButton>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-2">Aucun modèle pour cette marque.</p>
              )}
              <div className="mt-3 max-w-md">
                <AddModel brandId={b.id} brandName={b.name} />
              </div>
            </div>
          </details>
        </li>
      ))}
    </ul>
  )
}
