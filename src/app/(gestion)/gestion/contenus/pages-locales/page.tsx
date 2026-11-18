import type { Metadata } from 'next'

import { DocListPage } from '@/components/gestion/contenus/DocPages'

export const metadata: Metadata = { title: 'Pages locales' }

export default async function LocalPagesPage({ searchParams }: { searchParams: Promise<{ filtre?: string }> }) {
  return <DocListPage kind="local-pages" filter={(await searchParams).filtre} />
}
