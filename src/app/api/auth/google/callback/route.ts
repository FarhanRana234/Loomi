import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

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
      console.error("Google token exchange failed:", await tokenRes.text());
      return NextResponse.redirect(new URL("/login?error=google_token_exchange", siteUrl));
    }

    const { id_token } = await tokenRes.json();

    const decoded = await getAdminAuth().verifyIdToken(id_token);

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
            <a href="${siteUrl}/dashboard" style="display:inline-block;background:#09090B;color:#FAFAFA;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:500;margin-top:16px;">Go to Dashboard</a>
          </body></html>`,
        });
      } catch {
        // email is best-effort
      }
    }

    const response = NextResponse.redirect(new URL("/dashboard", siteUrl));
    response.cookies.set("__session", id_token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    });

    return response;
  } catch (error) {
    const origin = request.headers.get("origin") || new URL(request.url).origin;
    console.error("Google callback error:", error);
    return NextResponse.redirect(new URL("/login?error=google_failed", origin));
  }
}
