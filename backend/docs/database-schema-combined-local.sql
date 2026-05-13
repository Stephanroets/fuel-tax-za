-- ============================================================================
-- VEHICLE EXPENSE & TAX COMPLIANCE SYSTEM - PostgreSQL Schema (COMBINED LOCAL VERSION)
-- South African ZAR Currency | SARS Logbook Compliant
-- Multi-Tenant Architecture: Organizations -> Users & Vehicles -> Expenses & Trips
-- Combined from production and local schemas for local testing
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'DRIVER');
CREATE TYPE organization_mode AS ENUM ('SOLO', 'FLEET');
CREATE TYPE fuel_type AS ENUM (
  'DIESEL_10PPM',
  'DIESEL_50PPM', 
  'DIESEL_500PPM',
  'PETROL_UNLEADED_93',
  'PETROL_UNLEADED_95'
);
CREATE TYPE expense_category AS ENUM (
  'FUEL_LOG',
  'MECHANIC_SERVICE',
  'MAINTENANCE_TOPUP',
  'TIRES',
  'FIXED_ADMIN'
);
CREATE TYPE maintenance_item_type AS ENUM (
  'ANTIFREEZE',
  'OIL',
  'WIPER_BLADES',
  'LIGHT_BULBS',
  'VEHICLE_WASH',
  'VALET'
);
CREATE TYPE service_type AS ENUM (
  'MAJOR_SERVICE',
  'MINOR_SERVICE',
  'BRAKE_OVERHAUL',
  'ENGINE_REPAIR',
  'TRANSMISSION',
  'SUSPENSION',
  'ELECTRICAL',
  'AIR_CONDITIONING',
  'OTHER'
);
CREATE TYPE fixed_expense_type AS ENUM (
  'INSURANCE_PREMIUM',
  'VEHICLE_TRACKING',
  'ETOLL_SANRAL',
  'LICENSE_RENEWAL',
  'ROADWORTHY',
  'OTHER'
);
CREATE TYPE trip_purpose AS ENUM ('BUSINESS', 'PRIVATE');
CREATE TYPE verification_status AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED');
CREATE TYPE odometer_reading_type AS ENUM ('OPENING', 'CLOSING');

-- ============================================================================
-- ORGANIZATIONS TABLE
-- Root of multi-tenant hierarchy
-- ============================================================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  mode organization_mode NOT NULL DEFAULT 'SOLO',
  tax_number VARCHAR(50), -- SA Tax Registration Number
  vat_number VARCHAR(50), -- VAT Registration (if applicable)
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  province VARCHAR(100),
  postal_code VARCHAR(10),
  country VARCHAR(50) DEFAULT 'South Africa',
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_organizations_mode ON organizations(mode);
CREATE INDEX idx_organizations_active ON organizations(is_active);

-- ============================================================================
-- USERS TABLE
-- Linked to organization with role-based access
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role user_role NOT NULL DEFAULT 'DRIVER',
  phone VARCHAR(20),
  employee_number VARCHAR(50),
  drivers_license_number VARCHAR(50),
  drivers_license_expiry DATE,
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  verification_token_expires TIMESTAMP WITH TIME ZONE,
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- ============================================================================
-- VEHICLES TABLE
-- Fleet vehicles linked to organization
-- ============================================================================

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assigned_driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  registration_number VARCHAR(20) NOT NULL,
  vin VARCHAR(17), -- Vehicle Identification Number
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  color VARCHAR(50),
  fuel_type fuel_type NOT NULL,
  tank_capacity_liters DECIMAL(6,2),
  current_odometer INTEGER NOT NULL DEFAULT 0,
  purchase_date DATE,
  purchase_price DECIMAL(12,2),
  license_expiry DATE,
  insurance_policy_number VARCHAR(100),
  tracker_serial VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(organization_id, registration_number)
);

CREATE INDEX idx_vehicles_organization ON vehicles(organization_id);
CREATE INDEX idx_vehicles_driver ON vehicles(assigned_driver_id);
CREATE INDEX idx_vehicles_registration ON vehicles(registration_number);
CREATE INDEX idx_vehicles_active ON vehicles(is_active);

-- ============================================================================
-- EXPENSES TABLE (Base)
-- Common fields for all expense types
-- ============================================================================

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category expense_category NOT NULL,
  expense_date DATE NOT NULL,
  amount_zar DECIMAL(12,2) NOT NULL,
  vat_amount_zar DECIMAL(12,2) DEFAULT 0,
  description TEXT,
  receipt_image_url VARCHAR(500),
  receipt_image_key VARCHAR(255), -- S3 key for deletion
  odometer_reading INTEGER,
  supplier_name VARCHAR(255),
  invoice_number VARCHAR(100),
  is_tax_deductible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_expenses_organization ON expenses(organization_id);
