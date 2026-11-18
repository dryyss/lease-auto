import { NextResponse, type NextRequest } from 'next/server'

import { DEV_COOKIE, devAuthAllowed } from '@/auth/devStrategy'
import { auth0 } from '@/lib/auth0'

// L'ancienne interface (Payload) est remplacée par la console « Gestion » : chaque écran renvoie à son équivalent.
// Restent servis par Payload : l'API (/api), la connexion et la déconnexion.
const COLLECTIONS: Record<string, string> = {
  requests: '/gestion/demandes',
  vehicles: '/gestion/vehicules',
  appointments: '/gestion/rendez-vous',
  reviews: '/gestion/avis',
  users: '/gestion/equipe',
  media: '/gestion/medias',
  brands: '/gestion/marques',
  models: '/gestion/marques',
  documents: '/gestion/justificatifs',
  subscribers: '/gestion/abonnes',
  campaigns: '/gestion/newsletters',
  faqs: '/gestion/contenus/faq',
  articles: '/gestion/contenus/articles',
  'local-pages': '/gestion/contenus/pages-locales',
  redirects: '/gestion/redirections',
}
const GLOBALS: Record<string, string> = {
  homepage: '/gestion/contenus/accueil',
  agency: '/gestion/contenus/agence',
  settings: '/gestion/reglages',
  agenda: '/gestion/creneaux',
}
const AUTH_PAGES = ['/admin/login', '/admin/logout', '/admin/create-first-user']

function consoleEquivalent(pathname: string): string {
  const [, , kind, slug, id] = pathname.split('/') // '', 'admin', 'collections' | 'globals', slug, id
  if (kind === 'globals' && GLOBALS[slug]) return GLOBALS[slug]
  if (kind === 'collections' && COLLECTIONS[slug]) {
    const base = COLLECTIONS[slug]
    if (id === 'create') return base === '/gestion/vehicules' || base.startsWith('/gestion/contenus/') ? `${base}/nouveau` : base
    // Seules les fiches qui existent dans la console gardent leur identifiant.
    return id && /^\d+$/.test(id) && ['/gestion/demandes', '/gestion/vehicules', '/gestion/contenus/articles', '/gestion/contenus/pages-locales'].includes(base) ? `${base}/${id}` : base
  }
  return '/gestion'
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin') && !AUTH_PAGES.includes(pathname)) {
    return NextResponse.redirect(new URL(consoleEquivalent(pathname), request.url))
  }

  if (!auth0) {
    if (devAuthAllowed() && (pathname === '/admin/login' || pathname === '/admin/create-first-user')) {
      return NextResponse.redirect(new URL('/dev/acces', request.url))
    }
    if (devAuthAllowed() && pathname === '/admin/logout') {
      const res = NextResponse.redirect(new URL('/dev/acces', request.url))
      res.cookies.set(DEV_COOKIE, '', { path: '/', maxAge: 0 })
      return res
    }
    return pathname.startsWith('/auth') || pathname === '/admin/login'
      ? new NextResponse('Auth0 n’est pas configuré : renseignez AUTH0_* dans .env', { status: 503 })
      : NextResponse.next()
  }

  // L'écran de connexion et la déconnexion de Payload passent par Auth0.
  if (pathname === '/admin/login' || pathname === '/admin/create-first-user') {
    // Déjà connecté à Auth0 mais refusé par Payload (e-mail inconnu ou accès désactivé) :
    // on l'arrête ici, sinon Auth0 le renverrait aussitôt vers /admin, en boucle.
    if (await auth0.getSession(request)) {
      return NextResponse.redirect(new URL('/acces-refuse', request.url))
    }
    const url = new URL('/auth/login', request.url)
    const back = request.nextUrl.searchParams.get('redirect')
    url.searchParams.set('returnTo', back && back !== '/admin' ? back : '/gestion')
    return NextResponse.redirect(url)
  }
  if (pathname === '/admin/logout') {
    // Compte de démo : on efface son cookie, Auth0 n'est pas concerné.
    if (request.cookies.has(DEV_COOKIE)) {
      const res = NextResponse.redirect(new URL('/', request.url))
      res.cookies.set(DEV_COOKIE, '', { path: '/', maxAge: 0 })
      return res
    }
    return NextResponse.redirect(new URL('/auth/logout', request.url))
  }
  // Pas de session : direction Auth0 tout de suite, côté serveur. Sinon Payload charge l'admin puis redirige
  // côté navigateur, et cette navigation interne échoue sur Auth0 (autre domaine) avant de se rattraper.
  // Le cookie de démo (signé) est vérifié par Payload : on le laisse passer.
  if ((pathname.startsWith('/admin') || pathname.startsWith('/gestion')) && !request.cookies.has(DEV_COOKIE) && !(await auth0.getSession(request))) {
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('returnTo', pathname + request.nextUrl.search)
    return NextResponse.redirect(url)
  }

  // Monte /auth/* et prolonge la session Auth0 pendant la navigation dans l'admin.
  return auth0.middleware(request)
}

export const config = {
  matcher: ['/auth/:path*', '/admin/:path*', '/gestion/:path*', '/gestion'],
}
