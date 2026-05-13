"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Car,
  Fuel,
  Route,
  TrendingUp,
  Wrench,
  Droplets,
  CircleDot,
  FileText,
  PlusCircle,
  CheckCircle2,
  Clock,
  Briefcase,
  MapPin,
  X,
  Search,
  Sparkles,
  LayoutGrid,
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ExpenseCategoryCard } from "@/components/dashboard/expense-category-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { TaxAlertBanner } from "@/components/dashboard/tax-alert-banner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatZAR } from "@/lib/types/database";
import { apiFetch } from "@/lib/api/client";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Vehicle {
  id: string;
  nickname: string | null;
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  color: string | null;
  fuelType: string;
  fuelTypeLabel: string;
  currentOdometer: number;
  compliant: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function vehicleLabel(v: Vehicle): string {
  return v.nickname
    ? `${v.nickname} (${v.registrationNumber})`
    : `${v.year} ${v.make} ${v.model} — ${v.registrationNumber}`;
}

function vehicleShortLabel(v: Vehicle): string {
  return v.nickname ?? `${v.make} ${v.model}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();

  // User display name — from localStorage (set during login / register)
  const [firstName, setFirstName] = useState<string | null>(null);

  // Gate state — spinner shown until compliance check resolves
  const [checking, setChecking] = useState(true);

  // ── Vehicle Context ────────────────────────────────────────────────────────
  // Single source of truth. Every stat, banner, and link derives from this.
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user_profile");
      if (raw) setFirstName(JSON.parse(raw).firstName ?? null);
    } catch {}

    const token = localStorage.getItem("jwt_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    apiFetch("/vehicles")
      .then((res) => {
        if (res.status === 401) {
          localStorage.clear();
          router.replace("/login");
          return null;
        }
        return res.json() as Promise<Vehicle[]>;
      })
      .then((list) => {
        if (!list) return;

        // ── Compliance gate ────────────────────────────────────────────────
        if (list.length === 0) {
          router.replace("/onboarding/add-vehicle");
          return;
        }

        const firstCompliant = list.find((v) => v.compliant);
        if (!firstCompliant) {
          router.replace(`/onboarding/odometer-check/${list[0].id}`);
          return;
        }

        // ── All checks passed — populate real state ────────────────────────
        setVehicles(list);
        // Auto-select the first compliant vehicle; user can switch after
        setSelectedVehicle(firstCompliant);
        setChecking(false);
      })
      .catch(() => {
        // Network failure — fail open, don't lock the user out
        setChecking(false);
      });
  }, [router]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">
            Loading your vehicles…
          </p>
        </div>
      </div>
    );
  }

  // ── Derived values — all come from selectedVehicle, no .find() needed ──────
  const vehicleCount = vehicles.length;
  const odometer = selectedVehicle
    ? selectedVehicle.currentOdometer.toLocaleString("en-ZA") + " km"
    : "—";
  const odometerSubtitle = selectedVehicle
    ? vehicleShortLabel(selectedVehicle)
    : "";

  // Expense links carry the selected vehicle ID so the add-expense form
  // can pre-populate the vehicle picker
  const expenseBase = selectedVehicle
    ? `/dashboard/expenses/new?vehicleId=${selectedVehicle.id}`
    : "/dashboard/expenses/new";

  // ── Dashboard ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-4">
      {/* SARS Compliance Banner — scoped to selected vehicle */}
      {selectedVehicle && (
        <TaxAlertBanner
          vehicleId={selectedVehicle.id}
          vehicleReg={selectedVehicle.registrationNumber}
        />
      )}

      {/* ── Welcome ───────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-muted-foreground">
          {vehicleCount === 0
            ? "No vehicles yet"
            : vehicleCount === 1
              ? "Managing 1 vehicle"
              : `Managing ${vehicleCount} vehicles`}
        </p>
      </div>

      {/* ── Vehicle Context Selector ───────────────────────────────────────── */}
      {vehicleCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
          <Car className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap shrink-0">
            Viewing:
          </span>
          <Select
            value={selectedVehicle?.id ?? ""}
            onValueChange={(id) => {
              const v = vehicles.find((v) => v.id === id);
              if (v) setSelectedVehicle(v);
            }}
          >
            <SelectTrigger className="h-9 flex-1 border-0 bg-transparent shadow-none focus:ring-0 font-medium">
              <SelectValue placeholder="Select a vehicle…" />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  <span className="flex items-center gap-2">
                    {vehicleLabel(v)}
                    {v.compliant ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                    ) : (
                      <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* ── Stats Grid ────────────────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Fleet size — real count from API */}
        <StatsCard
          title="Vehicles"
          value={vehicleCount.toString()}
          subtitle="In your fleet"
          icon={Car}
          variant="primary"
        />
        {/* Odometer — real value from selected vehicle */}
        <StatsCard
          title="Odometer"
          value={odometer}
          subtitle={odometerSubtitle}
          icon={Route}
          variant="default"
        />
        {/* Expense & KM stats — honest zeros, backend not yet wired */}
        <StatsCard
          title="Monthly Expenses"
          value={formatZAR(0)}
          subtitle="No expenses yet"
          icon={TrendingUp}
          variant="default"
        />
        <StatsCard
          title="Business KM"
          value="0%"
          subtitle="Log trips to track"
          icon={Fuel}
          variant="default"
        />
      </div>

      {/* ── Vehicle Fleet ─────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Your Vehicles</h2>
          <Button asChild variant="outline" size="sm">
            <Link href="/onboarding/add-vehicle">
              <PlusCircle className="h-4 w-4 mr-1.5" />
              Add Vehicle
            </Link>
          </Button>
        </div>

        <div className="space-y-2">
          {vehicles.map((v) => {
            const isSelected = v.id === selectedVehicle?.id;
            return (
              <button
                key={v.id}
                onClick={() => setSelectedVehicle(v)}
                className="w-full text-left"
                aria-pressed={isSelected}
              >
                <Card
                  className={`border transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/50 hover:border-border hover:bg-muted/30"
                  }`}
                >
                  <CardContent className="flex items-center gap-3 p-4">
                    {/* Vehicle icon */}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        isSelected ? "bg-primary/20" : "bg-muted"
                      }`}
                    >
                      <Car
                        className={`h-5 w-5 ${
                          isSelected ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                    </div>

                    {/* Name + details */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate leading-tight">
                        {v.nickname
                          ? v.nickname
                          : `${v.year} ${v.make} ${v.model}`}
                      </p>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {v.registrationNumber}
                        {" · "}
                        {v.currentOdometer.toLocaleString("en-ZA")} km
                        {" · "}
                        {v.fuelTypeLabel}
                      </p>
                    </div>

                    {/* Compliance badge */}
                    <Badge
                      variant="outline"
                      className={`shrink-0 text-xs ${
                        v.compliant
                          ? "border-green-300 bg-green-50 text-green-700"
                          : "border-amber-300 bg-amber-50 text-amber-700"
                      }`}
                    >
                      {v.compliant ? "✓ Compliant" : "Pending"}
                    </Badge>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Add Expense ───────────────────────────────────────────────────── */}
      {selectedVehicle && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Add Expense</h2>
            <span className="text-xs text-muted-foreground">
              for {vehicleShortLabel(selectedVehicle)}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ExpenseCategoryCard
              title="Fuel"
              description="Petrol, diesel, electricity"
              href={`${expenseBase}&category=fuel`}
              icon={Fuel}
              iconBgColor="bg-chart-1/10"
              iconColor="text-chart-1"
            />
            <ExpenseCategoryCard
              title="Car Wash"
              description="Wash & Valet services"
              href={`${expenseBase}&category=carwash`}
              icon={Sparkles}
              iconBgColor="bg-blue-100"
              iconColor="text-blue-600"
            />
            <ExpenseCategoryCard
              title="Service & Repairs"
              description="Workshop invoices"
              href={`${expenseBase}&category=service`}
              icon={Wrench}
              iconBgColor="bg-chart-3/10"
              iconColor="text-chart-3"
            />
            <ExpenseCategoryCard
              title="Top-ups (DIY)"
              description="Oil, antifreeze, wipers"
              href={`${expenseBase}&category=topup`}
              icon={Droplets}
              iconBgColor="bg-chart-2/10"
              iconColor="text-chart-2"
            />
            <ExpenseCategoryCard
              title="Tyres"
              description="Purchase & rotation"
              href={`${expenseBase}&category=tyres`}
              icon={CircleDot}
              iconBgColor="bg-chart-5/10"
              iconColor="text-chart-5"
            />
            <ExpenseCategoryCard
              title="Fixed & Admin"
              description="Insurance, tracking, e-tolls"
              href={`${expenseBase}&category=fixed`}
              icon={FileText}
              iconBgColor="bg-chart-4/10"
              iconColor="text-chart-4"
            />
          </div>
        </div>
      )}

      {/* ── SARS Tax Year Progress ─────────────────────────────────────────── */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            SARS Tax Year Progress
            {selectedVehicle && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                — {vehicleShortLabel(selectedVehicle)}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-4 text-center space-y-2">
            <Route className="h-8 w-8 text-muted-foreground/40 mx-auto" />
            <p className="text-sm text-muted-foreground">
              No trips logged yet.
            </p>
            <p className="text-xs text-muted-foreground">
              Log business and private trips to calculate your SARS-deductible
              percentage for{" "}
              {selectedVehicle
                ? vehicleShortLabel(selectedVehicle)
                : "this vehicle"}
              .
            </p>
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link
                href={
                  selectedVehicle
                    ? `/dashboard/logbook/new?vehicleId=${selectedVehicle.id}`
                    : "/dashboard/logbook/new"
                }
              >
                Log Your First Trip
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Recent Activity ───────────────────────────────────────────────── */}
      <RecentActivity activities={[]} />
    </div>
  );
}
