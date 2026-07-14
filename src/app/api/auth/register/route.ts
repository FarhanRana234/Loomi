import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { setSessionCookie } from "@/lib/session";
import { upsertUserByEmail } from "@/lib/user-sync";

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

async function firebaseSignUp(email: string, password: string) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  return { ok: res.ok, data: await res.json().catch(() => ({})) };
}

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
    throw new Error(err.error?.message || "Invalid credentials");
  }
  return res.json();
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, username } = await request.json();

    if (!email || !password || !username) {
      return NextResponse.json(
        { success: false, error: "All fields required" },
        { status: 400 }
      );
    }

    if (!FIREBASE_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Firebase not configured" },
        { status: 500 }
      );
    }

    const firebaseRes = await firebaseSignUp(email, password);

    if (!firebaseRes.ok && firebaseRes.data?.error?.message !== "EMAIL_EXISTS") {
      throw new Error(firebaseRes.data?.error?.message || "Registration failed");
    }

    const isExistingEmail = firebaseRes.data?.error?.message === "EMAIL_EXISTS";

    let idToken: string;
    let refreshToken: string;
    let expiresIn: string;

    if (isExistingEmail) {
      const signInRes = await firebaseSignIn(email, password);
      idToken = signInRes.idToken;
      refreshToken = signInRes.refreshToken;
      expiresIn = signInRes.expiresIn;
    } else {
      idToken = firebaseRes.data.idToken;
      refreshToken = firebaseRes.data.refreshToken;
      expiresIn = firebaseRes.data.expiresIn;
    }

    const decoded = await getAdminAuth().verifyIdToken(idToken);

    const user = await upsertUserByEmail({
      firebaseId: decoded.uid,
      email: decoded.email || email,
      username,
      avatarUrl: decoded.picture || "",
      hasPassword: true,
    });

    const response = NextResponse.json(
      { success: true, data: { user, refreshToken, expiresIn } },
      { status: isExistingEmail ? 200 : 201 }
    );
    await setSessionCookie(response, idToken);

    return response;
  } catch (error: unknown) {
    console.error("Register error:", error);
    const message = error instanceof Error ? error.message : "Registration failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
