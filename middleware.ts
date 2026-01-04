import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const cookieName = process.env.APP_COOKIE_NAME || 'sid';
const protectedPaths = ['/', '/memos', '/account', '/admin'];

function clearSessionCookie(res: NextResponse) {
  res.cookies.set(cookieName, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0
  });
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get(cookieName)?.value);
  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (!hasSession && isProtected) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (hasSession && (isProtected || pathname === '/login')) {
    const res = await fetch(`${req.nextUrl.origin}/api/auth/me`, {
      headers: { cookie: req.headers.get('cookie') ?? '' },
      cache: 'no-store'
    });

    if (!res.ok) {
      if (isProtected) {
        const url = req.nextUrl.clone();
        url.pathname = '/login';
        const redirect = NextResponse.redirect(url);
        clearSessionCookie(redirect);
        return redirect;
      }
      if (pathname === '/login') {
        const next = NextResponse.next();
        clearSessionCookie(next);
        return next;
      }
    }

    if (res.ok && pathname === '/login') {
      const url = req.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico).*)']
};
