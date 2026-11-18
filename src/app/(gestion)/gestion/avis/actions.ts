'use server'

import { revalidatePath } from 'next/cache'

import { parseDay } from '@/components/gestion/rendez-vous/dates'
import { errorMessage, fail, text, type Result } from '@/components/gestion/rendez-vous/result'
import { requireStaff } from '@/lib/gestion/session'
import type { Review } from '@/payload-types'

// Les pages publiques (accueil, agence) sont rafraîchies par le hook de la collection.
const refresh = () => {
  revalidatePath('/gestion/avis')
  revalidatePath('/gestion')
}

const SOURCES: NonNullable<Review['source']>[] = ['google', 'instagram', 'tiktok']

/** Création (id null) ou modification d'un avis réel. */
export async function saveReview(id: number | null, form: FormData): Promise<Result> {
  const { payload, user } = await requireStaff()
  const source = SOURCES.find((s) => s === text(form, 'source'))
  const firstName = text(form, 'firstName', 80)
  const day = parseDay(text(form, 'date', 10))
  const body = text(form, 'text', 3000)
  const url = text(form, 'url', 500)
  const rating = Number(form.get('rating'))

  if (!source) return fail('Choisissez le réseau d’où vient l’avis.')
  if (!firstName) return fail('Indiquez le prénom ou le pseudo de l’auteur.')
  if (source === 'google' && !(Number.isInteger(rating) && rating >= 1 && rating <= 5)) return fail('Choisissez la note de l’avis Google, de 1 à 5 étoiles.')
  if (!day) return fail('Indiquez la date de l’avis.')
  if (Date.UTC(day.y, day.m - 1, day.d) > Date.now() + 86_400_000) return fail('La date de l’avis ne peut pas être dans le futur.')
  if (!body) return fail('Recopiez le texte de l’avis.')
  if (url && !/^https?:\/\/\S+$/i.test(url)) return fail('Le lien doit commencer par https://')

  const data = {
    source,
    firstName,
    rating: source === 'google' ? rating : null,
    // Midi UTC : la date reste la même quel que soit le fuseau d'affichage.
    date: new Date(Date.UTC(day.y, day.m - 1, day.d, 12)).toISOString(),
    text: body,
    url: url || null,
    featured: form.get('featured') === 'on',
  }

  try {
    if (id == null) {
      await payload.create({ collection: 'reviews', data, depth: 0, user, overrideAccess: false })
    } else {
      const exists = await payload.findByID({ collection: 'reviews', id, depth: 0, user, overrideAccess: false }).catch(() => null)
      if (!exists) return fail('Cet avis est introuvable. Il a peut-être été supprimé.')
      await payload.update({ collection: 'reviews', id, data, depth: 0, user, overrideAccess: false })
    }
  } catch (err) {
    return fail(errorMessage(err))
  }
  refresh()
  return { ok: true }
}

/** Interrupteur « Mis en avant » (affiché sur le site). */
export async function setReviewFeatured(id: number, featured: boolean): Promise<Result> {
  const { payload, user } = await requireStaff()
  const current = await payload.findByID({ collection: 'reviews', id, depth: 0, user, overrideAccess: false }).catch(() => null)
  if (!current) return fail('Cet avis est introuvable. Il a peut-être été supprimé.')
  if (Boolean(current.featured) === featured) return { ok: true }
  try {
    await payload.update({ collection: 'reviews', id, data: { featured }, depth: 0, user, overrideAccess: false })
  } catch (err) {
    return fail(errorMessage(err))
  }
  refresh()
  return { ok: true }
}

export async function deleteReview(id: number): Promise<Result> {
  const { payload, user } = await requireStaff()
  const current = await payload.findByID({ collection: 'reviews', id, depth: 0, user, overrideAccess: false }).catch(() => null)
  if (!current) return fail('Cet avis est déjà supprimé.')
  try {
    await payload.delete({ collection: 'reviews', id, depth: 0, user, overrideAccess: false })
  } catch (err) {
    return fail(errorMessage(err))
  }
  refresh()
  return { ok: true }
}
