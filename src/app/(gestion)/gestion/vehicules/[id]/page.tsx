import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { hasRichDescription, loadOptions, toInput, toPhotos } from '@/components/gestion/vehicules/load'
import { VehicleForm } from '@/components/gestion/vehicules/VehicleForm'
import { isAdminUser, requireStaff } from '@/lib/gestion/session'

export const metadata: Metadata = { title: 'Fiche véhicule' }

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function VehiclePage({ params, searchParams }: Props) {
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id <= 0) notFound()
  const sp = await searchParams
  const { payload, user } = await requireStaff()
  const q = { user, overrideAccess: false as const }

  // Dernière version (brouillon compris) pour le formulaire ; la ligne principale dit si l'annonce est en ligne.
  const [vehicle, main, options] = await Promise.all([
    payload.findByID({ collection: 'vehicles', id, draft: true, depth: 1, ...q }).catch(() => null),
    payload.findByID({ collection: 'vehicles', id, draft: false, depth: 0, select: { _status: true, slug: true }, ...q }).catch(() => null),
    loadOptions(payload, user),
  ])
  if (!vehicle) notFound()
  const published = main?._status === 'published'

  return (
    <VehicleForm
      key={vehicle.id}
      initial={{ ...toInput(vehicle), publish: published }}
      initialPhotos={toPhotos(vehicle.gallery)}
      brands={options.brands}
      models={options.models}
      published={published}
      slug={main?.slug ?? vehicle.slug}
      computed={(vehicle.monthlies ?? []).map((m) => ({ formula: m.formula, manual: Boolean(m.manual), amount: m.amount ?? null, months: m.months ?? null, deposit: m.deposit ?? null }))}
      monthlyFrom={vehicle.monthlyFrom ?? null}
      isAdmin={isAdminUser(user)}
      justSaved={sp.enregistre === '1'}
      richDescription={hasRichDescription(vehicle.description)}
      updatedAt={vehicle.updatedAt}
    />
  )
}
