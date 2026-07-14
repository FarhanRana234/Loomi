"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, X, Plus, ExternalLink } from "lucide-react";
import { useUserStore } from "@/hooks/useUserStore";

interface SocialLink {
  label: string;
  url: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storeUser = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [settingPassword, setSettingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    if (storeUser) {
      setUsername(storeUser.username);
      setBio(storeUser.bio || "");
      setWebsite(storeUser.website || "");
      setSocialLinks(storeUser.socialLinks || []);
      setLoading(false);
    } else {
      fetch("/api/auth/me")
        .then((r) => {
          if (!r.ok) throw new Error("Not authenticated");
          return r.json();
        })
        .then((d) => {
          if (d.success && d.data) {
            setUsername(d.data.username);
            setBio(d.data.bio || "");
            setWebsite(d.data.website || "");
            setSocialLinks(d.data.socialLinks || []);
          }
        })
        .catch(() => router.push("/login"))
        .finally(() => setLoading(false));
    }
  }, [storeUser, router]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const clearAvatar = () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    setAvatarFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addSocialLink = () => {
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) return;
    setSocialLinks([...socialLinks, { label: newLinkLabel.trim(), url: newLinkUrl.trim() }]);
    setNewLinkLabel("");
    setNewLinkUrl("");
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingPassword(true);
    setPasswordError("");
    setPasswordSuccess("");

    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to set password");

      setPasswordSuccess("Password set! You can now sign in with email and password.");
      setNewPassword("");
      if (storeUser) {
        setUser({ ...storeUser, hasPassword: true });
      }
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : "Failed to set password");
    }
    setSettingPassword(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      let finalAvatarUrl = storeUser?.avatarUrl || "";

      if (avatarFile) {
        setUploadingAvatar(true);
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
          throw new Error("Cloudinary not configured");
        }

        const formData = new FormData();
        formData.append("file", avatarFile);
        formData.append("upload_preset", uploadPreset);
        formData.append("folder", "avatars");

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: "POST", body: formData }
        );

        if (!uploadRes.ok) throw new Error("Avatar upload failed");
        const uploadData = await uploadRes.json();
        finalAvatarUrl = uploadData.secure_url;
        setUploadingAvatar(false);
      }

      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          bio,
          avatarUrl: finalAvatarUrl,
          website,
          socialLinks,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");

      if (data.data) {
        setUser(data.data);
      }

      setSuccess("Profile updated");
      clearAvatar();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update");
      setUploadingAvatar(false);
    }
    setSaving(false);
  };

  const initials = storeUser?.username
    ? storeUser.username.slice(0, 2).toUpperCase()
    : "??";

  const hasChanges =
    username !== (storeUser?.username || "") ||
    bio !== (storeUser?.bio || "") ||
    website !== (storeUser?.website || "") ||
    avatarFile !== null ||
    JSON.stringify(socialLinks) !== JSON.stringify(storeUser?.socialLinks || []);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-60 rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your profile and account
      </p>

      <form onSubmit={handleSave} className="mt-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Profile Photo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={avatarPreview || storeUser?.avatarUrl}
                    alt="avatar"
                  />
                  <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                </Avatar>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 rounded-full bg-foreground p-1.5 text-background hover:bg-foreground/80"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex-1">
                {avatarPreview ? (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">New photo selected</p>
                    <button
                      type="button"
                      onClick={clearAvatar}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Click the camera icon to change your profile photo. Max 5MB.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input value={storeUser?.email || ""} disabled className="opacity-60" />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                placeholder="username"
                required
                minLength={3}
                maxLength={30}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell the community about yourself..."
                rows={3}
                maxLength={150}
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                {bio.length}/150
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Website</label>
              <Input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Input value={storeUser?.role || ""} disabled className="opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Social Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {socialLinks.map((link, i) => (
              <div key={i} className="flex items-center gap-2">
                <Badge variant="outline" className="shrink-0">
                  {link.label}
                </Badge>
                <span className="flex-1 truncate text-xs text-muted-foreground">
                  {link.url}
                </span>
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                </a>
                <button
                  type="button"
                  onClick={() => removeSocialLink(i)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                value={newLinkLabel}
                onChange={(e) => setNewLinkLabel(e.target.value)}
                placeholder="Label (e.g. Twitter)"
                className="w-1/3"
              />
              <Input
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1"
              />
              <Button type="button" variant="outline" size="icon" onClick={addSocialLink}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Add links to your social profiles or portfolio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {storeUser?.hasPassword ? "Change Password" : "Set Password"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {storeUser?.hasPassword ? (
              <p className="text-sm text-muted-foreground">
                To change your password, use the{" "}
                <a href="/forgot-password" className="font-medium hover:underline">
                  Forgot Password
                </a>{" "}
                flow.
              </p>
            ) : (
              <>
                <p className="mb-4 text-sm text-muted-foreground">
                  You signed in with Google. Set a password to also enable email/password login.
                </p>
                <form onSubmit={handleSetPassword} className="flex gap-2">
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min 6 chars)"
                    minLength={6}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={settingPassword || !newPassword.trim()}>
                    {settingPassword ? "Setting..." : "Set Password"}
                  </Button>
                </form>
              </>
            )}
            {passwordError && (
              <div className="mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="mt-3 rounded-lg bg-green-500/10 p-3 text-sm text-green-600">
                {passwordSuccess}
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg bg-green-500/10 p-3 text-sm text-green-600">
            {success}
          </div>
        )}

        <Button type="submit" disabled={saving || !hasChanges}>
          {saving
            ? uploadingAvatar
              ? "Uploading photo..."
              : "Saving..."
            : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
