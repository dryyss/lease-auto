import type { Metadata } from 'next'

import { DocNewPage } from '@/components/gestion/contenus/DocPages'
import { requireStaff } from '@/lib/gestion/session'

export const metadata: Metadata = { title: 'Nouvelle page locale' }

export default async function NewLocalPage() {
  await requireStaff()
  return <DocNewPage kind="local-pages" />
}
