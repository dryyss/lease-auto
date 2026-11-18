import type { Metadata } from 'next'

import { DocListPage } from '@/components/gestion/contenus/DocPages'

export const metadata: Metadata = { title: 'Guides et articles' }

export default async function ArticlesPage({ searchParams }: { searchParams: Promise<{ filtre?: string }> }) {
  return <DocListPage kind="articles" filter={(await searchParams).filtre} />
}
