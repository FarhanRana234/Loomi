import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("__session")?.value;

  if (pathname.startsWith("/dashboard")) {
    if (!sessionCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { getAdminAuth } = await import("@/lib/firebase-admin");
      await getAdminAuth().verifySessionCookie(sessionCookie);
      return NextResponse.next();
    } catch (e: unknown) {
      console.error("[middleware] dashboard session verify failed:", e instanceof Error ? e.message : e);
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      loginUrl.searchParams.set("error", "session_expired");
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("__session");
      return response;
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!sessionCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      loginUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { getAdminAuth } = await import("@/lib/firebase-admin");
      const { connectToDatabase } = await import("@/lib/db");
      const User = (await import("@/models/User")).default;

      const decoded = await getAdminAuth().verifySessionCookie(sessionCookie);
      console.log("[middleware] admin check — uid:", decoded.uid);

      await connectToDatabase();
      const user = await User.findOne({ firebaseId: decoded.uid });
      console.log("[middleware] admin check — user role:", user?.role);

      if (!user || user.role !== "admin") {
        console.log("[middleware] admin check — DENIED");
        const redirectUrl = new URL("/login", request.url);
        redirectUrl.searchParams.set("error", "unauthorized");
        return NextResponse.redirect(redirectUrl);
      }

      console.log("[middleware] admin check — ALLOWED");
      return NextResponse.next();
    } catch (e: unknown) {
      console.error("[middleware] admin session verify failed:", e instanceof Error ? e.message : e);
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("error", "session_expired");
      const response = NextResponse.redirect(redirectUrl);
      response.cookies.delete("__session");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
