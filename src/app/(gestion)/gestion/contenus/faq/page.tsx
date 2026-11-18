import type { Metadata } from 'next'

import { FaqManager } from '@/components/gestion/contenus/FaqManager'
import type { FaqItem } from '@/components/gestion/contenus/types'
import { richTextToMarkdown } from '@/lib/gestion/richtext'
import { requireStaff } from '@/lib/gestion/session'

export const metadata: Metadata = { title: 'FAQ' }

export default async function FaqContentPage() {
  const { payload, user } = await requireStaff()
  const { docs } = await payload.find({ collection: 'faqs', sort: 'order', pagination: false, depth: 0, user, overrideAccess: false })
  const items: FaqItem[] = await Promise.all(
    docs.map(async (f) => ({ id: f.id, question: f.question, answer: await richTextToMarkdown(f.answer), category: f.category, order: f.order ?? null, updatedAt: f.updatedAt })),
  )
  return <FaqManager items={items} />
}
