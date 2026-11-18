'use server'

import { revalidatePath } from 'next/cache'
import type { Payload } from 'payload'

import {
  extractMapUrl,
  FAQ_CATEGORIES,
  MAP_EMBED_PREFIX,
  type AgencyInput,
  type DocInput,
  type DocKind,
  type FaqInput,
  type FieldErrors,
  type HomepageInput,
  type Result,
} from '@/components/gestion/contenus/types'
import { slugify } from '@/fields/slug'
import { markdownToRichText } from '@/lib/gestion/richtext'
import { requireStaff, type Staff } from '@/lib/gestion/session'
import type { Faq } from '@/payload-types'

// Actions des écrans « Contenus ». Droits de Payload respectés : `user` + overrideAccess: false partout.
// Guides et pages locales ont des brouillons (même logique que les véhicules) :
// - publier = update/create avec `draft: false` et `_status: 'published'` (validation complète) ;
// - brouillon = `draft: true` (pas de validation, seule une version est écrite : on envoie le document entier) ;
// - repasser en brouillon une page en ligne = d'abord `_status: 'draft'` avec `draft: false` (retire la page du site).

type Fail = { ok: false; error: string; fields?: FieldErrors }

/* Erreurs Payload → messages en français. */
const MESSAGES: [RegExp, string][] = [
  [/required|requis|obligatoire/i, 'Ce champ est obligatoire.'],
  [/unique|already|déjà/i, 'Cette valeur est déjà utilisée par une autre page.'],
  [/not a valid|invalid|valide/i, 'Valeur non valable.'],
]
const fr = (m: string) => MESSAGES.find(([re]) => re.test(m))?.[1] ?? m

function fail(err: unknown, payload: Payload, labels: Record<string, string>, paths: Record<string, string> = {}): Fail {
  const e = err as { name?: string; message?: string; status?: number; data?: { errors?: { path?: string; message?: string }[] } }
  const list = e?.data?.errors
  if (Array.isArray(list) && list.length) {
    const fields: FieldErrors = {}
    for (const item of list) {
      const path = String(item.path ?? '')
      const key = paths[path] ?? path.split('.')[0] ?? 'form'
      fields[key] ??= fr(String(item.message ?? ''))
    }
    return { ok: false, error: `À corriger : ${Object.keys(fields).map((k) => labels[k] ?? k).join(', ')}.`, fields }
  }
  if (e?.status === 403 || e?.name === 'Forbidden') return { ok: false, error: 'Vous n’avez pas le droit de faire cette action.' }
  if (e?.status === 404 || e?.name === 'NotFound') return { ok: false, error: 'Ce contenu n’existe plus. Rechargez la page.' }
  payload.logger.error({ err }, 'Gestion contenus : erreur')
  return { ok: false, error: 'L’enregistrement a échoué. Réessayez ; si cela continue, prévenez l’administrateur.' }
}

const invalid = (fields: FieldErrors, labels: Record<string, string>): Fail => ({
  ok: false,
  error: `À corriger : ${Object.keys(fields).map((k) => labels[k] ?? k).join(', ')}.`,
  fields,
})

/** Markdown → texte riche au format attendu par les types Payload (null si vide). */
const rich = async (md: string) => (await markdownToRichText(md)) as Faq['answer'] | null

const clean = (s: string | null | undefined, max = 500) => (s ?? '').replace(/\r\n/g, '\n').trim().slice(0, max)
const ids = (list: unknown[]) => [...new Set(list.map(Number).filter((n) => Number.isInteger(n) && n > 0))]

/** Une console rafraîchie après chaque changement. */
const refreshConsole = () => {
  revalidatePath('/gestion/contenus', 'layout')
}

/* ------------------------------------------------------------------ Accueil */

const HOME_LABELS: Record<string, string> = {
  heroTitle: 'Titre de l’accroche',
  heroSubtitle: 'Sous-titre',
  badges: 'Badges',
  stats: 'Chiffres clés',
  steps: 'Étapes du parcours',
  featuredFaqs: 'Questions affichées',
}

