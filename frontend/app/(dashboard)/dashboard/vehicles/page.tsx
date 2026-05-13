"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Car, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api/client";
import type { Vehicle } from "@/lib/types/database";

export default function VehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setIsLoading(true);
      const data = await api.get<Vehicle[]>("/vehicles");
      // Ensure vehicles is always an array
      if (Array.isArray(data)) {
        setVehicles(data);
      } else if (data && typeof data === 'object') {
        // Handle paginated response or wrapped response
        const vehiclesArray = (data as any).content || (data as any).data || (data as any).vehicles || [];
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
            <Card key={vehicle.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {vehicle.nickname || `${vehicle.make} ${vehicle.model}`}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </p>
                <p className="text-sm font-medium">
                  {vehicle.registrationNumber}
                </p>
                <p className="text-sm text-muted-foreground capitalize">
                  {vehicle.fuelType.toLowerCase().replace("_", " ")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