CREATE INDEX idx_expenses_vehicle ON expenses(vehicle_id);
CREATE INDEX idx_expenses_user ON expenses(user_id);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_tax_deductible ON expenses(is_tax_deductible);

-- ============================================================================
-- FUEL LOGS TABLE
-- Detailed fuel purchase tracking
-- ============================================================================

CREATE TABLE fuel_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  fuel_type fuel_type NOT NULL,
  liters DECIMAL(8,3) NOT NULL,
  price_per_liter DECIMAL(8,4) NOT NULL,
  full_tank BOOLEAN DEFAULT TRUE,
  station_name VARCHAR(255),
  station_location VARCHAR(255),
  previous_odometer INTEGER,
  km_since_last_fill DECIMAL(10,2),
  efficiency_km_per_liter DECIMAL(6,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fuel_logs_expense ON fuel_logs(expense_id);
CREATE INDEX idx_fuel_logs_fuel_type ON fuel_logs(fuel_type);

-- ============================================================================
-- MECHANIC SERVICES TABLE
-- Full workshop invoice tracking
-- ============================================================================

CREATE TABLE mechanic_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  service_type service_type NOT NULL,
  workshop_name VARCHAR(255) NOT NULL,
  workshop_phone VARCHAR(20),
  workshop_address VARCHAR(500),
  technician_name VARCHAR(100),
  labor_cost_zar DECIMAL(12,2),
  parts_cost_zar DECIMAL(12,2),
  work_description TEXT,
  parts_replaced TEXT,
  warranty_months INTEGER,
  next_service_due_km INTEGER,
  next_service_due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_mechanic_services_expense ON mechanic_services(expense_id);
CREATE INDEX idx_mechanic_services_type ON mechanic_services(service_type);

-- ============================================================================
-- MAINTENANCE TOP-UPS TABLE
-- DIY purchases (antifreeze, oil, wipers, etc.)
-- ============================================================================

CREATE TABLE maintenance_topups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  item_type maintenance_item_type NOT NULL,
  item_brand VARCHAR(100),
  item_quantity DECIMAL(6,2) DEFAULT 1,
  item_unit VARCHAR(20), -- liters, units, etc.
  shop_name VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_maintenance_topups_expense ON maintenance_topups(expense_id);
CREATE INDEX idx_maintenance_topups_type ON maintenance_topups(item_type);

-- ============================================================================
-- TIRES TABLE
-- Standalone tire tracking
-- ============================================================================

CREATE TABLE tires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100),
  size VARCHAR(50) NOT NULL, -- e.g., "205/55R16"
  quantity INTEGER NOT NULL DEFAULT 4,
  position VARCHAR(50), -- "Front", "Rear", "All", "Spare"
  purchase_odometer INTEGER NOT NULL,
  tread_depth_mm DECIMAL(4,2),
  expected_lifespan_km INTEGER,
  rotation_interval_km INTEGER DEFAULT 10000,
  last_rotation_odometer INTEGER,
  warranty_km INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tires_expense ON tires(expense_id);
CREATE INDEX idx_tires_brand ON tires(brand);

-- ============================================================================
-- FIXED EXPENSES TABLE
-- Insurance, tracking, e-tolls, etc.
-- ============================================================================

CREATE TABLE fixed_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  expense_type fixed_expense_type NOT NULL,
  provider_name VARCHAR(255),
  policy_number VARCHAR(100),
  coverage_start DATE,
  coverage_end DATE,
  payment_frequency VARCHAR(50), -- Monthly, Annual, Once-off
  reference_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fixed_expenses_expense ON fixed_expenses(expense_id);
CREATE INDEX idx_fixed_expenses_type ON fixed_expenses(expense_type);

-- ============================================================================
-- TRIPS TABLE
-- SARS Logbook compliant trip logging
-- ============================================================================

CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trip_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  start_odometer INTEGER NOT NULL,
  end_odometer INTEGER NOT NULL,
  distance_km DECIMAL(10,2) GENERATED ALWAYS AS (end_odometer - start_odometer) STORED,
  purpose trip_purpose NOT NULL,
  start_location VARCHAR(255) NOT NULL,
  end_location VARCHAR(255) NOT NULL,
  route_description TEXT,
  customer_client_name VARCHAR(255), -- For business trips
  reason_for_trip TEXT,
  toll_costs_zar DECIMAL(10,2) DEFAULT 0,
  parking_costs_zar DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_trips_organization ON trips(organization_id);
