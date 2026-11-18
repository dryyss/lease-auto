import { ExternalLink, FileCheck2, FileImage, FileText, Info } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import type { Where } from 'payload'

import { fileUrl } from '@/components/gestion/demandes/format'
import { DeleteJustificatif } from '@/components/gestion/justificatifs/DeleteJustificatif'
import { Pager, SearchBox } from '@/components/gestion/medias/Pager'
import { Badge, Card, Empty, FilterPills, PageHeader } from '@/components/gestion/ui'
import { DOCUMENT_KIND_LABELS, fmtDate, fmtDateTime, plural } from '@/lib/gestion/labels'
import { isAdminUser, requireStaff } from '@/lib/gestion/session'
import type { Document } from '@/payload-types'

export const metadata: Metadata = { title: 'Justificatifs' }

const PER_PAGE = 50
const SOON_DAYS = 7
const KINDS = Object.keys(DOCUMENT_KIND_LABELS) as NonNullable<Document['kind']>[]

type Params = { type?: string; proche?: string; q?: string; page?: string }

export default async function JustificatifsPage({
  searchParams,
}: {
  searchParams: Promise<Params>
}) {
  const sp = await searchParams
  const type = KINDS.find((k) => k === sp.type)
  const soon = sp.proche === '1'
  const q = (sp.q ?? '').trim().slice(0, 100)
  const page = Math.max(1, Math.floor(Number(sp.page)) || 1)
  const { payload, user } = await requireStaff()
  const admin = isAdminUser(user)

  const soonLimit = new Date(Date.now() + SOON_DAYS * 86_400_000).toISOString()
  const base = (withType: boolean): Where => ({
    and: [
      ...(q ? [{ filename: { like: q } }] : []),
      ...(soon ? [{ deleteAfter: { less_than: soonLimit } }] : []),
      ...(withType && type ? [{ kind: { equals: type } }] : []),
    ],
  })
  const count = (where: Where) =>
    payload
      .count({ collection: 'documents', where, user, overrideAccess: false })
      .then((r) => r.totalDocs)

  const [res, all, soonCount, settings, ...perKind] = await Promise.all([
    payload.find({
      collection: 'documents',
      where: base(true),
      sort: soon ? 'deleteAfter' : '-createdAt',
      limit: PER_PAGE,
      page,
      depth: 1,
      populate: { requests: { reference: true, firstName: true, lastName: true } },
      user,
      overrideAccess: false,
    }),
    count(base(false)),
    count({
      and: [
        ...(q ? [{ filename: { like: q } }] : []),
        ...(type ? [{ kind: { equals: type } }] : []),
        { deleteAfter: { less_than: soonLimit } },
      ],
    }),
    payload
      .findGlobal({ slug: 'settings', depth: 0, user, overrideAccess: false })
      .catch(() => null),
    ...KINDS.map((k) => count({ and: [...(base(false).and ?? []), { kind: { equals: k } }] })),
  ])
  const days = settings?.retention?.documentsDays ?? 90

  const href = (o: Params) => {
    const next = { type: type ?? '', proche: soon ? '1' : '', q, ...o }
    const p = new URLSearchParams(
      Object.entries(next).filter(([, v]) => v) as [string, string][],
    ).toString()
    return `/gestion/justificatifs${p ? `?${p}` : ''}`
  }
  const now = Date.now()

  return (
    <>
      <PageHeader
        title="Justificatifs"
        subtitle={`${plural(res.totalDocs, 'pièce')}${type || soon || q ? ' avec ces filtres' : ' en tout'}. Les fichiers ne sont jamais publics.`}
      />

      <p className="mb-5 flex items-start gap-2 rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink-2">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <span>
          Chaque justificatif est supprimé automatiquement{' '}
          <strong className="text-primary">{plural(days, 'jour')}</strong> après son dépôt (durée
          fixée dans les Réglages). Téléchargez-le avant cette date si vous devez le garder.
        </span>
      </p>

      <div className="mb-5 space-y-3">
        <SearchBox
          action="/gestion/justificatifs"
          id="justificatifs-q"
          q={q}
          placeholder="Rechercher par nom de fichier"
          keep={{ type, proche: soon ? '1' : undefined }}
        />
        <FilterPills
          items={[
            {
              href: href({ type: '', page: '' }),
              label: 'Toutes les pièces',
              count: all,
              active: !type,
            },
            ...KINDS.map((k, i) => ({
              href: href({ type: k, page: '' }),
              label: DOCUMENT_KIND_LABELS[k],
              count: perKind[i],
              active: type === k,
            })).filter((x) => x.count || x.active),
          ]}
        />
        <FilterPills
          items={[
            {
              href: href({ proche: soon ? '' : '1', page: '' }),
              label: `Suppression dans moins de ${SOON_DAYS} jours`,
              count: soonCount,
              active: soon,
            },
          ]}
        />
        {(type || soon || q) && (
          <Link
            href="/gestion/justificatifs"
            className="inline-block text-sm font-semibold text-accent hover:underline"
          >
            Effacer les filtres
          </Link>
        )}
      </div>

      {res.docs.length ? (
        <Card padded={false}>
          <ul className="divide-y divide-line">
            {res.docs.map((d) => {
              const req = d.request && typeof d.request === 'object' ? d.request : null
              const reqId = req?.id ?? (typeof d.request === 'number' ? d.request : null)
              const left = d.deleteAfter
                ? Math.ceil((new Date(d.deleteAfter).getTime() - now) / 86_400_000)
                : null
              const Icon = d.mimeType === 'application/pdf' ? FileText : FileImage
              return (
                <li
                  key={d.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-soft text-ink-3">
                    <Icon className="size-4.5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 basis-56">
                    <span
                      className="block truncate font-semibold text-primary"
                      title={d.filename ?? ''}
                    >
                      {d.filename}
                    </span>
                    <span className="block text-xs text-ink-3">
                      {d.kind ? DOCUMENT_KIND_LABELS[d.kind] : 'Type non précisé'} · reçu le{' '}
                      {fmtDateTime(d.createdAt)}
                    </span>
                  </span>
                  <span className="min-w-0 basis-44 text-sm">
                    {reqId ? (
                      <Link
                        href={`/gestion/demandes/${reqId}`}
                        className="font-semibold text-primary hover:text-accent"
                      >
                        {req ? `${req.firstName} ${req.lastName}`.trim() : `Demande n° ${reqId}`}
                        {req?.reference && (
                          <span className="block text-xs font-normal text-ink-3">
                            Réf. {req.reference}
                          </span>
                        )}
                      </Link>
                    ) : (
                      <span className="text-ink-3">Sans demande liée</span>
                    )}
                  </span>
                  <span className="basis-40 text-xs">
                    {d.deleteAfter ? (
                      <>
                        <span className="block text-ink-3">Suppression prévue le</span>
                        <span
                          className={`font-semibold ${left != null && left <= SOON_DAYS ? 'text-accent' : 'text-primary'}`}
                        >
                          {fmtDate(d.deleteAfter)}
                        </span>
                        {left != null && left <= SOON_DAYS && (
                          <Badge className="ml-1.5 bg-accent-soft text-accent-dark">
                            {left <= 0 ? 'imminente' : `dans ${plural(left, 'jour')}`}
                          </Badge>
                        )}
                      </>
                    ) : (
                      <span className="text-ink-3">Pas de date de suppression</span>
                    )}
                  </span>
                  <span className="flex items-center gap-3">
                    {d.filename && (
                      <a
                        href={fileUrl(d.filename)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:text-accent"
                      >
                        Voir <ExternalLink className="size-3.5" aria-hidden />
                        <span className="sr-only">{d.filename} (nouvel onglet)</span>
                      </a>
                    )}
                    {admin && (
                      <DeleteJustificatif id={d.id} filename={d.filename ?? 'ce fichier'} />
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
        </Card>
      ) : (
        <Card>
          <Empty
            icon={FileCheck2}
            title={
              type || soon || q
                ? 'Aucun justificatif avec ces filtres.'
                : 'Aucun justificatif pour le moment.'
            }
            text="Les pièces envoyées par les clients avec leur demande, ou ajoutées depuis une fiche demande, apparaissent ici."
          />
        </Card>
      )}

      <Pager
        page={page}
        pages={res.totalPages}
        href={(p) => href({ page: p > 1 ? String(p) : '' })}
        total={plural(res.totalDocs, 'pièce')}
      />
    </>
  )
}
