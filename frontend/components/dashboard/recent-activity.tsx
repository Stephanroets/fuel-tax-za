'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { 
  Fuel, 
  Wrench, 
  Droplets, 
  CircleDot,
  FileText,
  ChevronRight,
  type LucideIcon
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExpenseCategory, formatZAR, EXPENSE_CATEGORY_LABELS } from '@/lib/types/database'
import { cn } from '@/lib/utils'

// Component to render relative time only on the client to avoid hydration mismatch
function RelativeTime({ date }: { date: Date }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return a placeholder with same structure to avoid layout shift
    return <span className="text-xs text-muted-foreground">...</span>
  }

  return (
    <span className="text-xs text-muted-foreground">
      {formatDistanceToNow(date, { addSuffix: true })}
    </span>
  )
}

interface ActivityItem {
  id: string
  category: ExpenseCategory
  description: string
  amount: number
  vehicleReg: string
  date: Date
}

interface RecentActivityProps {
  activities: ActivityItem[]
}

const categoryIcons: Record<ExpenseCategory, LucideIcon> = {
  [ExpenseCategory.FUEL_LOG]: Fuel,
  [ExpenseCategory.MECHANIC_SERVICE]: Wrench,
  [ExpenseCategory.MAINTENANCE_TOPUP]: Droplets,
  [ExpenseCategory.TIRES]: CircleDot,
  [ExpenseCategory.FIXED_ADMIN]: FileText,
}

const categoryColors: Record<ExpenseCategory, { bg: string; text: string }> = {
  [ExpenseCategory.FUEL_LOG]: { bg: 'bg-chart-1/10', text: 'text-chart-1' },
  [ExpenseCategory.MECHANIC_SERVICE]: { bg: 'bg-chart-3/10', text: 'text-chart-3' },
  [ExpenseCategory.MAINTENANCE_TOPUP]: { bg: 'bg-chart-2/10', text: 'text-chart-2' },
  [ExpenseCategory.TIRES]: { bg: 'bg-chart-5/10', text: 'text-chart-5' },
  [ExpenseCategory.FIXED_ADMIN]: { bg: 'bg-chart-4/10', text: 'text-chart-4' },
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/expenses">
            View all
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {activities.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No recent activity. Add your first expense!
            </p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/expenses/new">Add Expense</Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {activities.map((activity) => {
              const Icon = categoryIcons[activity.category]
              const colors = categoryColors[activity.category]
              
              return (
                <li key={activity.id}>
                  <Link 
                    href={`/dashboard/expenses/${activity.id}`}
                    className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                      colors.bg
                    )}>
                      <Icon className={cn('h-5 w-5', colors.text)} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">
                          {activity.description}
                        </p>
                        <p className="text-sm font-semibold shrink-0 ml-2">
                          {formatZAR(activity.amount)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {activity.vehicleReg}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          &bull;
                        </span>
                        <RelativeTime date={activity.date} />
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
