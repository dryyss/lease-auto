import 'server-only'

import config from '@payload-config'
import { convertLexicalToMarkdown, convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'

// Les textes riches de Payload (Lexical) s'éditent dans la console en Markdown simple :
// titres (##), gras (**), italique (*), listes (-), liens [texte](url). Conversion dans les deux sens, côté serveur.

let editorConfig: Awaited<ReturnType<typeof editorConfigFactory.default>> | undefined
const getEditorConfig = async () => (editorConfig ??= await editorConfigFactory.default({ config: await config }))

type Lexical = Parameters<typeof convertLexicalToMarkdown>[0]['data']

/** Texte riche enregistré → Markdown pour le champ d'édition. Vide si rien. */
export async function richTextToMarkdown(value: unknown): Promise<string> {
  if (!value || typeof value !== 'object' || !('root' in value)) return ''
  try {
    return convertLexicalToMarkdown({ data: value as Lexical, editorConfig: await getEditorConfig() }).trim()
  } catch {
    return ''
  }
}

/** Markdown saisi → texte riche à enregistrer (null si vide). */
export async function markdownToRichText(markdown: string): Promise<Lexical | null> {
  const md = markdown.replace(/\r\n/g, '\n').trim()
  if (!md) return null
  return convertMarkdownToLexical({ editorConfig: await getEditorConfig(), markdown: md }) as Lexical
}
