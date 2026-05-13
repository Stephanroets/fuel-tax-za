'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { OdometerCaptureForm } from '@/components/forms/odometer-capture-form'
import { OdometerReadingType } from '@/lib/types/database'
import { Skeleton } from '@/components/ui/skeleton'

// Mock vehicle data - replace with actual data fetching
const mockVehicles: Record<string, { reg: string; lastOdometer: number }> = {
  'vehicle-1-uuid': { reg: 'CA 123-456', lastOdometer: 45230 },
  'vehicle-2-uuid': { reg: 'CA 789-012', lastOdometer: 78450 },
}

function OdometerVerificationContent() {
  const searchParams = useSearchParams()
  const vehicleId = searchParams.get('vehicleId') || 'vehicle-1-uuid'
  const typeParam = searchParams.get('type')
  
  // Determine reading type from URL param or default to OPENING
  const readingType = typeParam === 'CLOSING' 
    ? OdometerReadingType.CLOSING 
    : OdometerReadingType.OPENING
  
  // Get vehicle info
  const vehicle = mockVehicles[vehicleId] || { reg: 'Unknown', lastOdometer: 0 }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold">Odometer Verification</h1>
          <p className="text-sm text-muted-foreground">
            SARS Tax Year Compliance
          </p>
        </div>
      </div>

      <div className="px-4 py-6">
        <OdometerCaptureForm
          vehicleId={vehicleId}
          vehicleReg={vehicle.reg}
          readingType={readingType}
          lastKnownOdometer={vehicle.lastOdometer}
        />
      </div>
    </div>
  )
}

export default function OdometerVerificationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 py-4 border-b">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="px-4 py-6 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    }>
      <OdometerVerificationContent />
    </Suspense>
  )
}