export async function saveHomepage(input: HomepageInput): Promise<Result> {
  const { payload, user } = await requireStaff()
  const fields: FieldErrors = {}

  const title = clean(input.hero.title, 200)
  if (!title) fields.heroTitle = 'Indiquez le titre de l’accroche.'
  const badges = input.hero.badges.map((b) => ({ id: b.id || undefined, label: clean(b.label, 60) })).filter((b) => b.label)
  const stats = input.stats.map((s) => ({ id: s.id || undefined, value: clean(s.value, 30), label: clean(s.label, 80) })).filter((s) => s.value || s.label)
  const steps = input.steps.map((s) => ({ id: s.id || undefined, title: clean(s.title, 120), text: clean(s.text, 600) })).filter((s) => s.title || s.text)
  if (badges.length > 4) fields.badges = '4 badges au maximum.'
  if (stats.length > 4) fields.stats = '4 chiffres au maximum.'
  else if (stats.some((s) => !s.value || !s.label)) fields.stats = 'Chaque chiffre a besoin d’une valeur et d’un libellé.'
  if (steps.length > 5) fields.steps = '5 étapes au maximum.'
  else if (steps.some((s) => !s.title)) fields.steps = 'Chaque étape a besoin d’un titre.'
  const faqs = ids(input.featuredFaqs)
  if (faqs.length > 6) fields.featuredFaqs = '6 questions au maximum.'
  if (Object.keys(fields).length) return invalid(fields, HOME_LABELS)

  try {
    // Questions supprimées entre-temps : retirées sans bloquer l'enregistrement.
    const existing = faqs.length
      ? (await payload.find({ collection: 'faqs', where: { id: { in: faqs } }, depth: 0, limit: faqs.length, select: { question: true }, user, overrideAccess: false })).docs.map((f) => f.id)
      : []
    await payload.updateGlobal({
      slug: 'homepage',
      data: {
        hero: { title, subtitle: clean(input.hero.subtitle, 400) || null, image: input.hero.image || null, badges },
        stats,
        steps: steps.map((s) => ({ ...s, text: s.text || null })),
        featuredFaqs: faqs.filter((id) => existing.includes(id)),
      },
      depth: 0,
      user,
      overrideAccess: false,
    })
  } catch (err) {
    return fail(err, payload, HOME_LABELS, { 'hero.title': 'heroTitle', 'hero.subtitle': 'heroSubtitle', 'hero.badges': 'badges' })
  }
  // L'accueil, et la page agence qui reprend les chiffres clés.
  revalidatePath('/')
  revalidatePath('/agence')
  refreshConsole()
  return { ok: true }
}

/* ------------------------------------------------------------------ Agence */

const AGENCY_LABELS: Record<string, string> = { title: 'Titre', intro: 'Accroche', content: 'Présentation', photos: 'Photos', mapEmbedUrl: 'Carte Google Maps' }

export async function saveAgency(input: AgencyInput): Promise<Result> {
  const { payload, user } = await requireStaff()
  const map = extractMapUrl(input.mapEmbedUrl ?? '')
  if (map && !map.startsWith(MAP_EMBED_PREFIX)) {
    return invalid({ mapEmbedUrl: 'Collez le lien « Intégrer une carte » de Google Maps : il commence par https://www.google.com/maps/embed' }, AGENCY_LABELS)
  }
  try {
    const content = input.content === null ? undefined : await rich(input.content)
    await payload.updateGlobal({
      slug: 'agency',
      data: {
        title: clean(input.title, 200) || null,
        intro: clean(input.intro, 600) || null,
        photos: ids(input.photos),
        mapEmbedUrl: map || null,
        ...(content !== undefined ? { content } : {}),
      },
      depth: 0,
      user,
      overrideAccess: false,
    })
  } catch (err) {
    return fail(err, payload, AGENCY_LABELS)
  }
  revalidatePath('/agence')
  refreshConsole()
  return { ok: true }
}

/* ------------------------------------------------------------------ FAQ */

const FAQ_LABELS: Record<string, string> = { question: 'Question', answer: 'Réponse', category: 'Thème', order: 'Ordre' }

/** La FAQ s'affiche sur la page FAQ, l'accueil et les pages formules. */
const refreshFaq = () => {
  revalidatePath('/faq')
  revalidatePath('/')
  revalidatePath('/financement', 'layout')
  refreshConsole()
}

