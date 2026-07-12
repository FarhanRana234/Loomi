import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    const { email, password, username } = await request.json();

    if (!email || !password || !username) {
      return NextResponse.json(
        { success: false, error: "All fields required" },
        { status: 400 }
      );
    }

    // Accept an idToken from client-side Firebase Auth
    const { idToken } = await request.json().catch(() => ({}));

    if (idToken) {
      const decoded = await getAdminAuth().verifyIdToken(idToken);

      await connectToDatabase();

      const existing = await User.findOne({
        $or: [{ firebaseId: decoded.uid }, { username }],
      });

      if (existing) {
        return NextResponse.json(
          { success: false, error: "User already exists" },
          { status: 409 }
        );
      }

      const user = await User.create({
        firebaseId: decoded.uid,
        email: decoded.email || email,
        username,
        avatarUrl: decoded.picture || "",
      });

      const response = NextResponse.json(
        { success: true, data: { user } },
        { status: 201 }
      );
      response.cookies.set("__session", idToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60,
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: "Authentication not configured. Please set up Firebase." },
      { status: 501 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, error: "Registration failed" },
      { status: 500 }
    );
  }
}
