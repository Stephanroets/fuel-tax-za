'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FileText } from 'lucide-react'
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
} from '@/lib/types/database'
import {
  VehicleSelect,
  DatePickerField,
  TotalAmountDisplay,
  ReceiptImageUpload,
  SubmitButton,
  useReceiptImage,
} from './shared'

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
  const receipt = useReceiptImage()

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

  const isInsurance = expenseType === FixedExpenseType.INSURANCE_PREMIUM
  const isTracking = expenseType === FixedExpenseType.VEHICLE_TRACKING

  const handleFormSubmit = async (data: FixedAdminInput) => {
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
            <FileText className="h-5 w-5 text-chart-4" />
            Fixed & Admin Expense
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

          <TotalAmountDisplay amount={amountZar} />

          <div className="space-y-2">
            <Label htmlFor="referenceNumber">Reference Number</Label>
            <Input
              {...register('referenceNumber')}
              placeholder="e.g., INV-12345, POL-67890"
              className="h-12 touch-target"
            />
          </div>

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

      <ReceiptImageUpload
        previewUrl={receipt.previewUrl}
        isCompressing={receipt.isCompressing}
        compressionInfo={receipt.compressionInfo}
        error={receipt.error}
        onCapture={receipt.handleCapture}
        onRemove={receipt.remove}
        accentColor="chart-4"
      />

      <SubmitButton
        isSubmitting={isSubmitting}
        disabled={!receipt.image}
        label="Save Expense"
      />
    </form>
  )
}
