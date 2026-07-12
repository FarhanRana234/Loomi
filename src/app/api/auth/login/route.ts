import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password required" },
        { status: 400 }
      );
    }

    // Firebase Admin doesn't support email/password sign-in directly.
    // The client should use Firebase Auth SDK for credential creation,
    // then POST the idToken here. For now, accept an idToken from the client.
    const { idToken } = await request.json().catch(() => ({}));

    if (idToken) {
      const decoded = await getAdminAuth().verifyIdToken(idToken);

      await connectToDatabase();
      const user = await User.findOne({ firebaseId: decoded.uid });

      if (!user) {
        return NextResponse.json(
          { success: false, error: "User not found. Please register first." },
          { status: 404 }
        );
      }

      // Create a session cookie
      const response = NextResponse.json({ success: true, data: { user } });
      response.cookies.set("__session", idToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60, // 1 hour
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: "Authentication not configured. Please set up Firebase." },
      { status: 501 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Login failed" },
      { status: 500 }
    );
  }
}
