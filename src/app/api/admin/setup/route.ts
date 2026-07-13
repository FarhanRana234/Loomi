import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    const { email, secret } = await request.json();

    if (secret !== process.env.ADMIN_SETUP_SECRET) {
      return NextResponse.json(
        { success: false, error: "Invalid secret" },
        { status: 403 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found. Register first." },
        { status: 404 }
      );
    }

    user.role = "admin";
    await user.save();

    return NextResponse.json({
      success: true,
      message: `${email} is now an admin`,
    });
  } catch (error) {
    console.error("Admin setup error:", error);
    return NextResponse.json(
      { success: false, error: "Failed" },
      { status: 500 }
    );
  }
}
