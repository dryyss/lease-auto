'use server'

import { redirect } from 'next/navigation'

import type { ActionResult } from '@/app/(frontend)/actions'
import { demoAccessAllowed } from '@/auth/devStrategy'
import { closeCustomerSession, openCustomerSession } from '@/lib/customer-session'
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

export async function closeSpace() {
  await closeCustomerSession()
  redirect('/mon-espace')
}
