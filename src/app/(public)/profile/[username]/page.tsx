import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Project from "@/models/Project";
import Moodboard from "@/models/Moodboard";
import { getAdminAuth } from "@/lib/firebase-admin";
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
    Moodboard.find({ userId: profileOwner.firebaseId })
      .populate("projects", "title mediaUrl userId likes")
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
  const visibleMoodboards = isSelf
    ? allMoodboards
    : allMoodboards.filter((m) => m.isPublic === true);

  const serializedUser = {
    _id: String(profileOwner._id),
    username: profileOwner.username as string,
    bio: (profileOwner.bio as string) || "",
    avatarUrl: (profileOwner.avatarUrl as string) || "",
    website: (profileOwner.website as string) || "",
    socialLinks: (profileOwner.socialLinks as { label: string; url: string }[]) || [],
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serializedProjects = (projects as any[]).map((p) => ({
    _id: String(p._id),
    title: p.title as string,
    mediaUrl: p.mediaUrl as string,
    likes: (p.likes as string[]) || [],
    views: (p.views as number) || 0,
    category: (p.category as string) || "",
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serializedMoodboards = (visibleMoodboards as any[]).map((m) => ({
    _id: String(m._id),
    name: m.name as string,
    isPublic: m.isPublic as boolean,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    projects: ((m.projects || []) as any[]).map((p) => ({
      _id: String(p._id),
      title: (p.title as string) || "",
      mediaUrl: (p.mediaUrl as string) || "",
    })),
  }));

  return (
    <ProfileClient
      profileOwner={serializedUser}
      projects={serializedProjects}
      moodboards={serializedMoodboards}
      isSelf={isSelf}
      projectCount={projects.length}
      moodboardCount={visibleMoodboards.length}
    />
  );
}
