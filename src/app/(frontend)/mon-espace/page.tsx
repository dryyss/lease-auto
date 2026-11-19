import { CalendarDays, CarFront, Check, FileText, LogOut, Phone, UserRound } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { demoAccessAllowed } from '@/auth/devStrategy'
import { PageHero } from '@/components/ui/PageHero'
import { customerEmail } from '@/lib/customer-session'
import { FORMULA_LABELS, formatEUR, telHref } from '@/lib/format'
import { manageAppointmentPath } from '@/lib/appointment-link'
import { getSettings, payloadClient } from '@/lib/payload'
import { BUSINESS_DOCS, isBusinessProfile, PERSONAL_DOCS } from '@/lib/required-documents'
import type { Appointment, Request } from '@/payload-types'

import { closeSpace, openDemoSpace } from './actions'
import { DocumentUpload } from './DocumentUpload'
import { SpaceLogin } from './SpaceLogin'

export const metadata: Metadata = { title: 'Mon espace', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

const TYPES: Record<Request['type'], string> = { financing: 'Demande de financement', tradein: 'Estimation de reprise', contact: 'Message', callback: 'Demande de rappel' }
const KINDS: Record<Appointment['kind'], string> = { 'test-drive': 'Essai du véhicule', visit: 'Passage à l’agence', delivery: 'Livraison' }

// Étapes montrées au client. Les autres demandes (contact, rappel, reprise) n'ont que « reçue → prise en charge → traitée ».
const FINANCING_STEPS = ['Demande reçue', 'Dossier à l’étude', 'Accord obtenu', 'Véhicule livré']
const SIMPLE_STEPS = ['Demande reçue', 'Prise en charge', 'Traitée']
const stepIndex = (r: Request) =>
  r.type === 'financing' ? { new: 0, review: 1, approved: 2, delivered: 3, refused: 1 }[r.status] : { new: 0, review: 1, approved: 1, delivered: 2, refused: 1 }[r.status]

const STATUS_TEXT: Record<Request['status'], string> = {
  new: 'Votre demande est bien reçue. Un conseiller la prend en charge et revient vers vous.',
  review: 'Votre dossier est à l’étude. Nous vous tenons informé dès qu’une réponse arrive.',
  approved: 'Bonne nouvelle : votre financement a reçu un accord. Votre conseiller vous contacte pour la signature et la livraison.',
  delivered: 'Votre véhicule est livré. Merci pour votre confiance, et bonne route !',
  refused: 'Nous n’avons pas pu obtenir d’accord pour ce dossier. Votre conseiller peut étudier avec vous une autre solution (autre véhicule, apport, durée).',
}
const simpleText = (r: Request) =>
  r.status === 'new' ? 'Votre demande est bien reçue. Un conseiller vous recontacte.' : r.status === 'delivered' || r.status === 'refused' ? 'Cette demande est traitée.' : 'Un conseiller s’occupe de votre demande.'

const day = (s: string) => new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' })
const dayTime = (s: string) =>
  new Date(s).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })

