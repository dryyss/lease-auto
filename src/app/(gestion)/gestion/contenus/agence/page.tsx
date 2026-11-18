import type { Metadata } from 'next'

import { AgencyForm } from '@/components/gestion/contenus/AgencyForm'
import { toMediaItem } from '@/components/gestion/contenus/load'
import type { MediaItem } from '@/lib/gestion/media-actions'
import { richTextToMarkdown } from '@/lib/gestion/richtext'
import { requireStaff } from '@/lib/gestion/session'

export const metadata: Metadata = { title: 'Page « L’agence »' }

export default async function AgencyContentPage() {
  const { payload, user } = await requireStaff()
  const agency = await payload.findGlobal({ slug: 'agency', depth: 1, user, overrideAccess: false })

  return (
    <AgencyForm
      initial={{
        title: agency.title ?? '',
        intro: agency.intro ?? '',
        content: await richTextToMarkdown(agency.content),
        photos: (agency.photos ?? []).map(toMediaItem).filter((m): m is MediaItem => m !== null),
        mapEmbedUrl: agency.mapEmbedUrl ?? '',
      }}
      updatedAt={agency.updatedAt}
    />
  )
}
