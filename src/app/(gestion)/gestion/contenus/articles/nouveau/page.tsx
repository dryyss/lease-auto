import type { Metadata } from 'next'

import { DocNewPage } from '@/components/gestion/contenus/DocPages'
import { requireStaff } from '@/lib/gestion/session'

export const metadata: Metadata = { title: 'Nouveau guide' }

export default async function NewArticlePage() {
  await requireStaff()
  return <DocNewPage kind="articles" />
}
