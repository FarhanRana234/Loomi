import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { getAdminAuth } from "@/lib/firebase-admin";

async function getAuthUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("__session")?.value;
  if (!sessionCookie) return null;
  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie);
    await connectToDatabase();
    return await User.findOne({ firebaseId: decoded.uid }).select("-__v");
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const user = await getAuthUser();
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
    const user = await getAuthUser();
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
