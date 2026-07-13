import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { connectToDatabase } from "@/lib/db";
import { setSessionCookie } from "@/lib/session";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Missing Authorization header" },
        { status: 401 }
      );
    }

    const idToken = authHeader.split("Bearer ")[1];

    const decoded = await getAdminAuth().verifyIdToken(idToken);

    await connectToDatabase();

    let user = await User.findOne({ firebaseId: decoded.uid }).select("-__v");

    if (!user) {
      const email = decoded.email || "";
      const username =
        decoded.name?.replace(/\s+/g, "").toLowerCase() ||
        email.split("@")[0] ||
        `user_${decoded.uid.slice(0, 8)}`;

      user = await User.create({
        firebaseId: decoded.uid,
        email,
        username,
        avatarUrl: decoded.picture || "",
      });
    }

    const response = NextResponse.json({
      success: true,
      data: { user },
    });

    await setSessionCookie(response, idToken);

    return response;
  } catch (error: unknown) {
    console.error("POST /api/auth/cookie error:", error);
    const message = error instanceof Error ? error.message : "Cookie failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 401 }
    );
  }
}
