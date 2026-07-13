"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface UserData {
  _id: string;
  username: string;
  email: string;
  avatarUrl: string;
  role: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => {
        if (!r.ok) throw new Error("Not authenticated");
        return r.json();
      })
      .then((d) => {
        if (d.success && d.data) setUser(d.data);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-40 rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        User account management
      </p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input value={user.email} disabled className="opacity-60" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <Input value={user.username} disabled className="opacity-60" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Input value={user.role} disabled className="opacity-60" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
