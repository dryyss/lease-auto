// Services externes branchés ou non. Le site s'adapte au lieu d'échouer :
// sans stockage, les formulaires ne proposent pas d'envoi de fichiers ; sans e-mail, ils n'annoncent pas d'e-mail.

/** Fichiers (justificatifs, photos) : Vercel Blob en ligne. En local, le disque suffit. */
export const uploadsEnabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN) || !process.env.VERCEL

/** E-mails transactionnels (Resend). */
export const emailEnabled = () => Boolean(process.env.RESEND_API_KEY)
