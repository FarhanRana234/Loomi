import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { verifyRequest } from "@/lib/auth";

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const decoded = await verifyRequest(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { password } = await request.json();

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
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
    const user = await User.findOne({ firebaseId: decoded.uid });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (user.hasPassword) {
      return NextResponse.json(
        { success: false, error: "Password already set. Use change-password instead." },
        { status: 409 }
      );
    }

    const firebaseRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken: decoded.token,
          password,
          returnSecureToken: true,
        }),
      }
    );

    if (!firebaseRes.ok) {
      const err = await firebaseRes.json().catch(() => ({}));
      throw new Error(err.error?.message || "Failed to set password");
    }

    user.hasPassword = true;
    await user.save();

    return NextResponse.json({
      success: true,
      data: { hasPassword: true },
    });
  } catch (error: unknown) {
    console.error("POST /api/auth/set-password error:", error);
    const message = error instanceof Error ? error.message : "Failed to set password";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
