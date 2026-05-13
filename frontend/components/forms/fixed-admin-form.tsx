'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { FileText, Camera, AlertCircle, CheckCircle2, CalendarIcon } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { 
  FixedExpenseType, 
  FIXED_EXPENSE_LABELS, 
  FuelType,
  formatZAR 
} from '@/lib/types/database'
import { 
  processReceiptImage, 
  validateImageFile, 
  formatFileSize 
} from '@/lib/utils/image-converter'

const fixedAdminSchema = z.object({
  vehicleId: z.string().min(1, 'Select a vehicle'),
  expenseType: z.nativeEnum(FixedExpenseType),
  date: z.date({ required_error: 'Select a date' }),
  amountZar: z.coerce.number().positive('Enter amount'),
  referenceNumber: z.string().optional(),
  providerName: z.string().optional(),
  policyNumber: z.string().optional(),
  coverageStart: z.string().optional(),
  coverageEnd: z.string().optional(),
  notes: z.string().optional(),
})

type FixedAdminInput = z.infer<typeof fixedAdminSchema>

interface Vehicle {
  id: string
  registrationNumber: string
  make: string
  model: string
  fuelType: FuelType
  currentOdometer: number
}

interface FixedAdminFormProps {
  vehicles: Vehicle[]
  onSubmit: (data: FixedAdminInput, receiptImage: File) => Promise<void>
}

// Only show the main expense types as per requirements
const MAIN_EXPENSE_TYPES: FixedExpenseType[] = [
  FixedExpenseType.INSURANCE_PREMIUM,
  FixedExpenseType.VEHICLE_TRACKING,
  FixedExpenseType.ETOLL_SANRAL,
  FixedExpenseType.LICENSE_RENEWAL,
  FixedExpenseType.ROADWORTHY,
  FixedExpenseType.OTHER,
]

export function FixedAdminForm({ vehicles, onSubmit }: FixedAdminFormProps) {
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
  } = useForm<FixedAdminInput>({
    resolver: zodResolver(fixedAdminSchema),
    defaultValues: {
      vehicleId: vehicles[0]?.id || '',
      date: new Date(),
      expenseType: FixedExpenseType.INSURANCE_PREMIUM,
    },
  })

  const selectedVehicleId = watch('vehicleId')
  const expenseType = watch('expenseType')
  const amountZar = watch('amountZar')

  // Show insurance-specific fields
  const isInsurance = expenseType === FixedExpenseType.INSURANCE_PREMIUM
  const isTracking = expenseType === FixedExpenseType.VEHICLE_TRACKING

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageError(null)
    setCompressionInfo(null)

    // Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      setImageError(validation.error || 'Invalid file')
      return
    }

    setIsCompressing(true)

    try {
      // Process and compress to AVIF
      const result = await processReceiptImage(file)
      
      // Create a new File from the blob
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

  const handleFormSubmit = async (data: FixedAdminInput) => {
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
      {/* Fixed Expense Details */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-chart-4" />
            Fixed & Admin Expense
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

          {/* Expense Type - Large touch targets */}
          <div className="space-y-2">
            <Label htmlFor="expenseType">Expense Type</Label>
            <Select
              value={expenseType}
              onValueChange={(value) => setValue('expenseType', value as FixedExpenseType)}
            >
              <SelectTrigger className="h-12 touch-target">
                <SelectValue placeholder="Select expense type" />
              </SelectTrigger>
              <SelectContent>
                {MAIN_EXPENSE_TYPES.map((type) => (
                  <SelectItem key={type} value={type} className="py-3">
                    {FIXED_EXPENSE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amountZar">Amount (R)</Label>
            <Input
              {...register('amountZar')}
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="1250.00"
              className="h-12 touch-target text-lg font-semibold"
            />
            {errors.amountZar && (
              <p className="text-sm text-destructive">{errors.amountZar.message}</p>
            )}
          </div>

          {/* Total Display */}
          {amountZar > 0 && (
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="text-2xl font-bold">{formatZAR(amountZar)}</span>
              </div>
            </div>
          )}

          {/* Reference Number */}
          <div className="space-y-2">
            <Label htmlFor="referenceNumber">Reference Number</Label>
            <Input
              {...register('referenceNumber')}
              placeholder="e.g., INV-12345, POL-67890"
              className="h-12 touch-target"
            />
          </div>

          {/* Provider Name */}
          <div className="space-y-2">
            <Label htmlFor="providerName">
              {isInsurance ? 'Insurance Company' : isTracking ? 'Tracking Provider' : 'Provider (Optional)'}
            </Label>
            <Input
              {...register('providerName')}
              placeholder={
                isInsurance 
                  ? "e.g., OUTsurance, Discovery" 
                  : isTracking 
                    ? "e.g., Tracker, Cartrack" 
                    : "Provider name"
              }
              className="h-12 touch-target"
            />
          </div>

          {/* Insurance/Tracking specific fields */}
          {(isInsurance || isTracking) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="policyNumber">
                  {isInsurance ? 'Policy Number' : 'Contract/Account Number'}
                </Label>
                <Input
                  {...register('policyNumber')}
                  placeholder={isInsurance ? "Policy number" : "Account number"}
                  className="h-12 touch-target"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="coverageStart">Coverage Start</Label>
                  <Input
                    {...register('coverageStart')}
                    type="date"
                    className="h-12 touch-target"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coverageEnd">Coverage End</Label>
                  <Input
                    {...register('coverageEnd')}
                    type="date"
                    className="h-12 touch-target"
                  />
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              {...register('notes')}
              placeholder="Any additional details..."
              className="min-h-[80px] touch-target"
            />
          </div>
        </CardContent>
      </Card>

      {/* Receipt Image - MANDATORY */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-5 w-5 text-chart-4" />
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
              ${imageError ? 'border-destructive bg-destructive/5' : 'border-chart-4 hover:border-chart-4/80 hover:bg-chart-4/5'}
            `}>
              {isCompressing ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-chart-4 mb-2" />
                  <span className="text-sm text-muted-foreground">Compressing image...</span>
                </>
              ) : (
                <>
                  <Camera className="h-10 w-10 text-chart-4 mb-2" />
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
        {isSubmitting ? 'Saving...' : 'Save Expense'}
      </Button>
    </form>
  )
}
