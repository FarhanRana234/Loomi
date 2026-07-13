import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { connectToDatabase } from "@/lib/db";
import { setSessionCookie } from "@/lib/session";
import User from "@/models/User";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!;

export async function GET(request: NextRequest) {
  try {
    const origin = request.headers.get("origin") || new URL(request.url).origin;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;

    const code = request.nextUrl.searchParams.get("code");
    if (!code) {
      return NextResponse.redirect(new URL("/login?error=google_no_code", siteUrl));
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${origin}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Google token exchange failed:", errText);
      return NextResponse.redirect(new URL("/login?error=google_token_exchange", siteUrl));
    }

    const { id_token: googleIdToken } = await tokenRes.json();

    const firebaseRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          requestUri: `${origin}/api/auth/google/callback`,
          postBody: `id_token=${googleIdToken}&providerId=google.com`,
          returnIdpCredential: "true",
          returnSecureToken: "true",
        }),
      }
    );

    if (!firebaseRes.ok) {
      const errText = await firebaseRes.text();
      console.error("Firebase signInWithIdp failed:", errText);
      return NextResponse.redirect(new URL("/login?error=google_firebase_auth", siteUrl));
    }

    const firebaseData = await firebaseRes.json();
    const { idToken: firebaseIdToken } = firebaseData;

    const decoded = await getAdminAuth().verifyIdToken(firebaseIdToken);

    await connectToDatabase();

    let user = await User.findOne({ firebaseId: decoded.uid });

    if (!user) {
      const email = decoded.email || firebaseData.email || "";
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
            <a href="${siteUrl}/dashboard" style="display:inline-block;background:#09090B;color:#FAFAFA;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:500;margin-top:16px;">Go to Dashboard</a>
          </body></html>`,
        });
      } catch {
        // email is best-effort
      }
    }

    const response = NextResponse.redirect(
      new URL("/dashboard?auth=google", siteUrl)
    );
    setSessionCookie(response, firebaseIdToken);

    // Set refresh token as a short-lived cookie so client can pick it up
    if (firebaseData.refreshToken) {
      response.cookies.set("loomi_rt", firebaseData.refreshToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 14,
      });
    }

    return response;
  } catch (error) {
    const origin = request.headers.get("origin") || new URL(request.url).origin;
    console.error("Google callback error:", error);
    const msg = error instanceof Error ? error.message : "unknown";
    return NextResponse.redirect(new URL(`/login?error=google_failed&detail=${encodeURIComponent(msg)}`, origin));
  }
}
