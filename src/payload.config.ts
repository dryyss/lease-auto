import { postgresAdapter } from '@payloadcms/db-postgres'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fr } from '@payloadcms/translations/languages/fr'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { admins } from './access'
import { Appointments } from './collections/Appointments'
import { Brands, Models } from './collections/Brands'
import { Articles, Faqs, LocalPages, Reviews } from './collections/Content'
import { Documents } from './collections/Documents'
import { Media } from './collections/Media'
import { Requests } from './collections/Requests'
import { Subscribers } from './collections/Subscribers'
import { Users } from './collections/Users'
import { Vehicles } from './collections/Vehicles'
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
    importMap: { baseDir: path.resolve(dirname) },
  },
  i18n: { supportedLanguages: { fr }, fallbackLanguage: 'fr' },
  collections: [
    Vehicles,
    Brands,
    Models,
    Requests,
    Documents,
    Appointments,
    Subscribers,
    Reviews,
    Faqs,
    Articles,
    LocalPages,
    Media,
    Users,
  ],
  globals: [Homepage, Settings, Agenda],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
  }),
  sharp,
  plugins: [
    // SEO-04 : titre, description et image de partage par page et par véhicule
    seoPlugin({
      collections: ['vehicles', 'brands', 'models', 'articles', 'local-pages'],
      uploadsCollection: 'media',
      tabbedUI: true,
      generateTitle: ({ doc }) => `${doc?.title ?? doc?.name ?? doc?.city ?? ''} | Lease Auto`,
      generateURL: ({ doc, collectionSlug }) => `${serverURL}/${collectionSlug}/${doc?.slug ?? ''}`,
    }),
    // SEO-06 : redirections des anciennes adresses
    redirectsPlugin({
      collections: ['vehicles', 'articles', 'local-pages'],
      overrides: {
        admin: { group: 'Réglages' },
        access: { read: () => true, create: admins, update: admins, delete: admins },
      },
    }),
  ],
})
