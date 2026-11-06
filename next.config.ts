import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  // Auth0 est chargé à l'exécution. Le bundler sinon recompile tout le site à chaque URL
  // (require dynamique dans le SDK, compilation de 15 à 20 s).
  serverExternalPackages: ['@auth0/nextjs-auth0', 'jose'],
  images: {
    localPatterns: [{ pathname: '/api/media/file/**' }, { pathname: '/images/**' }],
    formats: ['image/avif', 'image/webp'],
  },
  // Justificatifs et photos envoyés par les formulaires (compressés côté navigateur, 4 Mo max).
  experimental: { serverActions: { bodySizeLimit: '5mb' } },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    webpackConfig.ignoreWarnings = [
      ...(webpackConfig.ignoreWarnings ?? []),
      { module: /jose|@auth0[\\/]nextjs-auth0/, message: /Critical dependency/ },
    ]

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
