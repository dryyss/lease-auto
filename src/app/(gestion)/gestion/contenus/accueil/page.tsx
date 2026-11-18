import type { Metadata } from 'next'

import { HomepageForm, type HomepageState } from '@/components/gestion/contenus/HomepageForm'
import { toMediaItem } from '@/components/gestion/contenus/load'
import { requireStaff } from '@/lib/gestion/session'

export const metadata: Metadata = { title: 'Page d’accueil' }

export default async function HomepageContentPage() {
  const { payload, user } = await requireStaff()
  const q = { user, overrideAccess: false as const }
  const [home, faqs] = await Promise.all([
    payload.findGlobal({ slug: 'homepage', depth: 1, ...q }),
    payload.find({ collection: 'faqs', sort: 'order', pagination: false, depth: 0, select: { question: true, category: true }, ...q }),
  ])

  const initial: HomepageState = {
    title: home.hero?.title ?? '',
    subtitle: home.hero?.subtitle ?? '',
    image: toMediaItem(home.hero?.image),
    badges: (home.hero?.badges ?? []).map((b, i) => ({ key: b.id ?? `b${i}`, id: b.id, label: b.label ?? '' })),
    stats: (home.stats ?? []).map((s, i) => ({ key: s.id ?? `s${i}`, id: s.id, value: s.value ?? '', label: s.label ?? '' })),
    steps: (home.steps ?? []).map((s, i) => ({ key: s.id ?? `e${i}`, id: s.id, title: s.title ?? '', text: s.text ?? '' })),
    faqs: (home.featuredFaqs ?? []).map((f) => (typeof f === 'object' ? f.id : f)),
  }

  return (
    <HomepageForm
      initial={initial}
      faqOptions={faqs.docs.map((f) => ({ id: f.id, question: f.question, category: f.category }))}
      updatedAt={home.updatedAt}
    />
  )
}
