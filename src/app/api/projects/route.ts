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

  const images = (p.images as string[]) || [];
  const mediaType = (p.mediaType as string) || (images.length > 1 ? "image" : isVideoUrl(p.mediaUrl as string) ? "video" : "image");

  if (mediaType === "video" && p.cloudinaryPublicId) {
    const publicId = p.cloudinaryPublicId as string;
    const isProtected = !!p.protected;
    enriched.thumbnailUrl = getThumbnailUrl(publicId, isProtected);
    enriched.signedVideoUrl = isProtected
      ? signUrl(publicId, {
          resource_type: "video",
          type: "authenticated",
          expiresInSeconds: 3600,
        })
      : p.mediaUrl;
  } else if (images.length > 0) {
    const isProtected = !!p.protected;
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
  } else if (p.cloudinaryPublicId && !!p.protected) {
    enriched.signedImageUrl = signUrl(p.cloudinaryPublicId as string, {
      resource_type: "image",
      type: "authenticated",
      expiresInSeconds: 3600,
    });
  }

  return enriched;
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const categoriesParam = searchParams.get("categories");
    const userId = searchParams.get("userId");
    const q = searchParams.get("q");

    const query: Record<string, unknown> = { status: "published" };
    if (categoriesParam) {
      const cats = categoriesParam.split(",").map((c) => c.trim().toLowerCase()).filter(Boolean);
      if (cats.length === 1) {
        query.categories = cats[0];
      } else if (cats.length > 1) {
        query.categories = { $in: cats };
      }
    }
    if (userId) query.userId = userId;
    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      query.$or = [{ title: regex }, { categories: regex }, { description: regex }];
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
      categories,
      cloudinaryPublicId,
      mediaUrl,
      mediaType,
      images,
      soundtrackId,
      soundtrackTitle,
      soundtrackArtist,
      protected: isProtected,
      isDownloadable,
    } = body;

    if (!title || !cloudinaryPublicId || !mediaUrl) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const resolvedMediaType = mediaType || ((images && images.length > 1) ? "image" : isVideoUrl(mediaUrl) ? "video" : "image");

    const project = await Project.create({
      title,
      description: description || "",
      categories: (categories || []).map((c: string) => c.toLowerCase().trim()),
      cloudinaryPublicId,
      mediaUrl,
      mediaType: resolvedMediaType,
      images: images || [],
      soundtrackId: soundtrackId || "",
      soundtrackTitle: soundtrackTitle || "",
      soundtrackArtist: soundtrackArtist || "",
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