CREATE INDEX idx_trips_vehicle ON trips(vehicle_id);
CREATE INDEX idx_trips_user ON trips(user_id);
CREATE INDEX idx_trips_date ON trips(trip_date);
CREATE INDEX idx_trips_purpose ON trips(purpose);

-- ============================================================================
-- SARS TAX YEAR SUMMARIES TABLE
-- Pre-calculated tax year summaries for reporting
-- ============================================================================

CREATE TABLE tax_year_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL, -- SA Tax Year (March to February)
  total_km DECIMAL(12,2) DEFAULT 0,
  business_km DECIMAL(12,2) DEFAULT 0,
  private_km DECIMAL(12,2) DEFAULT 0,
  business_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_km > 0 THEN (business_km / total_km * 100) ELSE 0 END
  ) STORED,
  total_expenses_zar DECIMAL(14,2) DEFAULT 0,
  fuel_expenses_zar DECIMAL(14,2) DEFAULT 0,
  maintenance_expenses_zar DECIMAL(14,2) DEFAULT 0,
  fixed_expenses_zar DECIMAL(14,2) DEFAULT 0,
  opening_odometer INTEGER,
  closing_odometer INTEGER,
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, vehicle_id, tax_year)
);

CREATE INDEX idx_tax_summaries_organization ON tax_year_summaries(organization_id);
CREATE INDEX idx_tax_summaries_vehicle ON tax_year_summaries(vehicle_id);
CREATE INDEX idx_tax_summaries_year ON tax_year_summaries(tax_year);

-- ============================================================================
-- ODOMETER VERIFICATIONS TABLE
-- SARS Tax Year Opening/Closing Odometer Photo Verification
-- ============================================================================

CREATE TABLE odometer_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL, -- SA Tax Year (March to February)
  reading_type odometer_reading_type NOT NULL,
  odometer_value INTEGER NOT NULL,
  image_url_avif VARCHAR(500) NOT NULL,
  image_key VARCHAR(255), -- S3 key for deletion
  -- Audit metadata
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL, -- System timestamp at capture
  gps_latitude DECIMAL(10, 8), -- GPS coordinates at capture
  gps_longitude DECIMAL(11, 8),
  gps_accuracy_meters DECIMAL(8, 2),
  device_info VARCHAR(500), -- Device/browser info
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Unique constraint: Only one OPENING and one CLOSING per vehicle per tax year
  UNIQUE(vehicle_id, tax_year, reading_type)
);

CREATE INDEX idx_odometer_verifications_organization ON odometer_verifications(organization_id);
CREATE INDEX idx_odometer_verifications_vehicle ON odometer_verifications(vehicle_id);
CREATE INDEX idx_odometer_verifications_tax_year ON odometer_verifications(tax_year);
CREATE INDEX idx_odometer_verifications_type ON odometer_verifications(reading_type);

-- Enable RLS (for local testing, can be disabled)
ALTER TABLE odometer_verifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- REFRESH TOKENS TABLE
-- JWT refresh token management
-- ============================================================================

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  device_info VARCHAR(500),
  ip_address VARCHAR(45),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- ============================================================================
-- AUDIT LOG TABLE
-- Track important actions for compliance
-- ============================================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_organization ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- Tenant isolation at database level (for local testing, can be disabled)
-- ============================================================================

-- Enable RLS on all tenant tables (commented out for local testing if needed)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE mechanic_services ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE maintenance_topups ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tires ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tax_year_summaries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies should be created based on your authentication setup
-- Example policies would filter by organization_id from JWT claims

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate fuel efficiency
CREATE OR REPLACE FUNCTION calculate_fuel_efficiency()
RETURNS TRIGGER AS $$
DECLARE
  prev_odometer INTEGER;
BEGIN
  -- Get previous odometer reading for this vehicle
  SELECT odometer_reading INTO prev_odometer
  FROM expenses
  WHERE vehicle_id = (SELECT vehicle_id FROM expenses WHERE id = NEW.expense_id)
    AND category = 'FUEL_LOG'
    AND id != NEW.expense_id
  ORDER BY expense_date DESC, created_at DESC
  LIMIT 1;
  
  IF prev_odometer IS NOT NULL THEN
    NEW.previous_odometer := prev_odometer;
    NEW.km_since_last_fill := (SELECT odometer_reading FROM expenses WHERE id = NEW.expense_id) - prev_odometer;
    IF NEW.liters > 0 THEN
      NEW.efficiency_km_per_liter := NEW.km_since_last_fill / NEW.liters;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_fuel_efficiency_trigger
  BEFORE INSERT ON fuel_logs
  FOR EACH ROW EXECUTE FUNCTION calculate_fuel_efficiency();

-- ============================================================================
-- SCHEMA COMPLETE - Ready for Local Testing
-- ============================================================================
