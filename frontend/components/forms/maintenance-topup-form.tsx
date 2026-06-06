'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Droplets } from 'lucide-react'
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
import { 
  MaintenanceItemType, 
  MAINTENANCE_ITEM_LABELS, 
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

const maintenanceTopupSchema = z.object({
  vehicleId: z.string().min(1, 'Select a vehicle'),
  itemType: z.nativeEnum(MaintenanceItemType),
  date: z.date({ required_error: 'Select a date' }),
  priceZar: z.coerce.number().positive('Enter price'),
  itemBrand: z.string().optional(),
  itemQuantity: z.coerce.number().int().min(1).default(1),
  shopName: z.string().optional(),
  notes: z.string().optional(),
})

type MaintenanceTopupInput = z.infer<typeof maintenanceTopupSchema>

interface Vehicle {
  id: string
  registrationNumber: string
  make: string
  model: string
  fuelType: FuelType
  currentOdometer: number
}

interface MaintenanceTopupFormProps {
  vehicles: Vehicle[]
  onSubmit: (data: MaintenanceTopupInput, receiptImage: File) => Promise<void>
}

export function MaintenanceTopupForm({ vehicles, onSubmit }: MaintenanceTopupFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const receipt = useReceiptImage()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MaintenanceTopupInput>({
    resolver: zodResolver(maintenanceTopupSchema),
    defaultValues: {
      vehicleId: vehicles[0]?.id || '',
      itemType: MaintenanceItemType.ENGINE_OIL,
      date: new Date(),
      itemQuantity: 1,
    },
  })

  const selectedVehicleId = watch('vehicleId')
  const priceZar = watch('priceZar')

  const handleFormSubmit = async (data: MaintenanceTopupInput) => {
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
            <Droplets className="h-5 w-5 text-chart-2" />
            Maintenance Top-up (DIY)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <VehicleSelect
            vehicles={vehicles}
            value={selectedVehicleId}
            onValueChange={(value) => setValue('vehicleId', value)}
            error={errors.vehicleId?.message}
          />

          <div className="space-y-2">
            <Label htmlFor="itemType">Item Type</Label>
            <Select
              value={watch('itemType')}
              onValueChange={(value) => setValue('itemType', value as MaintenanceItemType)}
            >
              <SelectTrigger className="h-12 touch-target">
                <SelectValue placeholder="Select item type" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(MaintenanceItemType).map((type) => (
                  <SelectItem key={type} value={type} className="py-3">
                    {MAINTENANCE_ITEM_LABELS[type]}
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
            <Label htmlFor="priceZar">Price (R)</Label>
            <Input
              {...register('priceZar')}
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="150.00"
              className="h-12 touch-target text-lg font-semibold"
            />
            {errors.priceZar && (
              <p className="text-sm text-destructive">{errors.priceZar.message}</p>
            )}
          </div>

          <TotalAmountDisplay amount={priceZar} />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="itemBrand">Brand (Optional)</Label>
              <Input
                {...register('itemBrand')}
                placeholder="e.g., Castrol"
                className="h-12 touch-target"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemQuantity">Qty</Label>
              <Input
                {...register('itemQuantity')}
                type="number"
                inputMode="numeric"
                min="1"
                className="h-12 touch-target"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shopName">Shop Name (Optional)</Label>
            <Input
              {...register('shopName')}
              placeholder="e.g., AutoZone, Midas"
              className="h-12 touch-target"
            />
          </div>
        </CardContent>
      </Card>

      <ReceiptImageUpload
        previewUrl={receipt.previewUrl}
        isCompressing={receipt.isCompressing}
        compressionInfo={receipt.compressionInfo}
        error={receipt.error}
        onCapture={receipt.handleCapture}
        onRemove={receipt.remove}
        accentColor="chart-2"
      />

      <SubmitButton
        isSubmitting={isSubmitting}
        disabled={!receipt.image}
        label="Save Top-up"
      />
    </form>
  )
}
