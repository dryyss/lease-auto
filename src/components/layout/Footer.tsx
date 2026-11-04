import { Clock, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { telHref } from '@/lib/format'
import { getSettings, payloadClient } from '@/lib/payload'

const linkClass = 'text-white/60 transition-colors hover:text-white'

export async function Footer() {
  const settings = await getSettings()
  const payload = await payloadClient()
  const [brands, localPages] = await Promise.all([
    payload.find({ collection: 'brands', limit: 8, sort: 'name', depth: 0, select: { name: true, slug: true } }),
    payload.find({
      collection: 'local-pages',
      where: { _status: { equals: 'published' } },
      limit: 8,
      depth: 0,
      select: { city: true, slug: true },
    }),
  ])
  const c = settings.company ?? {}

  return (
    <footer className="bg-primary pb-20 text-white sm:pb-0">
      {/* Bandeau d'appel à l'action */}
      <div className="border-b border-white/10">
        <div className="container-site flex flex-col items-center justify-between gap-6 py-10 sm:py-14 lg:flex-row">
          <div className="text-center lg:text-left">
            <p className="mb-2 text-xl font-black sm:text-2xl lg:text-3xl">
              Prêt à rouler dans votre <span className="text-accent-on-dark">prochaine voiture</span> ?
            </p>
            <p className="text-sm text-white/55 sm:text-base">Réponse de principe sous 48 h, dossier 100 % en ligne.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/demande" className="btn-primary">
              Demander un financement
            </Link>
            <Link href="/simulateur" className="btn-ghost border-white/15! bg-white/5! text-white! hover:bg-white/10!">
              Simuler ma mensualité
            </Link>
          </div>
        </div>
      </div>

      <div className="container-site">
        <div className="grid gap-10 border-b border-white/10 py-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="mb-4 inline-flex rounded-xl bg-white px-4 py-3">
              <Image src="/images/logo-lease-auto.png" alt="Lease Auto" width={456} height={85} className="h-8 w-auto" />
            </div>
            <p className="mb-5 max-w-sm text-sm leading-relaxed text-white/55">
              Véhicules d’occasion contrôlés et garantis, financés en LOA, LLD ou crédit, livrés partout en France depuis notre
              agence d’Épinay-sur-Seine.
            </p>
            <ul className="space-y-2.5 text-sm text-white/70">
              {c.address && (
                <li className="flex gap-2.5">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-accent-on-dark" aria-hidden />
                  {c.mapsUrl ? (
                    <a href={c.mapsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                      {c.address}, {c.postalCode} {c.city}
                    </a>
                  ) : (
                    <span>
                      {c.address}, {c.postalCode} {c.city}
                    </span>
                  )}
                </li>
              )}
              {c.phone && (
                <li className="flex gap-2.5">
                  <Phone className="mt-0.5 size-4 shrink-0 text-accent-on-dark" aria-hidden />
                  <a href={telHref(c.phone)} className="hover:text-white">
                    {c.phone}
                  </a>
                </li>
              )}
              {c.email && (
                <li className="flex gap-2.5">
                  <Mail className="mt-0.5 size-4 shrink-0 text-accent-on-dark" aria-hidden />
                  <a href={`mailto:${c.email}`} className="hover:text-white">
                    {c.email}
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:col-span-8">
            <FooterColumn title="Véhicules">
              <li><Link href="/vehicules" className={linkClass}>Tout le stock</Link></li>
              {brands.docs.map((b) => (
                <li key={b.id}><Link href={`/vehicules/${b.slug}`} className={linkClass}>{b.name} d’occasion</Link></li>
              ))}
            </FooterColumn>
            <FooterColumn title="Financement">
              <li><Link href="/financement/loa" className={linkClass}>LOA</Link></li>
              <li><Link href="/financement/lld" className={linkClass}>LLD</Link></li>
              <li><Link href="/financement/credit" className={linkClass}>Crédit auto</Link></li>
              <li><Link href="/simulateur" className={linkClass}>Simulateur</Link></li>
              <li><Link href="/reprise" className={linkClass}>Estimer ma reprise</Link></li>
            </FooterColumn>
            <FooterColumn title="Lease Auto">
              <li><Link href="/agence" className={linkClass}>L’agence</Link></li>
              <li><Link href="/rendez-vous" className={linkClass}>Prendre rendez-vous</Link></li>
              <li><Link href="/guides" className={linkClass}>Guides et conseils</Link></li>
              <li><Link href="/faq" className={linkClass}>FAQ</Link></li>
              <li><Link href="/contact" className={linkClass}>Contact</Link></li>
            </FooterColumn>
            <FooterColumn title="Horaires">
              {(settings.openingHours ?? []).length > 0 ? (
                settings.openingHours!.map((h) => (
                  <li key={h.id ?? h.days} className="text-white/60">
                    <span className="block font-semibold text-white/80">{h.days}</span>
                    {h.hours}
                  </li>
                ))
              ) : (
                <li className="flex gap-2 text-white/60">
                  <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
                  Sur rendez-vous
                </li>
              )}
            </FooterColumn>
          </div>
        </div>

        {localPages.docs.length > 0 && (
          <div className="border-b border-white/10 py-7 text-sm">
            <p className="mb-3 text-xs font-bold tracking-widest text-white/80 uppercase">Nous livrons aussi</p>
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {localPages.docs.map((p) => (
                <li key={p.id}><Link href={`/voiture-occasion/${p.slug}`} className={linkClass}>{p.city}</Link></li>
              ))}
            </ul>
          </div>
        )}

        {/* Mentions obligatoires (PUB-02) */}
        <div className="flex flex-col gap-4 py-6 text-xs text-white/45 lg:flex-row lg:items-center lg:justify-between">
          <p className="flex flex-wrap gap-x-3 gap-y-1">
            <span className="font-semibold text-white/60">{c.name}{c.legalForm && `, ${c.legalForm}`}</span>
            {c.siren && <span>SIREN {c.siren}</span>}
            {c.rcs && <span>RCS {c.rcs}</span>}
            {c.orias && <span>Intermédiaire en opérations de banque, ORIAS n° {c.orias} (orias.fr)</span>}
          </p>
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <li><Link href="/mentions-legales" className="hover:text-white">Mentions légales</Link></li>
            <li><Link href="/confidentialite" className="hover:text-white">Confidentialité</Link></li>
            <li><Link href="/cookies" className="hover:text-white">Cookies</Link></li>
            <li><Link href="/conditions-generales" className="hover:text-white">Conditions générales</Link></li>
            <li className="flex items-center gap-1.5"><ShieldCheck className="size-3.5" aria-hidden /> © {new Date().getFullYear()} Lease Auto</li>
          </ul>
        </div>

        <div className="flex justify-center border-t border-white/10 py-5">
          <a href="https://magar-developpement.fr" target="_blank" rel="noopener noreferrer" className="text-xs text-white/40 transition-colors hover:text-white">
            Développé par <span className="font-semibold text-white/60">Magar Développement</span>
          </a>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-4 text-xs font-bold tracking-widest text-white/80 uppercase">{title}</p>
      <ul className="space-y-2.5 text-sm">{children}</ul>
    </div>
  )
}
