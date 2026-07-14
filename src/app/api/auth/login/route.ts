import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { setSessionCookie } from "@/lib/session";

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

async function firebaseSignIn(email: string, password: string) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Invalid email or password");
  }
  return res.json();
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password required" },
        { status: 400 }
      );
    }

    if (!FIREBASE_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Firebase not configured" },
        { status: 500 }
      );
    }

    const firebaseRes = await firebaseSignIn(email, password);
    const { idToken, refreshToken, expiresIn } = firebaseRes;

    const decoded = await getAdminAuth().verifyIdToken(idToken);

    const { upsertUserByEmail } = await import("@/lib/user-sync");
    const user = await upsertUserByEmail({
      firebaseId: decoded.uid,
      email: decoded.email || email,
      username: decoded.email?.split("@")[0] || email.split("@")[0],
      avatarUrl: decoded.picture || "",
      hasPassword: true,
    });

    const response = NextResponse.json({
      success: true,
      data: { user, refreshToken, expiresIn },
    });
    await setSessionCookie(response, idToken);

    return response;
  } catch (error: unknown) {
    console.error("Login error:", error);
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 401 }
    );
  }
}
