'use client'

import { useState, useEffect, useCallback } from 'react'
import type { 
  ExpiryAlert, 
  ExpiryAlertCounts, 
  ExpiryItemType, 
  ExpiryStatus 
} from '@/lib/types/database'

// Storage key for persisted expiry alerts
const EXPIRY_ALERTS_STORAGE_KEY = 'fuel-tax-za-expiry-alerts'
const EXPIRY_DISMISSALS_STORAGE_KEY = 'fuel-tax-za-expiry-dismissals'

// Mock data generator for demo - in production this comes from the database
function generateMockExpiryAlerts(): ExpiryAlert[] {
  const today = new Date()
  
  const alerts: ExpiryAlert[] = [
    // Vehicle License - Expired
    {
      itemType: 'VEHICLE_LICENSE',
      itemId: 'vl-1',
      itemName: 'Vehicle License',
      itemDescription: 'License disc for CF 12345 GP',
      vehicleId: 'v-1',
      vehicleRegistration: 'CF 12345 GP',
      vehicleName: 'Toyota Hilux 2.8 GD-6',
      expiryDate: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      daysUntilExpiry: -15,
      expiryStatus: 'EXPIRED',
      renewalUrl: 'https://online.natis.gov.za/',
      isDismissed: false,
    },
    // Driver's License - Critical (5 days)
    {
      itemType: 'DRIVERS_LICENSE',
      itemId: 'dl-1',
      itemName: "Driver's License",
      itemDescription: "Driver's license for John Smith",
      userId: 'u-1',
      userName: 'John Smith',
      expiryDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days
      daysUntilExpiry: 5,
      expiryStatus: 'CRITICAL',
      renewalUrl: 'https://online.natis.gov.za/',
      isDismissed: false,
    },
    // Insurance - Warning (21 days)
    {
      itemType: 'INSURANCE',
      itemId: 'ins-1',
      relatedId: 'exp-1',
      itemName: 'Insurance - Outsurance',
      itemDescription: 'Policy OP-12345678 coverage ending',
      vehicleId: 'v-1',
      vehicleRegistration: 'CF 12345 GP',
      vehicleName: 'Toyota Hilux 2.8 GD-6',
      expiryDate: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000), // 21 days
      daysUntilExpiry: 21,
      expiryStatus: 'WARNING',
      isDismissed: false,
    },
    // Tracking Contract - Upcoming (45 days)
    {
      itemType: 'TRACKING_CONTRACT',
      itemId: 'tc-1',
      relatedId: 'exp-2',
      itemName: 'Tracking - Tracker SA',
      itemDescription: 'Contract ending for tracker',
      vehicleId: 'v-2',
      vehicleRegistration: 'DK 54321 GP',
      vehicleName: 'Ford Ranger 3.2',
      expiryDate: new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000), // 45 days
      daysUntilExpiry: 45,
      expiryStatus: 'UPCOMING',
      isDismissed: false,
    },
    // Roadworthy - Warning (14 days)
    {
      itemType: 'ROADWORTHY',
      itemId: 'rw-1',
      relatedId: 'exp-3',
      itemName: 'Roadworthy Certificate',
      itemDescription: 'Certificate #RW-2024-001 from DEKRA',
      vehicleId: 'v-1',
      vehicleRegistration: 'CF 12345 GP',
      vehicleName: 'Toyota Hilux 2.8 GD-6',
      expiryDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days
      daysUntilExpiry: 14,
      expiryStatus: 'WARNING',
      isDismissed: false,
    },
    // PDP - Critical (3 days)
    {
      itemType: 'PDP',
      itemId: 'pdp-1',
      itemName: 'PDP Renewal',
      itemDescription: 'Professional Driving Permit expiring',
      userId: 'u-2',
      userName: 'David Nkosi',
      expiryDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days
      daysUntilExpiry: 3,
      expiryStatus: 'CRITICAL',
      renewalUrl: 'https://online.natis.gov.za/',
      isDismissed: false,
    },
  ]
  
  return alerts
}

// Load dismissals from localStorage
function loadDismissals(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const stored = localStorage.getItem(EXPIRY_DISMISSALS_STORAGE_KEY)
    if (stored) {
      return new Set(JSON.parse(stored))
    }
  } catch (e) {
    console.error('Error loading expiry dismissals:', e)
  }
  return new Set()
}

// Save dismissals to localStorage
function saveDismissals(dismissals: Set<string>): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(EXPIRY_DISMISSALS_STORAGE_KEY, JSON.stringify([...dismissals]))
  } catch (e) {
    console.error('Error saving expiry dismissals:', e)
  }
}

// Calculate expiry status based on days until expiry
function calculateExpiryStatus(daysUntilExpiry: number): ExpiryStatus {
  if (daysUntilExpiry < 0) return 'EXPIRED'
  if (daysUntilExpiry <= 7) return 'CRITICAL'
  if (daysUntilExpiry <= 30) return 'WARNING'
  if (daysUntilExpiry <= 60) return 'UPCOMING'
  return 'VALID'
}

