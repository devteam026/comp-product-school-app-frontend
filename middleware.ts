import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("session");
  const { pathname } = request.nextUrl;

  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  if (pathname === "/home" && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/home"],
};
