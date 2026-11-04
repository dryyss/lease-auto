import { NextResponse, type NextRequest } from 'next/server'

import { auth0, auth0Configured } from '@/lib/auth0'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!auth0Configured) {
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
    return NextResponse.redirect(new URL('/auth/logout', request.url))
  }

  // Monte /auth/* et prolonge la session Auth0 pendant la navigation dans l'admin.
  return auth0.middleware(request)
}

export const config = {
  matcher: ['/auth/:path*', '/admin/:path*'],
}