// Recalculate days until expiry
function recalculateAlert(alert: ExpiryAlert): ExpiryAlert {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiryDate = new Date(alert.expiryDate)
  expiryDate.setHours(0, 0, 0, 0)
  const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
  
  return {
    ...alert,
    daysUntilExpiry,
    expiryStatus: calculateExpiryStatus(daysUntilExpiry)
  }
}

export interface UseExpiryAlertsResult {
  alerts: ExpiryAlert[]
  activeAlerts: ExpiryAlert[]
  counts: ExpiryAlertCounts
  isLoading: boolean
  error: string | null
  dismissAlert: (itemType: ExpiryItemType, itemId: string) => void
  undismissAlert: (itemType: ExpiryItemType, itemId: string) => void
  refreshAlerts: () => void
  getAlertsByType: (itemType: ExpiryItemType) => ExpiryAlert[]
  getAlertsByVehicle: (vehicleId: string) => ExpiryAlert[]
  getAlertsByStatus: (status: ExpiryStatus) => ExpiryAlert[]
}

export function useExpiryAlerts(): UseExpiryAlertsResult {
  const [alerts, setAlerts] = useState<ExpiryAlert[]>([])
  const [dismissals, setDismissals] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load alerts on mount
  useEffect(() => {
    loadAlerts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load dismissals on mount
  useEffect(() => {
    setDismissals(loadDismissals())
  }, [])

  const loadAlerts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // In production, this would fetch from the API
      // For now, use mock data
      const mockAlerts = generateMockExpiryAlerts()
      
      // Recalculate days until expiry for each alert
      const recalculatedAlerts = mockAlerts.map(recalculateAlert)
      
      // Sort by urgency (expired first, then critical, etc.)
      recalculatedAlerts.sort((a, b) => {
        const statusOrder: Record<ExpiryStatus, number> = {
          'EXPIRED': 0,
          'CRITICAL': 1,
          'WARNING': 2,
          'UPCOMING': 3,
          'VALID': 4
        }
        const statusDiff = statusOrder[a.expiryStatus] - statusOrder[b.expiryStatus]
        if (statusDiff !== 0) return statusDiff
        return a.daysUntilExpiry - b.daysUntilExpiry
      })
      
      setAlerts(recalculatedAlerts)
    } catch (e) {
      console.error('Error loading expiry alerts:', e)
      setError('Failed to load expiry alerts')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Generate dismissal key
  const getDismissalKey = (itemType: ExpiryItemType, itemId: string): string => {
    return `${itemType}:${itemId}`
  }

  // Dismiss an alert
  const dismissAlert = useCallback((itemType: ExpiryItemType, itemId: string) => {
    const key = getDismissalKey(itemType, itemId)
    setDismissals(prev => {
      const next = new Set(prev)
      next.add(key)
      saveDismissals(next)
      return next
    })
  }, [])

  // Undismiss an alert
  const undismissAlert = useCallback((itemType: ExpiryItemType, itemId: string) => {
    const key = getDismissalKey(itemType, itemId)
    setDismissals(prev => {
      const next = new Set(prev)
      next.delete(key)
      saveDismissals(next)
      return next
    })
  }, [])

  // Apply dismissals to alerts
  const alertsWithDismissals = alerts.map(alert => ({
    ...alert,
    isDismissed: dismissals.has(getDismissalKey(alert.itemType, alert.itemId))
  }))

  // Active (non-dismissed) alerts
  const activeAlerts = alertsWithDismissals.filter(a => !a.isDismissed)

  // Calculate counts
  const counts: ExpiryAlertCounts = {
    totalAlerts: activeAlerts.length,
    expiredCount: activeAlerts.filter(a => a.expiryStatus === 'EXPIRED').length,
    criticalCount: activeAlerts.filter(a => a.expiryStatus === 'CRITICAL').length,
    warningCount: activeAlerts.filter(a => a.expiryStatus === 'WARNING').length,
    upcomingCount: activeAlerts.filter(a => a.expiryStatus === 'UPCOMING').length,
  }

  // Get alerts by type
  const getAlertsByType = useCallback((itemType: ExpiryItemType): ExpiryAlert[] => {
    return alertsWithDismissals.filter(a => a.itemType === itemType)
  }, [alertsWithDismissals])

  // Get alerts by vehicle
  const getAlertsByVehicle = useCallback((vehicleId: string): ExpiryAlert[] => {
    return alertsWithDismissals.filter(a => a.vehicleId === vehicleId)
  }, [alertsWithDismissals])

  // Get alerts by status
  const getAlertsByStatus = useCallback((status: ExpiryStatus): ExpiryAlert[] => {
    return alertsWithDismissals.filter(a => a.expiryStatus === status)
  }, [alertsWithDismissals])

  return {
    alerts: alertsWithDismissals,
    activeAlerts,
    counts,
    isLoading,
    error,
    dismissAlert,
    undismissAlert,
    refreshAlerts: loadAlerts,
    getAlertsByType,
    getAlertsByVehicle,
    getAlertsByStatus,
  }
}

// Helper to add a custom expiry alert (for testing/demo)
export function addCustomExpiryAlert(alert: Omit<ExpiryAlert, 'daysUntilExpiry' | 'expiryStatus' | 'isDismissed'>): void {
  // This would call the API in production
  console.log('Adding custom expiry alert:', alert)
}
