import { PageHero } from '@/components/ui/PageHero'
import { Prose } from '@/components/ui/Prose'
import { getSettings } from '@/lib/payload'

type Kind = 'legalNotice' | 'privacyPolicy' | 'terms'

/** PUB-19 : texte saisi dans Réglages → Mentions légales, sinon texte de base généré depuis les coordonnées. */
export async function LegalPage({ kind, title, children }: { kind: Kind; title: string; children?: React.ReactNode }) {
  const settings = await getSettings()
  const content = settings[kind]
  return (
    <>
      <PageHero eyebrow="Informations légales" title={title} crumbs={[{ label: title }]} />
      <div className="container-site pb-16">{content ? <Prose data={content} /> : <Fallback kind={kind} />}{children}</div>
    </>
  )
}

async function Fallback({ kind }: { kind: Kind }) {
  const s = await getSettings()
  const c = s.company
  const company = [c?.name ?? 'Lease Auto', c?.legalForm].filter(Boolean).join(', ')
  const address = `${c?.address ?? ''}, ${c?.postalCode ?? ''} ${c?.city ?? ''}`
  const box = 'max-w-3xl space-y-4 text-[15px] leading-relaxed text-ink-2 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-black [&_h2]:text-primary [&_ul]:list-disc [&_ul]:pl-6'

  if (kind === 'legalNotice') {
    return (
      <div className={box}>
        <h2>Éditeur du site</h2>
        <p>
          {company}, {address}. {c?.siren && `SIREN ${c.siren}. `}
          {c?.rcs && `RCS ${c.rcs}. `}Téléphone : {c?.phone}. E-mail : {c?.email}.
        </p>
        <h2>Intermédiaire en opérations de banque</h2>
        <p>
          {c?.orias
            ? `${c?.name} est immatriculée à l’ORIAS sous le n° ${c.orias} (vérifiable sur www.orias.fr) en qualité d’intermédiaire en opérations de banque et en services de paiement. ${c?.name} n’agit pas en tant que prêteur.`
            : 'Numéro ORIAS à compléter dans Réglages → Entreprise.'}
        </p>
        <h2>Hébergement</h2>
        <p>Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.</p>
        <h2>Réalisation</h2>
        <p>Magar Développement.</p>
        <h2>Propriété intellectuelle</h2>
        <p>Les contenus de ce site (textes, photos, logo) appartiennent à {c?.name ?? 'Lease Auto'} ou à leurs auteurs. Toute reproduction sans autorisation est interdite.</p>
      </div>
    )
  }
  if (kind === 'privacyPolicy') {
    return (
      <div className={box}>
        <h2>Responsable du traitement</h2>
        <p>{company}, {address}. Contact : {c?.email}.</p>
        <h2>Données collectées</h2>
        <ul>
          <li>Identité et contact : nom, prénom, e-mail, téléphone, code postal.</li>
          <li>Données de dossier : véhicule, financement souhaité, situation professionnelle, revenus, justificatifs transmis.</li>
          <li>Données techniques : cookies de mesure d’audience, si vous les acceptez.</li>
        </ul>
        <h2>Finalités et bases légales</h2>
        <ul>
          <li>Traiter vos demandes et transmettre votre dossier aux organismes financiers : mesures précontractuelles.</li>
          <li>Vous envoyer les nouveautés, alertes et offres : votre consentement, retirable à tout moment.</li>
          <li>Sécurité du site et prévention de la fraude : intérêt légitime.</li>
        </ul>
        <h2>Destinataires</h2>
        <p>L’équipe Lease Auto habilitée, les organismes financiers partenaires pour l’étude de votre dossier, et nos prestataires techniques (hébergement, envoi d’e-mails) sous contrat.</p>
        <h2>Durées de conservation</h2>
        <ul>
          <li>Justificatifs : {s.retention?.documentsDays ?? 90} jours après leur envoi, puis suppression automatique.</li>
          <li>Prospects : 3 ans après le dernier contact.</li>
          <li>Clients : 5 ans après la fin du contrat (10 ans pour les pièces comptables).</li>
          <li>Cookies de mesure d’audience : 13 mois.</li>
        </ul>
        <h2>Vos droits</h2>
        <p>
          Vous pouvez accéder à vos données, les rectifier, les supprimer, vous opposer à leur traitement ou demander leur portabilité en écrivant à {c?.email}. Vous pouvez aussi
          saisir la CNIL (www.cnil.fr).
        </p>
      </div>
    )
  }
  return (
    <div className={box}>
      <h2>Objet</h2>
      <p>Les présentes conditions encadrent l’utilisation du site de {c?.name ?? 'Lease Auto'} et le dépôt de demandes de financement, de reprise ou de rendez-vous.</p>
      <h2>Annonces et prix</h2>
      <p>Les prix sont indiqués TTC. Les mensualités sont indicatives et soumises à l’acceptation du dossier par l’organisme financier. Un crédit vous engage et doit être remboursé.</p>
      <h2>Demandes en ligne</h2>
      <p>Une demande déposée sur le site ne vaut ni commande ni accord de financement. Elle permet à un conseiller d’étudier votre projet et de vous recontacter.</p>
      <h2>Droit applicable</h2>
      <p>Droit français. En cas de litige, vous pouvez recourir gratuitement à un médiateur de la consommation.</p>
    </div>
  )
}
