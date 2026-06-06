import { Vehicle } from '@/lib/types/database'

interface SubmitExpenseOptions {
  data: Record<string, unknown>
  vehicles: Vehicle[]
  receiptImage?: File | null
  endpoint: string
  amountField: string | string[]
  descriptionFn: (data: Record<string, unknown>) => string
  supplierField?: string
}

function resolveAmount(data: Record<string, unknown>, field: string | string[]): number {
  if (typeof field === 'string') {
    return (data[field] as number) || 0
  }
  for (const f of field) {
    const val = data[f] as number
    if (val) return val
  }
  return 0
}

function serializeDate(date: unknown): string {
  if (date instanceof Date) return date.toISOString()
  return new Date().toISOString()
}

export async function submitExpense({
  data,
  vehicles,
  receiptImage,
  endpoint,
  amountField,
  descriptionFn,
  supplierField,
}: SubmitExpenseOptions): Promise<void> {
  const vehicle = vehicles.find(v => v.id === data.vehicleId)
  const vehicleReg = vehicle?.registrationNumber || 'Unknown'

  const dataToSend = {
    ...data,
    date: serializeDate(data.date),
    amount: resolveAmount(data, amountField),
    description: descriptionFn(data),
    vehicleReg,
    ...(supplierField ? { supplierName: data[supplierField] as string } : {}),
  }

  const formData = new FormData()
  formData.append('data', JSON.stringify(dataToSend))
  if (receiptImage) formData.append('receipt', receiptImage)

  const token = typeof window !== 'undefined' ? localStorage.getItem('jwt_token') : null
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to save expense: ${errorText}`)
  }

  const newExpense = await response.json()

  const existingExpenses = JSON.parse(localStorage.getItem('expenses') || '[]')
  existingExpenses.push(newExpense)
  localStorage.setItem('expenses', JSON.stringify(existingExpenses))
}
