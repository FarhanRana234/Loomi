import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import Project from "@/models/Project";
import { isVideoUrl, signUrl } from "@/lib/cloudinary";

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeanProject = any;

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

    const project: LeanProject = await Project.findById(id)
      .populate("userId", "username avatarUrl")
      .lean();

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    // Increment views
    await Project.findByIdAndUpdate(id, { $inc: { views: 1 } });

    // Generate signed URLs for protected or video assets
    const enriched: Record<string, unknown> = { ...project };

    if (project.cloudinaryPublicId) {
      const publicId = project.cloudinaryPublicId as string;
      const url = project.mediaUrl as string;
      const isProtected = !!project.protected;
      const isVideo = isVideoUrl(url);

      if (isProtected || isVideo) {
        if (isVideo) {
          enriched.signedVideoUrl = signUrl(publicId, {
            resource_type: "video",
            type: "authenticated",
            expiresInSeconds: 3600,
          });
          enriched.signedThumbnailUrl = signUrl(publicId, {
            resource_type: "video",
            format: "jpg",
            type: "authenticated",
            expiresInSeconds: 3600,
          });
        } else if (isProtected) {
          enriched.signedImageUrl = signUrl(publicId, {
            resource_type: "image",
            type: "authenticated",
            expiresInSeconds: 3600,
          });
        }
      }
    }

    return NextResponse.json({ success: true, data: enriched });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "CastError") {
      return NextResponse.json(
        { success: false, error: "Invalid project ID" },
        { status: 400 }
      );
    }
    console.error("GET /api/projects/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}
