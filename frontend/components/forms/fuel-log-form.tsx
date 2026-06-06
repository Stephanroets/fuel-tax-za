'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { Fuel, Camera, MapPin, CalendarIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FuelType, FUEL_TYPE_LABELS, formatZAR } from '@/lib/types/database'

const fuelLogSchema = z.object({
  vehicleId: z.string().min(1, 'Select a vehicle'),
  fuelType: z.nativeEnum(FuelType),
  date: z.date({ required_error: 'Select a date' }),
  liters: z.coerce.number().positive('Enter liters'),
  pricePerLiter: z.coerce.number().positive('Enter price'),
  odometerReading: z.coerce.number().int().min(0, 'Enter odometer'),
  fullTank: z.boolean().default(true),
  stationName: z.string().optional(),
  stationLocation: z.string().optional(),
})

type FuelLogInput = z.infer<typeof fuelLogSchema>

interface Vehicle {
  id: string
  registrationNumber: string
  make: string
  model: string
  fuelType: FuelType
  currentOdometer: number
}

interface FuelLogFormProps {
  vehicles: Vehicle[]
  onSubmit: (data: FuelLogInput, receiptImage?: File) => Promise<void>
}

// Helper function to get available fuel types based on vehicle fuel type
function getAvailableFuelTypes(vehicleFuelType: FuelType): FuelType[] {
  // Determine fuel category based on vehicle's fuel type
  const fuelTypeStr = vehicleFuelType.toString()

  if (fuelTypeStr.startsWith('PETROL')) {
    return [FuelType.PETROL_UNLEADED_93, FuelType.PETROL_UNLEADED_95]
  }

  if (fuelTypeStr.startsWith('DIESEL')) {
    return [FuelType.DIESEL_10PPM, FuelType.DIESEL_50PPM, FuelType.DIESEL_500PPM]
  }

  // Default to all fuel types if can't determine
  return Object.values(FuelType)
}

export function FuelLogForm({ vehicles, onSubmit }: FuelLogFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [receiptImage, setReceiptImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FuelLogInput>({
    resolver: zodResolver(fuelLogSchema),
    defaultValues: {
      fullTank: true,
      vehicleId: vehicles[0]?.id || '',
      fuelType: vehicles[0]?.fuelType || FuelType.PETROL_UNLEADED_95,
      date: new Date(),
      odometerReading: vehicles[0]?.currentOdometer || 0,
    },
  })

  const selectedVehicleId = watch('vehicleId')
  const liters = watch('liters')
  const pricePerLiter = watch('pricePerLiter')
  
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId)
  const availableFuelTypes = selectedVehicle 
    ? getAvailableFuelTypes(selectedVehicle.fuelType)
    : Object.values(FuelType)
  const totalAmount = liters && pricePerLiter ? liters * pricePerLiter : 0

  // Update fuel type when vehicle changes
  const handleVehicleChange = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId)
    if (vehicle) {
      setValue('vehicleId', vehicleId)
      // Get available fuel types for this vehicle and set to first one
      const available = getAvailableFuelTypes(vehicle.fuelType)
      setValue('fuelType', available[0] || vehicle.fuelType)
      // Set odometer to current vehicle odometer as default
      setValue('odometerReading', vehicle.currentOdometer)
    }
  }

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setReceiptImage(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleFormSubmit = async (data: FuelLogInput) => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await onSubmit(data, receiptImage || undefined)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {submitError && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {submitError}
        </div>
      )}
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
            <Label htmlFor="vehicleId">Vehicle</Label>
            <Select
              value={selectedVehicleId}
              onValueChange={handleVehicleChange}
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
            {errors.vehicleId && (
              <p className="text-sm text-destructive">{errors.vehicleId.message}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full h-12 touch-target justify-start text-left font-normal',
                    !watch('date') && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {watch('date') ? format(watch('date'), 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={watch('date')}
                  onSelect={(date) => setValue('date', date || new Date())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date.message}</p>
            )}
          </div>

          {/* Fuel Type */}
          <div className="space-y-2">
            <Label htmlFor="fuelType">Fuel Type</Label>
            <Select
              value={watch('fuelType')}
              onValueChange={(value) => setValue('fuelType', value as FuelType)}
            >
              <SelectTrigger className="h-12 touch-target">
                <SelectValue placeholder="Select fuel type" />
              </SelectTrigger>
              <SelectContent>
                {availableFuelTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {FUEL_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Liters and Price - Side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="liters">Liters</Label>
              <Input
                {...register('liters')}
                type="number"
                inputMode="decimal"
                step="0.001"
                placeholder="45.5"
                className="h-12 touch-target text-lg"
              />
              {errors.liters && (
                <p className="text-sm text-destructive">{errors.liters.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pricePerLiter">Price/L (R)</Label>
              <Input
                {...register('pricePerLiter')}
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="24.99"
                className="h-12 touch-target text-lg"
              />
              {errors.pricePerLiter && (
                <p className="text-sm text-destructive">{errors.pricePerLiter.message}</p>
              )}
            </div>
          </div>

          {/* Total Amount Display */}
          {totalAmount > 0 && (
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="text-2xl font-bold">{formatZAR(totalAmount)}</span>
              </div>
            </div>
          )}

          {/* Odometer */}
          <div className="space-y-2">
            <Label htmlFor="odometerReading">Odometer (km)</Label>
            <Input
              {...register('odometerReading', { valueAsNumber: true })}
              type="number"
              inputMode="numeric"
              value={watch('odometerReading') || ''}
              onChange={(e) => setValue('odometerReading', parseInt(e.target.value) || 0)}
              className="h-12 touch-target text-lg"
            />
            {errors.odometerReading && (
              <p className="text-sm text-destructive">{errors.odometerReading.message}</p>
            )}
            {selectedVehicle && (
              <p className="text-xs text-muted-foreground">
                Current: {selectedVehicle.currentOdometer.toLocaleString()} km
              </p>
            )}
          </div>

          {/* Full Tank Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <Label htmlFor="fullTank" className="text-base">Full Tank</Label>
              <p className="text-sm text-muted-foreground">
                Enable for accurate efficiency calculation
              </p>
            </div>
            <Switch
              id="fullTank"
              checked={watch('fullTank')}
              onCheckedChange={(checked) => setValue('fullTank', checked)}
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
              {...register('stationName')}
              placeholder="e.g., Shell, Engen, Sasol"
              className="h-12 touch-target"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stationLocation">Location</Label>
            <Input
              {...register('stationLocation')}
              placeholder="e.g., N1 Highway, Johannesburg"
              className="h-12 touch-target"
            />
          </div>
        </CardContent>
      </Card>

      {/* Receipt Image */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-5 w-5 text-muted-foreground" />
            Receipt Image (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {previewUrl ? (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Receipt preview"
                className="w-full max-h-48 object-contain rounded-lg bg-muted"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => {
                  setReceiptImage(null)
                  setPreviewUrl(null)
                }}
              >
                Remove
              </Button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-muted-foreground transition-colors">
              <Camera className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Tap to capture or upload</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageCapture}
                className="hidden"
              />
            </label>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        className="w-full h-14 text-lg touch-target-lg"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Saving...' : 'Save Fuel Log'}
      </Button>
    </form>
  )
}
