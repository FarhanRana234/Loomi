import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { getAdminAuth } from "@/lib/firebase-admin";

async function getAuthUser(request?: NextRequest) {
  let uid: string | null = null;

  if (request) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const decoded = await getAdminAuth().verifyIdToken(
          authHeader.split("Bearer ")[1]
        );
        uid = decoded.uid;
      } catch {
        // invalid ID token
      }
    }
  }

  if (!uid) {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;
    if (sessionCookie) {
      try {
        const decoded = await getAdminAuth().verifySessionCookie(sessionCookie);
        uid = decoded.uid;
      } catch {
        // invalid session cookie
      }
    }
  }

  if (!uid) return null;

  await connectToDatabase();
  return await User.findOne({ firebaseId: uid }).select("-__v");
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }
    return NextResponse.json({ success: true, data: user });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid token" },
      { status: 401 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username, bio, avatarUrl, website, socialLinks } = body;

    if (username && username !== user.username) {
      const existing = await User.findOne({ username, _id: { $ne: user._id } });
      if (existing) {
        return NextResponse.json(
          { success: false, error: "Username already taken" },
          { status: 409 }
        );
      }
      user.username = username;
    }

    if (bio !== undefined) user.bio = bio;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (website !== undefined) user.website = website;
    if (socialLinks !== undefined) user.socialLinks = socialLinks;

    await user.save();

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
