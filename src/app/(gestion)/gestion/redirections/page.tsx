import { Lock } from 'lucide-react'
import type { Metadata } from 'next'

import { RedirectManager } from '@/components/gestion/redirections/RedirectManager'
import { TARGETS, type Options, type RedirectRow, type Target } from '@/components/gestion/redirections/shared'
import { Card, Empty, PageHeader } from '@/components/gestion/ui'
import { isAdminUser, requireStaff } from '@/lib/gestion/session'

export const metadata: Metadata = { title: 'Redirections' }

export default async function RedirectionsPage() {
  const { payload, user } = await requireStaff()
  if (!isAdminUser(user)) {
    return (
      <>
        <PageHeader title="Redirections" />
        <Card>
          <Empty icon={Lock} title="Réservé aux administrateurs." text="Les redirections des anciennes adresses du site sont gérées par un administrateur." />
        </Card>
      </>
    )
  }

  const ctx = { user, overrideAccess: false as const, depth: 0, pagination: false as const }
  const [redirects, vehicles, articles, locals] = await Promise.all([
    payload.find({ collection: 'redirects', sort: 'from', ...ctx }),
    payload.find({ collection: 'vehicles', sort: 'title', select: { title: true, slug: true, _status: true }, ...ctx }),
    payload.find({ collection: 'articles', sort: 'title', select: { title: true, slug: true }, ...ctx }),
    payload.find({ collection: 'local-pages', sort: 'city', select: { city: true, slug: true }, ...ctx }),
  ])

  const options: Options = {
    vehicles: vehicles.docs.map((d) => ({ id: d.id, label: d.title || `Véhicule n° ${d.id}`, path: `${TARGETS.vehicles.base}${d.slug ?? ''}`, draft: d._status !== 'published' })),
    articles: articles.docs.map((d) => ({ id: d.id, label: d.title, path: `${TARGETS.articles.base}${d.slug ?? ''}` })),
    'local-pages': locals.docs.map((d) => ({ id: d.id, label: d.city, path: `${TARGETS['local-pages'].base}${d.slug ?? ''}` })),
  }

  const rows: RedirectRow[] = redirects.docs.map((r) => {
    const ref = r.to?.reference
    const value = ref?.value
    return {
      id: r.id,
      from: r.from,
      toType: r.to?.type === 'custom' ? 'custom' : 'reference',
      relationTo: (ref?.relationTo ?? 'vehicles') as Target,
      refId: value == null ? null : typeof value === 'object' ? value.id : value,
      url: r.to?.url ?? '',
      updatedAt: r.updatedAt,
    }
  })

  return (
    <>
      <PageHeader title="Redirections" subtitle="Envoyer les visiteurs des anciennes adresses du site vers la bonne page." />
      <RedirectManager rows={rows} options={options} />
    </>
  )
}
