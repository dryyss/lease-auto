import type { Field, FieldHook } from 'payload'

export const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** Champ slug rempli automatiquement à partir d'un ou plusieurs champs, modifiable à la main. */
export const slugField = (from: string[], { unique = true } = {}): Field => {
  const fill: FieldHook = ({ value, data }) => {
    if (typeof value === 'string' && value.length > 0) return slugify(value)
    const source = from.map((name) => data?.[name]).filter(Boolean).join(' ')
    return source ? slugify(String(source)) : value
  }

  return {
    name: 'slug',
    type: 'text',
    index: true,
    unique,
    admin: {
      position: 'sidebar',
      description: 'Adresse de la page. Générée automatiquement si vide.',
    },
    hooks: { beforeValidate: [fill] },
  }
}
