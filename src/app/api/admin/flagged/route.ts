import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Project from "@/models/Project";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const flagged = await Project.find({ status: "flagged" })
      .populate("userId", "username avatarUrl")
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: flagged });
  } catch (error) {
    console.error("Admin flagged error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch flagged projects" },
      { status: 500 }
    );
  }
}
