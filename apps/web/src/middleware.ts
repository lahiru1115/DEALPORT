import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "dealport_token";

const LOGIN_PATH = "/login";
const DEFAULT_AUTHENTICATED_PATH = "/dashboard";

/**
 * Route guard.
 *
 * **This is not authentication.** It only checks whether an auth cookie is
 * present — it cannot verify the signature, because the middleware runs on the
 * edge without the API's signing secret, and it would be wrong to ship that
 * secret here to try. A forged or expired cookie gets past this check and is
 * then rejected by NestJS, which is the only thing actually enforcing access.
 *
 * What this *does* buy is the user experience: an unauthenticated visitor is
 * sent to `/login` instead of watching a shell render and then fail. Expiry is
 * caught a layer further in, by `requireSession()` calling `GET /auth/me`.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasCookie = Boolean(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  const isLoginPage = pathname === LOGIN_PATH;

  if (!hasCookie && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.search = "";
    /*
      Where they were headed, so login can return them there. Only the
      path-and-query is kept — putting a full URL in a redirect parameter is
      how open-redirect bugs happen, and the login page re-checks it anyway.
    */
    if (pathname !== "/" && pathname !== DEFAULT_AUTHENTICATED_PATH) {
      url.searchParams.set("next", `${pathname}${search}`);
    }
    return NextResponse.redirect(url);
  }

  if (hasCookie && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = DEFAULT_AUTHENTICATED_PATH;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  /*
    Page navigations only — every `/api/*` route handler is excluded.

    This guard's whole job is to *redirect*, and a redirect is the wrong answer
    for a data request. `fetch` follows a 307 transparently, so proxying an
    unauthenticated XHR through here would hand the caller the login page's HTML
    with status 200; the client would then fail on `response.json()` with a
    syntax error instead of seeing the 401 it knows how to handle. Verified: it
    really does return 307 before this exclusion, and 401 after.

    So the API routes guard themselves — `/api/proxy/[...path]` returns a proper
    401 when there is no cookie — and `/api/auth/*` has to stay open regardless,
    since logging in is how a cookie is obtained in the first place.
  */
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icons|brand|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
