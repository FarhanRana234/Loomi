import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Project from "@/models/Project";
import Moodboard from "@/models/Moodboard";
import Follow from "@/models/Follow";
import { getAdminAuth } from "@/lib/firebase-admin";
import { isVideoUrl, getThumbnailUrl } from "@/lib/cloudinary";
import ProfileClient from "./ProfileClient";

interface PageParams {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: PageParams) {
  const resolvedParams = await params;
  const username = resolvedParams.username.toLowerCase();

  await connectToDatabase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileOwner = await User.findOne({ username }).select("-__v -email -role").lean() as any;
  if (!profileOwner) notFound();

  const [projects, allMoodboards] = await Promise.all([
    Project.find({ userId: profileOwner._id, status: "published" })
      .sort({ createdAt: -1 })
      .lean(),
    Moodboard.find({ userId: profileOwner.firebaseId, visibility: "public" })
      .populate("projects", "title mediaUrl cloudinaryPublicId protected likes")
      .lean(),
  ]);

  let viewerUid: string | null = null;
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("__session")?.value;
    if (session) {
      const decoded = await getAdminAuth().verifySessionCookie(session);
      viewerUid = decoded.uid;
    }
  } catch {
    // not logged in
  }

  const isSelf = viewerUid === profileOwner.firebaseId;

  let isFollowing = false;
  if (viewerUid && !isSelf) {
    const followDoc = await Follow.findOne({
      followerId: viewerUid,
      followingId: profileOwner.firebaseId,
    }).lean();
    isFollowing = !!followDoc;
  }

  const visibleMoodboards = allMoodboards;

  const serializedUser = {
    _id: String(profileOwner._id),
    firebaseId: profileOwner.firebaseId as string,
    username: profileOwner.username as string,
    bio: (profileOwner.bio as string) || "",
    avatarUrl: (profileOwner.avatarUrl as string) || "",
    website: (profileOwner.website as string) || "",
    socialLinks: (profileOwner.socialLinks as { label: string; url: string }[]) || [],
    followersCount: (profileOwner.followersCount as number) || 0,
    followingCount: (profileOwner.followingCount as number) || 0,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serializedProjects = (projects as any[]).map((p) => {
    const isVideo = p.cloudinaryPublicId && isVideoUrl(p.mediaUrl as string);
    return {
      _id: String(p._id),
      title: p.title as string,
      mediaUrl: p.mediaUrl as string,
      thumbnailUrl: isVideo
        ? getThumbnailUrl(p.cloudinaryPublicId as string, !!p.protected)
        : undefined,
      likes: (p.likes as string[]) || [],
      views: (p.views as number) || 0,
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serializedMoodboards = (visibleMoodboards as any[]).map((m) => ({
    _id: String(m._id),
    name: m.name as string,
    visibility: (m.visibility as string) || "public",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    projects: ((m.projects || []) as any[]).map((p) => {
      const isVideo = p.cloudinaryPublicId && isVideoUrl(p.mediaUrl as string);
      return {
        _id: String(p._id),
        title: (p.title as string) || "",
        mediaUrl: (p.mediaUrl as string) || "",
        thumbnailUrl: isVideo
          ? getThumbnailUrl(p.cloudinaryPublicId as string, !!p.protected)
          : undefined,
      };
    }),
  }));

  return (
    <ProfileClient
      profileOwner={serializedUser}
      projects={serializedProjects}
      moodboards={serializedMoodboards}
      isSelf={isSelf}
      isFollowing={isFollowing}
      projectCount={projects.length}
      moodboardCount={visibleMoodboards.length}
    />
  );
}
