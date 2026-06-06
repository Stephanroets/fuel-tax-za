'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Wrench } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { 
  ServiceType, 
  SERVICE_TYPE_LABELS, 
  FuelType,
} from '@/lib/types/database'
import {
  VehicleSelect,
  DatePickerField,
  TotalAmountDisplay,
  ReceiptImageUpload,
  SubmitButton,
  useReceiptImage,
} from './shared'

const mechanicServiceSchema = z.object({
  vehicleId: z.string().min(1, 'Select a vehicle'),
  serviceType: z.nativeEnum(ServiceType),
  date: z.date({ required_error: 'Select a date' }),
  workshopName: z.string().min(1, 'Workshop name is required'),
  odometerReading: z.coerce.number().int().min(0, 'Enter odometer reading'),
  totalCostZar: z.coerce.number().positive('Enter total cost'),
  laborCostZar: z.coerce.number().min(0).optional(),
  partsCostZar: z.coerce.number().min(0).optional(),
  workDescription: z.string().optional(),
  invoiceNumber: z.string().optional(),
  glassProvider: z.string().optional(),
  excessAmountZar: z.coerce.number().min(0).optional(),
})

type MechanicServiceInput = z.infer<typeof mechanicServiceSchema>

interface Vehicle {
  id: string
  registrationNumber: string
  make: string
  model: string
  fuelType: FuelType
  currentOdometer: number
}

interface MechanicServiceFormProps {
  vehicles: Vehicle[]
  onSubmit: (data: MechanicServiceInput, invoiceImage: File) => Promise<void>
}

export function MechanicServiceForm({ vehicles, onSubmit }: MechanicServiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const receipt = useReceiptImage()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MechanicServiceInput>({
    resolver: zodResolver(mechanicServiceSchema),
    defaultValues: {
      vehicleId: vehicles[0]?.id || '',
      serviceType: ServiceType.MAJOR_SERVICE,
      date: new Date(),
      odometerReading: vehicles[0]?.currentOdometer || 0,
    },
  })

  const selectedVehicleId = watch('vehicleId')
  const totalCost = watch('totalCostZar')
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId)

  const handleVehicleChange = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId)
    if (vehicle) {
      setValue('vehicleId', vehicleId)
      setValue('odometerReading', vehicle.currentOdometer)
    }
  }

  const handleFormSubmit = async (data: MechanicServiceInput) => {
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
            <Wrench className="h-5 w-5 text-chart-3" />
            Mechanic Service
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <VehicleSelect
            vehicles={vehicles}
            value={selectedVehicleId}
            onValueChange={handleVehicleChange}
            error={errors.vehicleId?.message}
          />

          <div className="space-y-2">
            <Label htmlFor="serviceType">Service Type</Label>
            <Select
              value={watch('serviceType')}
              onValueChange={(value) => setValue('serviceType', value as ServiceType)}
            >
              <SelectTrigger className="h-12 touch-target">
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ServiceType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {SERVICE_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DatePickerField
            value={watch('date')}
            onChange={(date) => setValue('date', date)}
            error={errors.date?.message}
          />

          <div className="space-y-2">
            <Label htmlFor="workshopName">Workshop Name</Label>
            <Input
              {...register('workshopName')}
              placeholder="e.g., ABC Auto Services"
              className="h-12 touch-target text-lg"
            />
            {errors.workshopName && (
              <p className="text-sm text-destructive">{errors.workshopName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="odometerReading">Odometer (km)</Label>
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
            <Label htmlFor="totalCostZar">Total Cost (R)</Label>
            <Input
              {...register('totalCostZar')}
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="2500.00"
              className="h-12 touch-target text-lg font-semibold"
            />
            {errors.totalCostZar && (
              <p className="text-sm text-destructive">{errors.totalCostZar.message}</p>
            )}
          </div>

          <TotalAmountDisplay amount={totalCost} />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="laborCostZar">Labour (R) - Optional</Label>
              <Input
                {...register('laborCostZar')}
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="0.00"
                className="h-12 touch-target"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partsCostZar">Parts (R) - Optional</Label>
              <Input
                {...register('partsCostZar')}
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="0.00"
                className="h-12 touch-target"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workDescription">Work Description (Optional)</Label>
            <Textarea
              {...register('workDescription')}
              placeholder="Describe the work performed..."
              className="min-h-[100px] touch-target"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoiceNumber">Invoice Number (Optional)</Label>
            <Input
              {...register('invoiceNumber')}
              placeholder="INV-12345"
              className="h-12 touch-target"
            />
          </div>

          {watch('serviceType') === ServiceType.WINDSCREEN_GLASS && (
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium text-sm text-muted-foreground">Windscreen & Glass Details</h4>
              <div className="space-y-2">
                <Label htmlFor="glassProvider">Glass Provider</Label>
                <Input
                  {...register('glassProvider')}
                  placeholder="e.g., PG Glass, Autoglass"
                  className="h-12 touch-target"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="excessAmountZar">Insurance Excess (R)</Label>
                <Input
                  {...register('excessAmountZar')}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  placeholder="0.00"
                  className="h-12 touch-target"
                />
                <p className="text-xs text-muted-foreground">
                  Amount paid as excess if claimed through insurance
                </p>
              </div>
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
        title="Capture Invoice"
        altText="Invoice preview"
        accentColor="chart-3"
      />

      <SubmitButton
        isSubmitting={isSubmitting}
        disabled={!receipt.image}
        label="Save Service Record"
      />
    </form>
  )
}
