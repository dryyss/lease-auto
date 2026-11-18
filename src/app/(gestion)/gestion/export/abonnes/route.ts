import { criteriaParts, parseFilter, subscriberWhere } from '@/components/gestion/abonnes/filters'

import { csvDate, csvResponse, findAll, staffFromRequest, unauthorized } from '../csv'

export const dynamic = 'force-dynamic'

/** Export CSV des abonnés, avec les filtres de la liste (?q=…&filtre=newsletter|alerte|desinscrits). */
export async function GET(req: Request) {
  const auth = await staffFromRequest(req)
  if (!auth) return unauthorized()
  const { payload, user } = auth
  const url = new URL(req.url)
  const where = subscriberWhere(
    url.searchParams.get('q') ?? '',
    parseFilter(url.searchParams.get('filtre')),
  )

  const [subs, brands] = await Promise.all([
    findAll((page) =>
      payload.find({
        collection: 'subscribers',
        where,
        sort: '-createdAt',
        limit: 500,
        page,
        depth: 0,
        user,
        overrideAccess: false,
      }),
    ),
    payload.find({
      collection: 'brands',
      pagination: false,
      depth: 0,
      select: { name: true },
      user,
      overrideAccess: false,
    }),
  ])
  const brandName = (id: number) => brands.docs.find((b) => b.id === id)?.name

  return csvResponse(
    'abonnes',
    [
      'E-mail',
      'Prénom',
      'Newsletter',
      'Alerte véhicule',
      'Marques',
      'Prix max (€)',
      'Mensualité max (€)',
      'Kilométrage max (km)',
      'Carburants',
      'Consentement donné le',
      'Inscrit le',
    ],
    subs.map((s) => {
      const c = s.alertEnabled ? criteriaParts(s.criteria, brandName) : null
      return [
        s.email,
        s.firstName,
        !!s.newsletter,
        !!s.alertEnabled,
        c ? c.brands || 'Toutes' : '',
        s.alertEnabled ? s.criteria?.maxPrice : null,
        s.alertEnabled ? s.criteria?.maxMonthly : null,
        s.alertEnabled ? s.criteria?.maxMileage : null,
        c?.fuels,
        csvDate(s.consentAt),
        csvDate(s.createdAt),
      ]
    }),
  )
}
