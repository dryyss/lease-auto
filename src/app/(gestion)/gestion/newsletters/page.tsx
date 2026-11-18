import { Plus, Send } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { Pager } from '@/components/gestion/medias/Pager'
import { EmailWarning } from '@/components/gestion/newsletters/EmailWarning'
import { countRecipients } from '@/components/gestion/newsletters/load'
import { Badge, btn, Card, Empty, PageHeader } from '@/components/gestion/ui'
import { fmtDate, fmtDateTime, plural } from '@/lib/gestion/labels'
import { requireStaff } from '@/lib/gestion/session'
import { emailEnabled } from '@/lib/services'

export const metadata: Metadata = { title: 'Newsletters' }

const PER_PAGE = 30

export default async function NewslettersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const page = Math.max(1, Math.floor(Number((await searchParams).page)) || 1)
  const { payload, user } = await requireStaff()
  const [res, recipients] = await Promise.all([
    payload.find({
      collection: 'campaigns',
      sort: '-createdAt',
      limit: PER_PAGE,
      page,
      depth: 0,
      select: {
        subject: true,
        status: true,
        sentAt: true,
        sentCount: true,
        vehicles: true,
        createdAt: true,
        updatedAt: true,
      },
      user,
      overrideAccess: false,
    }),
    countRecipients(payload, user),
  ])

  return (
    <>
      <PageHeader
        title="Newsletters"
        subtitle={`${plural(recipients, 'abonné')} à la newsletter actuellement. Une newsletter présente quelques véhicules du stock.`}
        actions={
          <Link href="/gestion/newsletters/nouvelle" className={btn.primary}>
            <Plus className="size-4" aria-hidden /> Nouvelle newsletter
          </Link>
        }
      />
      {!emailEnabled() && <EmailWarning />}

      {res.docs.length ? (
        <Card padded={false}>
          <ul className="divide-y divide-line">
            {res.docs.map((c) => {
              const sent = c.status === 'sent'
              return (
                <li
                  key={c.id}
                  className="relative flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-3.5 transition hover:bg-soft sm:px-5"
                >
                  <span className="min-w-0 flex-1 basis-64">
                    <Link
                      href={`/gestion/newsletters/${c.id}`}
                      className="block truncate font-bold text-primary after:absolute after:inset-0 hover:text-accent focus-visible:outline-none focus-visible:after:ring-3 focus-visible:after:ring-accent/40"
                    >
                      {c.subject}
                    </Link>
                    <span className="block text-xs text-ink-3">
                      {plural(c.vehicles?.length ?? 0, 'véhicule')} ·{' '}
                      {sent
                        ? `envoyée le ${fmtDateTime(c.sentAt)}`
                        : `modifiée le ${fmtDate(c.updatedAt)}`}
                    </span>
                  </span>
                  {sent && (
                    <span className="text-sm text-ink-2">
                      {plural(c.sentCount ?? 0, 'destinataire')}
                    </span>
                  )}
                  <Badge
                    className={
                      sent ? 'bg-emerald-600 text-white' : 'bg-white text-ink-2 ring-1 ring-line'
                    }
                  >
                    {sent ? 'Envoyée' : 'Brouillon'}
                  </Badge>
                </li>
              )
            })}
          </ul>
        </Card>
      ) : (
        <Card>
          <Empty
            icon={Send}
            title="Aucune newsletter pour le moment."
            text="Préparez une sélection de véhicules avec un mot d’introduction, prévisualisez-la, puis envoyez-la aux abonnés."
            action={
              <Link href="/gestion/newsletters/nouvelle" className={btn.primary}>
                <Plus className="size-4" aria-hidden /> Nouvelle newsletter
              </Link>
            }
          />
        </Card>
      )}
      <Pager
        page={page}
        pages={res.totalPages}
        href={(p) => (p > 1 ? `/gestion/newsletters?page=${p}` : '/gestion/newsletters')}
      />
    </>
  )
}
