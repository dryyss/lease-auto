'use server'

import { isSlotAvailable } from '@/lib/agenda'
import { notifyNewRequest } from '@/lib/notifications'
import { payloadClient } from '@/lib/payload'
import { checkSpam } from '@/lib/spam'
import type { Document, Request } from '@/payload-types'

export type ActionResult = { ok: true; reference?: string; message?: string } | { ok: false; error: string }

const MAX_FILES = 10
const MAX_TOTAL_BYTES = 4 * 1024 * 1024 // limite d'une requête sur Vercel (4,5 Mo)
const ACCEPTED = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic']

const str = (form: FormData, key: string, max = 500) => String(form.get(key) ?? '').trim().slice(0, max)
const num = (form: FormData, key: string) => {
  const v = Number(String(form.get(key) ?? '').replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(v) && v >= 0 ? v : undefined
}
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
const isPhone = (v: string) => v.replace(/\D/g, '').length >= 9

const pick = <T extends string>(value: string, allowed: readonly T[]) => (allowed.includes(value as T) ? (value as T) : undefined)

function readFiles(form: FormData, field: string): File[] | string {
  const files = form.getAll(field).filter((f): f is File => f instanceof File && f.size > 0)
  if (files.length > MAX_FILES) return `${MAX_FILES} fichiers maximum.`
  if (files.reduce((s, f) => s + f.size, 0) > MAX_TOTAL_BYTES)
    return 'Fichiers trop lourds (4 Mo au total). Envoyez le reste en réponse à l’e-mail de confirmation.'
  if (files.some((f) => !ACCEPTED.includes(f.type))) return 'Formats acceptés : PDF, JPG, PNG, HEIC.'
  return files
}

/** PUB-03 / PUB-12 / PUB-13 : demande de financement, reprise, contact ou rappel. */
export async function submitRequest(form: FormData): Promise<ActionResult> {
  const spam = await checkSpam(form)
  if (spam) return { ok: false, error: spam }

  const type = pick(str(form, 'type'), ['financing', 'tradein', 'contact', 'callback'] as const)
  const firstName = str(form, 'firstName', 80)
  const lastName = str(form, 'lastName', 80)
  const email = str(form, 'email', 160).toLowerCase()
  const phone = str(form, 'phone', 30)

  if (!type) return { ok: false, error: 'Type de demande inconnu.' }
  if (!firstName || !lastName) return { ok: false, error: 'Merci d’indiquer votre prénom et votre nom.' }
  if (!isEmail(email)) return { ok: false, error: 'Adresse e-mail invalide.' }
  if (!isPhone(phone)) return { ok: false, error: 'Numéro de téléphone invalide.' }
  if (form.get('privacy') !== 'on') return { ok: false, error: 'Merci d’accepter la politique de confidentialité.' }

  const files = readFiles(form, type === 'tradein' ? 'photos' : 'documents')
  if (typeof files === 'string') return { ok: false, error: files }

  const payload = await payloadClient()
  const vehicleId = num(form, 'vehicle')
  const vehicle = vehicleId
    ? await payload.findByID({ collection: 'vehicles', id: vehicleId, depth: 0, overrideAccess: false }).catch(() => null)
    : null

  const data: Partial<Request> = {
    type,
    status: 'new',
    firstName,
    lastName,
    email,
    phone,
    postalCode: str(form, 'postalCode', 10),
    message: str(form, 'message', 3000),
    marketingConsent: form.get('marketing') === 'on',
    source: str(form, 'source', 120) || undefined,
  }

  if (type === 'financing') {
    Object.assign(data, {
      vehicle: vehicle?.id,
      formula: pick(str(form, 'formula'), ['loa', 'lld', 'credit'] as const),
      months: num(form, 'months'),
      deposit: num(form, 'deposit'),
      profile: pick(str(form, 'profile'), ['cdi', 'cdd', 'independant', 'societe', 'retraite', 'autre'] as const),
      monthlyIncome: num(form, 'monthlyIncome'),
      monthlyBudget: num(form, 'monthlyBudget'),
      missingDocuments: files.length === 0,
    })
  }
  if (type === 'tradein') {
    data.tradeIn = {
      brand: str(form, 'tiBrand', 60),
      model: str(form, 'tiModel', 80),
      year: num(form, 'tiYear'),
      mileage: num(form, 'tiMileage'),
    }
  }

  let requestId: number | undefined
  try {
    const request = await payload.create({ collection: 'requests', data: data as Request, overrideAccess: true, context: { skipEmails: true } })
    requestId = request.id

    const kinds = form.getAll('documentKinds').map(String)
    const uploaded: Document[] = []
    for (const [i, file] of files.entries()) {
      const doc = await payload.create({
        collection: 'documents',
        data: {
          request: request.id,
          kind: type === 'tradein' ? 'tradein-photo' : (pick(kinds[i] ?? '', ['id', 'address', 'payslips', 'tax', 'rib', 'kbis', 'accounts', 'bank', 'other'] as const) ?? 'other'),
        },
        file: { data: Buffer.from(await file.arrayBuffer()), mimetype: file.type, name: file.name, size: file.size },
        overrideAccess: true,
      })
      uploaded.push(doc)
    }
    if (type === 'tradein' && uploaded.length) {
      await payload.update({
        collection: 'requests',
        id: request.id,
        data: { tradeIn: { ...data.tradeIn, photos: uploaded.map((d) => d.id) } },
        overrideAccess: true,
        context: { skipEmails: true },
      })
    }

    if (form.get('marketing') === 'on') await upsertSubscriber(email, firstName, { newsletter: true })

    await notifyNewRequest(payload, request, uploaded.length)
    return { ok: true, reference: request.reference ?? undefined }
  } catch (err) {
    if (requestId) {
      await payload.delete({ collection: 'documents', where: { request: { equals: requestId } }, overrideAccess: true }).catch(() => undefined)
      await payload.delete({ collection: 'requests', id: requestId, overrideAccess: true }).catch(() => undefined)
    }
    payload.logger.error({ err }, 'Échec de création de demande')
    const detail = JSON.stringify(err)
    const fileRejected = /pdf|mime|file type|Invalid file/i.test(detail)
    return {
      ok: false,
      error: fileRejected
        ? 'Fichier refusé. Envoyez un PDF complet ou une photo JPG, PNG ou HEIC.'
        : 'Une erreur est survenue. Réessayez ou appelez-nous.',
    }
  }
}

/** PUB-14 : réservation d'un créneau d'essai ou de passage en agence. */
export async function bookAppointment(form: FormData): Promise<ActionResult> {
  const spam = await checkSpam(form)
  if (spam) return { ok: false, error: spam }

  const name = str(form, 'name', 120)
  const email = str(form, 'email', 160).toLowerCase()
  const phone = str(form, 'phone', 30)
  const startsAt = str(form, 'startsAt', 40)
  const kind = pick(str(form, 'kind'), ['test-drive', 'visit', 'delivery'] as const) ?? 'visit'

  if (!name) return { ok: false, error: 'Merci d’indiquer votre nom.' }
  if (!isEmail(email)) return { ok: false, error: 'Adresse e-mail invalide.' }
  if (!isPhone(phone)) return { ok: false, error: 'Numéro de téléphone invalide.' }
  if (form.get('privacy') !== 'on') return { ok: false, error: 'Merci d’accepter la politique de confidentialité.' }

  const payload = await payloadClient()
  if (!(await isSlotAvailable(payload, startsAt))) return { ok: false, error: 'Ce créneau vient d’être pris. Choisissez-en un autre.' }

  const vehicleId = num(form, 'vehicle')
  await payload.create({
    collection: 'appointments',
    data: { name, email, phone, startsAt, kind, status: 'confirmed', vehicle: vehicleId || undefined },
    overrideAccess: true,
  })
  return { ok: true, message: 'Rendez-vous confirmé. Vous allez recevoir un e-mail récapitulatif.' }
}

async function upsertSubscriber(email: string, firstName: string | undefined, data: { newsletter?: boolean; alertEnabled?: boolean; criteria?: Record<string, unknown> }) {
  const payload = await payloadClient()
  const { docs } = await payload.find({ collection: 'subscribers', where: { email: { equals: email } }, limit: 1, overrideAccess: true })
  const consentAt = new Date().toISOString()
  if (docs[0]) {
    await payload.update({ collection: 'subscribers', id: docs[0].id, data: { ...data, consentAt, firstName: firstName || docs[0].firstName }, overrideAccess: true })
  } else {
    await payload.create({ collection: 'subscribers', data: { email, firstName, consentAt, ...data }, overrideAccess: true })
  }
}

/** PUB-15 : alerte véhicule (critères) ou simple inscription à la newsletter. */
export async function subscribe(form: FormData): Promise<ActionResult> {
  const spam = await checkSpam(form)
  if (spam) return { ok: false, error: spam }

  const email = str(form, 'email', 160).toLowerCase()
  if (!isEmail(email)) return { ok: false, error: 'Adresse e-mail invalide.' }
  if (form.get('consent') !== 'on') return { ok: false, error: 'Merci de confirmer votre accord pour recevoir nos e-mails.' }

  const mode = str(form, 'mode')
  if (mode === 'alert') {
    const brands = form.getAll('brands').map(Number).filter(Boolean)
    const fuels = form
      .getAll('fuels')
      .map(String)
      .filter((f) => ['essence', 'diesel', 'hybride', 'hybride-rechargeable', 'electrique', 'gpl'].includes(f))
    await upsertSubscriber(email, str(form, 'firstName', 80) || undefined, {
      alertEnabled: true,
      criteria: { brands, fuels, maxPrice: num(form, 'maxPrice'), maxMonthly: num(form, 'maxMonthly'), maxMileage: num(form, 'maxMileage') },
    })
    return { ok: true, message: 'Alerte créée : vous recevrez un e-mail dès qu’un véhicule correspond.' }
  }
  await upsertSubscriber(email, undefined, { newsletter: true })
  return { ok: true, message: 'Inscription confirmée. À bientôt dans votre boîte mail !' }
}
