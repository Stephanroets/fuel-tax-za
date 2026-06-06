'use client'

import { formatZAR } from '@/lib/types/database'

interface TotalAmountDisplayProps {
  amount: number
  label?: string
  secondaryLabel?: string
  secondaryAmount?: number
}

export function TotalAmountDisplay({
  amount,
  label = 'Total Amount',
  secondaryLabel,
  secondaryAmount,
}: TotalAmountDisplayProps) {
  if (amount <= 0) return null

  return (
    <div className="rounded-lg bg-muted p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-2xl font-bold">{formatZAR(amount)}</span>
      </div>
      {secondaryLabel && secondaryAmount != null && secondaryAmount > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{secondaryLabel}</span>
          <span className="font-medium">{formatZAR(secondaryAmount)}</span>
        </div>
      )}
    </div>
  )
}
