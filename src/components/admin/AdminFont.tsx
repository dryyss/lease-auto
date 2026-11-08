import { Plus_Jakarta_Sans } from 'next/font/google'
import type { ReactNode } from 'react'

/* Même police que le site public (src/app/(frontend)/layout.tsx), auto-hébergée par next/font. */
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], display: 'swap' })

/** Fournisseur Payload : applique la police de la charte à tout l'admin. */
export function AdminFont({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`html[data-theme]{--font-body:${jakarta.style.fontFamily},-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}`}</style>
      {children}
    </>
  )
}
