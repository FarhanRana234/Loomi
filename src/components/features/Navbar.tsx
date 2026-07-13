"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
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
import { LogOut, LayoutDashboard, Settings, Menu, X, Search } from "lucide-react";

interface NavbarUser {
  username: string;
  avatarUrl: string;
  role: string;
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<NavbarUser | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(searchParams.get("q") || "");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.success && d.data) setUser(d.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setSearchValue(searchParams.get("q") || "");
  }, [searchParams]);

  const handleSearch = (value: string) => {
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
  };

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "??";

  const SearchInput = ({ className }: { className?: string }) => (
    <div className={`relative ${className}`}>
      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSearch(searchValue);
        }}
        placeholder="Search projects..."
        className="h-9 w-full rounded-lg border border-input bg-transparent pl-8 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
    </div>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight">Loomi</span>
        </Link>

        {/* Center: Search (hidden on mobile) */}
        <SearchInput className="hidden flex-1 justify-center md:flex max-w-sm mx-4" />

        {/* Right: Auth + Theme */}
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
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    fetch("/api/auth/logout", { method: "POST" }).then(() => {
                      window.location.href = "/login";
                    });
                  }}
                >
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

          {/* Mobile menu button */}
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

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border px-4 py-3 md:hidden">
          <SearchInput className="mb-3" />
          {user && (
            <div className="flex flex-col gap-1">
              <Link
                href="/dashboard"
                className="rounded-lg px-3 py-2 text-sm hover:bg-accent"
                onClick={() => setMobileOpen(false)}
              >
                Dashboard
              </Link>
              <button
                className="rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
                onClick={() => {
                  fetch("/api/auth/logout", { method: "POST" }).then(() => {
                    window.location.href = "/login";
                  });
                }}
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
