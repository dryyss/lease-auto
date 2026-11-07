import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { importExportPlugin } from '@payloadcms/plugin-import-export'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fr } from '@payloadcms/translations/languages/fr'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { admins, isAdmin } from './access'
import { Appointments } from './collections/Appointments'
import { Brands, Models } from './collections/Brands'
import { Campaigns } from './collections/Campaigns'
import { Articles, Faqs, LocalPages, Reviews } from './collections/Content'
import { Documents } from './collections/Documents'
import { Media } from './collections/Media'
import { Requests } from './collections/Requests'
import { Subscribers } from './collections/Subscribers'
import { Users } from './collections/Users'
import { Vehicles } from './collections/Vehicles'
import { Agency } from './globals/Agency'
import { Agenda } from './globals/Agenda'
import { Homepage } from './globals/Homepage'
import { Settings } from './globals/Settings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export default buildConfig({
  serverURL,
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ' · Lease Auto' },
    dateFormat: 'dd/MM/yyyy HH:mm',
    importMap: { baseDir: path.resolve(dirname) },
    components: { beforeDashboard: ['@/components/admin/Dashboard#Dashboard'] },
  },
  // E-mails : Resend si la clé est fournie, sinon Payload les écrit dans la console (développement).
  ...(process.env.RESEND_API_KEY && {
    email: resendAdapter({
      apiKey: process.env.RESEND_API_KEY,
      defaultFromAddress: process.env.EMAIL_FROM || 'contact@lease-auto.fr',
      defaultFromName: 'Lease Auto',
    }),
  }),
  i18n: { supportedLanguages: { fr }, fallbackLanguage: 'fr' },
  collections: [
    Vehicles,
    Brands,
    Models,
    Requests,
    Documents,
    Appointments,
    Subscribers,
    Campaigns,
    Reviews,
    Faqs,
    Articles,
    LocalPages,
    Media,
    Users,
  ],
  globals: [Homepage, Agency, Settings, Agenda],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
    // Synchro automatique du schéma seulement sur une base locale : une base distante (Neon) passe par les migrations.
    push: /@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL ?? ''),
  }),
  sharp,
  plugins: [
    // Fichiers sur Vercel Blob en production (le disque Vercel n'est pas conservé), disque local sinon.
    // Suffixe aléatoire : les adresses des justificatifs ne se devinent pas.
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: true,
      collections: { media: true, documents: { prefix: 'justificatifs' } },
    }),
    // ADM-08 : export tableur des abonnés et des demandes
    importExportPlugin({
      collections: [
        { slug: 'subscribers', import: false, export: { disableJobsQueue: true } },
        { slug: 'requests', import: false, export: { disableJobsQueue: true } },
      ],
    }),
    // SEO-04 : titre, description et image de partage par page et par véhicule
    seoPlugin({
      collections: ['vehicles', 'brands', 'models', 'articles', 'local-pages'],
      uploadsCollection: 'media',
      tabbedUI: true,
      generateTitle: ({ doc }) => `${doc?.title ?? doc?.name ?? doc?.city ?? ''} | Lease Auto`,
      generateURL: ({ doc, collectionSlug }) => {
        const base: Record<string, string> = {
          vehicles: '/vehicule/',
          brands: '/vehicules/',
          articles: '/guides/',
          'local-pages': '/voiture-occasion/',
        }
        const brandSlug = typeof doc?.brand === 'object' ? doc.brand?.slug : ''
        const path = collectionSlug === 'models' ? `/vehicules/${brandSlug}/` : (base[collectionSlug ?? ''] ?? '/')
        return `${serverURL}${path}${doc?.slug ?? ''}`
      },
    }),
    // SEO-06 : redirections des anciennes adresses
    redirectsPlugin({
      collections: ['vehicles', 'articles', 'local-pages'],
      overrides: {
        admin: { group: 'Réglages', hidden: ({ user }) => !isAdmin(user) },
        access: { read: () => true, create: admins, update: admins, delete: admins },
      },
    }),
  ],
})
