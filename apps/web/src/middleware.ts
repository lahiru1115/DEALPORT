import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "dealport_token";

const LOGIN_PATH = "/login";
const DEFAULT_AUTHENTICATED_PATH = "/dashboard";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasCookie = Boolean(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  const isLoginPage = pathname === LOGIN_PATH;

  if (!hasCookie && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.search = "";
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
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icons|brand|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
