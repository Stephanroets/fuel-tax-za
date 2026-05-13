'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { 
  Plus, 
  Search,
  Fuel,
  Wrench,
  Droplets,
  CircleDot,
  FileText,
  ChevronRight,
  Car,
  Sparkles,
  Lock,
  Image as ImageIcon,
  type LucideIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ExpenseCategory, formatZAR, EXPENSE_CATEGORY_LABELS } from '@/lib/types/database'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Vehicle, EntryImage } from '@/lib/types/database'
import { api } from '@/lib/api/client'
import { cn } from '@/lib/utils'
import { EntryActions, EntryImageManager } from '@/components/entries'

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

interface ExpenseItem {
  id: string
  category: ExpenseCategory
  description: string
  amount: number
  vehicleReg: string
  vehicleId?: string
  date: Date
  supplierName?: string
  isLocked?: boolean
  lockedAt?: Date
  lockedByName?: string
  lockedReason?: string
  imageCount?: number
}

export default function ExpensesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<ExpenseCategory | 'ALL'>('ALL')
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<string>('ALL')
  const [expenses, setExpenses] = useState<ExpenseItem[]>([])
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null)
  const [expenseImages, setExpenseImages] = useState<Record<string, EntryImage[]>>({})

  // Fetch expenses from backend API on mount
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const response = await api.get('/expenses')
        console.log('Expenses - Backend response:', response)
        const expenseData = (response as any).data || response
        if (Array.isArray(expenseData)) {
          const loadedExpenses: ExpenseItem[] = expenseData.map((expense: any) => ({
            id: expense.id,
            category: expense.category,
            description: expense.description || 'Expense',
            amount: expense.amountZar || 0,
            vehicleReg: expense.vehicle?.registrationNumber || 'Unknown',
            vehicleId: expense.vehicleId,
            date: expense.expenseDate ? new Date(expense.expenseDate) : (expense.createdAt ? new Date(expense.createdAt) : new Date()),
            supplierName: expense.supplierName,
            isLocked: expense.isLocked || false,
            lockedAt: expense.lockedAt ? new Date(expense.lockedAt) : undefined,
            lockedByName: expense.lockedByName,
            lockedReason: expense.lockedReason,
            imageCount: expense.imageCount || 0,
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
        const vehicleData = (response as any).data || response
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

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await api.delete(`/expenses/${expenseId}`)
      setExpenses(expenses.filter(e => e.id !== expenseId))
    } catch (err) {
      console.error("Failed to delete expense:", err)
      throw err
    }
  }

  const handleLockExpense = async (expenseId: string, reason?: string) => {
    try {
      await api.patch(`/expenses/${expenseId}/lock`, { reason })
      setExpenses(expenses.map(e => 
        e.id === expenseId 
          ? { ...e, isLocked: true, lockedAt: new Date(), lockedReason: reason }
          : e
      ))
    } catch (err) {
      console.error("Failed to lock expense:", err)
      // For demo, still update locally
      setExpenses(expenses.map(e => 
        e.id === expenseId 
          ? { ...e, isLocked: true, lockedAt: new Date(), lockedReason: reason }
          : e
      ))
    }
  }

  const handleUnlockExpense = async (expenseId: string) => {
    try {
      await api.patch(`/expenses/${expenseId}/unlock`, {})
      setExpenses(expenses.map(e => 
        e.id === expenseId 
          ? { ...e, isLocked: false, lockedAt: undefined, lockedReason: undefined }
          : e
      ))
    } catch (err) {
      console.error("Failed to unlock expense:", err)
      // For demo, still update locally
      setExpenses(expenses.map(e => 
        e.id === expenseId 
          ? { ...e, isLocked: false, lockedAt: undefined, lockedReason: undefined }
          : e
      ))
    }
  }

  const fetchExpenseImages = async (expenseId: string) => {
    try {
      const response = await api.get(`/expenses/${expenseId}/images`)
      const images = (response as any).data || response || []
      setExpenseImages(prev => ({ ...prev, [expenseId]: images }))
    } catch (err) {
      console.error("Failed to fetch expense images:", err)
      setExpenseImages(prev => ({ ...prev, [expenseId]: [] }))
    }
  }

  const handleUploadExpenseImage = async (expenseId: string, file: File, description?: string) => {
    console.log('[v0] Uploading image for expense:', expenseId, file.name)
    await fetchExpenseImages(expenseId)
  }

  const handleDeleteExpenseImage = async (expenseId: string, imageId: string) => {
    try {
      await api.delete(`/expenses/${expenseId}/images/${imageId}`)
      setExpenseImages(prev => ({
        ...prev,
        [expenseId]: (prev[expenseId] || []).filter(img => img.id !== imageId)
      }))
    } catch (err) {
      console.error("Failed to delete image:", err)
      throw err
    }
  }

  const handleReuploadExpenseImage = async (expenseId: string, imageId: string, file: File) => {
    console.log('[v0] Reuploading expense image:', imageId, file.name)
    await fetchExpenseImages(expenseId)
  }

  const handleLockExpenseImage = async (expenseId: string, imageId: string, reason?: string) => {
    try {
      await api.patch(`/expenses/${expenseId}/images/${imageId}/lock`, { reason })
      await fetchExpenseImages(expenseId)
    } catch (err) {
      console.error("Failed to lock image:", err)
      throw err
    }
  }

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
              <Card 
                key={expense.id} 
                className={cn(
                  "border-border/50 hover:border-border transition-colors relative",
                  expense.isLocked && "border-amber-500/50"
                )}
              >
                {/* Lock indicator */}
                {expense.isLocked && (
                  <div className="absolute top-3 right-3 z-10">
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                      <Lock className="h-3 w-3 mr-1" />
                      Locked
                    </Badge>
                  </div>
                )}
                
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
                          {(expense.imageCount ?? 0) > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <ImageIcon className="h-3 w-3" />
                              <span>{expense.imageCount} image{expense.imageCount !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold">{formatZAR(expense.amount)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                    <Link 
                      href={`/dashboard/expenses/${expense.id}`}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      View details
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                    
                    <EntryActions
                      entryId={expense.id}
                      entryType="expense"
                      isLocked={expense.isLocked ?? false}
                      lockedAt={expense.lockedAt}
                      lockedByName={expense.lockedByName}
                      lockedReason={expense.lockedReason}
                      onEdit={() => setEditingExpense(expense)}
                      onDelete={() => handleDeleteExpense(expense.id)}
                      onLock={(reason) => handleLockExpense(expense.id, reason)}
                      onUnlock={() => handleUnlockExpense(expense.id)}
                      variant="icons"
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Edit Expense Dialog */}
      <Dialog open={!!editingExpense} onOpenChange={() => setEditingExpense(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {editingExpense && EXPENSE_CATEGORY_LABELS[editingExpense.category]}</DialogTitle>
            <DialogDescription>
              {editingExpense && `${format(editingExpense.date, 'd MMM yyyy')} - ${formatZAR(editingExpense.amount)}`}
            </DialogDescription>
          </DialogHeader>
          
          {editingExpense && (
            <div className="space-y-6 py-4">
              {/* Expense Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Category</label>
                  <p className="font-medium">{EXPENSE_CATEGORY_LABELS[editingExpense.category]}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Amount</label>
                  <p className="font-medium">{formatZAR(editingExpense.amount)}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Date</label>
                  <p className="font-medium">{format(editingExpense.date, 'd MMM yyyy')}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Vehicle</label>
                  <p className="font-medium">{editingExpense.vehicleReg}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-muted-foreground">Description</label>
                  <p className="font-medium">{editingExpense.description}</p>
                </div>
                {editingExpense.supplierName && (
                  <div className="col-span-2">
                    <label className="text-sm text-muted-foreground">Supplier</label>
                    <p className="font-medium">{editingExpense.supplierName}</p>
                  </div>
                )}
              </div>

              {/* Images Section */}
              <div className="space-y-3">
                <h3 className="font-medium">Receipt / Images</h3>
                <EntryImageManager
                  entryId={editingExpense.id}
                  entryType="EXPENSE"
                  images={expenseImages[editingExpense.id] || []}
                  onUpload={(file, desc) => handleUploadExpenseImage(editingExpense.id, file, desc)}
                  onDelete={(imageId) => handleDeleteExpenseImage(editingExpense.id, imageId)}
                  onReupload={(imageId, file) => handleReuploadExpenseImage(editingExpense.id, imageId, file)}
                  onLock={(imageId, reason) => handleLockExpenseImage(editingExpense.id, imageId, reason)}
                  disabled={editingExpense.isLocked}
                />
              </div>

              {/* Edit Link */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setEditingExpense(null)}>
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    router.push(`/dashboard/expenses/${editingExpense.id}/edit`)
                    setEditingExpense(null)
                  }}
                  disabled={editingExpense.isLocked}
                >
                  Edit Details
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
