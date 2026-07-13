import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Project from "@/models/Project";
import { verifyRequest } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const decoded = await verifyRequest(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Authentication required to like" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const firebaseId = decoded.uid;

    // Check current like status first
    const project = await Project.findById(id).select("likes");
    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const alreadyLiked = project.likes.includes(firebaseId);

    // Atomic update
    const update = alreadyLiked
      ? { $pull: { likes: firebaseId } }
      : { $addToSet: { likes: firebaseId } };

    const updated = await Project.findByIdAndUpdate(id, update, { new: true }).select("likes");

    return NextResponse.json({
      success: true,
      data: {
        liked: !alreadyLiked,
        totalLikes: updated!.likes.length,
      },
    });
  } catch (error) {
    console.error("POST /api/projects/[id]/like error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}
