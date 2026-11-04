import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

/** Rendu d'un texte riche Payload avec la typographie du site. */
export function Prose({ data, className = '' }: { data: SerializedEditorState | null | undefined; className?: string }) {
  if (!data) return null
  return (
    <div
      className={`max-w-3xl text-[15px] leading-relaxed text-ink-2 [&_a]:font-semibold [&_a]:text-accent [&_a]:underline [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-primary [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-black [&_h3]:text-primary [&_li]:mt-1.5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-4 [&_strong]:text-primary [&_ul]:list-disc [&_ul]:pl-6 ${className}`}
    >
      <RichText data={data} />
    </div>
  )
}
