import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebase-admin";
import { setSessionCookie, clearSessionCookie } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { idToken } = body;

    if (!idToken) {
      const response = NextResponse.json(
        { success: false, error: "idToken required" },
        { status: 400 }
      );
      clearSessionCookie(response);
      return response;
    }

    const decoded = await getAdminAuth().verifyIdToken(idToken);

    const response = NextResponse.json({ success: true, uid: decoded.uid });
    setSessionCookie(response, idToken);
    return response;
  } catch {
    const response = NextResponse.json(
      { success: false, error: "Invalid token" },
      { status: 401 }
    );
    clearSessionCookie(response);
    return response;
  }
}
