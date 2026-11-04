import { Calendar, Fuel, Gauge, Settings2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { FUEL_LABELS, GEARBOX_LABELS, formatEUR, formatKm } from '@/lib/format'
import { mediaSrc } from '@/lib/media'
import type { Media, Vehicle } from '@/payload-types'

const NEW_DAYS = 14

/** PUB-04 / PUB-07 : photo, prix total, mensualité « à partir de », km, année, carburant et badges. */
export function VehicleCard({ vehicle, priority = false }: { vehicle: Vehicle; priority?: boolean }) {
  const photo = vehicle.gallery?.find((m): m is Media => typeof m === 'object')
  const src = mediaSrc(photo, 'card')
  const isNew = Date.now() - new Date(vehicle.createdAt).getTime() < NEW_DAYS * 86_400_000
  const badge =
    vehicle.status === 'sold'
      ? { label: 'Vendu', className: 'bg-gray-900 text-white' }
      : vehicle.status === 'reserved'
        ? { label: 'Réservé', className: 'bg-amber-400 text-gray-900' }
        : isNew
          ? { label: 'Nouveau', className: 'bg-accent text-white' }
          : null

  return (
    <Link
      href={`/vehicule/${vehicle.slug}`}
      className="group card hover-lift flex flex-col overflow-hidden"
      aria-label={`${vehicle.title}, ${formatEUR(vehicle.price)}`}
    >
      <div className="relative aspect-3/2 overflow-hidden bg-soft">
        {src && (
          <Image
            src={src}
            alt={photo?.alt ?? vehicle.title}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className={`object-cover transition-transform duration-500 group-hover:scale-105 ${vehicle.status === 'sold' ? 'grayscale' : ''}`}
          />
        )}
        {badge && (
          <span className={`absolute top-3 left-3 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide uppercase ${badge.className}`}>
            {badge.label}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-base leading-snug font-bold text-primary">{vehicle.title}</h3>

        <ul className="mt-3 mb-5 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[13px] text-ink-2">
          <li className="flex items-center gap-1.5"><Calendar className="size-3.5 text-ink-3" aria-hidden />{vehicle.year}</li>
          <li className="flex items-center gap-1.5"><Gauge className="size-3.5 text-ink-3" aria-hidden />{formatKm(vehicle.mileage)}</li>
          <li className="flex items-center gap-1.5"><Fuel className="size-3.5 text-ink-3" aria-hidden />{FUEL_LABELS[vehicle.fuel]}</li>
          <li className="flex items-center gap-1.5"><Settings2 className="size-3.5 text-ink-3" aria-hidden />{GEARBOX_LABELS[vehicle.gearbox]}</li>
        </ul>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-4">
          <div>
            <p className="text-[11px] font-semibold text-ink-3 uppercase">Prix TTC</p>
            <p className="text-lg font-black text-primary">{formatEUR(vehicle.price)}</p>
          </div>
          {vehicle.monthlyFrom ? (
            <div className="text-right">
              <p className="text-[11px] font-semibold text-ink-3 uppercase">À partir de</p>
              <p className="text-lg font-black text-accent">
                {formatEUR(vehicle.monthlyFrom)}
                <span className="text-xs font-bold">/mois*</span>
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
