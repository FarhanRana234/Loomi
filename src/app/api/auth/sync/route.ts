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
