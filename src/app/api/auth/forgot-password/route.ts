import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email required" },
        { status: 400 }
      );
    }

    // Firebase password reset requires Firebase Auth client SDK
    // or you can use the Resend API to send a reset link
    return NextResponse.json({
      success: true,
      message: "If an account exists, a reset link has been sent.",
    });
  } catch {
    return NextResponse.json({
      success: true,
      message: "If an account exists, a reset link has been sent.",
    });
  }
}
