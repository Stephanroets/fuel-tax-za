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
  CircleDot,
  AlertTriangle,
  RotateCcw,
  X,
  Check,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/contexts/auth-context";
import { cn } from "@/lib/utils";
import { useTyreRotationWarnings } from "@/lib/hooks/use-tyre-rotation-warnings";
import {
  TyreRotationWarning,
  getTyreRotationStatusColor,
  getTyreRotationStatusLabel,
  DRIVETRAIN_TYPE_LABELS,
} from "@/lib/types/database";

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

function TyreRotationNotification({
  warning,
  onDismiss,
  onRecordRotation,
}: {
  warning: TyreRotationWarning;
  onDismiss: (id: string) => void;
  onRecordRotation: (id: string) => void;
}) {
  const statusColor = getTyreRotationStatusColor(warning.rotationStatus);
  const statusLabel = getTyreRotationStatusLabel(warning.rotationStatus);

  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "p-1.5 rounded-full",
              warning.rotationStatus === "CRITICAL"
                ? "bg-destructive/20"
                : "bg-warning/20"
            )}
          >
            <CircleDot
              className={cn(
                "h-4 w-4",
                warning.rotationStatus === "CRITICAL"
                  ? "text-destructive"
                  : "text-warning"
              )}
            />
          </div>
          <div>
            <p className="text-sm font-medium">{warning.vehicleRegistration}</p>
            <p className="text-xs text-muted-foreground">{warning.vehicleName}</p>
          </div>
        </div>
        <Badge variant="outline" className={cn("text-xs", statusColor)}>
          {statusLabel}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-muted-foreground">Tyres</p>
          <p className="font-medium">{warning.tyreBrand}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Drivetrain</p>
          <p className="font-medium">
            {DRIVETRAIN_TYPE_LABELS[warning.drivetrainType]}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Interval</p>
          <p className="font-medium">
            {warning.rotationIntervalKm.toLocaleString()} km
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">
            {warning.kmOverdue > 0 ? "Overdue" : "Due at"}
          </p>
          <p
            className={cn(
              "font-medium",
              warning.kmOverdue > 0 && "text-destructive"
            )}
          >
            {warning.kmOverdue > 0
              ? `${warning.kmOverdue.toLocaleString()} km`
              : `${warning.nextRotationOdometer.toLocaleString()} km`}
          </p>
        </div>
      </div>

      {warning.latestFuelOdometer && (
        <div className="text-xs text-muted-foreground">
          Latest fuel reading: {warning.latestFuelOdometer.toLocaleString()} km
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-8 text-xs"
          onClick={() => onRecordRotation(warning.trackingId)}
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Mark Rotated
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-muted-foreground"
          onClick={() => onDismiss(warning.trackingId)}
        >
          <X className="h-3 w-3 mr-1" />
          Dismiss
        </Button>
      </div>
    </div>
  );
}

export function DashboardHeader({
  title,
  showModeToggle = true,
}: DashboardHeaderProps) {
  // logout() is the one thing still valid from AuthContext (it clears localStorage)
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Real user data — read from localStorage (set during login / register)
  const [profile, setProfile] = useState<StoredProfile>({});

  // Tyre rotation warnings
  const {
    warnings,
    warningCount,
    criticalCount,
    dismissWarning,
    recordRotation,
  } = useTyreRotationWarnings();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user_profile");
      if (raw) setProfile(JSON.parse(raw));
    } catch {
      // ignore
    }
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

  const handleDismissWarning = async (trackingId: string) => {
    try {
      await dismissWarning(trackingId);
    } catch {
      // Handle error
    }
  };

  const handleRecordRotation = async (trackingId: string) => {
    // In a real app, you'd prompt for the current odometer
    // For now, we'll use the current vehicle odometer from the warning
    const warning = warnings.find((w) => w.trackingId === trackingId);
    if (warning) {
      try {
        await recordRotation(trackingId, warning.currentVehicleOdometer);
      } catch {
        // Handle error
      }
    }
  };

  const totalNotifications = warningCount;
  const hasCritical = criticalCount > 0;

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
          {/* Notification Bell with Tyre Rotation Warnings */}
          <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative touch-target"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {totalNotifications > 0 && (
                  <span
                    className={cn(
                      "absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white",
                      hasCritical ? "bg-destructive animate-pulse" : "bg-warning"
                    )}
                  >
                    {totalNotifications}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-80 p-0"
              sideOffset={8}
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className={cn(
                      "h-4 w-4",
                      hasCritical ? "text-destructive" : "text-warning"
                    )}
                  />
                  <span className="font-semibold text-sm">
                    Tyre Rotation Alerts
                  </span>
                </div>
                {totalNotifications > 0 && (
                  <Badge
                    variant={hasCritical ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {totalNotifications}
                  </Badge>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto p-2">
                {warnings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="p-3 rounded-full bg-muted mb-3">
                      <Check className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">All caught up!</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      No tyre rotation warnings at this time.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {warnings.map((warning) => (
                      <TyreRotationNotification
                        key={warning.trackingId}
                        warning={warning}
                        onDismiss={handleDismissWarning}
                        onRecordRotation={handleRecordRotation}
                      />
                    ))}
                  </div>
                )}
              </div>

              {warnings.length > 0 && (
                <div className="border-t border-border px-4 py-2">
                  <p className="text-xs text-muted-foreground text-center">
                    Warnings based on fuel purchase odometer readings
                  </p>
                </div>
              )}
            </PopoverContent>
          </Popover>

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
                      Loading...
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
                {isLoggingOut ? "Signing out..." : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
