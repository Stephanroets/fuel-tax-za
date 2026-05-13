'use client'

import { 
  Fuel, 
  Wrench, 
  Droplets, 
  CircleDot, 
  FileText,
  ChevronRight,
  Sparkles,
  type LucideIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ExpenseCategory } from '@/lib/types/database'

interface ExpenseTypeOption {
  category: ExpenseCategory
  title: string
  description: string
  icon: LucideIcon
  bgColor: string
  iconColor: string
}

const expenseTypes: ExpenseTypeOption[] = [
  {
    category: ExpenseCategory.FUEL_LOG,
    title: 'Fuel',
    description: 'Diesel or Petrol purchase',
    icon: Fuel,
    bgColor: 'bg-chart-1/10 hover:bg-chart-1/20',
    iconColor: 'text-chart-1',
  },
  {
    category: ExpenseCategory.CAR_WASH,
    title: 'Wash & Valet',
    description: 'Car wash, full valet, engine clean',
    icon: Sparkles,
    bgColor: 'bg-sky-500/10 hover:bg-sky-500/20',
    iconColor: 'text-sky-500',
  },
  {
    category: ExpenseCategory.MECHANIC_SERVICE,
    title: 'Service & Repairs',
    description: 'Workshop invoice, windscreen, glass',
    icon: Wrench,
    bgColor: 'bg-chart-3/10 hover:bg-chart-3/20',
    iconColor: 'text-chart-3',
  },
  {
    category: ExpenseCategory.MAINTENANCE_TOPUP,
    title: 'Top-ups (DIY)',
    description: 'Oil, battery, fuses, brake fluid',
    icon: Droplets,
    bgColor: 'bg-chart-2/10 hover:bg-chart-2/20',
    iconColor: 'text-chart-2',
  },
  {
    category: ExpenseCategory.TIRES,
    title: 'Tyres',
    description: 'Purchase and rotation tracking',
    icon: CircleDot,
    bgColor: 'bg-chart-5/10 hover:bg-chart-5/20',
    iconColor: 'text-chart-5',
  },
  {
    category: ExpenseCategory.FIXED_ADMIN,
    title: 'Fixed & Admin',
    description: 'Insurance, tracking, e-tolls',
    icon: FileText,
    bgColor: 'bg-chart-4/10 hover:bg-chart-4/20',
    iconColor: 'text-chart-4',
  },
]

interface ExpenseTypeSelectorProps {
  selectedCategory: ExpenseCategory | null
  onSelect: (category: ExpenseCategory) => void
}

export function ExpenseTypeSelector({ 
  selectedCategory, 
  onSelect 
}: ExpenseTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">What type of expense?</h2>
      <div className="space-y-2">
        {expenseTypes.map((type) => {
          const Icon = type.icon
          const isSelected = selectedCategory === type.category
          
          return (
            <button
              key={type.category}
              type="button"
              onClick={() => onSelect(type.category)}
              className={cn(
                'w-full flex items-center gap-4 p-4 rounded-xl border transition-all touch-target',
                isSelected 
                  ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                  : 'border-border hover:border-muted-foreground'
              )}
            >
              <div className={cn(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors',
                type.bgColor
              )}>
                <Icon className={cn('h-6 w-6', type.iconColor)} />
              </div>
              
              <div className="flex-1 text-left">
                <h3 className="font-semibold">{type.title}</h3>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </div>
              
              <ChevronRight className={cn(
                'h-5 w-5 shrink-0 transition-colors',
                isSelected ? 'text-primary' : 'text-muted-foreground'
              )} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
