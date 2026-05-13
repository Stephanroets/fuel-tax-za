'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  TyreRotationWarning, 
  TyreRotationStatus,
  DrivetrainType,
  ROTATION_INTERVAL_KM
} from '@/lib/types/database'

// Mock data for development - in production, this would come from the API
const getMockWarnings = (): TyreRotationWarning[] => {
  // Check localStorage for tyre purchases with rotation tracking enabled
  try {
    const tyreData = localStorage.getItem('tyre_rotation_tracking')
    if (tyreData) {
      const trackingRecords = JSON.parse(tyreData) as TyreRotationWarning[]
      return trackingRecords.filter(r => r.isActive && !r.isDismissed)
    }
  } catch {
    // Ignore errors
  }
  return []
}

// Get latest fuel odometer reading for a vehicle
const getLatestFuelOdometer = (vehicleId: string): number | null => {
  try {
    const fuelLogs = localStorage.getItem('fuel_logs')
    if (fuelLogs) {
      const logs = JSON.parse(fuelLogs) as Array<{ vehicleId: string; odometerReading: number; date: string }>
      const vehicleLogs = logs
        .filter(log => log.vehicleId === vehicleId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      
      if (vehicleLogs.length > 0) {
        return vehicleLogs[0].odometerReading
      }
    }
  } catch {
    // Ignore errors
  }
  return null
}

// Calculate rotation status based on current vs target odometer
const calculateRotationStatus = (
  currentOdometer: number,
  nextRotationOdometer: number
): TyreRotationStatus => {
  const diff = currentOdometer - nextRotationOdometer
  
  if (diff >= 1000) return 'CRITICAL'
  if (diff >= 0) return 'WARNING'
  if (diff >= -500) return 'UPCOMING'
  return 'OK'
}

export interface UseTyreRotationWarningsResult {
  warnings: TyreRotationWarning[]
  warningCount: number
  criticalCount: number
  isLoading: boolean
  error: Error | null
  refetch: () => void
  dismissWarning: (trackingId: string) => Promise<void>
  recordRotation: (trackingId: string, rotationOdometer: number) => Promise<void>
}

export function useTyreRotationWarnings(): UseTyreRotationWarningsResult {
  const [warnings, setWarnings] = useState<TyreRotationWarning[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchWarnings = useCallback(() => {
    setIsLoading(true)
    setError(null)
    
    try {
      // In production, this would be an API call
      // For now, we check localStorage and calculate warnings
      const tyreTracking = getMockWarnings()
      
      // Update each warning with latest fuel odometer data
      const updatedWarnings = tyreTracking.map(warning => {
        const latestFuelOdometer = getLatestFuelOdometer(warning.vehicleId)
        const currentOdometer = latestFuelOdometer || warning.currentVehicleOdometer
        const kmOverdue = Math.max(0, currentOdometer - warning.nextRotationOdometer)
        const rotationStatus = calculateRotationStatus(currentOdometer, warning.nextRotationOdometer)
        
        return {
          ...warning,
          latestFuelOdometer: latestFuelOdometer || undefined,
          currentVehicleOdometer: currentOdometer,
          kmOverdue,
          rotationStatus
        }
      })
      
      // Only return warnings that are UPCOMING, WARNING, or CRITICAL
      const activeWarnings = updatedWarnings.filter(
        w => ['UPCOMING', 'WARNING', 'CRITICAL'].includes(w.rotationStatus)
      )
      
      setWarnings(activeWarnings)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch tyre rotation warnings'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const dismissWarning = useCallback(async (trackingId: string) => {
    try {
      // Update localStorage
      const tyreData = localStorage.getItem('tyre_rotation_tracking')
      if (tyreData) {
        const trackingRecords = JSON.parse(tyreData) as TyreRotationWarning[]
        const updated = trackingRecords.map(r => 
          r.trackingId === trackingId 
            ? { ...r, isDismissed: true, dismissedAt: new Date() }
            : r
        )
        localStorage.setItem('tyre_rotation_tracking', JSON.stringify(updated))
      }
      
      // Remove from current warnings
      setWarnings(prev => prev.filter(w => w.trackingId !== trackingId))
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to dismiss warning')
    }
  }, [])

  const recordRotation = useCallback(async (trackingId: string, rotationOdometer: number) => {
    try {
      // Update localStorage
      const tyreData = localStorage.getItem('tyre_rotation_tracking')
      if (tyreData) {
        const trackingRecords = JSON.parse(tyreData) as TyreRotationWarning[]
        const updated = trackingRecords.map(r => {
          if (r.trackingId === trackingId) {
            return {
              ...r,
              lastRotationOdometer: rotationOdometer,
              lastRotationDate: new Date(),
              rotationCount: r.rotationCount + 1,
              nextRotationOdometer: rotationOdometer + r.rotationIntervalKm,
              isDismissed: false,
              dismissedAt: undefined
            }
          }
          return r
        })
        localStorage.setItem('tyre_rotation_tracking', JSON.stringify(updated))
      }
      
      // Refetch to update the list
      fetchWarnings()
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to record rotation')
    }
  }, [fetchWarnings])

  // Initial fetch
  useEffect(() => {
    fetchWarnings()
  }, [fetchWarnings])

  // Listen for fuel log updates to recalculate warnings
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'fuel_logs' || e.key === 'tyre_rotation_tracking') {
        fetchWarnings()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [fetchWarnings])

  const warningCount = warnings.filter(w => w.rotationStatus === 'WARNING' || w.rotationStatus === 'CRITICAL').length
  const criticalCount = warnings.filter(w => w.rotationStatus === 'CRITICAL').length

  return {
    warnings,
    warningCount,
    criticalCount,
    isLoading,
    error,
    refetch: fetchWarnings,
    dismissWarning,
    recordRotation
  }
}

// Helper to add tyre rotation tracking when a tyre purchase is made
export function addTyreRotationTracking(data: {
  vehicleId: string
  vehicleRegistration: string
  vehicleName: string
  tyreExpenseId: string
  tyreBrand: string
  tyreModel?: string
  tyreSize?: string
  installationDate: Date
  installationOdometer: number
  drivetrainType: DrivetrainType
  organizationId?: string
}): TyreRotationWarning {
  const rotationIntervalKm = ROTATION_INTERVAL_KM[data.drivetrainType]
  
  const newTracking: TyreRotationWarning = {
    trackingId: `trt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    organizationId: data.organizationId || 'default',
    vehicleId: data.vehicleId,
    vehicleRegistration: data.vehicleRegistration,
    vehicleName: data.vehicleName,
    tyreBrand: data.tyreBrand,
    tyreModel: data.tyreModel,
    tyreSize: data.tyreSize,
    installationDate: data.installationDate,
    drivetrainType: data.drivetrainType,
    rotationIntervalKm,
    installationOdometer: data.installationOdometer,
    lastRotationOdometer: undefined,
    lastRotationDate: undefined,
    rotationCount: 0,
    nextRotationOdometer: data.installationOdometer + rotationIntervalKm,
    currentVehicleOdometer: data.installationOdometer,
    kmOverdue: 0,
    rotationStatus: 'OK',
    isActive: true,
    isDismissed: false
  }
  
  // Save to localStorage
  try {
    const existing = localStorage.getItem('tyre_rotation_tracking')
    const trackingRecords: TyreRotationWarning[] = existing ? JSON.parse(existing) : []
    
    // Deactivate any existing tracking for this vehicle (new tyres replace old)
    const updated = trackingRecords.map(r => 
      r.vehicleId === data.vehicleId ? { ...r, isActive: false } : r
    )
    
    updated.push(newTracking)
    localStorage.setItem('tyre_rotation_tracking', JSON.stringify(updated))
    
    // Trigger storage event for other components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'tyre_rotation_tracking',
      newValue: JSON.stringify(updated)
    }))
  } catch {
    // Ignore errors
  }
  
  return newTracking
}

// Helper to save fuel log with odometer (triggers recalculation)
export function saveFuelLogOdometer(vehicleId: string, odometerReading: number, date: Date = new Date()) {
  try {
    const existing = localStorage.getItem('fuel_logs')
    const logs: Array<{ vehicleId: string; odometerReading: number; date: string }> = existing ? JSON.parse(existing) : []
    
    logs.push({
      vehicleId,
      odometerReading,
      date: date.toISOString()
    })
    
    localStorage.setItem('fuel_logs', JSON.stringify(logs))
    
    // Trigger storage event for other components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'fuel_logs',
      newValue: JSON.stringify(logs)
    }))
  } catch {
    // Ignore errors
  }
}
