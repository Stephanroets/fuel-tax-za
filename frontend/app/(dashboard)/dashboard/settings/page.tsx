"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaxReadinessAudit } from "@/components/dashboard/tax-readiness-audit";
import {
  User,
  Building2,
  Bell,
  Moon,
  Sun,
  LogOut,
  FileText,
  ChevronRight,
  Camera,
  Settings as SettingsIcon,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/contexts/auth-context";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoredProfile {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  organizationMode?: "SOLO" | "FLEET";
  organizationName?: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState({
    serviceReminders: true,
    fuelEfficiency: true,
    taxDeadlines: true,
  });

  // ── Real user data from localStorage ──────────────────────────────────────
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
    : "—";

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account and preferences
          </p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <div className="px-4 pb-2">
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="general" className="gap-2">
                <SettingsIcon className="h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="tax-readiness" className="gap-2">
                <Camera className="h-4 w-4" />
                Tax Readiness
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── General Tab ───────────────────────────────────────────────── */}
          <TabsContent value="general" className="mt-0">
            <div className="px-4 py-4 space-y-6">
              {/* Profile card — real data from localStorage */}
              <Link href="/dashboard/profile">
                <Card className="cursor-pointer hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
                        {profile.firstName?.[0] ?? <User className="h-8 w-8" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="font-semibold text-lg truncate">
                          {displayName}
                        </h2>
                        <p className="text-sm text-muted-foreground truncate">
                          {profile.email ?? ""}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {/* Role from DB — read-only, never editable */}
                          <Badge variant="secondary" className="text-xs">
                            {profile.role ?? "—"}
                          </Badge>
                          {/* Account type from DB — read-only */}
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              isFleet
                                ? "border-primary/50 text-primary"
                                : "border-accent/50 text-accent",
                            )}
                          >
                            {isFleet ? "Fleet Account" : "Individual Account"}
                          </Badge>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* ── Account Type — READ-ONLY, set by the database ─────────── */}
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    Account Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {isFleet ? "Fleet Management" : "Individual"}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {isFleet
                          ? "Full fleet dashboard with team and vehicle management"
                          : "Personal vehicle expense tracking"}
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        "shrink-0",
                        isFleet
                          ? "bg-primary/20 text-primary border-primary/30"
                          : "bg-accent/20 text-accent border-accent/30",
                      )}
                      variant="outline"
                    >
                      {isFleet ? "FLEET" : "INDIVIDUAL"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Your account type is set by your organisation and cannot be
                    changed here.
                  </p>
                </CardContent>
              </Card>

              {/* ── Organisation (Fleet only) ──────────────────────────────── */}
              {isFleet && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Building2 className="h-5 w-5" />
                      Organisation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {profile.organizationName ?? "—"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Fleet account
                        </p>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href="/dashboard/organization">Manage</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ── Appearance ────────────────────────────────────────────── */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Appearance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {darkMode ? (
                        <Moon className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Sun className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <Label htmlFor="dark-mode" className="font-medium">
                          Dark Mode
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          High contrast for outdoor visibility
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="dark-mode"
                      checked={darkMode}
                      onCheckedChange={setDarkMode}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* ── Notifications ─────────────────────────────────────────── */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Bell className="h-5 w-5" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label
                        htmlFor="service-reminders"
                        className="font-medium"
                      >
                        Service Reminders
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified before service is due
                      </p>
                    </div>
                    <Switch
                      id="service-reminders"
                      checked={notifications.serviceReminders}
                      onCheckedChange={(v) =>
                        setNotifications({
                          ...notifications,
                          serviceReminders: v,
                        })
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="fuel-efficiency" className="font-medium">
                        Fuel Efficiency Alerts
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Alert when km/L drops significantly
                      </p>
                    </div>
                    <Switch
                      id="fuel-efficiency"
                      checked={notifications.fuelEfficiency}
                      onCheckedChange={(v) =>
                        setNotifications({
                          ...notifications,
                          fuelEfficiency: v,
                        })
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="tax-deadlines" className="font-medium">
                        SARS Tax Deadlines
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Reminders for tax submission dates
                      </p>
                    </div>
                    <Switch
                      id="tax-deadlines"
                      checked={notifications.taxDeadlines}
                      onCheckedChange={(v) =>
                        setNotifications({ ...notifications, taxDeadlines: v })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* ── Regional ──────────────────────────────────────────────── */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Regional</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select defaultValue="ZAR">
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ZAR">
                          ZAR (R) — South African Rand
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Distance Unit</Label>
                    <Select defaultValue="km">
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="km">Kilometers (km)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fuel Efficiency Display</Label>
                    <Select defaultValue="km_l">
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="km_l">km/L</SelectItem>
                        <SelectItem value="l_100km">L/100 km</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* ── Tax & Compliance ──────────────────────────────────────── */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-5 w-5" />
                    Tax & Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <SettingsRow
                    icon={<FileText className="h-4 w-4" />}
                    label="Tax Year"
                    value="2024 / 2025"
                  />
                  <SettingsRow
                    icon={<FileText className="h-4 w-4" />}
                    label="Export SARS Logbook"
                    value="Download PDF"
                    action
                  />
                  <SettingsRow
                    icon={<FileText className="h-4 w-4" />}
                    label="Export Expenses"
                    value="Download CSV"
                    action
                  />
                </CardContent>
              </Card>

              {/* ── Sign Out ──────────────────────────────────────────────── */}
              <Button
                variant="destructive"
                className="w-full h-14 text-base"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut className="h-5 w-5 mr-2" />
                {isLoggingOut ? "Signing out…" : "Sign Out"}
              </Button>

              <div className="text-center text-xs text-muted-foreground py-4">
                <p>Vehicle Expense Tracker v1.0.0</p>
                <p>Designed for South African Tax Compliance</p>
              </div>
            </div>
          </TabsContent>

          {/* ── Tax Readiness Tab ─────────────────────────────────────────── */}
          <TabsContent value="tax-readiness" className="mt-0">
            <div className="px-4 py-4">
              <TaxReadinessAudit />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function SettingsRow({
  icon,
  label,
  value,
  action = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  action?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "text-sm",
            action ? "text-primary" : "text-muted-foreground",
          )}
        >
          {value}
        </span>
        {action && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </div>
    </div>
  );
}
