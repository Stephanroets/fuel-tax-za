'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { Sparkles, Camera, AlertCircle, CheckCircle2, MapPin, CalendarIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
  formatZAR 
} from '@/lib/types/database'
import { 
  processReceiptImage, 
  validateImageFile, 
  formatFileSize 
} from '@/lib/utils/image-converter'

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
  const [receiptImage, setReceiptImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressionInfo, setCompressionInfo] = useState<{
    originalSize: number
    compressedSize: number
  } | null>(null)

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
      washType: CarWashType.BUCKET,
    },
  })

  const selectedVehicleId = watch('vehicleId')
  const costZar = watch('costZar')

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageError(null)
    setCompressionInfo(null)

    const validation = validateImageFile(file)
    if (!validation.valid) {
      setImageError(validation.error || 'Invalid file')
      return
    }

    setIsCompressing(true)

    try {
      const result = await processReceiptImage(file)
      
      const compressedFile = new File(
        [result.blob], 
        file.name.replace(/\.[^.]+$/, '.avif'),
        { type: result.format }
      )

      setReceiptImage(compressedFile)
      setPreviewUrl(URL.createObjectURL(result.blob))
      setCompressionInfo({
        originalSize: result.originalSize,
        compressedSize: result.convertedSize,
      })
    } catch (error) {
      setImageError('Failed to process image. Please try again.')
      console.error('Image compression error:', error)
    } finally {
      setIsCompressing(false)
    }
  }

  const handleFormSubmit = async (data: CarWashInput) => {
    if (!receiptImage) {
      setImageError('Receipt image is required')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(data, receiptImage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Car Wash Details */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-sky-500" />
            Wash & Valet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Vehicle */}
          <div className="space-y-2">
            <Label htmlFor="vehicleId">Vehicle</Label>
            <Select
              value={selectedVehicleId}
              onValueChange={(value) => setValue('vehicleId', value)}
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

          {/* Wash Type - Large touch targets */}
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

          {/* Cost */}
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

          {/* Total Display */}
          {costZar > 0 && (
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="text-2xl font-bold">{formatZAR(costZar)}</span>
              </div>
            </div>
          )}

          {/* Location */}
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

      {/* Receipt Image - MANDATORY */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-5 w-5 text-sky-500" />
            Capture Receipt
            <span className="text-destructive text-sm font-normal">(Required)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {previewUrl ? (
            <div className="space-y-3">
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
                    setCompressionInfo(null)
                  }}
                >
                  Remove
                </Button>
              </div>
              {compressionInfo && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>
                    Compressed: {formatFileSize(compressionInfo.originalSize)} → {formatFileSize(compressionInfo.compressedSize)}
                    ({Math.round((1 - compressionInfo.compressedSize / compressionInfo.originalSize) * 100)}% saved)
                  </span>
                </div>
              )}
            </div>
          ) : (
            <label className={`
              flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors
              ${imageError ? 'border-destructive bg-destructive/5' : 'border-sky-500 hover:border-sky-500/80 hover:bg-sky-500/5'}
            `}>
              {isCompressing ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mb-2" />
                  <span className="text-sm text-muted-foreground">Compressing image...</span>
                </>
              ) : (
                <>
                  <Camera className="h-10 w-10 text-sky-500 mb-2" />
                  <span className="text-sm font-medium text-foreground">Tap to capture receipt</span>
                  <span className="text-xs text-muted-foreground mt-1">Photo will be compressed automatically</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageCapture}
                className="hidden"
                disabled={isCompressing}
              />
            </label>
          )}
          {imageError && (
            <div className="flex items-center gap-2 mt-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{imageError}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        className="w-full h-14 text-lg touch-target-lg"
        disabled={isSubmitting || !receiptImage}
      >
        {isSubmitting ? 'Saving...' : 'Save Wash & Valet'}
      </Button>
    </form>
  )
}
