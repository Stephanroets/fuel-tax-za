// ============================================================================
// VEHICLE EXPENSE & TAX COMPLIANCE SYSTEM - TypeScript Types
// South African ZAR Currency | SARS Logbook Compliant
// ============================================================================

// ============================================================================
// ENUMS
// ============================================================================

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  DRIVER = 'DRIVER'
}

export enum OrganizationMode {
  SOLO = 'SOLO',
  FLEET = 'FLEET'
}

export enum FuelType {
  DIESEL_10PPM = 'DIESEL_10PPM',
  DIESEL_50PPM = 'DIESEL_50PPM',
  DIESEL_500PPM = 'DIESEL_500PPM',
  PETROL_UNLEADED_93 = 'PETROL_UNLEADED_93',
  PETROL_UNLEADED_95 = 'PETROL_UNLEADED_95'
}

export enum ExpenseCategory {
  FUEL_LOG = 'FUEL_LOG',
  MECHANIC_SERVICE = 'MECHANIC_SERVICE',  // Renamed to "Service & Repairs" in UI
  MAINTENANCE_TOPUP = 'MAINTENANCE_TOPUP',
  TIRES = 'TIRES',
  FIXED_ADMIN = 'FIXED_ADMIN',
  CAR_WASH = 'CAR_WASH'  // New: Promoted from maintenance top-ups
}

export enum MaintenanceItemType {
  ENGINE_OIL = 'ENGINE_OIL',
  BRAKE_FLUID = 'BRAKE_FLUID',
  ANTIFREEZE = 'ANTIFREEZE',
  BATTERY = 'BATTERY',
  FUSES = 'FUSES',
  RELAYS = 'RELAYS',
  WIPER_BLADES = 'WIPER_BLADES',
  LIGHT_BULBS = 'LIGHT_BULBS',
  OTHER = 'OTHER'  // Miscellaneous items
}

// New enum for Car Wash types (promoted from maintenance)
export enum CarWashType {
  WASH_AND_GO = 'WASH_AND_GO',
  FULL_VALET = 'FULL_VALET',
  ENGINE_STEAM_CLEAN = 'ENGINE_STEAM_CLEAN'
}

// Drivetrain types for tyre rotation logic
export enum DrivetrainType {
  FWD = 'FWD',       // Front Wheel Drive - 8,000km rotation
  RWD = 'RWD',       // Rear Wheel Drive - 10,000km rotation
  AWD = 'AWD',       // All Wheel Drive - 6,000km rotation
  FOUR_BY_FOUR = 'FOUR_BY_FOUR'  // 4x4 - 6,000km rotation
}

export enum ServiceType {
  MAJOR_SERVICE = 'MAJOR_SERVICE',
  MINOR_SERVICE = 'MINOR_SERVICE',
  BRAKE_OVERHAUL = 'BRAKE_OVERHAUL',
  ENGINE_REPAIR = 'ENGINE_REPAIR',
  TRANSMISSION = 'TRANSMISSION',
  SUSPENSION = 'SUSPENSION',
  ELECTRICAL = 'ELECTRICAL',
  AIR_CONDITIONING = 'AIR_CONDITIONING',
  WINDSCREEN_GLASS = 'WINDSCREEN_GLASS',  // New: Chip repairs/replacements
  OTHER = 'OTHER'
}

export enum FixedExpenseType {
  INSURANCE_PREMIUM = 'INSURANCE_PREMIUM',
  VEHICLE_TRACKING = 'VEHICLE_TRACKING',
  ETOLL_SANRAL = 'ETOLL_SANRAL',
  LICENSE_RENEWAL = 'LICENSE_RENEWAL',
  ROADWORTHY = 'ROADWORTHY',
  OTHER = 'OTHER'
}

export enum TripPurpose {
  BUSINESS = 'BUSINESS',
  PRIVATE = 'PRIVATE'
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  EXPIRED = 'EXPIRED'
}

export enum OdometerReadingType {
  OPENING = 'OPENING',
  CLOSING = 'CLOSING'
}

