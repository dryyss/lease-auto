'use client'

import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { formatEUR } from '@/lib/format'

export type HeroCar = {
  title: string
  slug: string
  monthly: number
  price: number
  image?: string
}

/** Le budget fait défiler le stock : la photo et la mensualité changent ensemble. */
export function HeroStage({
  fallback,
  title,
  subtitle,
  cars,
}: {
  fallback: string
  title: string
  subtitle?: string
  cars: HeroCar[]
}) {
  const stock = cars.length ? cars : []
  const opening = Math.max(stock.length - 1, 0)
  const [index, setIndex] = useState(opening)
  const [shift, setShift] = useState({ x: 0, y: 0 })
  const [amount, setAmount] = useState(stock[opening]?.monthly ?? 0)
  const shown = useRef(stock[opening]?.monthly ?? 0)
  const car = stock[index]
  const frame = car?.image || fallback

  useEffect(() => {
    const target = car?.monthly ?? 0
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      shown.current = target
      setAmount(target)
      return
    }
    const from = shown.current
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 480)
      const eased = 1 - (1 - p) ** 3
      const next = Math.round(from + (target - from) * eased)
      shown.current = next
      setAmount(next)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [car?.monthly])

  const onMove = (e: React.MouseEvent<HTMLElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const r = e.currentTarget.getBoundingClientRect()
    setShift({
      x: ((e.clientX - r.left) / r.width - 0.5) * -18,
      y: ((e.clientY - r.top) / r.height - 0.5) * -12,
    })
  }

  return (
    <section className="relative flex min-h-[100svh] items-end overflow-hidden" onMouseMove={onMove} onMouseLeave={() => setShift({ x: 0, y: 0 })}>
      <div className="absolute inset-0 transition-transform duration-700 ease-out" style={{ transform: `translate3d(${shift.x}px, ${shift.y}px, 0) scale(1.08)` }}>
        {stock.map((c) => (
          <Image
            key={c.slug}
            src={c.image || fallback}
            alt=""
            fill
            priority={c.slug === stock[opening]?.slug}
            sizes="100vw"
            className={`object-cover object-[center_40%] transition-opacity duration-700 ${c.slug === car?.slug ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
        {!stock.length && <Image src={frame} alt="" fill priority sizes="100vw" className="object-cover object-[center_40%]" />}
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25" />

      <div className="container-site relative z-10 grid w-full items-end gap-10 px-4 pt-32 pb-10 lg:grid-cols-[1.15fr_minmax(280px,420px)] lg:pb-14">
        <div className="text-white">
          <p className="mb-4 text-[11px] font-bold tracking-[0.32em] text-white/75 uppercase">Épinay-sur-Seine · stock en direct</p>
          <h1 className="max-w-xl font-black tracking-tight text-balance uppercase" style={{ fontSize: 'clamp(40px, 5.2vw, 72px)', lineHeight: 0.92 }}>
            {title}
          </h1>
          {subtitle && <p className="mt-5 max-w-md text-base text-white/80 sm:text-lg">{subtitle}</p>}
        </div>

        <div className="rounded-3xl border border-white/20 bg-white/10 p-5 text-white shadow-2xl backdrop-blur-md sm:p-6">
          <p className="text-[11px] font-bold tracking-[0.22em] text-white/70 uppercase">À partir de</p>
          <p className="mt-1 font-black tracking-tight tabular-nums" style={{ fontSize: 'clamp(52px, 6vw, 76px)', lineHeight: 0.9 }}>
            {formatEUR(amount)}
            <span className="ml-1 text-lg font-bold text-white/70">/mois*</span>
          </p>
          {car ? (
            <>
              <p className="mt-3 text-sm font-semibold text-white/90">{car.title}</p>
              <p className="text-xs text-white/60">{formatEUR(car.price)} TTC</p>
              {stock.length > 1 && (
                <label className="mt-5 block">
                  <span className="mb-2 flex justify-between text-[11px] font-bold tracking-wide text-white/60 uppercase">
                    <span>Plus accessible</span>
                    <span>Plus exclusif</span>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={stock.length - 1}
                    step={1}
                    value={index}
                    aria-valuetext={car.title}
                    onChange={(e) => setIndex(Number(e.target.value))}
                    className="w-full accent-[#de1d22]"
                  />
                </label>
              )}
              <Link href={`/vehicule/${car.slug}`} className="btn-primary mt-5 w-full rounded-full">
                Voir cette offre <ArrowRight className="size-4" aria-hidden />
              </Link>
            </>
          ) : (
            <Link href="/vehicules" className="btn-primary mt-5 w-full rounded-full">
              Voir les véhicules <ArrowRight className="size-4" aria-hidden />
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
