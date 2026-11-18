import type { Metadata } from 'next'

import { DocEditPage } from '@/components/gestion/contenus/DocPages'

export const metadata: Metadata = { title: 'Page locale' }

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ enregistre?: string }> }

export default async function LocalPage({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams])
  return <DocEditPage kind="local-pages" id={id} justSaved={sp.enregistre === '1'} />
}
