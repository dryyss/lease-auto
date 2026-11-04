import type { Metadata } from 'next'

import { PageHero } from '@/components/ui/PageHero'
import { payloadClient } from '@/lib/payload'

export const metadata: Metadata = { title: 'Désinscription', robots: { index: false } }

type Props = { searchParams: Promise<{ token?: string; ok?: string }> }

async function unsubscribe(form: FormData) {
  'use server'
  const token = String(form.get('token') ?? '')
  if (!token) return
  const payload = await payloadClient()
  await payload.update({
    collection: 'subscribers',
    where: { unsubscribeToken: { equals: token } },
    data: { newsletter: false, alertEnabled: false },
    overrideAccess: true,
  })
  const { redirect } = await import('next/navigation')
  redirect('/desinscription?ok=1')
}

/**
 * MAIL-05 : désinscription en un clic. Le clic se fait sur un bouton (et non à l'ouverture du lien),
 * car les antivirus de messagerie ouvrent les liens automatiquement et désinscriraient les gens à leur insu.
 */
export default async function UnsubscribePage({ searchParams }: Props) {
  const { token, ok } = await searchParams
  return (
    <>
      <PageHero eyebrow="E-mails" title={ok ? 'Vous êtes désinscrit' : 'Se désinscrire'} intro={ok ? 'Vous ne recevrez plus nos alertes ni notre newsletter.' : undefined} />
      {!ok && (
        <div className="container-site pb-16">
          {token ? (
            <form action={unsubscribe}>
              <input type="hidden" name="token" value={token} />
              <button type="submit" className="btn-primary">Me désinscrire de toutes les alertes et de la newsletter</button>
            </form>
          ) : (
            <p className="text-ink-2">Lien incomplet. Utilisez le lien présent en bas de nos e-mails.</p>
          )}
        </div>
      )}
    </>
  )
}
