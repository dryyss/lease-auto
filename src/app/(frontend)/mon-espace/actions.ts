'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import type { ActionResult } from '@/app/(frontend)/actions'
import { demoAccessAllowed } from '@/auth/devStrategy'
import { closeCustomerSession, customerEmail, openCustomerSession } from '@/lib/customer-session'
import { DOCUMENT_KINDS, readFiles } from '@/lib/uploads'
import { DEMO_CUSTOMER } from '@/lib/demo-customer'
import { payloadClient } from '@/lib/payload'
import { checkSpam } from '@/lib/spam'

/** Ouvre l'espace acheteur avec la référence d'une demande et l'e-mail utilisé pour la déposer. */
export async function openSpace(form: FormData): Promise<ActionResult> {
  // Même garde que les formulaires : champ piège, délai minimal et limite d'essais par adresse IP.
  const spam = await checkSpam(form)
  if (spam) return { ok: false, error: spam }

  const reference = String(form.get('reference') ?? '').trim().toUpperCase().slice(0, 40)
  const email = String(form.get('email') ?? '').trim().toLowerCase().slice(0, 160)
  if (!reference || !email) return { ok: false, error: 'Indiquez votre référence et votre e-mail.' }

  const payload = await payloadClient()
  const found = await payload.count({
    collection: 'requests',
    where: { and: [{ reference: { equals: reference } }, { email: { equals: email } }] },
    overrideAccess: true,
  })
  // Même message que la référence ou l'e-mail soit faux : on ne révèle pas lequel existe.
  if (!found.totalDocs) return { ok: false, error: 'Référence ou e-mail introuvable. Vérifiez l’e-mail utilisé pour votre demande, ou appelez-nous.' }

  await openCustomerSession(email)
  return { ok: true }
}

/** Compte de démonstration, seulement tant que l'accès démo est activé (DEMO_ACCESS_CODE). */
export async function openDemoSpace() {
  if (!demoAccessAllowed()) redirect('/mon-espace')
  await openCustomerSession(DEMO_CUSTOMER.email)
  redirect('/mon-espace')
}

/**
 * Dépôt de justificatifs par le client, depuis son espace. Uniquement sur ses propres demandes de financement
 * encore ouvertes. Le dossier repasse « à vérifier » pour l'équipe (note interne + pièces manquantes levées).
 */
export async function addCustomerDocuments(form: FormData): Promise<ActionResult> {
  const email = await customerEmail()
  if (!email) return { ok: false, error: 'Votre session a expiré. Rouvrez votre espace.' }

  const requestId = Number(form.get('request'))
  const kind = DOCUMENT_KINDS.find((k) => k === String(form.get('kind'))) ?? 'other'
  const files = readFiles(form, 'files')
  if (typeof files === 'string') return { ok: false, error: files }
  if (!files.length) return { ok: false, error: 'Choisissez au moins un fichier.' }

  const payload = await payloadClient()
  const request = await payload.findByID({ collection: 'requests', id: requestId, depth: 0, overrideAccess: true }).catch(() => null)
  if (!request || request.email !== email) return { ok: false, error: 'Demande introuvable.' }
  if (request.type !== 'financing' || !['new', 'review', 'approved'].includes(request.status))
    return { ok: false, error: 'Ce dossier n’attend plus de pièces. Appelez votre conseiller.' }

  let saved = 0
  for (const file of files) {
    try {
      await payload.create({
        collection: 'documents',
        data: { request: request.id, kind },
        file: { data: Buffer.from(await file.arrayBuffer()), mimetype: file.type, name: file.name, size: file.size },
        overrideAccess: true,
      })
      saved++
    } catch (err) {
      payload.logger.error({ err, request: request.id }, 'Justificatif client non enregistré')
    }
  }
  if (!saved) return { ok: false, error: 'Envoi impossible pour le moment. Réessayez ou appelez-nous.' }

  await payload.update({
    collection: 'requests',
    id: request.id,
    overrideAccess: true,
    context: { skipEmails: true },
    data: {
      notes: [
        ...(request.notes ?? []),
        { text: `Le client a déposé ${saved} pièce(s) depuis son espace (${DOCUMENT_LABELS[kind] ?? 'autre'}). À vérifier.`, at: new Date().toISOString() },
      ],
    },
  })
  revalidatePath('/mon-espace')
  return { ok: true, message: `${saved} fichier(s) reçu(s). Votre conseiller les vérifie.` }
}

const DOCUMENT_LABELS: Record<string, string> = {
  id: 'pièce d’identité',
  address: 'justificatif de domicile',
  payslips: 'bulletins de salaire',
  tax: 'avis d’imposition',
  rib: 'RIB',
  kbis: 'Kbis',
  accounts: 'bilans',
  bank: 'relevés bancaires',
  other: 'autre',
}

export async function closeSpace() {
  await closeCustomerSession()
  redirect('/mon-espace')
}
