"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Car, AlertCircle, Lock, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api/client";
import type { Vehicle, EntryImage } from "@/lib/types/database";
import { EntryActions, EntryImageManager } from "@/components/entries";
import { cn } from "@/lib/utils";

export default function VehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehicleImages, setVehicleImages] = useState<Record<string, EntryImage[]>>({});

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setIsLoading(true);
      const data = await api.get<Vehicle[]>("/vehicles");
      const responseData = (data as any).data || data;
      // Ensure vehicles is always an array
      if (Array.isArray(responseData)) {
        setVehicles(responseData);
      } else if (responseData && typeof responseData === 'object') {
        // Handle paginated response or wrapped response
        const vehiclesArray = (responseData as any).content || (responseData as any).vehicles || [];
        setVehicles(vehiclesArray);
      } else {
        setVehicles([]);
      }
    } catch (err) {
      console.error("Failed to fetch vehicles:", err);
      setError("Failed to load vehicles. Please try again.");
      setVehicles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    try {
      await api.delete(`/vehicles/${vehicleId}`);
      setVehicles(vehicles.filter(v => v.id !== vehicleId));
    } catch (err) {
      console.error("Failed to delete vehicle:", err);
      throw err;
    }
  };

  const handleLockVehicle = async (vehicleId: string, reason?: string) => {
    try {
      await api.patch(`/vehicles/${vehicleId}/lock`, { reason });
      setVehicles(vehicles.map(v => 
        v.id === vehicleId 
          ? { ...v, isLocked: true, lockedAt: new Date(), lockedReason: reason }
          : v
      ));
    } catch (err) {
      console.error("Failed to lock vehicle:", err);
      throw err;
    }
  };

  const handleUnlockVehicle = async (vehicleId: string) => {
    try {
      await api.patch(`/vehicles/${vehicleId}/unlock`, {});
      setVehicles(vehicles.map(v => 
        v.id === vehicleId 
          ? { ...v, isLocked: false, lockedAt: undefined, lockedReason: undefined }
          : v
      ));
    } catch (err) {
      console.error("Failed to unlock vehicle:", err);
      throw err;
    }
  };

  const fetchVehicleImages = async (vehicleId: string) => {
    try {
      const response = await api.get(`/vehicles/${vehicleId}/images`);
      const images = (response as any).data || response || [];
      setVehicleImages(prev => ({ ...prev, [vehicleId]: images }));
    } catch (err) {
      console.error("Failed to fetch vehicle images:", err);
      setVehicleImages(prev => ({ ...prev, [vehicleId]: [] }));
    }
  };

  const handleUploadImage = async (vehicleId: string, file: File, description?: string) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (description) formData.append('description', description);
      
      // This would typically use apiForm.post, but for now we'll simulate
      console.log('[v0] Uploading image for vehicle:', vehicleId, file.name);
      // After upload, refresh images
      await fetchVehicleImages(vehicleId);
    } catch (err) {
      console.error("Failed to upload image:", err);
      throw err;
    }
  };

  const handleDeleteImage = async (vehicleId: string, imageId: string) => {
    try {
      await api.delete(`/vehicles/${vehicleId}/images/${imageId}`);
      setVehicleImages(prev => ({
        ...prev,
        [vehicleId]: (prev[vehicleId] || []).filter(img => img.id !== imageId)
      }));
    } catch (err) {
      console.error("Failed to delete image:", err);
      throw err;
    }
  };

  const handleReuploadImage = async (vehicleId: string, imageId: string, file: File) => {
    try {
      console.log('[v0] Reuploading image:', imageId, file.name);
      await fetchVehicleImages(vehicleId);
    } catch (err) {
      console.error("Failed to reupload image:", err);
      throw err;
    }
  };

  const handleLockImage = async (vehicleId: string, imageId: string, reason?: string) => {
    try {
      await api.patch(`/vehicles/${vehicleId}/images/${imageId}/lock`, { reason });
      await fetchVehicleImages(vehicleId);
    } catch (err) {
      console.error("Failed to lock image:", err);
      throw err;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-2 text-sm text-muted-foreground">Loading vehicles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <p className="mt-2 text-muted-foreground">{error}</p>
          <Button onClick={fetchVehicles} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-4 pb-24 md:pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Vehicles</h1>
        <Button asChild>
          <Link href="/onboarding/add-vehicle">
            <Plus className="mr-2 h-4 w-4" />
            Add Vehicle
          </Link>
        </Button>
      </div>

      {vehicles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Car className="h-16 w-16 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">
              No vehicles yet
            </p>
            <p className="text-sm text-muted-foreground">
              Add your first vehicle to start tracking expenses
            </p>
            <Button asChild className="mt-6">
              <Link href="/onboarding/add-vehicle">Add Vehicle</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <Card 
              key={vehicle.id}
              className={cn(
                "relative",
                vehicle.isLocked && "border-amber-500/50"
              )}
            >
              {/* Lock indicator */}
              {vehicle.isLocked && (
                <div className="absolute top-3 right-3">
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                    <Lock className="h-3 w-3 mr-1" />
                    Locked
                  </Badge>
                </div>
              )}
              
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  {vehicle.nickname || `${vehicle.make} ${vehicle.model}`}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </p>
                  <p className="text-sm font-medium">
                    {vehicle.registrationNumber}
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {vehicle.fuelType.toLowerCase().replace("_", " ")}
                  </p>
                </div>
                
                {/* Image count indicator */}
                {(vehicle.imageCount ?? 0) > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ImageIcon className="h-3 w-3" />
                    <span>{vehicle.imageCount} image{vehicle.imageCount !== 1 ? 's' : ''}</span>
                  </div>
                )}

                {/* Action buttons */}
                <div className="pt-2 border-t border-border/50">
                  <EntryActions
                    entryId={vehicle.id}
                    entryType="vehicle"
                    isLocked={vehicle.isLocked ?? false}
                    lockedAt={vehicle.lockedAt}
                    lockedByName={vehicle.lockedByName}
                    lockedReason={vehicle.lockedReason}
                    onEdit={() => setEditingVehicle(vehicle)}
                    onDelete={() => handleDeleteVehicle(vehicle.id)}
                    onLock={(reason) => handleLockVehicle(vehicle.id, reason)}
                    onUnlock={() => handleUnlockVehicle(vehicle.id)}
                    variant="icons"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Vehicle Dialog */}
      <Dialog open={!!editingVehicle} onOpenChange={() => setEditingVehicle(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Vehicle</DialogTitle>
            <DialogDescription>
              {editingVehicle && `${editingVehicle.year} ${editingVehicle.make} ${editingVehicle.model} - ${editingVehicle.registrationNumber}`}
            </DialogDescription>
          </DialogHeader>
          
          {editingVehicle && (
            <div className="space-y-6 py-4">
              {/* Vehicle Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Nickname</label>
                  <p className="font-medium">{editingVehicle.nickname || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Registration</label>
                  <p className="font-medium">{editingVehicle.registrationNumber}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Make</label>
                  <p className="font-medium">{editingVehicle.make}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Model</label>
                  <p className="font-medium">{editingVehicle.model}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Year</label>
                  <p className="font-medium">{editingVehicle.year}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Fuel Type</label>
                  <p className="font-medium capitalize">{editingVehicle.fuelType.toLowerCase().replace("_", " ")}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Colour</label>
                  <p className="font-medium">{editingVehicle.color || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Current Odometer</label>
                  <p className="font-medium">{editingVehicle.currentOdometer?.toLocaleString() || 0} km</p>
                </div>
              </div>

              {/* Images Section */}
              <div className="space-y-3">
                <h3 className="font-medium">Vehicle Images</h3>
                <EntryImageManager
                  entryId={editingVehicle.id}
                  entryType="VEHICLE"
                  images={vehicleImages[editingVehicle.id] || []}
                  onUpload={(file, desc) => handleUploadImage(editingVehicle.id, file, desc)}
                  onDelete={(imageId) => handleDeleteImage(editingVehicle.id, imageId)}
                  onReupload={(imageId, file) => handleReuploadImage(editingVehicle.id, imageId, file)}
                  onLock={(imageId, reason) => handleLockImage(editingVehicle.id, imageId, reason)}
                  disabled={editingVehicle.isLocked}
                />
              </div>

              {/* Edit Link */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setEditingVehicle(null)}>
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    router.push(`/dashboard/vehicles/${editingVehicle.id}/edit`);
                    setEditingVehicle(null);
                  }}
                  disabled={editingVehicle.isLocked}
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
