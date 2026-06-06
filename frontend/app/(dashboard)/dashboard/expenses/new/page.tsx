'use client'

import { Suspense, useState, useEffect } from 'react'

// UUID generator for browsers without crypto.randomUUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ExpenseTypeSelector } from '@/components/forms/expense-type-selector'
import { FuelLogForm } from '@/components/forms/fuel-log-form'
import { MechanicServiceForm } from '@/components/forms/mechanic-service-form'
import { MaintenanceTopupForm } from '@/components/forms/maintenance-topup-form'
import { TyrePurchaseForm } from '@/components/forms/tyre-purchase-form'
import { FixedAdminForm } from '@/components/forms/fixed-admin-form'
import { CarWashForm } from '@/components/forms/car-wash-form'
import { ExpenseCategory, Vehicle } from '@/lib/types/database'
import { api } from '@/lib/api/client'

const categoryMap: Record<string, ExpenseCategory> = {
  fuel: ExpenseCategory.FUEL_LOG,
  carwash: ExpenseCategory.CAR_WASH,
  service: ExpenseCategory.MECHANIC_SERVICE,
  topup: ExpenseCategory.MAINTENANCE_TOPUP,
  tyres: ExpenseCategory.TIRES,
  fixed: ExpenseCategory.FIXED_ADMIN,
}

export default function NewExpensePage() {
  return (
    <Suspense>
      <NewExpensePageContent />
    </Suspense>
  )
}

function NewExpensePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get('category')
  
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(
    categoryParam ? categoryMap[categoryParam] || null : null
  )
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch vehicles from API
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setIsLoading(true)
        const response = await api.get('/vehicles')
        setVehicles(response.data || [])
      } catch (err) {
        console.error('Failed to fetch vehicles:', err)
        setError('Failed to load vehicles. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchVehicles()
  }, [])

  const handleFuelLogSubmit = async (data: unknown, receiptImage?: File) => {
    try {
      const expenseData = data as Record<string, unknown>
      
      // Calculate total cost from liters and price per liter
      const liters = Number(expenseData.liters) || 0
      const pricePerLiter = Number(expenseData.pricePerLiter) || 0
      const totalCost = liters * pricePerLiter
      
      // Get vehicle registration
      const vehicle = vehicles.find(v => v.id === expenseData.vehicleId)
      const vehicleReg = vehicle?.registrationNumber || 'Unknown'
      
      // Serialize date properly and add calculated fields
      const dataToSend = {
        ...expenseData,
        date: expenseData.date instanceof Date 
          ? expenseData.date.toISOString() 
          : new Date().toISOString(),
        totalCost: totalCost,
        amount: totalCost,
        description: expenseData.stationName 
          ? `Fuel at ${expenseData.stationName}` 
          : 'Fuel Purchase',
        vehicleReg: vehicleReg,
        supplierName: expenseData.stationName,
      }
      
      const formData = new FormData()
      formData.append('data', JSON.stringify(dataToSend))
      if (receiptImage) formData.append('receipt', receiptImage)
      
      const token = localStorage.getItem('jwt_token')
      const response = await fetch('/api/expenses/fuel', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to save fuel expense: ${errorText}`)
      }
      
      const newExpense = await response.json()
      
      // Store in localStorage for persistence
      const existingExpenses = JSON.parse(localStorage.getItem('expenses') || '[]')
      existingExpenses.push(newExpense)
      localStorage.setItem('expenses', JSON.stringify(existingExpenses))
      
      router.push('/dashboard/expenses')
    } catch (error) {
      console.error('Fuel expense submission error:', error)
      alert('Failed to save fuel expense. Please try again.')
    }
  }

  const handleMechanicServiceSubmit = async (data: unknown, invoiceImage: File) => {
    try {
      const expenseData = data as Record<string, unknown>
      
      // Serialize date properly
      const expenseDate = expenseData.date instanceof Date 
        ? expenseData.date.toISOString() 
        : new Date().toISOString()
      
      // Get vehicle registration
      const vehicle = vehicles.find(v => v.id === expenseData.vehicleId)
      const vehicleReg = vehicle?.registrationNumber || 'Unknown'
      
      // Prepare data for API
      const dataToSend = {
        ...expenseData,
        date: expenseDate,
        amount: (expenseData.totalCostZar as number) || 0,
        description: (expenseData.workDescription as string) || 'Mechanic Service',
        vehicleReg: vehicleReg,
        supplierName: expenseData.workshopName as string,
      }
      
      const formData = new FormData()
      formData.append('data', JSON.stringify(dataToSend))
      if (invoiceImage) formData.append('receipt', invoiceImage)
      
      const token = localStorage.getItem('jwt_token')
      const response = await fetch('/api/expenses/mechanic', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to save mechanic service: ${errorText}`)
      }
      
      const newExpense = await response.json()
      
      // Store in localStorage for persistence
      const existingExpenses = JSON.parse(localStorage.getItem('expenses') || '[]')
      existingExpenses.push(newExpense)
      localStorage.setItem('expenses', JSON.stringify(existingExpenses))
      
      router.push('/dashboard/expenses')
    } catch (error) {
      console.error('Mechanic service submission error:', error)
      alert('Failed to save service record. Please try again.')
    }
  }

  const handleMaintenanceTopupSubmit = async (data: unknown, receiptImage: File) => {
    try {
      const expenseData = data as Record<string, unknown>
      
      // Serialize date properly
      const expenseDate = expenseData.date instanceof Date 
        ? expenseData.date.toISOString() 
        : new Date().toISOString()
      
      // Get vehicle registration
      const vehicle = vehicles.find(v => v.id === expenseData.vehicleId)
      const vehicleReg = vehicle?.registrationNumber || 'Unknown'
      
      // Prepare data for API
      const dataToSend = {
        ...expenseData,
        date: expenseDate,
        amount: (expenseData.priceZar as number) || (expenseData.totalCostZar as number) || (expenseData.costZar as number) || 0,
        description: `Maintenance: ${expenseData.itemType || 'Top-up'}`,
        vehicleReg: vehicleReg,
        supplierName: expenseData.shopName as string,
      }
      
      const formData = new FormData()
      formData.append('data', JSON.stringify(dataToSend))
      if (receiptImage) formData.append('receipt', receiptImage)
      
      const token = localStorage.getItem('jwt_token')
      const response = await fetch('/api/expenses/maintenance', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to save maintenance topup: ${errorText}`)
      }
      
      const newExpense = await response.json()
      
      // Store in localStorage for persistence
      const existingExpenses = JSON.parse(localStorage.getItem('expenses') || '[]')
      existingExpenses.push(newExpense)
      localStorage.setItem('expenses', JSON.stringify(existingExpenses))
      
      router.push('/dashboard/expenses')
    } catch (error) {
      console.error('Maintenance topup submission error:', error)
      alert('Failed to save maintenance record. Please try again.')
    }
  }

  const handleTyrePurchaseSubmit = async (data: unknown, receiptImage: File) => {
    try {
      const expenseData = data as Record<string, unknown>
      
      // Serialize date properly
      const expenseDate = expenseData.date instanceof Date 
        ? expenseData.date.toISOString() 
        : new Date().toISOString()
      
      // Get vehicle registration
      const vehicle = vehicles.find(v => v.id === expenseData.vehicleId)
      const vehicleReg = vehicle?.registrationNumber || 'Unknown'
      
      // Prepare data for API
      const dataToSend = {
        ...expenseData,
        date: expenseDate,
        amount: (expenseData.priceZar as number) || 0,
        description: `${expenseData.quantity}x ${expenseData.brand} Tyres`,
        vehicleReg: vehicleReg,
        odometerReading: expenseData.odometerReading as number,
        supplierName: expenseData.supplier as string,
        enableRotationTracking: expenseData.enableRotationTracking as boolean || false,
        drivetrainType: expenseData.drivetrainType as string,
      }
      
      const formData = new FormData()
      formData.append('data', JSON.stringify(dataToSend))
      if (receiptImage) formData.append('receipt', receiptImage)
      
      const token = localStorage.getItem('jwt_token')
      const response = await fetch('/api/expenses/tyres', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to save tyre purchase: ${errorText}`)
      }
      
      const newExpense = await response.json()
      
      // Store in localStorage for persistence
      const existingExpenses = JSON.parse(localStorage.getItem('expenses') || '[]')
      existingExpenses.push(newExpense)
      localStorage.setItem('expenses', JSON.stringify(existingExpenses))
      
      router.push('/dashboard/expenses')
    } catch (error) {
      console.error('Tyre purchase submission error:', error)
      alert('Failed to save tyre purchase. Please try again.')
    }
  }

  const handleFixedAdminSubmit = async (data: unknown, receiptImage: File) => {
    try {
      const expenseData = data as Record<string, unknown>
      
      // Serialize date properly
      const expenseDate = expenseData.date instanceof Date 
        ? expenseData.date.toISOString() 
        : new Date().toISOString()
      
      // Get vehicle registration
      const vehicle = vehicles.find(v => v.id === expenseData.vehicleId)
      const vehicleReg = vehicle?.registrationNumber || 'Unknown'
      
      // Prepare data for API
      const dataToSend = {
        ...expenseData,
        date: expenseDate,
        amount: (expenseData.amountZar as number) || 0,
        description: expenseData.description as string || 'Fixed Expense',
        vehicleReg: vehicleReg,
        supplierName: expenseData.providerName as string,
        expenseType: expenseData.expenseType as string,
      }
      
      const formData = new FormData()
      formData.append('data', JSON.stringify(dataToSend))
      if (receiptImage) formData.append('receipt', receiptImage)
      
      const token = localStorage.getItem('jwt_token')
      const response = await fetch('/api/expenses/fixed', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to save fixed expense: ${errorText}`)
      }
      
      const newExpense = await response.json()
      
      // Store in localStorage for persistence
      const existingExpenses = JSON.parse(localStorage.getItem('expenses') || '[]')
      existingExpenses.push(newExpense)
      localStorage.setItem('expenses', JSON.stringify(existingExpenses))
      
      router.push('/dashboard/expenses')
    } catch (error) {
      console.error('Fixed admin submission error:', error)
      alert('Failed to save fixed expense. Please try again.')
    }
  }

  const handleCarWashSubmit = async (data: unknown, receiptImage: File) => {
    try {
      const expenseData = data as Record<string, unknown>
      
      // Serialize date properly
      const expenseDate = expenseData.date instanceof Date 
        ? expenseData.date.toISOString() 
        : new Date().toISOString()
      
      // Get vehicle registration
      const vehicle = vehicles.find(v => v.id === expenseData.vehicleId)
      const vehicleReg = vehicle?.registrationNumber || 'Unknown'
      
      // Prepare data for API
      const dataToSend = {
        ...expenseData,
        date: expenseDate,
        amount: (expenseData.costZar as number) || 0,
        description: `Car Wash: ${expenseData.washType || 'Standard'}`,
        vehicleReg: vehicleReg,
        supplierName: expenseData.washName as string,
      }
      
      const formData = new FormData()
      formData.append('data', JSON.stringify(dataToSend))
      if (receiptImage) formData.append('receipt', receiptImage)
      
      const token = localStorage.getItem('jwt_token')
      const response = await fetch('/api/expenses/carwash', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to save car wash expense: ${errorText}`)
      }
      
      const newExpense = await response.json()
      
      // Store in localStorage for persistence
      const existingExpenses = JSON.parse(localStorage.getItem('expenses') || '[]')
      existingExpenses.push(newExpense)
      localStorage.setItem('expenses', JSON.stringify(existingExpenses))
      
      router.push('/dashboard/expenses')
    } catch (error) {
      console.error('Car wash submission error:', error)
      alert('Failed to save car wash expense. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading vehicles...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  const renderForm = () => {
    switch (selectedCategory) {
      case ExpenseCategory.FUEL_LOG:
        return (
          <FuelLogForm 
            vehicles={vehicles} 
            onSubmit={handleFuelLogSubmit}
          />
        )
      case ExpenseCategory.CAR_WASH:
        return (
          <CarWashForm
            vehicles={vehicles}
            onSubmit={handleCarWashSubmit}
          />
        )
      case ExpenseCategory.MECHANIC_SERVICE:
        return (
          <MechanicServiceForm
            vehicles={vehicles}
            onSubmit={handleMechanicServiceSubmit}
          />
        )
      case ExpenseCategory.MAINTENANCE_TOPUP:
        return (
          <MaintenanceTopupForm
            vehicles={vehicles}
            onSubmit={handleMaintenanceTopupSubmit}
          />
        )
      case ExpenseCategory.TIRES:
        return (
          <TyrePurchaseForm
            vehicles={vehicles}
            onSubmit={handleTyrePurchaseSubmit}
          />
        )
      case ExpenseCategory.FIXED_ADMIN:
        return (
          <FixedAdminForm
            vehicles={vehicles}
            onSubmit={handleFixedAdminSubmit}
          />
        )
      default:
        return (
          <ExpenseTypeSelector
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
          />
        )
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-14 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-semibold">Add Expense</h1>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-xs text-primary hover:underline"
              >
                Change type
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-24">
        {renderForm()}
      </div>
    </div>
  )
}
