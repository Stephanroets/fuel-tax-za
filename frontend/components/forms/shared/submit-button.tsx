'use client'

import { Button } from '@/components/ui/button'

interface SubmitButtonProps {
  isSubmitting: boolean
  disabled?: boolean
  label?: string
  submittingLabel?: string
}

export function SubmitButton({
  isSubmitting,
  disabled = false,
  label = 'Save',
  submittingLabel = 'Saving...',
}: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      size="lg"
      className="w-full h-14 text-lg touch-target-lg"
      disabled={isSubmitting || disabled}
    >
      {isSubmitting ? submittingLabel : label}
    </Button>
  )
}
