import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { verifyRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const decoded = await verifyRequest(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const user = await User.findOne({ firebaseId: decoded.uid });
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const users = await User.find({}).select("-__v").lean();
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
