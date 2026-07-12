import { NextRequest, NextResponse } from "next/server";

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email required" },
        { status: 400 }
      );
    }

    if (!FIREBASE_API_KEY) {
      return NextResponse.json({
        success: true,
        message: "If an account exists, a reset link has been sent.",
      });
    }

    await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: "PASSWORD_RESET",
          email,
        }),
      }
    );

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
