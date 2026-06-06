'use client'

import { useState, useEffect } from 'react'

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
import { submitExpense } from '@/components/forms/shared'

const categoryMap: Record<string, ExpenseCategory> = {
  fuel: ExpenseCategory.FUEL_LOG,
  carwash: ExpenseCategory.CAR_WASH,
  service: ExpenseCategory.MECHANIC_SERVICE,
  topup: ExpenseCategory.MAINTENANCE_TOPUP,
  tyres: ExpenseCategory.TIRES,
  fixed: ExpenseCategory.FIXED_ADMIN,
}

export default function NewExpensePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get('category')
  
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(
    categoryParam ? categoryMap[categoryParam] || null : null
  )
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const createSubmitHandler = (
    endpoint: string,
    amountField: string | string[],
    descriptionFn: (data: Record<string, unknown>) => string,
    supplierField?: string,
    errorLabel = 'expense',
  ) => {
    return async (data: unknown, receiptImage?: File | null) => {
      try {
        await submitExpense({
          data: data as Record<string, unknown>,
          vehicles,
          receiptImage: receiptImage ?? null,
          endpoint,
          amountField,
          descriptionFn,
          supplierField,
        })
        router.push('/dashboard/expenses')
      } catch (err) {
        console.error(`${errorLabel} submission error:`, err)
        alert(`Failed to save ${errorLabel}. Please try again.`)
      }
    }
  }

  const handleFuelLogSubmit = createSubmitHandler(
    '/api/expenses/fuel',
    'totalCost',
    (d) => d.stationName ? `Fuel at ${d.stationName}` : 'Fuel Purchase',
    'stationName',
    'fuel expense',
  )

  const handleFuelSubmitWrapper = async (data: unknown, receiptImage?: File) => {
    const expenseData = data as Record<string, unknown>
    const liters = Number(expenseData.liters) || 0
    const pricePerLiter = Number(expenseData.pricePerLiter) || 0
    const totalCost = liters * pricePerLiter
    await handleFuelLogSubmit({ ...expenseData, totalCost }, receiptImage)
  }

  const handleMechanicServiceSubmit = createSubmitHandler(
    '/api/expenses/mechanic',
    'totalCostZar',
    (d) => (d.workDescription as string) || 'Mechanic Service',
    'workshopName',
    'service record',
  )

  const handleMaintenanceTopupSubmit = createSubmitHandler(
    '/api/expenses/maintenance',
    ['priceZar', 'totalCostZar', 'costZar'],
    (d) => `Maintenance: ${d.itemType || 'Top-up'}`,
    'shopName',
    'maintenance record',
  )

  const handleTyrePurchaseSubmit = createSubmitHandler(
    '/api/expenses/tyres',
    'priceZar',
    (d) => `${d.quantity}x ${d.brand} Tyres`,
    'supplier',
    'tyre purchase',
  )

  const handleFixedAdminSubmit = createSubmitHandler(
    '/api/expenses/fixed',
    'amountZar',
    (d) => (d.description as string) || 'Fixed Expense',
    'providerName',
    'fixed expense',
  )

  const handleCarWashSubmit = createSubmitHandler(
    '/api/expenses/carwash',
    'costZar',
    (d) => `Car Wash: ${d.washType || 'Standard'}`,
    'washName',
    'car wash expense',
  )

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
            onSubmit={handleFuelSubmitWrapper}
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
