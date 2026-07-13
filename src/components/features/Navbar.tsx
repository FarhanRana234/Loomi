"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "./ThemeToggle";
import { SearchInput } from "./SearchInput";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import { LogOut, LayoutDashboard, Settings, Menu, X, FolderOpen } from "lucide-react";
import { useUserStore } from "@/hooks/useUserStore";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);
  const [mobileOpen, setMobileOpen] = useState(false);

  const pushSearch = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (pathname === "/") {
        const params = new URLSearchParams(searchParams.toString());
        if (trimmed) {
          params.set("q", trimmed);
        } else {
          params.delete("q");
        }
        router.push(`/?${params.toString()}`);
      } else {
        router.push(trimmed ? `/?q=${encodeURIComponent(trimmed)}` : "/");
      }
    },
    [pathname, searchParams, router]
  );

  const { value, isPending, handleChange, handleSubmit } =
    useDebouncedSearch(pushSearch, 300);

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "??";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight">Loomi</span>
        </Link>

        <div className="hidden flex-1 justify-center md:flex mx-4 max-w-sm">
          <SearchInput
            value={value}
            isPending={isPending}
            onChange={handleChange}
            onSubmit={handleSubmit}
          />
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl} alt={user.username} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl} alt={user.username} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.username}</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/profile/${user.username}`}>
                    <Avatar className="mr-2 h-4 w-4">
                      <AvatarImage src={user.avatarUrl} alt={user.username} />
                      <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                    </Avatar>
                    My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/moodboards-manager">
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Moodboards
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild variant="default" size="sm">
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border px-4 py-3 md:hidden">
          <div className="mb-3">
            <SearchInput
              value={value}
              isPending={isPending}
              onChange={handleChange}
              onSubmit={handleSubmit}
            />
          </div>
          {user && (
            <div className="flex flex-col gap-1">
              <Link
                href="/dashboard"
                className="rounded-lg px-3 py-2 text-sm hover:bg-accent"
                onClick={() => setMobileOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/moodboards-manager"
                className="rounded-lg px-3 py-2 text-sm hover:bg-accent"
                onClick={() => setMobileOpen(false)}
              >
                Moodboards
              </Link>
              <button
                className="rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
                onClick={() => logout()}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