export async function saveFaq(input: FaqInput): Promise<Result<{ id: number }>> {
  const { payload, user } = await requireStaff()
  const question = clean(input.question, 300)
  const category = FAQ_CATEGORIES.find((c) => c.value === input.category)?.value
  const fields: FieldErrors = {}
  if (!question) fields.question = 'Écrivez la question.'
  if (input.answer !== null && !clean(input.answer, 20000)) fields.answer = 'Écrivez la réponse.'
  if (!input.id && input.answer === null) fields.answer = 'Écrivez la réponse.'
  if (!category) fields.category = 'Choisissez un thème.'
  if (Object.keys(fields).length) return invalid(fields, FAQ_LABELS)

  try {
    const answer = input.answer === null ? undefined : await rich(input.answer)
    const data = {
      question,
      category: category!,
      order: input.order != null && Number.isFinite(input.order) ? Math.round(input.order) : 0,
      ...(answer ? { answer } : {}),
    }
    const doc = input.id
      ? await payload.update({ collection: 'faqs', id: input.id, data, depth: 0, user, overrideAccess: false })
      : await payload.create({ collection: 'faqs', data: { ...data, answer: answer! }, depth: 0, user, overrideAccess: false })
    refreshFaq()
    return { ok: true, id: doc.id }
  } catch (err) {
    return fail(err, payload, FAQ_LABELS)
  }
}

/** Nouvel ordre des questions d'un thème (identifiants dans l'ordre voulu) : ordres 10, 20, 30… */
export async function reorderFaqs(orderedIds: number[]): Promise<Result> {
  const { payload, user } = await requireStaff()
  const list = ids(orderedIds)
  try {
    const { docs } = await payload.find({ collection: 'faqs', where: { id: { in: list } }, depth: 0, limit: list.length, select: { order: true }, user, overrideAccess: false })
    for (const [i, id] of list.entries()) {
      const order = (i + 1) * 10
      if (docs.find((d) => d.id === id)?.order !== order) {
        await payload.update({ collection: 'faqs', id, data: { order }, depth: 0, user, overrideAccess: false })
      }
    }
  } catch (err) {
    return fail(err, payload, FAQ_LABELS)
  }
  refreshFaq()
  return { ok: true }
}

export async function deleteFaq(id: number): Promise<Result> {
  const { payload, user } = await requireStaff()
  try {
    await payload.delete({ collection: 'faqs', id, depth: 0, user, overrideAccess: false })
  } catch (err) {
    return fail(err, payload, FAQ_LABELS)
  }
  refreshFaq()
  return { ok: true }
}

/* ------------------------------------------------------------------ Guides et pages locales */

const DOC_LABELS: Record<string, string> = {
  title: 'Titre',
  city: 'Ville ou zone',
  headline: 'Titre de la page',
  slug: 'Adresse de la page',
  publishedAt: 'Date de publication',
  cover: 'Image de couverture',
  excerpt: 'Résumé',
  content: 'Texte',
  distanceNote: 'Accès depuis l’agence',
  meta: 'Référencement',
}
const KINDS: DocKind[] = ['articles', 'local-pages']

/** Pages publiques concernées. Les pages locales sont listées dans le pied de page : tout le site est rafraîchi. */
function refreshDoc(kind: DocKind, ...slugs: (string | null | undefined)[]) {
  const base = kind === 'articles' ? '/guides/' : '/voiture-occasion/'
  if (kind === 'articles') revalidatePath('/guides')
  else revalidatePath('/', 'layout')
  for (const s of new Set(slugs.filter(Boolean))) revalidatePath(`${base}${s}`)
  revalidatePath('/sitemap.xml')
  refreshConsole()
}

/** Adresse libre : celle saisie (nettoyée), sinon tirée du titre, suffixée -2, -3… si déjà prise. */
async function freeSlug(payload: Payload, user: Staff, kind: DocKind, wanted: string, source: string, exceptId?: number): Promise<string | Fail> {
  const taken = async (slug: string) =>
    (
      await payload.count({
        collection: kind,
        where: { and: [{ slug: { equals: slug } }, ...(exceptId ? [{ id: { not_equals: exceptId } }] : [])] },
        user,
        overrideAccess: false,
      })
    ).totalDocs > 0
  const typed = slugify(wanted)
  if (typed) return (await taken(typed)) ? { ok: false, error: 'Cette adresse est déjà utilisée par une autre page.', fields: { slug: 'Adresse déjà utilisée : choisissez-en une autre.' } } : typed
  const base = slugify(source) || (kind === 'articles' ? 'guide' : 'page')
  for (let i = 1; i < 50; i++) {
    const slug = i === 1 ? base : `${base}-${i}`
    if (!(await taken(slug))) return slug
  }
  return `${base}-${Date.now()}`
}