export default async function CustomerSpacePage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const email = await customerEmail()
  const settings = await getSettings()
  const phone = settings.company?.phone

  if (!email) {
    const { ref } = await searchParams
    return (
      <>
        <PageHero compact eyebrow="Mon espace" title="Suivez votre demande" intro="Avancement de votre dossier, pièces à fournir et rendez-vous, au même endroit." crumbs={[{ label: 'Mon espace' }]} />
        <div className="container-site grid items-start gap-8 pb-16 lg:grid-cols-[1fr_340px]">
          <div className="card p-6 sm:p-8">
            <h2 className="mb-1 text-xl font-black text-primary">Ouvrir mon espace</h2>
            <p className="mb-6 text-sm text-ink-2">Pas de mot de passe : la référence reçue à l’envoi de votre demande (elle commence par LA-) et votre e-mail suffisent.</p>
            <SpaceLogin reference={ref} />
            {demoAccessAllowed() && (
              <form action={openDemoSpace} className="mt-6 border-t border-line pt-6">
                <p className="mb-3 text-sm text-ink-2">Démonstration : découvrez l’espace avec un dossier d’exemple.</p>
                <button type="submit" className="btn-ghost">
                  Voir l’espace de démonstration
                </button>
              </form>
            )}
          </div>
          <aside className="space-y-4">
            <div className="card space-y-3 p-6 text-sm text-ink-2">
              <p className="font-black text-primary">Pas encore de demande ?</p>
              <p>Votre espace s’ouvre dès votre première demande de financement, de reprise ou de rappel.</p>
              <Link href="/demande" className="btn-primary w-full">
                <CarFront className="size-4" aria-hidden /> Demander un financement
              </Link>
            </div>
            <div className="card space-y-2 p-6 text-sm text-ink-2">
              <p className="font-black text-primary">Vous êtes de l’équipe Lease Auto ?</p>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- /admin redirige vers Auth0 (autre domaine) */}
              <a href="/gestion" className="font-bold text-accent hover:underline">
                Accéder à l’administration
              </a>
            </div>
          </aside>
        </div>
      </>
    )
  }

  const payload = await payloadClient()
  // Uniquement les champs montrables au client : jamais les notes internes, le motif de refus ni l'historique détaillé.
  const [requests, appointments] = await Promise.all([
    payload.find({
      collection: 'requests',
      where: { email: { equals: email } },
      sort: '-createdAt',
      limit: 20,
      depth: 1,
      overrideAccess: true,
      select: { reference: true, type: true, status: true, firstName: true, createdAt: true, vehicle: true, formula: true, months: true, deposit: true, profile: true, missingDocuments: true, tradeIn: true, assignedTo: true },
    }),
    payload.find({
      collection: 'appointments',
      where: { and: [{ email: { equals: email } }, { status: { equals: 'confirmed' } }, { startsAt: { greater_than: new Date(Date.now() - 3_600_000).toISOString() } }] },
      sort: 'startsAt',
      limit: 10,
      depth: 1,
      overrideAccess: true,
      select: { startsAt: true, kind: true, vehicle: true, email: true },
    }),
  ])
  const documents = requests.docs.length
    ? await payload.find({
        collection: 'documents',
        where: { request: { in: requests.docs.map((r) => r.id) } },
        limit: 200,
        depth: 0,
        overrideAccess: true,
        select: { request: true, kind: true },
      })
    : { docs: [] }
  const docsOf = (id: number) => documents.docs.filter((d) => (typeof d.request === 'object' ? d.request?.id : d.request) === id)
  const received = (id: number) => docsOf(id).length
  const receivedKinds = (id: number) => docsOf(id).reduce<Record<string, number>>((acc, d) => ({ ...acc, [d.kind ?? 'other']: (acc[d.kind ?? 'other'] ?? 0) + 1 }), {})

  const firstName = requests.docs[0]?.firstName
  const active = requests.docs.filter((r) => r.status !== 'delivered' && r.status !== 'refused').length

  return (
    <>
      <PageHero
        compact
        eyebrow="Mon espace"
        title={firstName ? `Bonjour ${firstName}` : 'Bonjour'}
        intro={active ? `${active} demande${active > 1 ? 's' : ''} en cours. Voici où en est votre dossier.` : 'Retrouvez ici vos demandes et vos rendez-vous.'}
        crumbs={[{ label: 'Mon espace' }]}
      />
      <div className="container-site grid items-start gap-8 pb-16 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {requests.docs.length === 0 && <p className="card p-6 text-ink-2">Aucune demande n’est associée à cette adresse e-mail.</p>}
          {requests.docs.map((r) => {
            const financing = r.type === 'financing'
            const steps = financing ? FINANCING_STEPS : SIMPLE_STEPS
            const current = stepIndex(r as Request)
            const refused = r.status === 'refused'
            const vehicle = r.vehicle && typeof r.vehicle === 'object' ? r.vehicle : null
            const advisor = r.assignedTo && typeof r.assignedTo === 'object' ? r.assignedTo.name?.split(' ')[0] : null
            const docs = isBusinessProfile(r.profile ?? '') ? BUSINESS_DOCS : PERSONAL_DOCS
            const count = received(r.id)
            return (
              <article key={r.id} className="card p-6 sm:p-8">
                <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="eyebrow mb-1">{TYPES[r.type]}</p>
                    <h2 className="text-xl font-black text-primary">
                      {vehicle?.title ?? (r.tradeIn?.brand ? `${r.tradeIn.brand} ${r.tradeIn.model ?? ''}` : 'Votre demande')}
                    </h2>
                    <p className="mt-1 text-sm text-ink-3">
                      Référence {r.reference} · déposée le {day(r.createdAt)}
                    </p>
                  </div>
                  {vehicle && (
                    <Link href={`/vehicule/${vehicle.slug}`} className="btn-ghost px-4! py-2.5! text-sm">
                      Voir le véhicule
                    </Link>
                  )}
                </header>

                {/* Avancement : étapes franchies en vert, étape en cours en rouge. */}
                <ol className={`mb-6 grid gap-3 ${financing ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
                  {steps.map((label, i) => {
                    // Demande terminée : la dernière étape est franchie elle aussi (verte), plus rien n’est « en cours ».
                    const finished = r.status === "delivered"
                    const done = !refused && (i < current || finished)
                    const now = !refused && !finished && i === current
                    return (
                      <li key={label} aria-current={now ? 'step' : undefined} className="flex items-center gap-3 sm:block">
                        <span className={`mb-0 block h-1.5 w-10 shrink-0 rounded-full sm:mb-2 sm:w-full ${done ? 'bg-emerald-500' : now ? 'bg-accent' : 'bg-line'}`} />
                        <span className={`flex items-center gap-1.5 text-sm font-bold ${done ? 'text-emerald-700' : now ? 'text-primary' : 'text-ink-3'}`}>
                          {done && <Check className="size-4" aria-hidden />}
                          {label}
                        </span>
                      </li>
                    )
                  })}
                </ol>
                <p className={`rounded-2xl p-4 text-sm ${refused && financing ? 'bg-soft text-ink-2' : r.status === 'approved' && financing ? 'bg-emerald-50 font-semibold text-emerald-800' : 'bg-soft text-ink-2'}`}>
                  {financing ? STATUS_TEXT[r.status] : simpleText(r as Request)}
                </p>

                {financing && (r.formula || r.months || r.deposit != null) && (
                  <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
                    {r.formula && (
                      <div>
                        <dt className="text-xs font-bold tracking-wide text-ink-3 uppercase">Formule</dt>
                        <dd className="mt-1 font-bold text-primary">{FORMULA_LABELS[r.formula]}</dd>
                      </div>
                    )}
                    {r.months ? (
                      <div>
                        <dt className="text-xs font-bold tracking-wide text-ink-3 uppercase">Durée souhaitée</dt>
                        <dd className="mt-1 font-bold text-primary">{r.months} mois</dd>
                      </div>
                    ) : null}
                    {r.deposit != null && (
                      <div>
                        <dt className="text-xs font-bold tracking-wide text-ink-3 uppercase">Apport</dt>
                        <dd className="mt-1 font-bold text-primary">{formatEUR(r.deposit)}</dd>
                      </div>
                    )}
                  </dl>
                )}

                {financing && (r.status === 'new' || r.status === 'review' || r.status === 'approved') && (
                  <section className="mt-6 border-t border-line pt-6">
                    <h3 className="mb-1 flex items-center gap-2 font-black text-primary">
                      <FileText className="size-5 text-accent" aria-hidden /> Vos justificatifs
                    </h3>
                    <p className="mb-4 text-sm text-ink-2">
                      {r.missingDocuments
                        ? 'Envoyez vos pièces ici, en PDF ou en photo (4 Mo par envoi). Votre conseiller est prévenu et les vérifie.'
                        : 'Votre dossier est complet. Vous pouvez encore ajouter une pièce si votre conseiller vous le demande.'}
                      {count > 0 ? ` ${count} fichier${count > 1 ? 's' : ''} reçu${count > 1 ? 's' : ''} au total.` : ''}
                    </p>
                    <DocumentUpload requestId={r.id} docs={docs} receivedKinds={receivedKinds(r.id)} />
                  </section>
                )}

                {advisor && (
                  <p className="mt-6 flex items-center gap-2 border-t border-line pt-5 text-sm text-ink-2">
                    <UserRound className="size-4 text-accent" aria-hidden />
                    Votre conseiller : <strong className="text-primary">{advisor}</strong>
                  </p>
                )}
              </article>
            )
          })}
        </div>

        <aside className="space-y-4">
          <div className="card p-6">
            <p className="mb-4 flex items-center gap-2 font-black text-primary">
              <CalendarDays className="size-5 text-accent" aria-hidden /> Mes rendez-vous
            </p>
            {appointments.docs.length === 0 ? (
              <p className="mb-4 text-sm text-ink-2">Aucun rendez-vous à venir.</p>
            ) : (
              <ul className="mb-4 space-y-3 text-sm">
                {appointments.docs.map((a) => (
                  <li key={a.id} className="rounded-2xl bg-soft p-3.5">
                    <p className="font-bold text-primary first-letter:uppercase">{dayTime(a.startsAt)}</p>
                    <p className="text-ink-2">
                      {KINDS[a.kind]}
                      {a.vehicle && typeof a.vehicle === 'object' ? ` · ${a.vehicle.title}` : ''}
                    </p>
                    <Link href={manageAppointmentPath({ id: a.id, email: a.email ?? email })} className="mt-1.5 inline-block text-xs font-bold text-accent hover:underline">
                      Changer de créneau ou annuler
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/rendez-vous" className="btn-ghost w-full">
              Prendre rendez-vous
            </Link>
          </div>

          <div className="gradient-cta rounded-3xl p-6">
            <p className="relative mb-2 text-lg font-black">Une question sur votre dossier ?</p>
            <p className="relative mb-4 text-sm text-white/80">Appelez-nous en indiquant votre référence.</p>
            {phone && (
              <a href={telHref(phone)} className="relative flex items-center gap-2.5 text-lg font-black text-white hover:underline">
                <Phone className="size-5 text-accent-on-dark" aria-hidden /> {phone}
              </a>
            )}
          </div>

          <form action={closeSpace}>
            <p className="mb-2 text-xs break-all text-ink-3">Connecté avec {email}</p>
            <button type="submit" className="inline-flex items-center gap-2 text-sm font-bold text-ink-2 hover:text-accent">
              <LogOut className="size-4" aria-hidden /> Fermer mon espace
            </button>
          </form>
        </aside>
      </div>
    </>
  )
}
