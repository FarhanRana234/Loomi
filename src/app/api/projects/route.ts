import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Project from "@/models/Project";
import { verifyRequest } from "@/lib/auth";
import User from "@/models/User";
import { isVideoUrl, signUrl, getThumbnailUrl } from "@/lib/cloudinary";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeanProject = any;

function enrichProject(p: LeanProject): Record<string, unknown> {
  const enriched: Record<string, unknown> = { ...p };

  if (p.cloudinaryPublicId) {
    const publicId = p.cloudinaryPublicId as string;
    const url = p.mediaUrl as string;
    const isProtected = !!p.protected;
    const isVideo = isVideoUrl(url);

    if (isVideo) {
      enriched.thumbnailUrl = getThumbnailUrl(publicId, isProtected);
      enriched.signedVideoUrl = isProtected
        ? signUrl(publicId, {
            resource_type: "video",
            type: "authenticated",
            expiresInSeconds: 3600,
          })
        : url;
    } else if (isProtected) {
      enriched.signedImageUrl = signUrl(publicId, {
        resource_type: "image",
        type: "authenticated",
        expiresInSeconds: 3600,
      });
    }
  }

  return enriched;
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const tag = searchParams.get("tag");
    const userId = searchParams.get("userId");
    const q = searchParams.get("q");
    const category = searchParams.get("category");

    const query: Record<string, unknown> = { status: "published" };
    if (tag) query.tags = tag;
    if (userId) query.userId = userId;
    if (category) query.category = category;
    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      query.$or = [{ title: regex }, { tags: regex }, { description: regex }];
    }

    const total = await Project.countDocuments(query);
    const items = await Project.find(query)
      .populate("userId", "username avatarUrl")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const enrichedItems = items.map(enrichProject);

    return NextResponse.json({
      success: true,
      data: { items: enrichedItems, total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = await verifyRequest(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ firebaseId: decoded.uid });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      tags,
      cloudinaryPublicId,
      mediaUrl,
      protected: isProtected,
      isDownloadable,
    } = body;

    if (!title || !cloudinaryPublicId || !mediaUrl) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const project = await Project.create({
      title: title.toLowerCase(),
      description: description || "",
      category: category || "General",
      tags: (tags || []).map((t: string) => t.toLowerCase().trim()),
      cloudinaryPublicId,
      mediaUrl,
      userId: user._id,
      protected: !!isProtected,
      isDownloadable: !!isDownloadable,
    });

    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create project" },
      { status: 500 }
    );
  }
}
