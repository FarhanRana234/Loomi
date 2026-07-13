import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Project from "@/models/Project";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const current = await Project.findById(id).select("tags title").lean<{ tags: string[]; title: string }>();
    if (!current) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const related = await Project.find({
      _id: { $ne: id },
      status: "published",
      tags: { $in: current.tags },
    })
      .populate("userId", "username avatarUrl")
      .sort({ views: -1 })
      .limit(8)
      .lean();

    return NextResponse.json({ success: true, data: related });
  } catch (error) {
    console.error("GET /api/projects/[id]/related error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch related projects" },
      { status: 500 }
    );
  }
}
