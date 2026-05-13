'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  CheckCircle2, 
  XCircle, 
  Camera, 
  MapPin, 
  Clock,
  Car,
  Calendar,
  ExternalLink,
  AlertTriangle,
  Pencil,
  Trash2,
  Lock,
  Unlock,
  Upload,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { OdometerReadingType, getTaxYearReadingWindow, getSATaxYear } from '@/lib/types/database'
import type { EntryImage } from '@/lib/types/database'

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
  // Lock fields
  isLocked?: boolean
  lockedAt?: Date
  lockedByName?: string
  lockedReason?: string
}

interface TaxReadinessAuditProps {
  className?: string
}

/**
 * Tax Readiness Audit View
 * 
 * Displays the time-stamped opening and closing odometer photos for each tax year.
 * Provides a visual audit trail for SARS compliance with edit, delete, and lock capabilities.
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
        createdAt: new Date(selectedYear, 2, 1, 9, 30).toISOString(),
        isLocked: true,
        lockedAt: new Date(selectedYear, 3, 1),
        lockedReason: 'Tax year opening verified',
      },
      closing: undefined
    }
  ]

  const displayVehicles = vehicles.length > 0 ? vehicles : mockVehicles.map(v => [v.vehicleId, v] as const)

  const handleDeleteVerification = async (verificationId: string) => {
    try {
      await fetch(`/api/odometer-verifications/${verificationId}`, { method: 'DELETE' })
      setVerifications(verifications.filter(v => v.id !== verificationId))
    } catch (err) {
      console.error('Failed to delete verification:', err)
    }
  }

  const handleLockVerification = async (verificationId: string, reason?: string) => {
    try {
      await fetch(`/api/odometer-verifications/${verificationId}/lock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      setVerifications(verifications.map(v => 
        v.id === verificationId 
          ? { ...v, isLocked: true, lockedAt: new Date(), lockedReason: reason }
          : v
      ))
    } catch (err) {
      console.error('Failed to lock verification:', err)
    }
  }

  const handleUnlockVerification = async (verificationId: string) => {
    try {
      await fetch(`/api/odometer-verifications/${verificationId}/unlock`, { method: 'PATCH' })
      setVerifications(verifications.map(v => 
        v.id === verificationId 
          ? { ...v, isLocked: false, lockedAt: undefined, lockedReason: undefined }
          : v
      ))
    } catch (err) {
      console.error('Failed to unlock verification:', err)
    }
  }

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
                onDelete={handleDeleteVerification}
                onLock={handleLockVerification}
                onUnlock={handleUnlockVerification}
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
            <span className="flex items-center gap-1 text-amber-600">
              <Lock className="h-3 w-3" /> Locked
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
  onDelete: (id: string) => Promise<void>
  onLock: (id: string, reason?: string) => Promise<void>
  onUnlock: (id: string) => Promise<void>
}

function VehicleVerificationCard({ 
  vehicleReg, 
  opening, 
  closing, 
  taxYear,
  onDelete,
  onLock,
  onUnlock
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
          onDelete={onDelete}
          onLock={onLock}
          onUnlock={onUnlock}
        />
        <ReadingCard
          type="CLOSING"
          record={closing}
          taxYear={taxYear}
          onDelete={onDelete}
          onLock={onLock}
          onUnlock={onUnlock}
        />
      </div>
    </div>
  )
}

interface ReadingCardProps {
  type: 'OPENING' | 'CLOSING'
  record?: OdometerVerificationRecord
  taxYear: number
  onDelete: (id: string) => Promise<void>
  onLock: (id: string, reason?: string) => Promise<void>
  onUnlock: (id: string) => Promise<void>
}

function ReadingCard({ type, record, taxYear, onDelete, onLock, onUnlock }: ReadingCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showLockDialog, setShowLockDialog] = useState(false)
  const [showUnlockDialog, setShowUnlockDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [lockReason, setLockReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const isOpening = type === 'OPENING'
  const expectedMonth = isOpening ? 'March' : 'February'
  const expectedYear = isOpening ? taxYear : taxYear + 1
  const isLocked = record?.isLocked ?? false

  const handleDelete = async () => {
    if (!record) return
    setIsProcessing(true)
    try {
      await onDelete(record.id)
      setShowDeleteDialog(false)
    } catch (err) {
      console.error('Failed to delete:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleLock = async () => {
    if (!record) return
    setIsProcessing(true)
    try {
      await onLock(record.id, lockReason || undefined)
      setShowLockDialog(false)
      setLockReason('')
    } catch (err) {
      console.error('Failed to lock:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUnlock = async () => {
    if (!record) return
    setIsProcessing(true)
    try {
      await onUnlock(record.id)
      setShowUnlockDialog(false)
    } catch (err) {
      console.error('Failed to unlock:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReupload = async () => {
    if (!selectedFile || !record) return
    setIsProcessing(true)
    try {
      // API call to reupload image would go here
      console.log('[v0] Reuploading odometer image:', record.id, selectedFile.name)
      setShowEditDialog(false)
      setSelectedFile(null)
    } catch (err) {
      console.error('Failed to reupload:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="p-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
        className="hidden"
      />
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-sm font-medium',
            record ? 'text-foreground' : 'text-muted-foreground'
          )}>
            {type} Reading
          </span>
          {record ? (
            isLocked ? (
              <Lock className="h-4 w-4 text-amber-500" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )
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
            
            {/* Lock indicator on image */}
            {isLocked && (
              <div className="absolute top-2 right-2 bg-amber-500 rounded-full p-1.5">
                <Lock className="h-3 w-3 text-white" />
              </div>
            )}
            
            {/* Action buttons overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8"
                onClick={() => window.open(record.imageUrlAvif, '_blank')}
                title="View full image"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              {!isLocked && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowEditDialog(true)}
                    title="Edit / Replace photo"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8"
                onClick={() => isLocked ? setShowUnlockDialog(true) : setShowLockDialog(true)}
                title={isLocked ? 'Unlock' : 'Lock'}
              >
                {isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              </Button>
            </div>
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
            {isLocked && record.lockedReason && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Lock reason:
                </span>
                <span className="text-xs text-amber-600">{record.lockedReason}</span>
              </div>
            )}
          </div>

          {/* Action buttons below image */}
          <div className="flex items-center gap-2 pt-2 border-t">
            {!isLocked && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowEditDialog(true)}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-destructive hover:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              className={cn("flex-1", isLocked && "text-amber-600 hover:text-amber-700")}
              onClick={() => isLocked ? setShowUnlockDialog(true) : setShowLockDialog(true)}
            >
              {isLocked ? (
                <>
                  <Unlock className="h-3 w-3 mr-1" />
                  Unlock
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3 mr-1" />
                  Lock
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="aspect-video bg-muted/50 rounded-lg flex flex-col items-center justify-center text-muted-foreground">
          <Camera className="h-8 w-8 mb-2 opacity-50" />
          <span className="text-sm">No reading submitted</span>
          <span className="text-xs mt-1">Expected: {expectedMonth} {expectedYear}</span>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-3"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-3 w-3 mr-1" />
            Take Photo
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete {type} Reading
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this odometer verification? This action cannot be undone 
              and may affect your SARS compliance records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lock Dialog */}
      <Dialog open={showLockDialog} onOpenChange={setShowLockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Lock {type} Reading
            </DialogTitle>
            <DialogDescription>
              Locking this odometer verification will prevent it from being edited or deleted.
              This is recommended for SARS audit compliance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lockReason">Reason for locking (optional)</Label>
              <Input
                id="lockReason"
                placeholder="e.g., Tax year verified, Audit locked"
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLockDialog(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleLock} disabled={isProcessing}>
              {isProcessing ? 'Locking...' : 'Lock Reading'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unlock Dialog */}
      <Dialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Unlock className="h-5 w-5" />
              Unlock {type} Reading
            </DialogTitle>
            <DialogDescription>
              Unlocking this odometer verification will allow it to be edited or deleted.
              Are you sure you want to proceed?
            </DialogDescription>
          </DialogHeader>
          {record?.lockedAt && (
            <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Locked at:</span>
                <span>{new Date(record.lockedAt).toLocaleString('en-ZA')}</span>
              </div>
              {record.lockedByName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Locked by:</span>
                  <span>{record.lockedByName}</span>
                </div>
              )}
              {record.lockedReason && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reason:</span>
                  <span>{record.lockedReason}</span>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnlockDialog(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleUnlock} disabled={isProcessing}>
              {isProcessing ? 'Unlocking...' : 'Unlock Reading'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit/Reupload Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit {type} Reading
            </DialogTitle>
            <DialogDescription>
              You can replace the odometer photo with a new one.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Current image preview */}
            {record && (
              <div className="space-y-2">
                <Label>Current Photo</Label>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <img
                    src={record.imageUrlAvif}
                    alt="Current odometer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Odometer: {record.odometerValue.toLocaleString()} km
                </p>
              </div>
            )}
            
            {/* New image upload */}
            <div className="space-y-2">
              <Label>Replace with new photo</Label>
              {selectedFile ? (
                <div className="space-y-2">
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt="New odometer"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null)
                      fileInputRef.current?.click()
                    }}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Choose different photo
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-24 border-dashed"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-6 w-6 mr-2" />
                  Select new photo
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEditDialog(false)
                setSelectedFile(null)
              }} 
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button onClick={handleReupload} disabled={isProcessing || !selectedFile}>
              {isProcessing ? 'Uploading...' : 'Replace Photo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
