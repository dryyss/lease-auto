// Recherche sans accents ni majuscules ; les numéros de téléphone se comparent chiffre à chiffre.

export const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

export function matches(q: string, fields: (string | null | undefined)[], phones: (string | null | undefined)[]) {
  const n = normalize(q)
  if (!n) return true
  if (fields.some((f) => f && normalize(f).includes(n))) return true
  const digits = q.replace(/\D/g, '')
  // « 06 12 34 » ou « +33 6 12 » : on compare sans le préfixe pays.
  const local = digits.replace(/^33/, '0')
  return digits.length >= 3 && phones.some((p) => {
    const d = (p ?? '').replace(/\D/g, '').replace(/^33/, '0')
    return d.includes(digits) || d.includes(local)
  })
}

export const clientHref = (email: string) => `/gestion/clients/${encodeURIComponent(email.trim().toLowerCase())}`