// ============================================================================
// DISPLAY LABELS (South African Context)
// ============================================================================

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  [FuelType.DIESEL_10PPM]: 'Diesel 10ppm (Ultra Low Sulphur)',
  [FuelType.DIESEL_50PPM]: 'Diesel 50ppm',
  [FuelType.DIESEL_500PPM]: 'Diesel 500ppm',
  [FuelType.PETROL_UNLEADED_93]: 'Petrol Unleaded 93',
  [FuelType.PETROL_UNLEADED_95]: 'Petrol Unleaded 95'
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.FUEL_LOG]: 'Fuel',
  [ExpenseCategory.MECHANIC_SERVICE]: 'Service & Repairs',  // Renamed from Mechanic Service
  [ExpenseCategory.MAINTENANCE_TOPUP]: 'Maintenance Top-ups (DIY)',
  [ExpenseCategory.TIRES]: 'Tyres',
  [ExpenseCategory.FIXED_ADMIN]: 'Fixed & Admin',
  [ExpenseCategory.CAR_WASH]: 'Wash & Valet'
}

export const MAINTENANCE_ITEM_LABELS: Record<MaintenanceItemType, string> = {
  [MaintenanceItemType.ENGINE_OIL]: 'Engine Oil',
  [MaintenanceItemType.BRAKE_FLUID]: 'Brake Fluid',
  [MaintenanceItemType.ANTIFREEZE]: 'Antifreeze/Coolant',
  [MaintenanceItemType.BATTERY]: 'Battery',
  [MaintenanceItemType.FUSES]: 'Fuses',
  [MaintenanceItemType.RELAYS]: 'Relays',
  [MaintenanceItemType.WIPER_BLADES]: 'Wiper Blades',
  [MaintenanceItemType.LIGHT_BULBS]: 'Light Bulbs',
  [MaintenanceItemType.OTHER]: 'Other/Miscellaneous'
}

export const CAR_WASH_TYPE_LABELS: Record<CarWashType, string> = {
  [CarWashType.WASH_AND_GO]: 'Wash & Go',
  [CarWashType.FULL_VALET]: 'Full Valet',
  [CarWashType.ENGINE_STEAM_CLEAN]: 'Engine Steam Clean'
}

export const DRIVETRAIN_TYPE_LABELS: Record<DrivetrainType, string> = {
  [DrivetrainType.FWD]: 'Front Wheel Drive (FWD)',
  [DrivetrainType.RWD]: 'Rear Wheel Drive (RWD)',
  [DrivetrainType.AWD]: 'All Wheel Drive (AWD)',
  [DrivetrainType.FOUR_BY_FOUR]: '4x4 / 4WD'
}

// Rotation interval in km based on drivetrain
export const ROTATION_INTERVAL_KM: Record<DrivetrainType, number> = {
  [DrivetrainType.FWD]: 8000,
  [DrivetrainType.RWD]: 10000,
  [DrivetrainType.AWD]: 6000,
  [DrivetrainType.FOUR_BY_FOUR]: 6000
}

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  [ServiceType.MAJOR_SERVICE]: 'Major Service',
  [ServiceType.MINOR_SERVICE]: 'Minor Service',
  [ServiceType.BRAKE_OVERHAUL]: 'Brake Overhaul',
  [ServiceType.ENGINE_REPAIR]: 'Engine Repair',
  [ServiceType.TRANSMISSION]: 'Transmission',
  [ServiceType.SUSPENSION]: 'Suspension',
  [ServiceType.ELECTRICAL]: 'Electrical',
  [ServiceType.AIR_CONDITIONING]: 'Air Conditioning',
  [ServiceType.WINDSCREEN_GLASS]: 'Windscreen & Glass',
  [ServiceType.OTHER]: 'Other'
}

export const FIXED_EXPENSE_LABELS: Record<FixedExpenseType, string> = {
  [FixedExpenseType.INSURANCE_PREMIUM]: 'Insurance Premium',
  [FixedExpenseType.VEHICLE_TRACKING]: 'Vehicle Tracking',
  [FixedExpenseType.ETOLL_SANRAL]: 'E-Tolls (SANRAL)',
  [FixedExpenseType.LICENSE_RENEWAL]: 'License Renewal',
  [FixedExpenseType.ROADWORTHY]: 'Roadworthy Certificate',
  [FixedExpenseType.OTHER]: 'Other'
}

// ============================================================================
// LOCK STATUS
// ============================================================================

