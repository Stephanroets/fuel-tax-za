import { describe, it, expect } from 'vitest'
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  vehicleSchema,
  baseExpenseSchema,
  fuelLogSchema,
  mechanicServiceSchema,
  maintenanceTopupSchema,
  tireSchema,
  fixedExpenseSchema,
  tripSchema,
  odometerVerificationSchema,
  inviteUserSchema,
} from '@/lib/validations/schemas'
import {
  OrganizationMode,
  FuelType,
  ExpenseCategory,
  ServiceType,
  MaintenanceItemType,
  FixedExpenseType,
  TripPurpose,
  OdometerReadingType,
  UserRole,
} from '@/lib/types/database'

// ────────────────────────────────────────────────────────────────
// AUTH SCHEMAS
// ────────────────────────────────────────────────────────────────

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({ email: 'user@test.com', password: 'Password1' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-email', password: 'Password1' })
    expect(result.success).toBe(false)
  })

  it('rejects short password', () => {
    const result = loginSchema.safeParse({ email: 'u@t.com', password: 'short' })
    expect(result.success).toBe(false)
  })
})

describe('registerSchema', () => {
  const validData = {
    email: 'user@test.com',
    password: 'Password1',
    confirmPassword: 'Password1',
    firstName: 'John',
    lastName: 'Doe',
    organizationName: 'Test Org',
    organizationMode: OrganizationMode.SOLO,
  }

  it('accepts valid registration', () => {
    expect(registerSchema.safeParse(validData).success).toBe(true)
  })

  it('rejects mismatched passwords', () => {
    const data = { ...validData, confirmPassword: 'Different1' }
    expect(registerSchema.safeParse(data).success).toBe(false)
  })

  it('rejects password without uppercase', () => {
    const data = { ...validData, password: 'password1', confirmPassword: 'password1' }
    expect(registerSchema.safeParse(data).success).toBe(false)
  })

  it('rejects password without lowercase', () => {
    const data = { ...validData, password: 'PASSWORD1', confirmPassword: 'PASSWORD1' }
    expect(registerSchema.safeParse(data).success).toBe(false)
  })

  it('rejects password without number', () => {
    const data = { ...validData, password: 'PasswordOnly', confirmPassword: 'PasswordOnly' }
    expect(registerSchema.safeParse(data).success).toBe(false)
  })

  it('rejects empty first name', () => {
    const data = { ...validData, firstName: '' }
    expect(registerSchema.safeParse(data).success).toBe(false)
  })
})

describe('forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'a@b.com' }).success).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'nope' }).success).toBe(false)
  })
})

describe('resetPasswordSchema', () => {
  it('accepts valid input', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'abc123',
      password: 'NewPass1',
      confirmPassword: 'NewPass1',
    })
    expect(result.success).toBe(true)
  })

  it('rejects password shorter than 8 characters', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'abc123',
      password: 'Short1',
      confirmPassword: 'Short1',
    })
    expect(result.success).toBe(false)
  })

  it('rejects mismatched passwords', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'abc',
      password: 'NewPassword1',
      confirmPassword: 'Mismatch1',
    })
    expect(result.success).toBe(false)
  })
})

// ────────────────────────────────────────────────────────────────
// VEHICLE SCHEMA
// ────────────────────────────────────────────────────────────────

describe('vehicleSchema', () => {
  const validVehicle = {
    registrationNumber: 'GP 123-456',
    make: 'Toyota',
    model: 'Hilux',
    year: 2023,
    fuelType: FuelType.DIESEL_50PPM,
    currentOdometer: 50000,
  }

  it('accepts valid vehicle', () => {
    expect(vehicleSchema.safeParse(validVehicle).success).toBe(true)
  })

  it('uppercases registration number', () => {
    const result = vehicleSchema.parse({ ...validVehicle, registrationNumber: 'gp abc' })
    expect(result.registrationNumber).toBe('GP ABC')
  })

  it('rejects future year', () => {
    const futureYear = new Date().getFullYear() + 5
    const result = vehicleSchema.safeParse({ ...validVehicle, year: futureYear })
    expect(result.success).toBe(false)
  })

  it('rejects negative odometer', () => {
    const result = vehicleSchema.safeParse({ ...validVehicle, currentOdometer: -100 })
    expect(result.success).toBe(false)
  })

  it('accepts optional VIN of exactly 17 chars', () => {
    const result = vehicleSchema.safeParse({ ...validVehicle, vin: '12345678901234567' })
    expect(result.success).toBe(true)
  })

  it('rejects VIN with wrong length', () => {
    const result = vehicleSchema.safeParse({ ...validVehicle, vin: '12345' })
    expect(result.success).toBe(false)
  })

  it('allows empty VIN string', () => {
    const result = vehicleSchema.safeParse({ ...validVehicle, vin: '' })
    expect(result.success).toBe(true)
  })
})

