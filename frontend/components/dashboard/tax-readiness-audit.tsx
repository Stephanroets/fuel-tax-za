'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  CheckCircle2, 
  XCircle, 
  Camera, 
  MapPin, 
  Clock,
  Car,
  Calendar,
  ExternalLink,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { OdometerReadingType, getTaxYearReadingWindow, getSATaxYear } from '@/lib/types/database'

interface OdometerVerificationRecord {
  id: string
  vehicleId: string
  vehicleReg: string
  taxYear: number
  readingType: OdometerReadingType
  odometerValue: number
  imageUrlAvif: string
  capturedAt: string
  gpsLatitude?: number
  gpsLongitude?: number
  createdAt: string
}

interface TaxReadinessAuditProps {
  className?: string
}

/**
 * Tax Readiness Audit View
 * 
 * Displays the time-stamped opening and closing odometer photos for each tax year.
 * Provides a visual audit trail for SARS compliance.
 */
export function TaxReadinessAudit({ className }: TaxReadinessAuditProps) {
  const [selectedYear, setSelectedYear] = useState<number>(getSATaxYear())
  const [verifications, setVerifications] = useState<OdometerVerificationRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { isOpeningWindow, isClosingWindow } = getTaxYearReadingWindow()

  // Generate available tax years (last 5 years)
  const currentYear = getSATaxYear()
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i)

  useEffect(() => {
    const fetchVerifications = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/odometer-verifications?taxYear=${selectedYear}`)
        if (response.ok) {
          const data = await response.json()
          setVerifications(data)
        }
      } catch (error) {
        console.error('Failed to fetch verifications:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchVerifications()
  }, [selectedYear])

  // Group verifications by vehicle
  const vehicleVerifications = verifications.reduce((acc, v) => {
    if (!acc[v.vehicleId]) {
      acc[v.vehicleId] = {
        vehicleReg: v.vehicleReg,
        opening: undefined,
        closing: undefined
      }
    }
    if (v.readingType === OdometerReadingType.OPENING) {
      acc[v.vehicleId].opening = v
    } else {
      acc[v.vehicleId].closing = v
    }
    return acc
  }, {} as Record<string, { vehicleReg: string; opening?: OdometerVerificationRecord; closing?: OdometerVerificationRecord }>)

  const vehicles = Object.entries(vehicleVerifications)

  // Mock data for demo purposes (when no real data exists)
  const mockVehicles = [
    {
      vehicleId: 'mock-1',
      vehicleReg: 'CA 123-456',
      opening: isOpeningWindow ? undefined : {
        id: '1',
        vehicleId: 'mock-1',
        vehicleReg: 'CA 123-456',
        taxYear: selectedYear,
        readingType: OdometerReadingType.OPENING,
        odometerValue: 45230,
        imageUrlAvif: '/placeholder-odometer.jpg',
        capturedAt: new Date(selectedYear, 2, 1, 9, 30).toISOString(),
        gpsLatitude: -33.9249,
        gpsLongitude: 18.4241,
        createdAt: new Date(selectedYear, 2, 1, 9, 30).toISOString()
      },
      closing: undefined
    }
  ]

  const displayVehicles = vehicles.length > 0 ? vehicles : mockVehicles.map(v => [v.vehicleId, v] as const)

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Tax Readiness Audit
            </CardTitle>
            <CardDescription>
              Review your SARS-compliant odometer verification photos
            </CardDescription>
          </div>
          <Select
            value={selectedYear.toString()}
            onValueChange={(v) => setSelectedYear(parseInt(v))}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}/{year + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Window Status */}
        {(isOpeningWindow || isClosingWindow) && (
          <div className={cn(
            'flex items-center gap-3 p-4 rounded-lg',
            isOpeningWindow ? 'bg-blue-500/10 text-blue-600' : 'bg-orange-500/10 text-orange-600'
          )}>
            <AlertTriangle className="h-5 w-5" />
            <div>
              <p className="font-medium">
                {isOpeningWindow ? 'Opening Reading Window Active' : 'Closing Reading Window Active'}
              </p>
              <p className="text-sm opacity-80">
                {isOpeningWindow 
                  ? 'Submit your opening odometer reading for the new tax year in March.'
                  : 'Submit your closing odometer reading for the current tax year in February.'}
              </p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            {displayVehicles.map(([vehicleId, data]) => (
              <VehicleVerificationCard
                key={vehicleId}
                vehicleId={vehicleId as string}
                vehicleReg={data.vehicleReg}
                opening={data.opening}
                closing={data.closing}
                taxYear={selectedYear}
              />
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="border-t pt-4 mt-6">
          <p className="text-xs text-muted-foreground mb-2">Verification Status:</p>
          <div className="flex flex-wrap gap-4 text-xs">
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="h-3 w-3" /> Verified
            </span>
            <span className="flex items-center gap-1 text-yellow-600">
              <AlertTriangle className="h-3 w-3" /> Pending
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <XCircle className="h-3 w-3" /> Missing
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface VehicleVerificationCardProps {
  vehicleId: string
  vehicleReg: string
  opening?: OdometerVerificationRecord
  closing?: OdometerVerificationRecord
  taxYear: number
}

function VehicleVerificationCard({ 
  vehicleReg, 
  opening, 
  closing, 
  taxYear 
}: VehicleVerificationCardProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Vehicle Header */}
      <div className="bg-muted/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Car className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{vehicleReg}</span>
        </div>
        <Badge variant={opening && closing ? 'default' : 'secondary'}>
          {opening && closing ? 'Complete' : opening || closing ? 'Partial' : 'Missing'}
        </Badge>
      </div>

      {/* Readings Grid */}
      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
        <ReadingCard
          type="OPENING"
          record={opening}
          taxYear={taxYear}
        />
        <ReadingCard
          type="CLOSING"
          record={closing}
          taxYear={taxYear}
        />
      </div>
    </div>
  )
}

interface ReadingCardProps {
  type: 'OPENING' | 'CLOSING'
  record?: OdometerVerificationRecord
  taxYear: number
}

function ReadingCard({ type, record, taxYear }: ReadingCardProps) {
  const isOpening = type === 'OPENING'
  const expectedMonth = isOpening ? 'March' : 'February'
  const expectedYear = isOpening ? taxYear : taxYear + 1

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-sm font-medium',
            record ? 'text-foreground' : 'text-muted-foreground'
          )}>
            {type} Reading
          </span>
          {record ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {expectedMonth} {expectedYear}
        </span>
      </div>

      {record ? (
        <div className="space-y-3">
          {/* Photo Thumbnail */}
          <div className="aspect-video bg-muted rounded-lg overflow-hidden relative group">
            <img
              src={record.imageUrlAvif}
              alt={`${type} odometer reading`}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback for missing images in demo
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60"%3E%3Crect fill="%23374151" width="100" height="60"/%3E%3Ctext x="50" y="35" text-anchor="middle" fill="%239CA3AF" font-size="8"%3EOdometer Photo%3C/text%3E%3C/svg%3E'
              }}
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity gap-1"
              onClick={() => window.open(record.imageUrlAvif, '_blank')}
            >
              <ExternalLink className="h-3 w-3" />
              View
            </Button>
          </div>

          {/* Reading Details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Odometer:</span>
              <span className="font-mono font-medium">
                {record.odometerValue.toLocaleString()} km
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Captured:
              </span>
              <span className="text-xs">
                {new Date(record.capturedAt).toLocaleString('en-ZA')}
              </span>
            </div>
            {record.gpsLatitude && record.gpsLongitude && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Location:
                </span>
                <a
                  href={`https://maps.google.com/?q=${record.gpsLatitude},${record.gpsLongitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  View on Map
                </a>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="aspect-video bg-muted/50 rounded-lg flex flex-col items-center justify-center text-muted-foreground">
          <Camera className="h-8 w-8 mb-2 opacity-50" />
          <span className="text-sm">No reading submitted</span>
          <span className="text-xs mt-1">Expected: {expectedMonth} {expectedYear}</span>
        </div>
      )}
    </div>
  )
}
