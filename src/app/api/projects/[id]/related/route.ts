import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import Project from "@/models/Project";

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid project ID" },
        { status: 400 }
      );
    }

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
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "CastError") {
      return NextResponse.json(
        { success: false, error: "Invalid project ID" },
        { status: 400 }
      );
    }
    console.error("GET /api/projects/[id]/related error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch related projects" },
      { status: 500 }
    );
  }
}
