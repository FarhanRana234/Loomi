import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { setSessionCookie } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Missing Authorization header" },
        { status: 401 }
      );
    }

    const idToken = authHeader.split("Bearer ")[1];

    const decoded = await getAdminAuth().verifyIdToken(idToken);

    const { upsertUserByEmail } = await import("@/lib/user-sync");
    const user = await upsertUserByEmail({
      firebaseId: decoded.uid,
      email: decoded.email || "",
      username:
        decoded.name?.replace(/\s+/g, "").toLowerCase() ||
        decoded.email?.split("@")[0] ||
        `user_${decoded.uid.slice(0, 8)}`,
      avatarUrl: decoded.picture || "",
    });

    const response = NextResponse.json({
      success: true,
      data: { user },
    });

    await setSessionCookie(response, idToken);

    return response;
  } catch (error: unknown) {
    console.error("POST /api/auth/cookie error:", error);
    const message = error instanceof Error ? error.message : "Cookie failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 401 }
    );
  }
}
