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
      await getResend().emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: "Welcome to Loomi",
        html: "<h1>Welcome to Loomi!</h1><p>Thank you for subscribing. You'll receive updates about the latest creative projects and community highlights.</p>",
      });
    } catch {
      // email sending is best-effort
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
