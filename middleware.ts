import { NextRequest, NextResponse } from "next/server";
const PUBLIC_FILE = /\.(.*)$/;
const PUBLIC_PATHS = ["/login", "/api/auth"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (
    PUBLIC_FILE.test(pathname) ||
    pathname.startsWith("/_next") ||
    PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  ) return NextResponse.next();

  const authed = req.cookies.has("sb-access-token") || req.cookies.has("sb:token");
  if (!authed) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!api/auth|_next|.*\..*).*)"] };
