import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  // Redirect authenticated users away from auth pages
  if (pathname.startsWith("/auth")) {
    if (token) {
      const dashboard =
        token.role === "TEACHER" ? "/teacher/dashboard" : "/student/dashboard";
      return NextResponse.redirect(new URL(dashboard, request.url));
    }
    return NextResponse.next();
  }

  // Protect student routes
  if (pathname.startsWith("/student")) {
    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    if (token.role !== "STUDENT") {
      return NextResponse.redirect(new URL("/teacher/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Protect teacher routes
  if (pathname.startsWith("/teacher")) {
    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    if (token.role !== "TEACHER") {
      return NextResponse.redirect(new URL("/student/dashboard", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/student/:path*", "/teacher/:path*", "/auth/:path*"],
};
