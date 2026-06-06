'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CircleDot, RotateCcw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { 
  FuelType, 
  DrivetrainType, 
  DRIVETRAIN_TYPE_LABELS,
  ROTATION_INTERVAL_KM
} from '@/lib/types/database'
import {
  VehicleSelect,
  DatePickerField,
  TotalAmountDisplay,
  ReceiptImageUpload,
  SubmitButton,
  useReceiptImage,
} from './shared'

const tyrePurchaseSchema = z.object({
  vehicleId: z.string().min(1, 'Select a vehicle'),
  date: z.date({ required_error: 'Select a date' }),
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().optional(),
  size: z.string().optional(),
  quantity: z.coerce.number().int().min(1, 'Enter number of tyres').max(6, 'Maximum 6 tyres'),
  odometerReading: z.coerce.number().int().min(0, 'Enter odometer at installation'),
  priceZar: z.coerce.number().positive('Enter total price'),
  position: z.string().optional(),
  warrantyKm: z.coerce.number().int().min(0).optional(),
  notes: z.string().optional(),
  enableRotationTracking: z.boolean().default(false),
  drivetrainType: z.nativeEnum(DrivetrainType).optional(),
})

type TyrePurchaseInput = z.infer<typeof tyrePurchaseSchema>

interface Vehicle {
  id: string
  registrationNumber: string
  make: string
  model: string
  fuelType: FuelType
  currentOdometer: number
}

interface TyrePurchaseFormProps {
  vehicles: Vehicle[]
  onSubmit: (data: TyrePurchaseInput, receiptImage: File) => Promise<void>
}

const COMMON_TYRE_BRANDS = [
  'Bridgestone',
  'Continental',
  'Dunlop',
  'Firestone',
  'Goodyear',
  'Hankook',
  'Kumho',
  'Michelin',
  'Pirelli',
  'Sumitomo',
  'Toyo',
  'Yokohama',
  'Other'
]

const TYRE_QUANTITIES = [
  { value: '1', label: '1 Tyre' },
  { value: '2', label: '2 Tyres' },
  { value: '4', label: '4 Tyres (Full Set)' },
  { value: '5', label: '5 Tyres (+ Spare)' },
]

