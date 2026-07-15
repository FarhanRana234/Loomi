import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import Project from "@/models/Project";
import User from "@/models/User";
import Moodboard from "@/models/Moodboard";
import { verifyRequest } from "@/lib/auth";
import { isVideoUrl, signUrl, getCloudinary, getThumbnailUrl } from "@/lib/cloudinary";

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

    const images = (project.images as string[]) || [];
    const mediaType = (project.mediaType as string) || (images.length > 1 ? "image" : isVideoUrl(project.mediaUrl as string) ? "video" : "image");

    if (mediaType === "video" && project.cloudinaryPublicId) {
      const publicId = project.cloudinaryPublicId as string;
      const url = project.mediaUrl as string;
      const isProtected = !!project.protected;
      enriched.thumbnailUrl = getThumbnailUrl(publicId, isProtected);
      enriched.signedVideoUrl = isProtected
        ? signUrl(publicId, {
            resource_type: "video",
            type: "authenticated",
            expiresInSeconds: 3600,
          })
        : url;
    } else if (images.length > 0) {
      const isProtected = !!project.protected;
      if (isProtected) {
        enriched.signedImageUrls = images.map((imgUrl: string) => {
          const match = imgUrl.match(/\/upload\/(?:v\d+\/)?(.+)/);
          if (match) {
            return signUrl(match[1], {
              resource_type: "image",
              type: "authenticated",
              expiresInSeconds: 3600,
            });
          }
          return imgUrl;
        });
      }
    } else if (project.cloudinaryPublicId && !!project.protected) {
      enriched.signedImageUrl = signUrl(project.cloudinaryPublicId as string, {
        resource_type: "image",
        type: "authenticated",
        expiresInSeconds: 3600,
      });
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

export async function PATCH(
  request: NextRequest,
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

    const decoded = await verifyRequest(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const currentUser = await User.findOne({ firebaseId: decoded.uid });
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const isOwner = project.userId.toString() === currentUser._id.toString();
    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const allowed = [
      "isDownloadable", "title", "description", "categories", "status",
      "mediaType", "images", "soundtrackId", "soundtrackTitle", "soundtrackArtist",
    ];
    for (const key of allowed) {
      if (key in body) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (project as any)[key] = body[key];
      }
    }

    await project.save();

    return NextResponse.json({ success: true, data: project });
  } catch (error: unknown) {
    console.error("PATCH /api/projects/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update project" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
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

    const decoded = await verifyRequest(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Fetch the requesting user
    const currentUser = await User.findOne({ firebaseId: decoded.uid });
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch the target project
    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    // Access control: owner OR admin
    const isOwner = project.userId.toString() === currentUser._id.toString();
    const isAdmin = currentUser.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // 1. Destroy from Cloudinary
    if (project.cloudinaryPublicId) {
      try {
        const c = getCloudinary();
        const resourceType = isVideoUrl(project.mediaUrl) ? "video" : "image";
        await c.uploader.destroy(project.cloudinaryPublicId, {
          resource_type: resourceType,
        });
      } catch (cloudErr) {
        console.error("Cloudinary deletion failed (non-fatal):", cloudErr);
      }
    }

    // Also delete additional images from Cloudinary
    const extraImages = (project as unknown as { images?: string[] }).images || [];
    if (extraImages.length > 0) {
      try {
        const c = getCloudinary();
        for (const imgUrl of extraImages) {
          const match = imgUrl.match(/\/upload\/(?:v\d+\/)?(.+)/);
          if (match) {
            const publicId = match[1].replace(/\.[^.]+$/, "");
            await c.uploader.destroy(publicId, { resource_type: "image" }).catch(() => {});
          }
        }
      } catch (cloudErr) {
        console.error("Cloudinary extra images deletion failed (non-fatal):", cloudErr);
      }
    }

    // 2. Delete the project document
    await Project.findByIdAndDelete(id);

    // 3. Cascade: remove from all users' likes
    await User.updateMany(
      { _id: { $in: project.likes } },
      { $pull: { likes: project._id } }
    ).catch(() => {});

    // 4. Cascade: remove from all moodboards
    await Moodboard.updateMany(
      { projects: project._id },
      { $pull: { projects: project._id } }
    ).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "CastError") {
      return NextResponse.json(
        { success: false, error: "Invalid project ID" },
        { status: 400 }
      );
    }
    console.error("DELETE /api/projects/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
