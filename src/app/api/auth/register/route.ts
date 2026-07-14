import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { connectToDatabase } from "@/lib/db";
import { setSessionCookie } from "@/lib/session";
import User from "@/models/User";

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

    await connectToDatabase();

    const existing = await User.findOne({ username });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Username already taken" },
        { status: 409 }
      );
    }

    let firebaseRes = await firebaseSignUp(email, password);
    let idToken: string;

    if (firebaseRes.ok) {
      idToken = firebaseRes.data.idToken;
    } else if (firebaseRes.data?.error?.message === "EMAIL_EXISTS") {
      const signInRes = await firebaseSignIn(email, password);
      idToken = signInRes.idToken;

      const decoded = await getAdminAuth().verifyIdToken(idToken);
      let user = await User.findOne({ firebaseId: decoded.uid });

      if (user) {
        user.hasPassword = true;
        if (!user.username || user.username === email.split("@")[0]) {
          user.username = username;
        }
        await user.save();

        const response = NextResponse.json(
          { success: true, data: { user, refreshToken: signInRes.refreshToken, expiresIn: signInRes.expiresIn } },
          { status: 200 }
        );
        setSessionCookie(response, idToken);
        return response;
      }

      user = await User.create({
        firebaseId: decoded.uid,
        email: decoded.email || email,
        username,
        avatarUrl: decoded.picture || "",
        hasPassword: true,
      });

      const response = NextResponse.json(
        { success: true, data: { user, refreshToken: signInRes.refreshToken, expiresIn: signInRes.expiresIn } },
        { status: 201 }
      );
      setSessionCookie(response, idToken);
      return response;
    } else {
      throw new Error(firebaseRes.data?.error?.message || "Registration failed");
    }

    const decoded = await getAdminAuth().verifyIdToken(idToken!);

    const user = await User.create({
      firebaseId: decoded.uid,
      email: decoded.email || email,
      username,
      avatarUrl: decoded.picture || "",
      hasPassword: true,
    });

    const response = NextResponse.json(
      { success: true, data: { user, refreshToken: firebaseRes.data.refreshToken, expiresIn: firebaseRes.data.expiresIn } },
      { status: 201 }
    );
    setSessionCookie(response, idToken!);

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
