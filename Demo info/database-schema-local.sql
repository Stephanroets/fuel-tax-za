-- ============================================================================
-- VEHICLE EXPENSE & TAX COMPLIANCE SYSTEM - PostgreSQL Schema (LOCAL VERSION)
-- South African ZAR Currency | SARS Logbook Compliant
-- Multi-Tenant Architecture: Organizations -> Users & Vehicles -> Expenses & Trips
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
CREATE TYPE odometer_reading_type AS ENUM ('OPENING', 'CLOSING');

-- ============================================================================
-- ORGANIZATIONS TABLE
-- ============================================================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  mode organization_mode NOT NULL DEFAULT 'SOLO',
  tax_number VARCHAR(50),
  vat_number VARCHAR(50),
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
-- ============================================================================

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assigned_driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  registration_number VARCHAR(20) NOT NULL,
  vin VARCHAR(17),
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
  receipt_image_key VARCHAR(255),
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

-- ============================================================================
-- FUEL LOGS TABLE
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

-- ============================================================================
-- MECHANIC SERVICES TABLE
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

-- ============================================================================
-- MAINTENANCE TOP-UPS TABLE
-- ============================================================================

CREATE TABLE maintenance_topups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  item_type maintenance_item_type NOT NULL,
  item_brand VARCHAR(100),
  item_quantity DECIMAL(6,2) DEFAULT 1,
  item_unit VARCHAR(20),
  shop_name VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_maintenance_topups_expense ON maintenance_topups(expense_id);

-- ============================================================================
-- TIRES TABLE
-- ============================================================================

CREATE TABLE tires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100),
  size VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 4,
  position VARCHAR(50),
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

-- ============================================================================
-- FIXED EXPENSES TABLE
-- ============================================================================

CREATE TABLE fixed_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  expense_type fixed_expense_type NOT NULL,
  provider_name VARCHAR(255),
  policy_number VARCHAR(100),
  coverage_start DATE,
  coverage_end DATE,
  payment_frequency VARCHAR(50),
  reference_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fixed_expenses_expense ON fixed_expenses(expense_id);

-- ============================================================================
-- TRIPS TABLE (SARS Logbook)
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
  customer_client_name VARCHAR(255),
  reason_for_trip TEXT,
  toll_costs_zar DECIMAL(10,2) DEFAULT 0,
  parking_costs_zar DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_trips_organization ON trips(organization_id);
CREATE INDEX idx_trips_vehicle ON trips(vehicle_id);
CREATE INDEX idx_trips_date ON trips(trip_date);

-- ============================================================================
-- ODOMETER VERIFICATIONS TABLE (SARS Tax Year Compliance)
-- ============================================================================

CREATE TABLE odometer_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL,
  reading_type odometer_reading_type NOT NULL,
  odometer_value INTEGER NOT NULL,
  photo_url VARCHAR(500),
  photo_key VARCHAR(255),
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL,
  gps_latitude DECIMAL(10, 8),
  gps_longitude DECIMAL(11, 8),
  device_info VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(vehicle_id, tax_year, reading_type)
);

CREATE INDEX idx_odometer_verifications_organization ON odometer_verifications(organization_id);
CREATE INDEX idx_odometer_verifications_vehicle ON odometer_verifications(vehicle_id);
CREATE INDEX idx_odometer_verifications_tax_year ON odometer_verifications(tax_year);

-- ============================================================================
-- REFRESH TOKENS TABLE
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

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
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