// ────────────────────────────────────────────────────────────────
// EXPENSE SCHEMAS
// ────────────────────────────────────────────────────────────────

describe('baseExpenseSchema', () => {
  const validExpense = {
    vehicleId: '550e8400-e29b-41d4-a716-446655440000',
    category: ExpenseCategory.FUEL_LOG,
    expenseDate: '2024-01-15',
    amountZar: 500,
  }

  it('accepts valid expense', () => {
    expect(baseExpenseSchema.safeParse(validExpense).success).toBe(true)
  })

  it('rejects non-UUID vehicleId', () => {
    const result = baseExpenseSchema.safeParse({ ...validExpense, vehicleId: 'not-uuid' })
    expect(result.success).toBe(false)
  })

  it('rejects zero amount', () => {
    const result = baseExpenseSchema.safeParse({ ...validExpense, amountZar: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects negative amount', () => {
    const result = baseExpenseSchema.safeParse({ ...validExpense, amountZar: -10 })
    expect(result.success).toBe(false)
  })

  it('defaults vatAmountZar to 0', () => {
    const result = baseExpenseSchema.parse(validExpense)
    expect(result.vatAmountZar).toBe(0)
  })

  it('defaults isTaxDeductible to true', () => {
    const result = baseExpenseSchema.parse(validExpense)
    expect(result.isTaxDeductible).toBe(true)
  })
})

describe('fuelLogSchema', () => {
  it('accepts valid fuel log', () => {
    const result = fuelLogSchema.safeParse({
      fuelType: FuelType.PETROL_UNLEADED_95,
      liters: 45,
      pricePerLiter: 24.5,
    })
    expect(result.success).toBe(true)
  })

  it('rejects zero liters', () => {
    const result = fuelLogSchema.safeParse({
      fuelType: FuelType.DIESEL_10PPM,
      liters: 0,
      pricePerLiter: 22,
    })
    expect(result.success).toBe(false)
  })

  it('rejects liters above 500', () => {
    const result = fuelLogSchema.safeParse({
      fuelType: FuelType.DIESEL_10PPM,
      liters: 501,
      pricePerLiter: 22,
    })
    expect(result.success).toBe(false)
  })

  it('defaults fullTank to true', () => {
    const result = fuelLogSchema.parse({
      fuelType: FuelType.PETROL_UNLEADED_93,
      liters: 30,
      pricePerLiter: 23,
    })
    expect(result.fullTank).toBe(true)
  })
})

describe('mechanicServiceSchema', () => {
  it('accepts valid service', () => {
    const result = mechanicServiceSchema.safeParse({
      serviceType: ServiceType.MAJOR_SERVICE,
      workshopName: 'AutoShop',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing workshop name', () => {
    const result = mechanicServiceSchema.safeParse({
      serviceType: ServiceType.MINOR_SERVICE,
      workshopName: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('maintenanceTopupSchema', () => {
  it('accepts valid topup', () => {
    const result = maintenanceTopupSchema.safeParse({
      itemType: MaintenanceItemType.ENGINE_OIL,
    })
    expect(result.success).toBe(true)
  })

  it('defaults itemQuantity to 1', () => {
    const result = maintenanceTopupSchema.parse({
      itemType: MaintenanceItemType.BATTERY,
    })
    expect(result.itemQuantity).toBe(1)
  })
})

describe('fixedExpenseSchema', () => {
  it('accepts valid fixed expense', () => {
    const result = fixedExpenseSchema.safeParse({
      expenseType: FixedExpenseType.INSURANCE_PREMIUM,
    })
    expect(result.success).toBe(true)
  })
})

// ────────────────────────────────────────────────────────────────
// TRIP SCHEMA
// ────────────────────────────────────────────────────────────────

describe('tripSchema', () => {
  const validTrip = {
    vehicleId: '550e8400-e29b-41d4-a716-446655440000',
    tripDate: '2024-06-01',
    startOdometer: 50000,
    endOdometer: 50100,
    purpose: TripPurpose.BUSINESS,
    startLocation: 'Johannesburg',
    endLocation: 'Pretoria',
  }

  it('accepts valid trip', () => {
    expect(tripSchema.safeParse(validTrip).success).toBe(true)
  })

  it('rejects endOdometer <= startOdometer', () => {
    const result = tripSchema.safeParse({ ...validTrip, endOdometer: 50000 })
    expect(result.success).toBe(false)
  })

  it('rejects endOdometer < startOdometer', () => {
    const result = tripSchema.safeParse({ ...validTrip, endOdometer: 49000 })
    expect(result.success).toBe(false)
  })

  it('defaults tollCostsZar to 0', () => {
    const result = tripSchema.parse(validTrip)
    expect(result.tollCostsZar).toBe(0)
  })

  it('defaults parkingCostsZar to 0', () => {
    const result = tripSchema.parse(validTrip)
    expect(result.parkingCostsZar).toBe(0)
  })
})

// ────────────────────────────────────────────────────────────────
// ODOMETER VERIFICATION SCHEMA
// ────────────────────────────────────────────────────────────────

describe('odometerVerificationSchema', () => {
  const validData = {
    vehicleId: '550e8400-e29b-41d4-a716-446655440000',
    taxYear: 2024,
    readingType: OdometerReadingType.OPENING,
    odometerValue: 55000,
    imageBase64: 'data:image/avif;base64,AAAA',
    capturedAt: '2024-03-01T10:00:00.000Z',
  }

  it('accepts valid data', () => {
    expect(odometerVerificationSchema.safeParse(validData).success).toBe(true)
  })

  it('rejects negative odometer', () => {
    const result = odometerVerificationSchema.safeParse({ ...validData, odometerValue: -1 })
    expect(result.success).toBe(false)
  })

  it('rejects invalid GPS latitude', () => {
    const result = odometerVerificationSchema.safeParse({ ...validData, gpsLatitude: 100 })
    expect(result.success).toBe(false)
  })

  it('rejects invalid GPS longitude', () => {
    const result = odometerVerificationSchema.safeParse({ ...validData, gpsLongitude: 200 })
    expect(result.success).toBe(false)
  })

  it('accepts valid GPS coordinates', () => {
    const result = odometerVerificationSchema.safeParse({
      ...validData,
      gpsLatitude: -26.2041,
      gpsLongitude: 28.0473,
      gpsAccuracyMeters: 5,
    })
    expect(result.success).toBe(true)
  })
})

// ────────────────────────────────────────────────────────────────
// INVITE USER SCHEMA
// ────────────────────────────────────────────────────────────────

describe('inviteUserSchema', () => {
  const validInvite = {
    email: 'driver@fleet.co.za',
    firstName: 'Jane',
    lastName: 'Smith',
    role: UserRole.DRIVER,
  }

  it('accepts valid invite', () => {
    expect(inviteUserSchema.safeParse(validInvite).success).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(inviteUserSchema.safeParse({ ...validInvite, email: 'nope' }).success).toBe(false)
  })

  it('rejects empty first name', () => {
    expect(inviteUserSchema.safeParse({ ...validInvite, firstName: '' }).success).toBe(false)
  })

  it('accepts optional fields', () => {
    const result = inviteUserSchema.safeParse({
      ...validInvite,
      phone: '+27821234567',
      employeeNumber: 'EMP001',
      driversLicenseNumber: 'DL12345',
    })
    expect(result.success).toBe(true)
  })
})
