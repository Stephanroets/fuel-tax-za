"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Fuel, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { api } from "@/lib/api/client";

const categoryOptions = [
  { value: "FUEL", label: "Fuel" },
  { value: "CAR_WASH", label: "Car Wash" },
  { value: "MECHANIC", label: "Mechanic" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "TYRES", label: "Tyres" },
  { value: "FIXED_ADMIN", label: "Fixed Admin" },
];

export default function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [expense, setExpense] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
    date: "",
    supplierName: "",
    notes: "",
    // Fuel-specific fields
    vehicleId: "",
    fuelType: "",
    liters: "",
    pricePerLiter: "",
    odometerReading: "",
    fullTank: true,
    stationName: "",
    stationLocation: "",
    receiptImage: null as File | null,
  });

  const { id } = React.use(params);

  // Fetch vehicles for dropdown
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await api.get('/vehicles');
        setVehicles(response.data || []);
      } catch (err) {
        console.error('Failed to fetch vehicles:', err);
      }
    };
    fetchVehicles();
  }, []);

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        // Call Next.js API route instead of backend directly
        const token = localStorage.getItem('jwt_token');
        const res = await fetch(`/api/expenses/${id}`, {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        
        console.log("Edit page - Full expense data:", data);
        console.log("Edit page - Fuel log data:", data.fuelLog);
        
        if (!data) {
          console.error("No expense data received");
          router.push("/dashboard/expenses");
          return;
        }
        
        setExpense(data);
        setFormData({
          description: data.description || "",
          amount: data.amountZar ? data.amountZar.toString() : "",
          category: data.category === 'FUEL_LOG' ? 'FUEL' : data.category || "",
          date: data.expenseDate ? format(new Date(data.expenseDate), "yyyy-MM-dd") : "",
          supplierName: data.supplierName || "",
          notes: data.notes || "",
          // Fuel-specific fields - access via fuelLog relationship
          vehicleId: data.vehicle?.id || "",
          fuelType: data.fuelLog?.fuelType || "",
          liters: data.fuelLog?.liters ? data.fuelLog.liters.toString() : "",
          pricePerLiter: data.fuelLog?.pricePerLiter ? data.fuelLog.pricePerLiter.toString() : "",
          odometerReading: data.odometerReading ? data.odometerReading.toString() : "",
          fullTank: data.fuelLog?.fullTank !== undefined ? data.fuelLog.fullTank : true,
          stationName: data.fuelLog?.stationName || data.supplierName || "",
          stationLocation: data.fuelLog?.stationLocation || "",
          receiptImage: null,
        });
      } catch (error) {
        console.error("Error fetching expense:", error);
        router.push("/dashboard/expenses");
      } finally {
        setLoading(false);
      }
    };

    fetchExpense();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updateData: any = {
        ...formData,
        amountZar: parseFloat(formData.amount),
        expenseDate: formData.date,
        // Convert FUEL back to FUEL_LOG for backend
        category: formData.category === 'FUEL' ? 'FUEL_LOG' : formData.category,
      };

      // Include fuel-specific fields if it's a fuel expense
      if (formData.category === 'FUEL') {
        updateData.odometerReading = formData.odometerReading ? parseInt(formData.odometerReading) : null;
        updateData.supplierName = formData.stationName;
        
        // Fuel-specific data goes in fuelLog relationship
        updateData.fuelLog = {
          fuelType: formData.fuelType,
          liters: formData.liters ? parseFloat(formData.liters) : null,
          pricePerLiter: formData.pricePerLiter ? parseFloat(formData.pricePerLiter) : null,
          fullTank: formData.fullTank,
          stationName: formData.stationName,
          stationLocation: formData.stationLocation,
        };
      }

      // Call Next.js API route instead of backend directly
      const token = localStorage.getItem('jwt_token');
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(updateData)
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Update failed' }));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }
      
      router.push(`/dashboard/expenses/${id}`);
    } catch (error) {
      console.error("Error updating expense:", error);
      alert("Failed to update expense. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading expense details...</div>
      </div>
    );
  }

  // Calculate total amount for fuel expenses
  const totalAmount = formData.category === 'FUEL' && formData.liters && formData.pricePerLiter 
    ? parseFloat(formData.liters) * parseFloat(formData.pricePerLiter)
    : parseFloat(formData.amount) || 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-14 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" asChild>
            <button onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Button>
          <div>
            <h1 className="font-semibold">Edit Expense</h1>
            {formData.category && (
              <button
                onClick={() => handleInputChange("category", "")}
                className="text-xs text-primary hover:underline"
              >
                Change type
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-24">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Category Selection */}
          {!formData.category && (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Select Expense Type</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {categoryOptions.map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant="outline"
                        className="h-16 flex-col"
                        onClick={() => handleInputChange("category", option.value)}
                      >
                        <span>{option.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fuel Purchase Form */}
          {formData.category === 'FUEL' && (
            <>
              {/* Vehicle Selection */}
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Fuel className="h-5 w-5 text-chart-1" />
                    Fuel Purchase
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Vehicle */}
                  <div className="space-y-2">
                    <Label>Vehicle</Label>
                    <Select
                      value={formData.vehicleId}
                      onValueChange={(value) => handleInputChange("vehicleId", value)}
                    >
                      <SelectTrigger className="h-12 touch-target">
                        <SelectValue placeholder="Select vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.registrationNumber} - {vehicle.make} {vehicle.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date */}
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange("date", e.target.value)}
                      required
                    />
                  </div>

                  {/* Fuel Type */}
                  <div className="space-y-2">
                    <Label>Fuel Type</Label>
                    <Select
                      value={formData.fuelType}
                      onValueChange={(value) => handleInputChange("fuelType", value)}
                    >
                      <SelectTrigger className="h-12 touch-target">
                        <SelectValue placeholder="Select fuel type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PETROL_UNLEADED_95">Petrol Unleaded 95</SelectItem>
                        <SelectItem value="PETROL_UNLEADED_93">Petrol Unleaded 93</SelectItem>
                        <SelectItem value="DIESEL_50PPM">Diesel 50PPM</SelectItem>
                        <SelectItem value="DIESEL_10PPM">Diesel 10PPM</SelectItem>
                        <SelectItem value="DIESEL_500PPM">Diesel 500PPM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Liters and Price */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="liters">Liters</Label>
                      <Input
                        id="liters"
                        type="number"
                        step="0.001"
                        value={formData.liters}
                        onChange={(e) => handleInputChange("liters", e.target.value)}
                        placeholder="45.5"
                        className="h-12 touch-target text-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pricePerLiter">Price/L (R)</Label>
                      <Input
                        id="pricePerLiter"
                        type="number"
                        step="0.01"
                        value={formData.pricePerLiter}
                        onChange={(e) => handleInputChange("pricePerLiter", e.target.value)}
                        placeholder="24.99"
                        className="h-12 touch-target text-lg"
                      />
                    </div>
                  </div>

                  {/* Total Amount Display */}
                  {totalAmount > 0 && (
                    <div className="rounded-lg bg-muted p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total Amount</span>
                        <span className="text-2xl font-bold">R{totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {/* Odometer */}
                  <div className="space-y-2">
                    <Label htmlFor="odometerReading">Odometer (km)</Label>
                    <Input
                      id="odometerReading"
                      type="number"
                      value={formData.odometerReading}
                      onChange={(e) => handleInputChange("odometerReading", e.target.value)}
                      placeholder="100000"
                      className="h-12 touch-target text-lg"
                    />
                  </div>

                  {/* Full Tank Toggle */}
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <Label className="text-base">Full Tank</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable for accurate efficiency calculation
                      </p>
                    </div>
                    <Switch
                      checked={formData.fullTank}
                      onCheckedChange={(checked) => handleInputChange("fullTank", checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Station Details */}
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    Station Details (Optional)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="stationName">Station Name</Label>
                    <Input
                      id="stationName"
                      value={formData.stationName}
                      onChange={(e) => handleInputChange("stationName", e.target.value)}
                      placeholder="e.g., Shell, Engen, Sasol"
                      className="h-12 touch-target"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stationLocation">Location</Label>
                    <Input
                      id="stationLocation"
                      value={formData.stationLocation}
                      onChange={(e) => handleInputChange("stationLocation", e.target.value)}
                      placeholder="e.g., N1 Highway, Johannesburg"
                      className="h-12 touch-target"
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Other Expense Types */}
          {formData.category && formData.category !== 'FUEL' && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Edit Expense Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Enter expense description"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="amount">Amount (R)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => handleInputChange("amount", e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="supplierName">Supplier Name</Label>
                  <Input
                    id="supplierName"
                    value={formData.supplierName}
                    onChange={(e) => handleInputChange("supplierName", e.target.value)}
                    placeholder="Enter supplier name (optional)"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Enter any additional notes (optional)"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {formData.category && (
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
