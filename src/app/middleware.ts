import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const sessionCookie =
    request.cookies.get("__session")?.value ||
    request.cookies.get("firebase-session")?.value;

  if (pathname.startsWith("/dashboard")) {
    if (!sessionCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!sessionCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { getAdminAuth } = await import("@/lib/firebase-admin");
      const { connectToDatabase } = await import("@/lib/db");
      const User = (await import("@/models/User")).default;

      const decodedToken = await getAdminAuth().verifyIdToken(sessionCookie);
      await connectToDatabase();

      const user = await User.findOne({ firebaseId: decodedToken.uid });

      if (!user || user.role !== "admin") {
        const response = NextResponse.redirect(new URL("/", request.url));
        response.headers.set("X-Unauthorized", "true");
        return response;
      }

      return NextResponse.next();
    } catch {
      const response = NextResponse.redirect(new URL("/", request.url));
      response.headers.set("X-Unauthorized", "true");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
