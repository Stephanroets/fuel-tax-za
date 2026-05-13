'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { 
  Plus, 
  Filter, 
  Search,
  Fuel,
  Wrench,
  Droplets,
  CircleDot,
  FileText,
  ChevronRight,
  Car,
  Sparkles,
  type LucideIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExpenseCategory, formatZAR, EXPENSE_CATEGORY_LABELS } from '@/lib/types/database'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Vehicle } from '@/lib/types/database'
import { api } from '@/lib/api/client'
import { cn } from '@/lib/utils'

const categoryIcons: Record<ExpenseCategory, LucideIcon> = {
  [ExpenseCategory.FUEL_LOG]: Fuel,
  [ExpenseCategory.MECHANIC_SERVICE]: Wrench,
  [ExpenseCategory.MAINTENANCE_TOPUP]: Droplets,
  [ExpenseCategory.TIRES]: CircleDot,
  [ExpenseCategory.FIXED_ADMIN]: FileText,
  [ExpenseCategory.CAR_WASH]: Sparkles,
}

// Helper to format vehicle label same as dashboard
function vehicleLabel(v: Vehicle): string {
  return v.nickname
    ? `${v.nickname} (${v.registrationNumber})`
    : `${v.year} ${v.make} ${v.model} — ${v.registrationNumber}`
}

const categoryColors: Record<ExpenseCategory, { bg: string; text: string }> = {
  [ExpenseCategory.FUEL_LOG]: { bg: 'bg-chart-1/10', text: 'text-chart-1' },
  [ExpenseCategory.MECHANIC_SERVICE]: { bg: 'bg-chart-3/10', text: 'text-chart-3' },
  [ExpenseCategory.MAINTENANCE_TOPUP]: { bg: 'bg-chart-2/10', text: 'text-chart-2' },
  [ExpenseCategory.TIRES]: { bg: 'bg-chart-5/10', text: 'text-chart-5' },
  [ExpenseCategory.FIXED_ADMIN]: { bg: 'bg-chart-4/10', text: 'text-chart-4' },
  [ExpenseCategory.CAR_WASH]: { bg: 'bg-chart-6/10', text: 'text-chart-6' },
}

export default function ExpensesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<ExpenseCategory | 'ALL'>('ALL')
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<string>('ALL')
  const [expenses, setExpenses] = useState<any[]>([])

  // Fetch expenses from backend API on mount
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const response = await api.get('/expenses')
        console.log('Expenses - Backend response:', response)
        const expenseData = response.data || response
        if (Array.isArray(expenseData)) {
          const loadedExpenses = expenseData.map((expense: any) => ({
            id: expense.id,
            category: expense.category,
            description: expense.description || 'Expense',
            amount: expense.amountZar || 0,
            vehicleReg: expense.vehicle?.registrationNumber || 'Unknown',
            date: expense.expenseDate ? new Date(expense.expenseDate) : (expense.createdAt ? new Date(expense.createdAt) : new Date()),
            supplierName: expense.supplierName,
          }))
          setExpenses(loadedExpenses)
          console.log('Loaded expenses from backend:', loadedExpenses.length)
        } else {
          console.warn('Expenses - Invalid backend data:', expenseData)
          setExpenses([])
        }
      } catch (err) {
        console.error('Expenses - Failed to fetch from backend:', err)
        setExpenses([])
      }
    }
    fetchExpenses()
  }, [])

  // Fetch vehicles for filter
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await api.get<Vehicle[]>('/vehicles')
        console.log('Expenses - Vehicles response:', response)
        const vehicleData = response.data || response
        if (Array.isArray(vehicleData)) {
          setVehicles(vehicleData)
          console.log('Expenses - Loaded vehicles:', vehicleData.length)
        } else {
          console.warn('Expenses - Invalid vehicles data:', vehicleData)
        }
      } catch (err) {
        console.error('Expenses - Failed to fetch vehicles:', err)
      }
    }
    fetchVehicles()
  }, [])

  // Filter expenses based on search, category, and vehicle
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.vehicleReg.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.supplierName?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = activeCategory === 'ALL' || expense.category === activeCategory
    const matchesVehicle = selectedVehicle === 'ALL' || expense.vehicleReg === selectedVehicle
    
    return matchesSearch && matchesCategory && matchesVehicle
  })

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-14 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Expenses</h1>
            <Button asChild>
              <Link href="/dashboard/expenses/new">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Link>
            </Button>
          </div>
          
          {/* Search and Vehicle Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-11"
              />
            </div>
            <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
              <SelectTrigger className="w-[180px] h-11">
                <span className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  <SelectValue placeholder="All Vehicles" />
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Vehicles</SelectItem>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.registrationNumber}>
                    {vehicleLabel(vehicle)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter Tabs */}
          <Tabs value={activeCategory === 'ALL' ? 'all' : activeCategory} onValueChange={(v) => setActiveCategory(v === 'all' ? 'ALL' : v as ExpenseCategory)}>
            <TabsList className="w-full h-auto p-1 grid grid-cols-3 sm:grid-cols-7">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value={ExpenseCategory.FUEL_LOG} className="text-xs">Fuel</TabsTrigger>
              <TabsTrigger value={ExpenseCategory.CAR_WASH} className="text-xs">Wash</TabsTrigger>
              <TabsTrigger value={ExpenseCategory.MECHANIC_SERVICE} className="text-xs">Service</TabsTrigger>
              <TabsTrigger value={ExpenseCategory.MAINTENANCE_TOPUP} className="text-xs">Top-ups</TabsTrigger>
              <TabsTrigger value={ExpenseCategory.TIRES} className="text-xs">Tyres</TabsTrigger>
              <TabsTrigger value={ExpenseCategory.FIXED_ADMIN} className="text-xs">Fixed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-lg font-bold">{formatZAR(totalAmount)}</p>
          </div>
        </div>
      </div>

      {/* Expense List */}
      <div className="p-4 pb-24 space-y-3">
        {filteredExpenses.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No expenses found</p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/expenses/new">Add Your First Expense</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredExpenses.map((expense) => {
            const Icon = categoryIcons[expense.category] || FileText
            const colors = categoryColors[expense.category] || { bg: 'bg-muted', text: 'text-muted-foreground' }
            
            return (
              <Link key={expense.id} href={`/dashboard/expenses/${expense.id}`}>
                <Card className="border-border/50 hover:border-border transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                        colors.bg
                      )}>
                        <Icon className={cn('h-6 w-6', colors.text)} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{expense.description}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground">
                                {expense.vehicleReg}
                              </span>
                              <span className="text-xs text-muted-foreground">&bull;</span>
                              <span className="text-xs text-muted-foreground">
                                {format(expense.date, 'd MMM yyyy')}
                              </span>
                            </div>
                            {expense.supplierName && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {expense.supplierName}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-semibold">{formatZAR(expense.amount)}</p>
                          </div>
                        </div>
                      </div>
                      
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
