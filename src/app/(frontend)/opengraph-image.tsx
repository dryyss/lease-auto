import { readFile } from 'fs/promises'
import { ImageResponse } from 'next/og'
import path from 'path'

// Image de partage par défaut (Facebook, WhatsApp, LinkedIn…). Les fiches véhicule utilisent leur photo.
export const alt = 'Lease Auto : voitures d’occasion en LOA, LLD et crédit à Épinay-sur-Seine'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage() {
  const read = (f: string) => readFile(path.join(process.cwd(), 'public/images', f))
  const [logo, hero] = await Promise.all([read('logo-lease-auto.png'), read('hero.jpg')])
  const src = (b: Buffer, type: string) => `data:${type};base64,${b.toString('base64')}`

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', fontFamily: 'sans-serif' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src(hero, 'image/jpeg')} alt="" width={1200} height={630} style={{ position: 'absolute', top: 0, left: 0, objectFit: 'cover' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, width: 1200, height: 630, display: 'flex', background: 'linear-gradient(90deg, rgba(13,36,73,0.97) 0%, rgba(13,36,73,0.9) 50%, rgba(13,36,73,0.4) 100%)' }} />
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 80px', color: 'white', width: '100%' }}>
          <div style={{ display: 'flex', background: 'white', borderRadius: 20, padding: '18px 26px', alignSelf: 'flex-start' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src(logo, 'image/png')} alt="" width={364} height={68} />
          </div>
          <div style={{ display: 'flex', marginTop: 44, fontSize: 64, fontWeight: 900, lineHeight: 1.05, maxWidth: 820 }}>
            Voitures d’occasion en LOA, LLD et crédit
          </div>
          <div style={{ display: 'flex', marginTop: 26, fontSize: 30, color: 'rgba(255,255,255,0.85)' }}>
            Contrôlées · garantie 12 mois · livraison partout en France
          </div>
          <div style={{ display: 'flex', marginTop: 40, height: 6, width: 160 }}>
            <div style={{ flex: 1, background: 'white' }} />
            <div style={{ flex: 1, background: '#DE1D22' }} />
          </div>
        </div>
      </div>
    ),
    size,
  )
}
