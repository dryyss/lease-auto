import Link from 'next/link'
import { getPayload } from 'payload'

import config from '@payload-config'

// Page provisoire : la vraie page d'accueil (PUB-01) arrive avec la phase design.
export default async function HomePage() {
  const payload = await getPayload({ config })
  const home = await payload.findGlobal({ slug: 'homepage' })

  return (
    <section style={{ padding: '4rem 1rem', maxWidth: 720, margin: '0 auto' }}>
      <h1>{home.hero?.title}</h1>
      <p>{home.hero?.subtitle}</p>
      <p>
        <Link href="/admin">Administration</Link>
      </p>
    </section>
  )
}
