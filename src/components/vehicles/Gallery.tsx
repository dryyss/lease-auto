'use client'

import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'

export type GalleryImage = { src: string; large: string; alt: string }

/** PUB-06 : galerie avec vignettes et affichage plein écran (clavier, glissement sur mobile). */
export function Gallery({ images, sold }: { images: GalleryImage[]; sold?: boolean }) {
  const [index, setIndex] = useState(0)
  const [open, setOpen] = useState(false)
  const [touchX, setTouchX] = useState<number | null>(null)
  const count = images.length
  const go = useCallback((delta: number) => setIndex((i) => (i + delta + count) % count), [count])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, go])

  if (!count) return <div className="aspect-3/2 rounded-3xl bg-soft" />
  const current = images[index]

  const swipe = {
    onTouchStart: (e: React.TouchEvent) => setTouchX(e.touches[0].clientX),
    onTouchEnd: (e: React.TouchEvent) => {
      if (touchX === null) return
      const dx = e.changedTouches[0].clientX - touchX
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
      setTouchX(null)
    },
  }

  return (
    <div>
      <div className="group relative aspect-3/2 overflow-hidden rounded-3xl bg-soft" {...swipe}>
        <Image src={current.src} alt={current.alt} fill priority sizes="(min-width: 1024px) 60vw, 100vw" className={`object-cover ${sold ? 'grayscale' : ''}`} />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-2 text-xs font-bold text-primary shadow backdrop-blur"
        >
          <Expand className="size-3.5" aria-hidden /> Plein écran · {index + 1}/{count}
        </button>
        {count > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Photo précédente" className="absolute top-1/2 left-3 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-primary shadow">
              <ChevronLeft className="size-5" />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Photo suivante" className="absolute top-1/2 right-3 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-primary shadow">
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Photo ${i + 1}`}
              aria-current={i === index}
              className={`relative aspect-3/2 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition ${i === index ? 'border-accent' : 'border-transparent opacity-70 hover:opacity-100'}`}
            >
              <Image src={img.src} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {open && (
        <div role="dialog" aria-modal="true" aria-label="Galerie photos" className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95" {...swipe}>
          <button type="button" onClick={() => setOpen(false)} aria-label="Fermer" className="absolute top-4 right-4 z-10 flex size-11 items-center justify-center rounded-full bg-white/10 text-white">
            <X className="size-6" />
          </button>
          <div className="relative h-[85vh] w-full max-w-6xl">
            <Image src={current.large} alt={current.alt} fill sizes="100vw" className="object-contain" />
          </div>
          {count > 1 && (
            <>
              <button type="button" onClick={() => go(-1)} aria-label="Photo précédente" className="absolute left-4 flex size-12 items-center justify-center rounded-full bg-white/10 text-white">
                <ChevronLeft className="size-6" />
              </button>
              <button type="button" onClick={() => go(1)} aria-label="Photo suivante" className="absolute right-4 flex size-12 items-center justify-center rounded-full bg-white/10 text-white">
                <ChevronRight className="size-6" />
              </button>
            </>
          )}
          <p className="absolute bottom-4 text-sm font-bold text-white/70">
            {index + 1} / {count}
          </p>
        </div>
      )}
    </div>
  )
}
