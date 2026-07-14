"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid3X3, FolderOpen, Lock, ExternalLink, Settings } from "lucide-react";
import FollowButton from "@/components/features/FollowButton";
import FollowersFollowingDialog from "@/components/features/FollowersFollowingDialog";
import { MoodboardThumbnail } from "@/components/features/MoodboardThumbnail";

interface ProfileUser {
  _id: string;
  firebaseId: string;
  username: string;
  bio: string;
  avatarUrl: string;
  website: string;
  socialLinks: { label: string; url: string }[];
  followersCount: number;
  followingCount: number;
}

interface ProjectThumb {
  _id: string;
  title: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  likes: string[];
  views: number;
}

interface MoodboardCard {
  _id: string;
  name: string;
  visibility: string;
  projects: { _id: string; title: string; mediaUrl: string; thumbnailUrl?: string }[];
}

interface ProfileClientProps {
  profileOwner: ProfileUser;
  projects: ProjectThumb[];
  moodboards: MoodboardCard[];
  isSelf: boolean;
  isFollowing: boolean;
  projectCount: number;
  moodboardCount: number;
}

export default function ProfileClient({
  profileOwner,
  projects,
  moodboards,
  isSelf,
  isFollowing,
  projectCount,
  moodboardCount,
}: ProfileClientProps) {
  const initials = profileOwner.username.slice(0, 2).toUpperCase();
  const [dialogType, setDialogType] = useState<"followers" | "following" | null>(null);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Profile Header */}
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <Avatar className="h-24 w-24 shrink-0 sm:h-32 sm:w-32">
          <AvatarImage src={profileOwner.avatarUrl} alt={profileOwner.username} />
          <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <h1 className="text-2xl font-bold tracking-tight">
              {profileOwner.username}
            </h1>
            {isSelf ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/settings">
                  <Settings className="mr-1.5 h-3.5 w-3.5" />
                  Edit Profile
                </Link>
              </Button>
            ) : (
              <FollowButton
                targetUserId={profileOwner.firebaseId}
                initialIsFollowing={isFollowing}
                initialFollowersCount={profileOwner.followersCount}
              />
            )}
          </div>

          <div className="mt-3 flex justify-center gap-5 text-sm sm:justify-start">
            <span>
              <strong>{projectCount}</strong>{" "}
              <span className="text-muted-foreground">Projects</span>
            </span>
            <button
              onClick={() => setDialogType("followers")}
              className="cursor-pointer transition-colors hover:opacity-70"
            >
              <strong>{profileOwner.followersCount}</strong>{" "}
              <span className="text-muted-foreground">Followers</span>
            </button>
            <button
              onClick={() => setDialogType("following")}
              className="cursor-pointer transition-colors hover:opacity-70"
            >
              <strong>{profileOwner.followingCount}</strong>{" "}
              <span className="text-muted-foreground">Following</span>
            </button>
            <span>
              <strong>{moodboardCount}</strong>{" "}
              <span className="text-muted-foreground">Boards</span>
            </span>
          </div>

          {profileOwner.bio && (
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
              {profileOwner.bio}
            </p>
          )}

          {profileOwner.website && (
            <a
              href={profileOwner.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {profileOwner.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </a>
          )}

          {profileOwner.socialLinks.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              {profileOwner.socialLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                    {link.label}
                  </Badge>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="projects" className="mt-10">
        <TabsList>
          <TabsTrigger value="projects" className="gap-1.5">
            <Grid3X3 className="h-4 w-4" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="moodboards" className="gap-1.5">
            <FolderOpen className="h-4 w-4" />
            Moodboards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          {projects.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-muted-foreground">No projects yet</p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-3 gap-1 md:gap-4">
              {projects.map((project) => (
                <Link
                  key={project._id}
                  href={`/project/${project._id}`}
                  className="group relative aspect-square overflow-hidden rounded-lg"
                >
                  <img
                    src={project.thumbnailUrl || project.mediaUrl}
                    alt={project.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="w-full p-3">
                      <p className="text-sm font-medium text-white line-clamp-1">
                        {project.title}
                      </p>
                      <p className="text-xs text-white/70">
                        {project.likes.length} likes · {project.views} views
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="moodboards">
          {moodboards.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-muted-foreground">
                {isSelf ? "No moodboards yet" : "No public moodboards"}
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {moodboards.map((mb) => (
                <div
                  key={mb._id}
                  className="group overflow-hidden rounded-2xl bg-muted transition-shadow hover:shadow-md"
                >
                  <Link href={`/moodboard/${mb._id}`} className="block">
                    <MoodboardThumbnail
                      images={mb.projects.map((p) => p.thumbnailUrl || p.mediaUrl)}
                      className="aspect-square w-full rounded-none"
                    />
                  </Link>
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <Link href={`/moodboard/${mb._id}`} className="text-sm font-medium hover:underline">
                        {mb.name}
                      </Link>
                      {mb.visibility === "private" && (
                        <Badge variant="outline" className="gap-1 text-[10px]">
                          <Lock className="h-3 w-3" />
                          Private
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {mb.projects.length} project{mb.projects.length !== 1 && "s"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Followers / Following Dialog */}
      {dialogType && (
        <FollowersFollowingDialog
          open={!!dialogType}
          onOpenChange={(open) => {
            if (!open) setDialogType(null);
          }}
          userId={profileOwner.firebaseId}
          type={dialogType}
          count={
            dialogType === "followers"
              ? profileOwner.followersCount
              : profileOwner.followingCount
          }
        />
      )}
    </div>
  );
}