export async function saveDoc(kind: DocKind, input: DocInput): Promise<Result<{ id: number; slug: string | null }>> {
  const { payload, user } = await requireStaff()
  if (!KINDS.includes(kind)) return { ok: false, error: 'Type de contenu inconnu.' }
  const isArticle = kind === 'articles'
  const ctx = { user, overrideAccess: false as const, depth: 0 }

  const title = clean(input.title, 200)
  const city = clean(input.city, 120)
  const headline = clean(input.headline, 200)
  const fields: FieldErrors = {}
  if (isArticle && !title) fields.title = 'Indiquez le titre.'
  if (!isArticle && !city) fields.city = 'Indiquez la ville ou la zone.'
  if (!isArticle && input.publish && !headline) fields.headline = 'Indiquez le titre de la page.'
  if (input.publishedAt && !/^\d{4}-\d{2}-\d{2}$/.test(input.publishedAt)) fields.publishedAt = 'Date non valable.'

  try {
    // Dernière version (brouillon compris) et état en ligne, pour une fiche existante.
    const latest = input.id ? await payload.findByID({ collection: kind, id: input.id, draft: true, ...ctx }) : null
    const main = input.id ? await payload.findByID({ collection: kind, id: input.id, draft: false, select: { _status: true, slug: true }, ...ctx }) : null
    const online = main?._status === 'published'

    const content = input.content === null ? undefined : await rich(input.content)
    const hasContent = content === undefined ? Boolean(latest?.content) : Boolean(content)
    if (input.publish && !hasContent) fields.content = 'Écrivez le texte avant de publier.'
    if (Object.keys(fields).length) return invalid(fields, DOC_LABELS)

    const slug = await freeSlug(payload, user, kind, input.slug, isArticle ? title : city, input.id)
    if (typeof slug !== 'string') return slug

    const meta = { title: clean(input.meta.title, 120) || null, description: clean(input.meta.description, 300) || null, image: input.meta.image || null }
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' })
    const day = input.publishedAt || (input.publish ? today : '')
    const data: Record<string, unknown> = isArticle
      ? { title, slug, publishedAt: day ? `${day}T12:00:00.000Z` : null, cover: input.cover || null, excerpt: clean(input.excerpt, 600) || null, meta }
      : { city, slug, headline, distanceNote: clean(input.distanceNote, 200) || null, meta }
    if (content !== undefined) data.content = content

    let doc: { id: number; slug?: string | null }
    if (!input.id || !latest) {
      doc = await payload.create({ collection: kind, data: { ...data, _status: input.publish ? 'published' : 'draft' } as never, draft: !input.publish, ...ctx })
    } else {
      const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = latest
      const full = { ...rest, ...data }
      if (input.publish) {
        doc = await payload.update({ collection: kind, id: input.id, data: { ...full, _status: 'published' } as never, draft: false, ...ctx })
      } else {
        // Retire d'abord la page du site, puis enregistre le brouillon (qui peut être incomplet).
        if (online) await payload.update({ collection: kind, id: input.id, data: { _status: 'draft' } as never, draft: false, ...ctx })
        doc = await payload.update({ collection: kind, id: input.id, data: { ...full, _status: 'draft' } as never, draft: true, ...ctx })
      }
    }
    refreshDoc(kind, main?.slug, latest?.slug, slug)
    return { ok: true, id: doc.id, slug }
  } catch (err) {
    return fail(err, payload, DOC_LABELS)
  }
}

export async function deleteDoc(kind: DocKind, id: number): Promise<Result> {
  const { payload, user } = await requireStaff()
  if (!KINDS.includes(kind)) return { ok: false, error: 'Type de contenu inconnu.' }
  try {
    const doc = await payload.delete({ collection: kind, id, depth: 0, user, overrideAccess: false })
    refreshDoc(kind, doc.slug)
    return { ok: true }
  } catch (err) {
    return fail(err, payload, DOC_LABELS)
  }
}
