import { NextResponse, type NextRequest } from 'next/server'

import { DEV_COOKIE, devAuthAllowed } from '@/auth/devStrategy'
import { auth0 } from '@/lib/auth0'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

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
    url.searchParams.set('returnTo', request.nextUrl.searchParams.get('redirect') || '/admin')
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
  if (pathname.startsWith('/admin') && !request.cookies.has(DEV_COOKIE) && !(await auth0.getSession(request))) {
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('returnTo', pathname + request.nextUrl.search)
    return NextResponse.redirect(url)
  }

  // Monte /auth/* et prolonge la session Auth0 pendant la navigation dans l'admin.
  return auth0.middleware(request)
}

export const config = {
  matcher: ['/auth/:path*', '/admin/:path*'],
}
