import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    const { firebaseId, email, username, avatarUrl } = await request.json();

    if (!firebaseId || !email) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    let user = await User.findOne({ firebaseId });
    let isNewUser = false;

    if (user) {
      user.email = email;
      if (username) user.username = username;
      if (avatarUrl) user.avatarUrl = avatarUrl;
      await user.save();
    } else {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return NextResponse.json(
          { success: false, error: "Username already taken" },
          { status: 409 }
        );
      }

      user = await User.create({
        firebaseId,
        email,
        username: username || email.split("@")[0],
        avatarUrl: avatarUrl || "",
      });
      isNewUser = true;
    }

    if (isNewUser) {
      try {
        const { getResend, FROM_EMAIL } = await import("@/lib/resend");
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://loomi.vercel.app";
        await getResend().emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: "Welcome to Loomi",
          html: `<!DOCTYPE html><html><body style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:40px 20px;color:#09090B;">
            <h1 style="font-size:28px;font-weight:700;margin:0 0 8px;">Welcome to Loomi</h1>
            <p style="color:#71717A;line-height:1.6;margin:0 0 24px;">Hey ${user!.username},<br/><br/>Thanks for joining Loomi! Your creative portfolio is ready. Start uploading your work and sharing it with the community.</p>
            <a href="${siteUrl}/dashboard" style="display:inline-block;background:#09090B;color:#FAFAFA;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:500;">Go to Dashboard</a>
            <p style="color:#A1A1AA;font-size:13px;margin-top:32px;">— The Loomi Team</p>
          </body></html>`,
        });
      } catch {
        // email is best-effort
      }
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("Auth sync error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
