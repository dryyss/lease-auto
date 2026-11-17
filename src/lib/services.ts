// Services externes branchés ou non. Le site s'adapte au lieu d'échouer.

/**
 * Fichiers (justificatifs, photos) : toujours disponibles. Vercel Blob si un jeton est fourni,
 * sinon la base de données en ligne (src/lib/db-storage.ts), le disque en local.
 */
export const uploadsEnabled = () => true

/** E-mails transactionnels (Resend). */
export const emailEnabled = () => Boolean(process.env.RESEND_API_KEY)
