'use client'

import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'

/** Fenêtre de la console (élément <dialog> natif : focus, Échap et fond gérés par le navigateur). */
export function Dialog({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={`m-auto w-[calc(100vw-2rem)] rounded-2xl border-0 bg-white p-0 text-primary shadow-2xl backdrop:bg-primary/45 backdrop:backdrop-blur-sm ${wide ? 'max-w-4xl' : 'max-w-lg'}`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <h2 className="text-lg font-black text-primary">{title}</h2>
        <button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-lg text-ink-3 hover:bg-soft hover:text-primary" aria-label="Fermer">
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <div className="max-h-[75vh] overflow-y-auto p-5">{children}</div>
    </dialog>
  )
}
