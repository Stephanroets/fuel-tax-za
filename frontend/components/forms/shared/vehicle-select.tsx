'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
interface VehicleOption {
  id: string
  registrationNumber: string
  make: string
  model: string
}

interface VehicleSelectProps {
  vehicles: VehicleOption[]
  value: string
  onValueChange: (vehicleId: string) => void
  error?: string
}

export function VehicleSelect({ vehicles, value, onValueChange, error }: VehicleSelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="vehicleId">Vehicle</Label>
      <Select value={value} onValueChange={onValueChange}>
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
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
