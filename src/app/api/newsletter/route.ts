import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Subscriber from "@/models/Subscriber";
import { getResend, FROM_EMAIL } from "@/lib/resend";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Valid email required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existing = await Subscriber.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Already subscribed" },
        { status: 409 }
      );
    }

    await Subscriber.create({ email, subscribedAt: new Date() });

    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://loomi.vercel.app";
      await getResend().emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: "You're subscribed to Loomi",
        html: `<!DOCTYPE html><html><body style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:40px 20px;color:#09090B;">
          <h1 style="font-size:24px;font-weight:700;margin:0 0 8px;">You&apos;re in</h1>
          <p style="color:#71717A;line-height:1.6;margin:0 0 24px;">You&apos;ve successfully subscribed to Loomi updates. We&apos;ll send you weekly highlights of the best creative work from the community.</p>
          <a href="${siteUrl}" style="display:inline-block;background:#09090B;color:#FAFAFA;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:500;">Explore Loomi</a>
          <p style="color:#A1A1AA;font-size:13px;margin-top:32px;">— The Loomi Team</p>
        </body></html>`,
      });
    } catch {
      // email is best-effort
    }

    return NextResponse.json({
      success: true,
      message: "Successfully subscribed",
    });
  } catch (error) {
    console.error("Newsletter subscribe error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to subscribe" },
      { status: 500 }
    );
  }
}
