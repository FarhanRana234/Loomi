import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { credential } = await request.json();

    if (!credential) {
      return NextResponse.json(
        { success: false, error: "Google credential required" },
        { status: 400 }
      );
    }

    if (!FIREBASE_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Firebase not configured" },
        { status: 500 }
      );
    }

    const firebaseRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestUri: "http://localhost",
          postBody: `id_token=${credential}&providerId=google.com`,
          returnIdpCredential: true,
          returnSecureToken: true,
        }),
      }
    );

    if (!firebaseRes.ok) {
      const err = await firebaseRes.json().catch(() => ({}));
      throw new Error(err.error?.message || "Google sign-in failed");
    }

    const firebaseData = await firebaseRes.json();
    const { idToken } = firebaseData;

    const decoded = await getAdminAuth().verifyIdToken(idToken);

    await connectToDatabase();

    let user = await User.findOne({ firebaseId: decoded.uid });

    if (!user) {
      const email = decoded.email || "";
      const username =
        decoded.name?.replace(/\s+/g, "").toLowerCase() ||
        email.split("@")[0];
      const avatarUrl = decoded.picture || "";

      user = await User.create({
        firebaseId: decoded.uid,
        email,
        username,
        avatarUrl,
      });

      try {
        const { getResend, FROM_EMAIL } = await import("@/lib/resend");
        await getResend().emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: "Welcome to Loomi",
          html: `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px 20px;">
            <h1 style="font-size:24px;font-weight:700;">Welcome to Loomi</h1>
            <p style="color:#666;line-height:1.6;">Hey ${username},<br/><br/>Thanks for joining Loomi! Your creative portfolio is ready. Start uploading your work and sharing it with the community.</p>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://loomi.vercel.app"}/dashboard" style="display:inline-block;background:#09090B;color:#FAFAFA;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:500;margin-top:16px;">Go to Dashboard</a>
          </body></html>`,
        });
      } catch {
        // email is best-effort
      }
    }

    const response = NextResponse.json({ success: true, data: { user } });
    response.cookies.set("__session", idToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    });

    return response;
  } catch (error: unknown) {
    console.error("Google auth error:", error);
    const message = error instanceof Error ? error.message : "Google sign-in failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
