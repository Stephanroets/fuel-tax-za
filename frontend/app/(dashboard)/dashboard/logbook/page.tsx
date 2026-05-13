"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import type { Vehicle, Trip, EntryImage } from "@/lib/types/database";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Lock,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { EntryActions, EntryImageManager } from "@/components/entries";

// Helper to format vehicle label same as dashboard
function vehicleLabel(v: Vehicle): string {
  return v.nickname
    ? `${v.nickname} (${v.registrationNumber})`
    : `${v.year} ${v.make} ${v.model} — ${v.registrationNumber}`
}

// Mock trip data with lock support
const mockTrips: (Trip & { vehicle: { registration: string; make: string; model: string } })[] = [
  {
    id: "t1",
    organizationId: "org1",
    vehicleId: "v1",
    userId: "u1",
    tripDate: new Date("2024-01-15"),
    startTime: "08:00",
    endTime: "10:00",
    startLocation: "Office - Sandton",
    endLocation: "Client Site - Pretoria",
    startOdometer: 45000,
    endOdometer: 45085,
    distanceKm: 85,
    purpose: "BUSINESS" as const,
    routeDescription: "Client meeting at ABC Construction",
    customerClientName: "ABC Construction",
    reasonForTrip: "Quarterly review meeting",
    tollCostsZar: 0,
    parkingCostsZar: 25,
    isLocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    vehicle: { registration: "CA 123-456", make: "Toyota", model: "Hilux" },
  },
  {
    id: "t2",
    organizationId: "org1",
    vehicleId: "v1",
    userId: "u1",
    tripDate: new Date("2024-01-15"),
    startTime: "10:30",
    endTime: "12:30",
    startLocation: "Client Site - Pretoria",
    endLocation: "Office - Sandton",
    startOdometer: 45085,
    endOdometer: 45170,
    distanceKm: 85,
    purpose: "BUSINESS" as const,
    routeDescription: "Return from client meeting",
    customerClientName: "ABC Construction",
    tollCostsZar: 0,
    parkingCostsZar: 0,
    isLocked: true,
    lockedAt: new Date("2024-02-01"),
    lockedReason: "Tax audit period",
    createdAt: new Date(),
    updatedAt: new Date(),
    vehicle: { registration: "CA 123-456", make: "Toyota", model: "Hilux" },
  },
  {
    id: "t3",
    organizationId: "org1",
    vehicleId: "v1",
    userId: "u1",
    tripDate: new Date("2024-01-14"),
    startTime: "07:00",
    endTime: "07:30",
    startLocation: "Home - Johannesburg",
    endLocation: "Gym - Rosebank",
    startOdometer: 44980,
    endOdometer: 44995,
    distanceKm: 15,
    purpose: "PRIVATE" as const,
    routeDescription: "Personal errand",
    tollCostsZar: 0,
    parkingCostsZar: 0,
    isLocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    vehicle: { registration: "CA 123-456", make: "Toyota", model: "Hilux" },
  },
  {
    id: "t4",
    organizationId: "org1",
    vehicleId: "v1",
    userId: "u1",
    tripDate: new Date("2024-01-13"),
    startTime: "09:00",
    endTime: "11:00",
    startLocation: "Office - Sandton",
    endLocation: "Supplier - Midrand",
    startOdometer: 44850,
    endOdometer: 44920,
    distanceKm: 70,
    purpose: "BUSINESS" as const,
    routeDescription: "Materials pickup",
    customerClientName: "BuildIt Midrand",
    tollCostsZar: 15,
    parkingCostsZar: 0,
    isLocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    vehicle: { registration: "CA 123-456", make: "Toyota", model: "Hilux" },
  },
  {
    id: "t5",
    organizationId: "org1",
    vehicleId: "v1",
    userId: "u1",
    tripDate: new Date("2024-01-12"),
    startTime: "14:00",
    endTime: "16:00",
    startLocation: "Home - Johannesburg",
    endLocation: "Weekend getaway - Hartbeespoort",
    startOdometer: 44750,
    endOdometer: 44850,
    distanceKm: 100,
    purpose: "PRIVATE" as const,
    routeDescription: "Family trip",
    tollCostsZar: 45,
    parkingCostsZar: 0,
    isLocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
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
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedVehicle, setSelectedVehicle] = useState("all");
  const [filterPurpose, setFilterPurpose] = useState<"all" | "BUSINESS" | "PRIVATE">("all");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState(mockTrips);
  const [editingTrip, setEditingTrip] = useState<typeof mockTrips[0] | null>(null);
  const [tripImages, setTripImages] = useState<Record<string, EntryImage[]>>({});

  // Fetch vehicles for filter
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await api.get<Vehicle[]>("/vehicles");
        console.log('Logbook - Vehicles response:', response);
        const vehicleData = (response as any).data || response;
        if (Array.isArray(vehicleData)) {
          setVehicles(vehicleData);
          console.log('Logbook - Loaded vehicles:', vehicleData.length);
        } else {
          console.warn('Logbook - Invalid vehicles data:', vehicleData);
        }
      } catch (err) {
        console.error("Logbook - Failed to fetch vehicles:", err);
      }
    };
    fetchVehicles();
  }, []);

  const filteredTrips = trips.filter((trip) => {
    if (filterPurpose !== "all" && trip.purpose !== filterPurpose) return false;
    return true;
  });

  const handleDeleteTrip = async (tripId: string) => {
    try {
      await api.delete(`/trips/${tripId}`);
      setTrips(trips.filter(t => t.id !== tripId));
    } catch (err) {
      console.error("Failed to delete trip:", err);
      // For demo, still remove locally
      setTrips(trips.filter(t => t.id !== tripId));
    }
  };

  const handleLockTrip = async (tripId: string, reason?: string) => {
    try {
      await api.patch(`/trips/${tripId}/lock`, { reason });
      setTrips(trips.map(t => 
        t.id === tripId 
          ? { ...t, isLocked: true, lockedAt: new Date(), lockedReason: reason }
          : t
      ));
    } catch (err) {
      console.error("Failed to lock trip:", err);
      // For demo, still update locally
      setTrips(trips.map(t => 
        t.id === tripId 
          ? { ...t, isLocked: true, lockedAt: new Date(), lockedReason: reason }
          : t
      ));
    }
  };

  const handleUnlockTrip = async (tripId: string) => {
    try {
      await api.patch(`/trips/${tripId}/unlock`, {});
      setTrips(trips.map(t => 
        t.id === tripId 
          ? { ...t, isLocked: false, lockedAt: undefined, lockedReason: undefined }
          : t
      ));
    } catch (err) {
      console.error("Failed to unlock trip:", err);
      // For demo, still update locally
      setTrips(trips.map(t => 
        t.id === tripId 
          ? { ...t, isLocked: false, lockedAt: undefined, lockedReason: undefined }
          : t
      ));
    }
  };

  const handleUploadTripImage = async (tripId: string, file: File, description?: string) => {
    console.log('[v0] Uploading image for trip:', tripId, file.name);
  };

  const handleDeleteTripImage = async (tripId: string, imageId: string) => {
    setTripImages(prev => ({
      ...prev,
      [tripId]: (prev[tripId] || []).filter(img => img.id !== imageId)
    }));
  };

  const handleReuploadTripImage = async (tripId: string, imageId: string, file: File) => {
    console.log('[v0] Reuploading trip image:', imageId, file.name);
  };

  const handleLockTripImage = async (tripId: string, imageId: string, reason?: string) => {
    console.log('[v0] Locking trip image:', imageId);
  };

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
                "overflow-hidden relative",
                trip.purpose === "BUSINESS"
                  ? "border-l-4 border-l-primary"
                  : "border-l-4 border-l-amber-500",
                trip.isLocked && "border-amber-500/50"
              )}
            >
              {/* Lock indicator */}
              {trip.isLocked && (
                <div className="absolute top-3 right-3 z-10">
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                    <Lock className="h-3 w-3 mr-1" />
                    Locked
                  </Badge>
                </div>
              )}
              
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
                      {new Date(trip.tripDate).toLocaleDateString("en-ZA", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <span className="text-lg font-bold">{trip.distanceKm} km</span>
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

                {trip.customerClientName && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">Client: </span>
                    <span className="text-xs font-medium">{trip.customerClientName}</span>
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Car className="h-3 w-3" />
                      <span>{trip.vehicle.registration}</span>
                    </div>
                    <span>
                      {trip.startOdometer.toLocaleString()} - {trip.endOdometer.toLocaleString()} km
                    </span>
                  </div>
                  
                  {/* Action buttons */}
                  <EntryActions
                    entryId={trip.id}
                    entryType="trip"
                    isLocked={trip.isLocked ?? false}
                    lockedAt={trip.lockedAt}
                    lockedByName={trip.lockedByName}
                    lockedReason={trip.lockedReason}
                    onEdit={() => setEditingTrip(trip)}
                    onDelete={() => handleDeleteTrip(trip.id)}
                    onLock={(reason) => handleLockTrip(trip.id, reason)}
                    onUnlock={() => handleUnlockTrip(trip.id)}
                    variant="icons"
                  />
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

      {/* Edit Trip Dialog */}
      <Dialog open={!!editingTrip} onOpenChange={() => setEditingTrip(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Trip</DialogTitle>
            <DialogDescription>
              {editingTrip && `${new Date(editingTrip.tripDate).toLocaleDateString('en-ZA')} - ${editingTrip.startLocation} to ${editingTrip.endLocation}`}
            </DialogDescription>
          </DialogHeader>
          
          {editingTrip && (
            <div className="space-y-6 py-4">
              {/* Trip Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Date</label>
                  <p className="font-medium">{new Date(editingTrip.tripDate).toLocaleDateString('en-ZA')}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Purpose</label>
                  <p className="font-medium">{editingTrip.purpose}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Start Location</label>
                  <p className="font-medium">{editingTrip.startLocation}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">End Location</label>
                  <p className="font-medium">{editingTrip.endLocation}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Start Odometer</label>
                  <p className="font-medium">{editingTrip.startOdometer.toLocaleString()} km</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">End Odometer</label>
                  <p className="font-medium">{editingTrip.endOdometer.toLocaleString()} km</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Distance</label>
                  <p className="font-medium">{editingTrip.distanceKm} km</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Vehicle</label>
                  <p className="font-medium">{editingTrip.vehicle.registration}</p>
                </div>
                {editingTrip.customerClientName && (
                  <div>
                    <label className="text-sm text-muted-foreground">Client</label>
                    <p className="font-medium">{editingTrip.customerClientName}</p>
                  </div>
                )}
                {editingTrip.routeDescription && (
                  <div className="col-span-2">
                    <label className="text-sm text-muted-foreground">Description</label>
                    <p className="font-medium">{editingTrip.routeDescription}</p>
                  </div>
                )}
              </div>

              {/* Images Section */}
              <div className="space-y-3">
                <h3 className="font-medium">Trip Images</h3>
                <EntryImageManager
                  entryId={editingTrip.id}
                  entryType="TRIP"
                  images={tripImages[editingTrip.id] || []}
                  onUpload={(file, desc) => handleUploadTripImage(editingTrip.id, file, desc)}
                  onDelete={(imageId) => handleDeleteTripImage(editingTrip.id, imageId)}
                  onReupload={(imageId, file) => handleReuploadTripImage(editingTrip.id, imageId, file)}
                  onLock={(imageId, reason) => handleLockTripImage(editingTrip.id, imageId, reason)}
                  disabled={editingTrip.isLocked}
                />
              </div>

              {/* Edit Link */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setEditingTrip(null)}>
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    router.push(`/dashboard/logbook/${editingTrip.id}/edit`);
                    setEditingTrip(null);
                  }}
                  disabled={editingTrip.isLocked}
                >
                  Edit Details
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
