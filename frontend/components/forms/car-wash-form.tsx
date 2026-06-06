'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Sparkles, MapPin } from 'lucide-react'
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
  CarWashType, 
  CAR_WASH_TYPE_LABELS, 
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

const carWashSchema = z.object({
  vehicleId: z.string().min(1, 'Select a vehicle'),
  date: z.date({ required_error: 'Select a date' }),
  washType: z.nativeEnum(CarWashType),
  costZar: z.coerce.number().positive('Enter cost'),
  location: z.string().optional(),
  notes: z.string().optional(),
})

type CarWashInput = z.infer<typeof carWashSchema>

interface Vehicle {
  id: string
  registrationNumber: string
  make: string
  model: string
  fuelType: FuelType
  currentOdometer: number
}

interface CarWashFormProps {
  vehicles: Vehicle[]
  onSubmit: (data: CarWashInput, receiptImage: File) => Promise<void>
}

export function CarWashForm({ vehicles, onSubmit }: CarWashFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const receipt = useReceiptImage()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CarWashInput>({
    resolver: zodResolver(carWashSchema),
    defaultValues: {
      vehicleId: vehicles[0]?.id || '',
      date: new Date(),
      washType: CarWashType.WASH_AND_GO,
    },
  })

  const selectedVehicleId = watch('vehicleId')
  const costZar = watch('costZar')

  const handleFormSubmit = async (data: CarWashInput) => {
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
            <Sparkles className="h-5 w-5 text-sky-500" />
            Wash & Valet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <VehicleSelect
            vehicles={vehicles}
            value={selectedVehicleId}
            onValueChange={(value) => setValue('vehicleId', value)}
            error={errors.vehicleId?.message}
          />

          <DatePickerField
            value={watch('date')}
            onChange={(date) => setValue('date', date)}
            error={errors.date?.message}
          />

          <div className="space-y-2">
            <Label htmlFor="washType">Wash Type</Label>
            <Select
              value={watch('washType')}
              onValueChange={(value) => setValue('washType', value as CarWashType)}
            >
              <SelectTrigger className="h-12 touch-target">
                <SelectValue placeholder="Select wash type" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(CarWashType).map((type) => (
                  <SelectItem key={type} value={type} className="py-3">
                    {CAR_WASH_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="costZar">Cost (R)</Label>
            <Input
              {...register('costZar')}
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="150.00"
              className="h-12 touch-target text-lg font-semibold"
            />
            {errors.costZar && (
              <p className="text-sm text-destructive">{errors.costZar.message}</p>
            )}
          </div>

          <TotalAmountDisplay amount={costZar} />

          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location (Optional)
            </Label>
            <Input
              {...register('location')}
              placeholder="e.g., Engen N1 City"
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
        accentColor="sky-500"
      />

      <SubmitButton
        isSubmitting={isSubmitting}
        disabled={!receipt.image}
        label="Save Wash & Valet"
      />
    </form>
  )
}