export interface LockInfo {
  isLocked: boolean
  lockedAt?: Date
  lockedByUserId?: string
  lockedByName?: string
  lockedReason?: string
}

// ============================================================================
// ENTRY IMAGES
// ============================================================================

export interface EntryImage {
  id: string
  organizationId: string
  entryType: 'VEHICLE' | 'EXPENSE' | 'TRIP' | 'ODOMETER_VERIFICATION'
  entryId: string
  imageUrl: string
  imageKey?: string
  imageType: 'RECEIPT' | 'ODOMETER' | 'ATTACHMENT' | 'DAMAGE'
  fileName?: string
  fileSizeBytes?: number
  mimeType?: string
  description?: string
  uploadedByUserId?: string
  uploadedByName?: string
  isLocked: boolean
  lockedAt?: Date
  lockedByUserId?: string
  lockedByName?: string
  lockedReason?: string
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// BASE INTERFACES
// ============================================================================

export interface Organization {
  id: string
  name: string
  mode: OrganizationMode
  taxNumber?: string
  vatNumber?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  province?: string
  postalCode?: string
  country: string
  phone?: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

export interface User {
  id: string
  organizationId: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  phone?: string
  employeeNumber?: string
  driversLicenseNumber?: string
  driversLicenseExpiry?: Date
  emailVerified: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

export interface Vehicle {
  id: string
  organizationId: string
  assignedDriverId?: string
  registrationNumber: string
  vin?: string
  make: string
  model: string
  year: number
  nickname?: string
  color?: string
  fuelType: FuelType
  tankCapacityLiters?: number
  currentOdometer: number
  purchaseDate?: Date
  purchasePrice?: number
  licenseExpiry?: Date
  insurancePolicyNumber?: string
  trackerSerial?: string
  notes?: string
  // Lock fields
  isLocked: boolean
  lockedAt?: Date
  lockedByUserId?: string
  lockedReason?: string
  // Timestamps
  createdAt: Date
  updatedAt: Date
  isActive: boolean
  // Additional fields from views
  lockedByName?: string
  imageCount?: number
}

// ============================================================================
// EXPENSE INTERFACES
// ============================================================================

export interface Expense {
  id: string
  organizationId: string
  vehicleId: string
  userId: string
  category: ExpenseCategory
  expenseDate: Date
  amountZar: number
  vatAmountZar: number
  description?: string
  receiptImageUrl?: string
  receiptImageKey?: string
  odometerReading?: number
  supplierName?: string
  invoiceNumber?: string
  isTaxDeductible: boolean
  // Lock fields
  isLocked: boolean
  lockedAt?: Date
  lockedByUserId?: string
  lockedReason?: string
  // Timestamps
  createdAt: Date
  updatedAt: Date
  // Additional fields from views
  lockedByName?: string
  imageCount?: number
}

export interface FuelLog {
  id: string
  expenseId: string
  fuelType: FuelType
  liters: number
  pricePerLiter: number
  fullTank: boolean
  stationName?: string
  stationLocation?: string
  previousOdometer?: number
  kmSinceLastFill?: number
  efficiencyKmPerLiter?: number
  createdAt: Date
}

export interface MechanicService {
  id: string
  expenseId: string
  serviceType: ServiceType
  workshopName: string
  workshopPhone?: string
  workshopAddress?: string
  technicianName?: string
  laborCostZar?: number
  partsCostZar?: number
  workDescription?: string
  partsReplaced?: string
  warrantyMonths?: number
  nextServiceDueKm?: number
  nextServiceDueDate?: Date
  createdAt: Date
}

export interface MaintenanceTopup {
  id: string
  expenseId: string
  itemType: MaintenanceItemType
  itemBrand?: string
  itemQuantity: number
  itemUnit?: string
  shopName?: string
  notes?: string
  createdAt: Date
}

export interface Tire {
  id: string
  expenseId: string
  brand: string
  model?: string
  size: string
  quantity: number
  position?: string
  purchaseOdometer: number
  treadDepthMm?: number
  expectedLifespanKm?: number
  rotationIntervalKm: number
  lastRotationOdometer?: number
  warrantyKm?: number
  notes?: string
  createdAt: Date
}

export interface FixedExpense {
  id: string
  expenseId: string
  expenseType: FixedExpenseType
  providerName?: string
  policyNumber?: string
  coverageStart?: Date
  coverageEnd?: Date
  paymentFrequency?: string
  referenceNumber?: string
  notes?: string
  createdAt: Date
}

// ============================================================================
// TRIP & LOGBOOK INTERFACES
// ============================================================================

export interface Trip {
  id: string
  organizationId: string
  vehicleId: string
  userId: string
  tripDate: Date
  startTime?: string
  endTime?: string
  startOdometer: number
  endOdometer: number
  distanceKm: number
  purpose: TripPurpose
  startLocation: string
  endLocation: string
  routeDescription?: string
  customerClientName?: string
  reasonForTrip?: string
  tollCostsZar: number
  parkingCostsZar: number
  // Lock fields
  isLocked: boolean
  lockedAt?: Date
  lockedByUserId?: string
  lockedReason?: string
  // Timestamps
  createdAt: Date
  updatedAt: Date
  // Additional fields from views
  lockedByName?: string
  imageCount?: number
  vehicleReg?: string
  vehicleName?: string
}

export interface TaxYearSummary {
  id: string
  organizationId: string
  vehicleId: string
  taxYear: number
  totalKm: number
  businessKm: number
  privateKm: number
  businessPercentage: number
  totalExpensesZar: number
  fuelExpensesZar: number
  maintenanceExpensesZar: number
  fixedExpensesZar: number
  openingOdometer?: number
  closingOdometer?: number
  lastCalculated: Date
  createdAt: Date
}

export interface OdometerVerification {
  id: string
  organizationId: string
  vehicleId: string
  userId: string
  taxYear: number
  readingType: OdometerReadingType
  odometerValue: number
  imageUrlAvif: string
  imageKey?: string
  capturedAt: Date
  gpsLatitude?: number
  gpsLongitude?: number
  gpsAccuracyMeters?: number
  deviceInfo?: string
  ipAddress?: string
  // Lock fields
  isLocked: boolean
  lockedAt?: Date
  lockedByUserId?: string
  lockedReason?: string
  // Timestamps
  createdAt: Date
  // Additional fields from views
  lockedByName?: string
  additionalImageCount?: number
  vehicleReg?: string
  vehicleName?: string
}

// Helper to check if we're in Opening/Closing window
export const getTaxYearReadingWindow = (date: Date = new Date()): {
  isOpeningWindow: boolean
  isClosingWindow: boolean
  currentTaxYear: number
} => {
  const month = date.getMonth() // 0-indexed (0=Jan, 2=Mar)
  const year = date.getFullYear()
  
  // Opening window: March (month 2)
  const isOpeningWindow = month === 2
  // Closing window: February (month 1)
  const isClosingWindow = month === 1
  
  // Current tax year: if before March, it's previous year's tax year
  const currentTaxYear = month < 2 ? year - 1 : year
  
  return { isOpeningWindow, isClosingWindow, currentTaxYear }
}

// ============================================================================
// COMPOSITE TYPES (For Forms & Display)
// ============================================================================

export interface ExpenseWithDetails extends Expense {
  vehicle?: Vehicle
  user?: User
  fuelLog?: FuelLog
  mechanicService?: MechanicService
  maintenanceTopup?: MaintenanceTopup
  tire?: Tire
  fixedExpense?: FixedExpense
}

export interface VehicleWithStats extends Vehicle {
  assignedDriver?: User
  totalExpenses?: number
  totalTrips?: number
  lastServiceDate?: Date
  lastFuelDate?: Date
  averageEfficiency?: number
}

export interface DashboardStats {
  totalVehicles: number
  activeDrivers: number
  monthlyExpenses: number
  monthlyTrips: number
  businessKmPercentage: number
  fuelEfficiencyAverage: number
  upcomingServices: number
  expiringLicenses: number
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateExpenseRequest {
  vehicleId: string
  category: ExpenseCategory
  expenseDate: string
  amountZar: number
  vatAmountZar?: number
  description?: string
  receiptImage?: File
  odometerReading?: number
  supplierName?: string
  invoiceNumber?: string
  isTaxDeductible?: boolean
  // Category-specific fields
  fuelLog?: Omit<FuelLog, 'id' | 'expenseId' | 'createdAt'>
  mechanicService?: Omit<MechanicService, 'id' | 'expenseId' | 'createdAt'>
  maintenanceTopup?: Omit<MaintenanceTopup, 'id' | 'expenseId' | 'createdAt'>
  tire?: Omit<Tire, 'id' | 'expenseId' | 'createdAt'>
  fixedExpense?: Omit<FixedExpense, 'id' | 'expenseId' | 'createdAt'>
}

export interface CreateTripRequest {
  vehicleId: string
  tripDate: string
  startTime?: string
  endTime?: string
  startOdometer: number
  endOdometer: number
  purpose: TripPurpose
  startLocation: string
  endLocation: string
  routeDescription?: string
  customerClientName?: string
  reasonForTrip?: string
  tollCostsZar?: number
  parkingCostsZar?: number
}

export interface AuthResponse {
  user: User
  organization: Organization
  accessToken: string
  refreshToken: string
}

export interface JWTPayload {
  sub: string // User ID
  email: string
  organizationId: string
  role: UserRole
  mode: OrganizationMode
  iat: number
  exp: number
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DateRange = {
  from: Date
  to: Date
}

export type SortDirection = 'asc' | 'desc'

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, string[]>
}

// ============================================================================
// ZAR CURRENCY HELPERS
// ============================================================================

export const formatZAR = (amount: number): string => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

export const formatDistance = (km: number): string => {
  return `${km.toLocaleString('en-ZA')} km`
}

export const formatEfficiency = (kmPerLiter: number): string => {
  return `${kmPerLiter.toFixed(1)} km/L`
}

// SA Tax Year runs March to February
export const getSATaxYear = (date: Date = new Date()): number => {
  const month = date.getMonth() // 0-indexed
  const year = date.getFullYear()
  // If before March, we're in the previous tax year
  return month < 2 ? year - 1 : year
}

export const getTaxYearDateRange = (taxYear: number): DateRange => {
  return {
    from: new Date(taxYear, 2, 1), // March 1
    to: new Date(taxYear + 1, 1, 28) // February 28/29
  }
}

// ============================================================================
// TYRE ROTATION TRACKING
// ============================================================================

export type TyreRotationStatus = 'OK' | 'UPCOMING' | 'WARNING' | 'CRITICAL'

export interface TyreRotationTracking {
  id: string
  organizationId: string
  vehicleId: string
  tyreExpenseId: string
  drivetrainType: DrivetrainType
  rotationIntervalKm: number
  installationOdometer: number
  lastRotationOdometer?: number
  lastRotationDate?: Date
  rotationCount: number
  nextRotationOdometer: number
  isActive: boolean
  isDismissed: boolean
  dismissedAt?: Date
  dismissedByUserId?: string
  createdAt: Date
  updatedAt: Date
}

export interface TyreRotationWarning {
  trackingId: string
  organizationId: string
  vehicleId: string
  vehicleRegistration: string
  vehicleName: string
  tyreBrand: string
  tyreModel?: string
  tyreSize?: string
  installationDate: Date
  drivetrainType: DrivetrainType
  rotationIntervalKm: number
  installationOdometer: number
  lastRotationOdometer?: number
  lastRotationDate?: Date
  rotationCount: number
  nextRotationOdometer: number
  currentVehicleOdometer: number
  latestFuelOdometer?: number
  kmOverdue: number
  rotationStatus: TyreRotationStatus
  isActive: boolean
  isDismissed: boolean
  dismissedAt?: Date
  dismissedByName?: string
}

export const getTyreRotationStatusColor = (status: TyreRotationStatus): string => {
  switch (status) {
    case 'CRITICAL':
      return 'text-destructive bg-destructive/10'
    case 'WARNING':
      return 'text-warning bg-warning/10'
    case 'UPCOMING':
      return 'text-primary bg-primary/10'
    default:
      return 'text-muted-foreground bg-muted'
  }
}

export const getTyreRotationStatusLabel = (status: TyreRotationStatus): string => {
  switch (status) {
    case 'CRITICAL':
      return 'Overdue - Rotate Now!'
    case 'WARNING':
      return 'Rotation Due'
    case 'UPCOMING':
      return 'Rotation Coming Up'
    default:
      return 'OK'
  }
}
