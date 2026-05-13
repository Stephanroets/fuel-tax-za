"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  User,
  LogOut,
  Settings,
  Building2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/contexts/auth-context";
import { cn } from "@/lib/utils";

// ── Stored profile shape (written to localStorage at login / register) ────────
interface StoredProfile {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  organizationMode?: "SOLO" | "FLEET";
  organizationName?: string;
}

interface DashboardHeaderProps {
  title?: string;
  showModeToggle?: boolean;
}

export function DashboardHeader({
  title,
  showModeToggle = true,
}: DashboardHeaderProps) {
  // logout() is the one thing still valid from AuthContext (it clears localStorage)
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Real user data — read from localStorage (set during login / register)
  const [profile, setProfile] = useState<StoredProfile>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user_profile");
      if (raw) setProfile(JSON.parse(raw));
    } catch {}
  }, []);

  const isFleet = profile.organizationMode === "FLEET";
  const displayName = profile.firstName
    ? `${profile.firstName} ${profile.lastName ?? ""}`.trim()
    : null;
  const initials = profile.firstName
    ? `${profile.firstName[0]}${profile.lastName?.[0] ?? ""}`.toUpperCase()
    : null;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left — logo + mode badge */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">
                VE
              </span>
            </div>
            <span className="hidden font-semibold sm:inline-block">
              {title || "Vehicle Expense"}
            </span>
          </Link>

          {/* Account-type badge — derived from real localStorage value */}
          {showModeToggle && profile.organizationMode && (
            <div
              className={cn(
                "hidden rounded-full px-2 py-0.5 text-xs font-medium sm:block",
                isFleet
                  ? "bg-primary/20 text-primary"
                  : "bg-accent/20 text-accent",
              )}
            >
              {isFleet ? "Fleet" : "Individual"}
            </div>
          )}
        </div>

        {/* Right — notifications + user menu */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="relative touch-target"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {/* Only show the red dot once real notifications exist */}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 touch-target">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-semibold">
                  {initials ?? <User className="h-4 w-4" />}
                </div>
                <span className="hidden max-w-[100px] truncate text-sm sm:inline-block">
                  {profile.firstName ?? "Account"}
                </span>
                <ChevronDown className="hidden h-4 w-4 sm:block" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-0.5">
                  {displayName ? (
                    <span className="text-sm font-medium">{displayName}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">
                      Loading…
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground truncate">
                    {profile.email ?? ""}
                  </span>
                  {profile.organizationMode && (
                    <span className="text-xs text-muted-foreground">
                      {isFleet
                        ? `Fleet · ${profile.organizationName ?? ""}`
                        : "Individual account"}
                    </span>
                  )}
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link
                  href="/dashboard/profile"
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>

              {/* Only show Organisation for Fleet accounts */}
              {isFleet && (
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/organization"
                    className="flex items-center gap-2"
                  >
                    <Building2 className="h-4 w-4" />
                    Organisation
                  </Link>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem asChild>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isLoggingOut ? "Signing out…" : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