export function TyrePurchaseForm({ vehicles, onSubmit }: TyrePurchaseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [enableRotation, setEnableRotation] = useState(false)
  const receipt = useReceiptImage()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TyrePurchaseInput>({
    resolver: zodResolver(tyrePurchaseSchema),
    defaultValues: {
      vehicleId: vehicles[0]?.id || '',
      date: new Date(),
      quantity: 4,
      odometerReading: vehicles[0]?.currentOdometer || 0,
      enableRotationTracking: false,
    },
  })

  const selectedVehicleId = watch('vehicleId')
  const priceZar = watch('priceZar')
  const quantity = watch('quantity')
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId)

  const pricePerTyre = priceZar && quantity ? priceZar / quantity : 0

  const handleVehicleChange = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId)
    if (vehicle) {
      setValue('vehicleId', vehicleId)
      setValue('odometerReading', vehicle.currentOdometer)
    }
  }

  const handleFormSubmit = async (data: TyrePurchaseInput) => {
    if (!receipt.requireImage()) return

    setIsSubmitting(true)
    try {
      await onSubmit(data, receipt.image!)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CircleDot className="h-5 w-5 text-chart-5" />
            Tyre Purchase
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <VehicleSelect
            vehicles={vehicles}
            value={selectedVehicleId}
            onValueChange={handleVehicleChange}
            error={errors.vehicleId?.message}
          />

          <DatePickerField
            value={watch('date')}
            onChange={(date) => setValue('date', date)}
            error={errors.date?.message}
          />

          <div className="space-y-2">
            <Label htmlFor="brand">Tyre Brand</Label>
            <Select
              value={watch('brand')}
              onValueChange={(value) => setValue('brand', value)}
            >
              <SelectTrigger className="h-12 touch-target">
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_TYRE_BRANDS.map((brand) => (
                  <SelectItem key={brand} value={brand} className="py-3">
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.brand && (
              <p className="text-sm text-destructive">{errors.brand.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Number of Tyres</Label>
            <Select
              value={quantity?.toString()}
              onValueChange={(value) => setValue('quantity', parseInt(value))}
            >
              <SelectTrigger className="h-12 touch-target">
                <SelectValue placeholder="Select quantity" />
              </SelectTrigger>
              <SelectContent>
                {TYRE_QUANTITIES.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="py-3">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.quantity && (
              <p className="text-sm text-destructive">{errors.quantity.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="odometerReading">Odometer at Installation (km)</Label>
            <Input
              {...register('odometerReading')}
              type="number"
              inputMode="numeric"
              placeholder={selectedVehicle?.currentOdometer.toString() || '0'}
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

          <div className="space-y-2">
            <Label htmlFor="priceZar">Total Price (R)</Label>
            <Input
              {...register('priceZar')}
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="4500.00"
              className="h-12 touch-target text-lg font-semibold"
            />
            {errors.priceZar && (
              <p className="text-sm text-destructive">{errors.priceZar.message}</p>
            )}
          </div>

          <TotalAmountDisplay
            amount={priceZar}
            secondaryLabel="Per Tyre"
            secondaryAmount={pricePerTyre}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="model">Tyre Model (Optional)</Label>
              <Input
                {...register('model')}
                placeholder="e.g., Pilot Sport"
                className="h-12 touch-target"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="size">Size (Optional)</Label>
              <Input
                {...register('size')}
                placeholder="e.g., 225/45R17"
                className="h-12 touch-target"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="warrantyKm">Warranty (km) - Optional</Label>
            <Input
              {...register('warrantyKm')}
              type="number"
              inputMode="numeric"
              placeholder="e.g., 80000"
              className="h-12 touch-target"
            />
          </div>
        </CardContent>
      </Card>

      {/* Rotation Tracking */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-chart-5" />
            Rotation Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enableRotation" className="font-medium">
                Enable Rotation Reminders
              </Label>
              <p className="text-sm text-muted-foreground">
                Get notified when tyres need rotation
              </p>
            </div>
            <Switch
              id="enableRotation"
              checked={enableRotation}
              onCheckedChange={(checked) => {
                setEnableRotation(checked)
                setValue('enableRotationTracking', checked)
              }}
            />
          </div>

          {enableRotation && (
            <div className="space-y-2 pt-2 border-t">
              <Label htmlFor="drivetrainType">Drivetrain Type</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Rotation intervals vary by drivetrain configuration
              </p>
              <Select
                value={watch('drivetrainType')}
                onValueChange={(value) => setValue('drivetrainType', value as DrivetrainType)}
              >
                <SelectTrigger className="h-12 touch-target">
                  <SelectValue placeholder="Select drivetrain" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(DrivetrainType).map((type) => (
                    <SelectItem key={type} value={type} className="py-3">
                      <div className="flex justify-between items-center w-full">
                        <span>{DRIVETRAIN_TYPE_LABELS[type]}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          every {ROTATION_INTERVAL_KM[type].toLocaleString()} km
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {watch('drivetrainType') && (
                <div className="rounded-lg bg-muted p-3 mt-2">
                  <p className="text-sm">
                    <span className="font-medium">Reminder set:</span> Rotate tyres every{' '}
                    <span className="font-semibold text-chart-5">
                      {ROTATION_INTERVAL_KM[watch('drivetrainType')!].toLocaleString()} km
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ReceiptImageUpload
        previewUrl={receipt.previewUrl}
        isCompressing={receipt.isCompressing}
        compressionInfo={receipt.compressionInfo}
        error={receipt.error}
        onCapture={receipt.handleCapture}
        onRemove={receipt.remove}
        accentColor="chart-5"
      />

      <SubmitButton
        isSubmitting={isSubmitting}
        disabled={!receipt.image}
        label="Save Tyre Purchase"
      />
    </form>
  )
}
