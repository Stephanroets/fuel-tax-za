"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api/client";
import type { Vehicle } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  FileText,
  Download,
  Calendar,
  Briefcase,
  Palmtree,
  TrendingUp,
  Car,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Helper to format vehicle label same as dashboard
function vehicleLabel(v: Vehicle): string {
  return v.nickname
    ? `${v.nickname} (${v.registrationNumber})`
    : `${v.year} ${v.make} ${v.model} — ${v.registrationNumber}`
}

// Mock trip data
const mockTrips = [
  {
    id: "t1",
    date: "2024-01-15",
    startLocation: "Office - Sandton",
    endLocation: "Client Site - Pretoria",
    startOdometer: 45000,
    endOdometer: 45085,
    distance: 85,
    purpose: "BUSINESS" as const,
    description: "Client meeting at ABC Construction",
    clientName: "ABC Construction",
    vehicle: { registration: "CA 123-456", make: "Toyota", model: "Hilux" },
  },
  {
    id: "t2",
    date: "2024-01-15",
    startLocation: "Client Site - Pretoria",
    endLocation: "Office - Sandton",
    startOdometer: 45085,
    endOdometer: 45170,
    distance: 85,
    purpose: "BUSINESS" as const,
    description: "Return from client meeting",
    clientName: "ABC Construction",
    vehicle: { registration: "CA 123-456", make: "Toyota", model: "Hilux" },
  },
  {
    id: "t3",
    date: "2024-01-14",
    startLocation: "Home - Johannesburg",
    endLocation: "Gym - Rosebank",
    startOdometer: 44980,
    endOdometer: 44995,
    distance: 15,
    purpose: "PRIVATE" as const,
    description: "Personal errand",
    vehicle: { registration: "CA 123-456", make: "Toyota", model: "Hilux" },
  },
  {
    id: "t4",
    date: "2024-01-13",
    startLocation: "Office - Sandton",
    endLocation: "Supplier - Midrand",
    startOdometer: 44850,
    endOdometer: 44920,
    distance: 70,
    purpose: "BUSINESS" as const,
    description: "Materials pickup",
    clientName: "BuildIt Midrand",
    vehicle: { registration: "CA 123-456", make: "Toyota", model: "Hilux" },
  },
  {
    id: "t5",
    date: "2024-01-12",
    startLocation: "Home - Johannesburg",
    endLocation: "Weekend getaway - Hartbeespoort",
    startOdometer: 44750,
    endOdometer: 44850,
    distance: 100,
    purpose: "PRIVATE" as const,
    description: "Family trip",
    vehicle: { registration: "CA 123-456", make: "Toyota", model: "Hilux" },
  },
];

// Mock summary data for current tax year
const mockSummary = {
  totalKm: 2450,
  businessKm: 1890,
  privateKm: 560,
  businessPercentage: 77.1,
  totalTrips: 45,
  businessTrips: 35,
  privateTrips: 10,
};

export default function LogbookPage() {
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedVehicle, setSelectedVehicle] = useState("all");
  const [filterPurpose, setFilterPurpose] = useState<"all" | "BUSINESS" | "PRIVATE">("all");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Fetch vehicles for filter
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await api.get<Vehicle[]>("/vehicles");
        const vehicleData = response.data || response;
        if (Array.isArray(vehicleData)) {
          setVehicles(vehicleData);
        } else {
          console.warn('Logbook - Invalid vehicles data:', vehicleData);
        }
      } catch (err) {
        console.error("Logbook - Failed to fetch vehicles:", err);
      }
    };
    fetchVehicles();
  }, []);

  const filteredTrips = mockTrips.filter((trip) => {
    if (filterPurpose !== "all" && trip.purpose !== filterPurpose) return false;
    // Note: mockTrips don't have vehicleId, so we'd need to add it to mock data
    // For now, filtering by purpose only
    return true;
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">SARS Logbook</h1>
              <p className="text-sm text-muted-foreground">Tax Year 2024/2025</p>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Tax Year Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-primary">Business KM</span>
              </div>
              <div className="text-2xl font-bold">
                {mockSummary.businessKm.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {mockSummary.businessTrips} trips
              </div>
            </CardContent>
          </Card>
          <Card className="bg-amber-500/10 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Palmtree className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-medium text-amber-500">Private KM</span>
              </div>
              <div className="text-2xl font-bold">
                {mockSummary.privateKm.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {mockSummary.privateTrips} trips
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Business Percentage Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="font-medium">Business Use Ratio</span>
              </div>
              <span className="text-2xl font-bold text-primary">
                {mockSummary.businessPercentage}%
              </span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${mockSummary.businessPercentage}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Business: {mockSummary.businessKm} km</span>
              <span>Private: {mockSummary.privateKm} km</span>
            </div>
          </CardContent>
        </Card>

        {/* SARS Compliance Notice */}
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">SARS Logbook Requirements</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Record all trips with date, start/end odometer, purpose (business/private),
                  and destination. Keep for 5 years for tax audit purposes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex gap-2">
          <Select value={filterPurpose} onValueChange={(v) => setFilterPurpose(v as typeof filterPurpose)}>
            <SelectTrigger className="w-[140px] h-10">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All trips" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trips</SelectItem>
              <SelectItem value="BUSINESS">Business Only</SelectItem>
              <SelectItem value="PRIVATE">Private Only</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
            <SelectTrigger className="w-[180px] h-10">
              <Car className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All vehicles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vehicles</SelectItem>
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicleLabel(vehicle)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="flex-1 h-10">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              <SelectItem value="01">January 2024</SelectItem>
              <SelectItem value="02">February 2024</SelectItem>
              <SelectItem value="03">March 2024</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Trip List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Trip History</h2>
            <span className="text-sm text-muted-foreground">
              {filteredTrips.length} trips
            </span>
          </div>

          {filteredTrips.map((trip) => (
            <Card
              key={trip.id}
              className={cn(
                "overflow-hidden",
                trip.purpose === "BUSINESS"
                  ? "border-l-4 border-l-primary"
                  : "border-l-4 border-l-amber-500"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={trip.purpose === "BUSINESS" ? "default" : "secondary"}
                      className={cn(
                        "text-xs",
                        trip.purpose === "PRIVATE" && "bg-amber-500/20 text-amber-500 hover:bg-amber-500/30"
                      )}
                    >
                      {trip.purpose === "BUSINESS" ? (
                        <Briefcase className="h-3 w-3 mr-1" />
                      ) : (
                        <Palmtree className="h-3 w-3 mr-1" />
                      )}
                      {trip.purpose}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(trip.date).toLocaleDateString("en-ZA", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <span className="text-lg font-bold">{trip.distance} km</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                    <span className="text-sm">{trip.startLocation}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    <span className="text-sm">{trip.endLocation}</span>
                  </div>
                </div>

                {trip.clientName && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">Client: </span>
                    <span className="text-xs font-medium">{trip.clientName}</span>
                  </div>
                )}

                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Car className="h-3 w-3" />
                    <span>{trip.vehicle.registration}</span>
                  </div>
                  <span>
                    {trip.startOdometer.toLocaleString()} - {trip.endOdometer.toLocaleString()} km
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Floating Add Button */}
      <Link href="/dashboard/logbook/new">
        <Button
          size="lg"
          className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg"
        >
          <Plus className="h-6 w-6" />
          <span className="sr-only">Add Trip</span>
        </Button>
      </Link>
    </div>
  );
}
