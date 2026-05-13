-- ============================================================================
-- VEHICLE EXPENSE & TAX COMPLIANCE SYSTEM - PostgreSQL 16 Schema Migration
-- New Feature: Separate Tables for Fixed & Admin Expense Types
-- South African ZAR Currency | SARS Logbook Compliant
-- ============================================================================

-- This migration separates Fixed & Admin expenses into individual tables:
-- 1. insurance_premiums - Vehicle insurance policies
-- 2. vehicle_tracking - GPS/tracking subscriptions
-- 3. etolls - E-toll (SANRAL) charges
-- 4. license_renewals - Vehicle license/registration renewals
-- 5. roadworthy_certificates - Roadworthy/COF certificates
-- 6. other_fixed_expenses - Miscellaneous fixed costs

-- ============================================================================
-- INSURANCE PREMIUMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS insurance_premiums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  -- Insurance Details
  insurance_company VARCHAR(100) NOT NULL, -- e.g., OUTsurance, Discovery, Santam
  policy_number VARCHAR(100),
  policy_type VARCHAR(50) DEFAULT 'COMPREHENSIVE', -- COMPREHENSIVE, THIRD_PARTY, THIRD_PARTY_FIRE_THEFT
  premium_amount_zar DECIMAL(12,2) NOT NULL,
  payment_frequency VARCHAR(20) DEFAULT 'MONTHLY', -- MONTHLY, ANNUAL
  -- Coverage Period
  coverage_start_date DATE NOT NULL,
  coverage_end_date DATE,
  -- Policy Details
  excess_amount_zar DECIMAL(12,2),
  cover_amount_zar DECIMAL(12,2), -- Insured value
  includes_windscreen BOOLEAN DEFAULT FALSE,
  includes_hail_damage BOOLEAN DEFAULT FALSE,
  includes_roadside_assist BOOLEAN DEFAULT FALSE,
  -- Contact
  broker_name VARCHAR(100),
  broker_phone VARCHAR(20),
  broker_email VARCHAR(100),
  claim_phone VARCHAR(20),
  -- Document Reference
  policy_document_url VARCHAR(500),
  policy_document_key VARCHAR(255),
  -- Lock fields
  is_locked BOOLEAN DEFAULT FALSE,
  locked_at TIMESTAMP WITH TIME ZONE,
  locked_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  locked_reason TEXT,
  -- Notes
  notes TEXT,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_insurance_premiums_org ON insurance_premiums(organization_id);
CREATE INDEX idx_insurance_premiums_vehicle ON insurance_premiums(vehicle_id);
CREATE INDEX idx_insurance_premiums_policy ON insurance_premiums(policy_number);
CREATE INDEX idx_insurance_premiums_coverage ON insurance_premiums(coverage_start_date, coverage_end_date);
CREATE INDEX idx_insurance_premiums_locked ON insurance_premiums(is_locked);

-- Enable RLS
ALTER TABLE insurance_premiums ENABLE ROW LEVEL SECURITY;

CREATE POLICY insurance_premiums_select_policy ON insurance_premiums
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id')::UUID
  ));

CREATE POLICY insurance_premiums_insert_policy ON insurance_premiums
  FOR INSERT WITH CHECK (organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id')::UUID
  ));

CREATE POLICY insurance_premiums_update_policy ON insurance_premiums
  FOR UPDATE USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id')::UUID
  ) AND is_locked = FALSE);

CREATE POLICY insurance_premiums_delete_policy ON insurance_premiums
  FOR DELETE USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id')::UUID
  ) AND is_locked = FALSE);

-- ============================================================================
-- VEHICLE TRACKING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicle_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  -- Tracking Provider Details
  provider_name VARCHAR(100) NOT NULL, -- e.g., Tracker, Cartrack, Netstar, Matrix
  account_number VARCHAR(100),
  contract_number VARCHAR(100),
  subscription_amount_zar DECIMAL(12,2) NOT NULL,
  payment_frequency VARCHAR(20) DEFAULT 'MONTHLY', -- MONTHLY, ANNUAL
  -- Device Details
  device_serial VARCHAR(100),
  device_type VARCHAR(50), -- GPS, OBD, HYBRID
  installation_date DATE,
  -- Contract Period
  contract_start_date DATE NOT NULL,
  contract_end_date DATE,
  contract_term_months INTEGER,
  -- Features
  has_stolen_vehicle_recovery BOOLEAN DEFAULT TRUE,
  has_live_tracking BOOLEAN DEFAULT TRUE,
  has_geofencing BOOLEAN DEFAULT FALSE,
  has_driver_behaviour BOOLEAN DEFAULT FALSE,
  has_crash_detection BOOLEAN DEFAULT FALSE,
  -- App/Portal
  portal_url VARCHAR(255),
  app_username VARCHAR(100),
  -- Contact
  support_phone VARCHAR(20),
  emergency_phone VARCHAR(20),
  -- Lock fields
  is_locked BOOLEAN DEFAULT FALSE,
  locked_at TIMESTAMP WITH TIME ZONE,
  locked_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  locked_reason TEXT,
  -- Notes
  notes TEXT,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vehicle_tracking_org ON vehicle_tracking(organization_id);
CREATE INDEX idx_vehicle_tracking_vehicle ON vehicle_tracking(vehicle_id);
CREATE INDEX idx_vehicle_tracking_provider ON vehicle_tracking(provider_name);
CREATE INDEX idx_vehicle_tracking_contract ON vehicle_tracking(contract_start_date, contract_end_date);
CREATE INDEX idx_vehicle_tracking_locked ON vehicle_tracking(is_locked);

-- Enable RLS
ALTER TABLE vehicle_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY vehicle_tracking_select_policy ON vehicle_tracking
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id')::UUID
  ));

CREATE POLICY vehicle_tracking_insert_policy ON vehicle_tracking
  FOR INSERT WITH CHECK (organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id')::UUID
  ));

CREATE POLICY vehicle_tracking_update_policy ON vehicle_tracking
  FOR UPDATE USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id')::UUID
  ) AND is_locked = FALSE);

CREATE POLICY vehicle_tracking_delete_policy ON vehicle_tracking
  FOR DELETE USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id')::UUID
  ) AND is_locked = FALSE);

-- ============================================================================
-- E-TOLLS (SANRAL) TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS etolls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  -- E-Toll Details
  etag_number VARCHAR(50), -- E-toll tag number
  account_number VARCHAR(100), -- SANRAL account number
  gantry_location VARCHAR(200), -- Specific gantry or "Multiple"
  toll_date DATE NOT NULL,
  amount_zar DECIMAL(12,2) NOT NULL,
  -- Trip Details (for linking to logbook)
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  route_description VARCHAR(255), -- e.g., "N1 North - Pretoria to Midrand"
  -- Payment
  payment_method VARCHAR(50), -- ETAG, VIOLATION, MANUAL
  payment_reference VARCHAR(100),
  payment_date DATE,
  -- Lock fields
  is_locked BOOLEAN DEFAULT FALSE,
  locked_at TIMESTAMP WITH TIME ZONE,
  locked_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  locked_reason TEXT,
  -- Notes
  notes TEXT,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_etolls_org ON etolls(organization_id);
CREATE INDEX idx_etolls_vehicle ON etolls(vehicle_id);
CREATE INDEX idx_etolls_date ON etolls(toll_date);
CREATE INDEX idx_etolls_etag ON etolls(etag_number);
CREATE INDEX idx_etolls_trip ON etolls(trip_id);
CREATE INDEX idx_etolls_locked ON etolls(is_locked);

-- Enable RLS
ALTER TABLE etolls ENABLE ROW LEVEL SECURITY;

CREATE POLICY etolls_select_policy ON etolls
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id')::UUID
  ));

CREATE POLICY etolls_insert_policy ON etolls
  FOR INSERT WITH CHECK (organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id')::UUID
  ));

CREATE POLICY etolls_update_policy ON etolls
  FOR UPDATE USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id')::UUID
  ) AND is_locked = FALSE);

CREATE POLICY etolls_delete_policy ON etolls
  FOR DELETE USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id')::UUID
  ) AND is_locked = FALSE);

-- ============================================================================
-- LICENSE RENEWALS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS license_renewals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  -- License Details
  license_number VARCHAR(50), -- Registration/license number
  license_type VARCHAR(50) DEFAULT 'MOTOR_VEHICLE', -- MOTOR_VEHICLE, MOTORCYCLE, TRAILER
  renewal_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  amount_zar DECIMAL(12,2) NOT NULL,
  -- Registration Authority
  licensing_authority VARCHAR(100), -- e.g., eNaTIS, Gauteng Licensing
  transaction_number VARCHAR(100),
  -- Penalties
  arrears_amount_zar DECIMAL(12,2) DEFAULT 0,
  penalty_amount_zar DECIMAL(12,2) DEFAULT 0,
  total_amount_zar DECIMAL(12,2), -- Calculated: amount + arrears + penalty
  -- Document
  license_disc_image_url VARCHAR(500),
  license_disc_image_key VARCHAR(255),
  -- Lock fields
  is_locked BOOLEAN DEFAULT FALSE,
  locked_at TIMESTAMP WITH TIME ZONE,
  locked_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  locked_reason TEXT,
  -- Notes
  notes TEXT,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_license_renewals_org ON license_renewals(organization_id);
CREATE INDEX idx_license_renewals_vehicle ON license_renewals(vehicle_id);
CREATE INDEX idx_license_renewals_expiry ON license_renewals(expiry_date);
CREATE INDEX idx_license_renewals_locked ON license_renewals(is_locked);

-- Enable RLS
ALTER TABLE license_renewals ENABLE ROW LEVEL SECURITY;

CREATE POLICY license_renewals_select_policy ON license_renewals
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id')::UUID
  ));

CREATE POLICY license_renewals_insert_policy ON license_renewals
  FOR INSERT WITH CHECK (organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id')::UUID
  ));

CREATE POLICY license_renewals_update_policy ON license_renewals
  FOR UPDATE USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id')::UUID
  ) AND is_locked = FALSE);

CREATE POLICY license_renewals_delete_policy ON license_renewals
  FOR DELETE USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id')::UUID
  ) AND is_locked = FALSE);

-- ============================================================================
-- ROADWORTHY CERTIFICATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS roadworthy_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  -- Certificate Details
  certificate_number VARCHAR(100),
  certificate_type VARCHAR(50) DEFAULT 'ROADWORTHY', -- ROADWORTHY, COF (Certificate of Fitness)
  issue_date DATE NOT NULL,
  expiry_date DATE, -- COF certificates expire, roadworthy usually doesn't
  amount_zar DECIMAL(12,2) NOT NULL,
  -- Testing Station
  testing_station_name VARCHAR(100) NOT NULL,
  testing_station_number VARCHAR(50), -- Registration number
  testing_station_address VARCHAR(255),
  testing_station_phone VARCHAR(20),
  -- Inspection Details
  inspector_name VARCHAR(100),
  inspection_date DATE NOT NULL,
  odometer_at_inspection INTEGER,
  -- Pass/Fail History
  attempt_number INTEGER DEFAULT 1,
  previous_fail_reasons TEXT[], -- Array of reasons if this is a retry
  -- Document
  certificate_image_url VARCHAR(500),
  certificate_image_key VARCHAR(255),
  -- Lock fields
  is_locked BOOLEAN DEFAULT FALSE,
  locked_at TIMESTAMP WITH TIME ZONE,
  locked_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  locked_reason TEXT,
  -- Notes
  notes TEXT,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_roadworthy_certificates_org ON roadworthy_certificates(organization_id);
CREATE INDEX idx_roadworthy_certificates_vehicle ON roadworthy_certificates(vehicle_id);
CREATE INDEX idx_roadworthy_certificates_expiry ON roadworthy_certificates(expiry_date);
CREATE INDEX idx_roadworthy_certificates_locked ON roadworthy_certificates(is_locked);

-- Enable RLS
ALTER TABLE roadworthy_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY roadworthy_certificates_select_policy ON roadworthy_certificates
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id')::UUID
  ));

CREATE POLICY roadworthy_certificates_insert_policy ON roadworthy_certificates
  FOR INSERT WITH CHECK (organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id')::UUID
  ));

CREATE POLICY roadworthy_certificates_update_policy ON roadworthy_certificates
  FOR UPDATE USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id')::UUID
  ) AND is_locked = FALSE);

CREATE POLICY roadworthy_certificates_delete_policy ON roadworthy_certificates
  FOR DELETE USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id')::UUID
  ) AND is_locked = FALSE);

-- ============================================================================
-- OTHER FIXED EXPENSES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS other_fixed_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  -- Expense Details
  expense_name VARCHAR(100) NOT NULL, -- User-defined name
  expense_description TEXT,
  amount_zar DECIMAL(12,2) NOT NULL,
  expense_date DATE NOT NULL,
  -- Recurrence (for budgeting)
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_frequency VARCHAR(20), -- WEEKLY, MONTHLY, QUARTERLY, ANNUAL
  next_due_date DATE,
  -- Provider
  provider_name VARCHAR(100),
  reference_number VARCHAR(100),
  -- Lock fields
  is_locked BOOLEAN DEFAULT FALSE,
  locked_at TIMESTAMP WITH TIME ZONE,
  locked_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  locked_reason TEXT,
  -- Notes
  notes TEXT,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_other_fixed_expenses_org ON other_fixed_expenses(organization_id);
CREATE INDEX idx_other_fixed_expenses_vehicle ON other_fixed_expenses(vehicle_id);
CREATE INDEX idx_other_fixed_expenses_date ON other_fixed_expenses(expense_date);
CREATE INDEX idx_other_fixed_expenses_recurring ON other_fixed_expenses(is_recurring, next_due_date);
CREATE INDEX idx_other_fixed_expenses_locked ON other_fixed_expenses(is_locked);

-- Enable RLS
ALTER TABLE other_fixed_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY other_fixed_expenses_select_policy ON other_fixed_expenses
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id')::UUID
  ));

CREATE POLICY other_fixed_expenses_insert_policy ON other_fixed_expenses
  FOR INSERT WITH CHECK (organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id')::UUID
  ));

CREATE POLICY other_fixed_expenses_update_policy ON other_fixed_expenses
  FOR UPDATE USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id')::UUID
  ) AND is_locked = FALSE);

CREATE POLICY other_fixed_expenses_delete_policy ON other_fixed_expenses
  FOR DELETE USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id')::UUID
  ) AND is_locked = FALSE);

-- ============================================================================
-- VIEWS FOR EACH FIXED EXPENSE TYPE
-- ============================================================================

-- Insurance Premiums View with vehicle and user details
CREATE OR REPLACE VIEW v_insurance_premiums AS
SELECT 
  ip.*,
  v.registration_number AS vehicle_registration,
  v.make || ' ' || v.model AS vehicle_name,
  u.first_name || ' ' || u.last_name AS created_by_name,
  lu.first_name || ' ' || lu.last_name AS locked_by_name,
  (SELECT COUNT(*) FROM entry_images ei WHERE ei.entry_type = 'EXPENSE' AND ei.entry_id = ip.expense_id) AS image_count
FROM insurance_premiums ip
INNER JOIN vehicles v ON ip.vehicle_id = v.id
INNER JOIN users u ON ip.user_id = u.id
LEFT JOIN users lu ON ip.locked_by_user_id = lu.id;

-- Vehicle Tracking View
CREATE OR REPLACE VIEW v_vehicle_tracking AS
SELECT 
  vt.*,
  v.registration_number AS vehicle_registration,
  v.make || ' ' || v.model AS vehicle_name,
  u.first_name || ' ' || u.last_name AS created_by_name,
  lu.first_name || ' ' || lu.last_name AS locked_by_name,
  (SELECT COUNT(*) FROM entry_images ei WHERE ei.entry_type = 'EXPENSE' AND ei.entry_id = vt.expense_id) AS image_count
FROM vehicle_tracking vt
INNER JOIN vehicles v ON vt.vehicle_id = v.id
INNER JOIN users u ON vt.user_id = u.id
LEFT JOIN users lu ON vt.locked_by_user_id = lu.id;

-- E-Tolls View
CREATE OR REPLACE VIEW v_etolls AS
SELECT 
  et.*,
  v.registration_number AS vehicle_registration,
  v.make || ' ' || v.model AS vehicle_name,
  u.first_name || ' ' || u.last_name AS created_by_name,
  lu.first_name || ' ' || lu.last_name AS locked_by_name,
  t.start_location AS trip_start,
  t.end_location AS trip_end,
  (SELECT COUNT(*) FROM entry_images ei WHERE ei.entry_type = 'EXPENSE' AND ei.entry_id = et.expense_id) AS image_count
FROM etolls et
INNER JOIN vehicles v ON et.vehicle_id = v.id
INNER JOIN users u ON et.user_id = u.id
LEFT JOIN users lu ON et.locked_by_user_id = lu.id
LEFT JOIN trips t ON et.trip_id = t.id;

-- License Renewals View
CREATE OR REPLACE VIEW v_license_renewals AS
SELECT 
  lr.*,
  v.registration_number AS vehicle_registration,
  v.make || ' ' || v.model AS vehicle_name,
  u.first_name || ' ' || u.last_name AS created_by_name,
  lu.first_name || ' ' || lu.last_name AS locked_by_name,
  CASE 
    WHEN lr.expiry_date < CURRENT_DATE THEN 'EXPIRED'
    WHEN lr.expiry_date < CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING_SOON'
    ELSE 'VALID'
  END AS license_status,
  (SELECT COUNT(*) FROM entry_images ei WHERE ei.entry_type = 'EXPENSE' AND ei.entry_id = lr.expense_id) AS image_count
FROM license_renewals lr
INNER JOIN vehicles v ON lr.vehicle_id = v.id
INNER JOIN users u ON lr.user_id = u.id
LEFT JOIN users lu ON lr.locked_by_user_id = lu.id;

-- Roadworthy Certificates View
CREATE OR REPLACE VIEW v_roadworthy_certificates AS
SELECT 
  rc.*,
  v.registration_number AS vehicle_registration,
  v.make || ' ' || v.model AS vehicle_name,
  u.first_name || ' ' || u.last_name AS created_by_name,
  lu.first_name || ' ' || lu.last_name AS locked_by_name,
  CASE 
    WHEN rc.expiry_date IS NULL THEN 'NO_EXPIRY'
    WHEN rc.expiry_date < CURRENT_DATE THEN 'EXPIRED'
    WHEN rc.expiry_date < CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING_SOON'
    ELSE 'VALID'
  END AS certificate_status,
  (SELECT COUNT(*) FROM entry_images ei WHERE ei.entry_type = 'EXPENSE' AND ei.entry_id = rc.expense_id) AS image_count
FROM roadworthy_certificates rc
INNER JOIN vehicles v ON rc.vehicle_id = v.id
INNER JOIN users u ON rc.user_id = u.id
LEFT JOIN users lu ON rc.locked_by_user_id = lu.id;

-- Other Fixed Expenses View
CREATE OR REPLACE VIEW v_other_fixed_expenses AS
SELECT 
  ofe.*,
  v.registration_number AS vehicle_registration,
  v.make || ' ' || v.model AS vehicle_name,
  u.first_name || ' ' || u.last_name AS created_by_name,
  lu.first_name || ' ' || lu.last_name AS locked_by_name,
  CASE 
    WHEN ofe.is_recurring AND ofe.next_due_date < CURRENT_DATE THEN 'OVERDUE'
    WHEN ofe.is_recurring AND ofe.next_due_date < CURRENT_DATE + INTERVAL '7 days' THEN 'DUE_SOON'
    ELSE 'OK'
  END AS payment_status,
  (SELECT COUNT(*) FROM entry_images ei WHERE ei.entry_type = 'EXPENSE' AND ei.entry_id = ofe.expense_id) AS image_count
FROM other_fixed_expenses ofe
INNER JOIN vehicles v ON ofe.vehicle_id = v.id
INNER JOIN users u ON ofe.user_id = u.id
LEFT JOIN users lu ON ofe.locked_by_user_id = lu.id;

-- ============================================================================
-- COMBINED FIXED ADMIN VIEW (for backwards compatibility)
-- ============================================================================

CREATE OR REPLACE VIEW v_all_fixed_admin_expenses AS
SELECT 
  'INSURANCE' AS expense_type,
  ip.id,
  ip.organization_id,
  ip.vehicle_id,
  ip.expense_id,
  ip.insurance_company AS provider_name,
  ip.policy_number AS reference_number,
  ip.premium_amount_zar AS amount_zar,
  ip.coverage_start_date AS effective_date,
  ip.coverage_end_date AS end_date,
  ip.is_locked,
  ip.locked_at,
  ip.locked_reason,
  ip.notes,
  ip.created_at,
  v.registration_number AS vehicle_registration,
  v.make || ' ' || v.model AS vehicle_name,
  (SELECT COUNT(*) FROM entry_images ei WHERE ei.entry_type = 'EXPENSE' AND ei.entry_id = ip.expense_id) AS image_count
FROM insurance_premiums ip
INNER JOIN vehicles v ON ip.vehicle_id = v.id

UNION ALL

SELECT 
  'TRACKING' AS expense_type,
  vt.id,
  vt.organization_id,
  vt.vehicle_id,
  vt.expense_id,
  vt.provider_name,
  vt.account_number AS reference_number,
  vt.subscription_amount_zar AS amount_zar,
  vt.contract_start_date AS effective_date,
  vt.contract_end_date AS end_date,
  vt.is_locked,
  vt.locked_at,
  vt.locked_reason,
  vt.notes,
  vt.created_at,
  v.registration_number AS vehicle_registration,
  v.make || ' ' || v.model AS vehicle_name,
  (SELECT COUNT(*) FROM entry_images ei WHERE ei.entry_type = 'EXPENSE' AND ei.entry_id = vt.expense_id) AS image_count
FROM vehicle_tracking vt
INNER JOIN vehicles v ON vt.vehicle_id = v.id

UNION ALL

SELECT 
  'ETOLL' AS expense_type,
  et.id,
  et.organization_id,
  et.vehicle_id,
  et.expense_id,
  'SANRAL' AS provider_name,
  et.etag_number AS reference_number,
  et.amount_zar,
  et.toll_date AS effective_date,
  NULL AS end_date,
  et.is_locked,
  et.locked_at,
  et.locked_reason,
  et.notes,
  et.created_at,
  v.registration_number AS vehicle_registration,
  v.make || ' ' || v.model AS vehicle_name,
  (SELECT COUNT(*) FROM entry_images ei WHERE ei.entry_type = 'EXPENSE' AND ei.entry_id = et.expense_id) AS image_count
FROM etolls et
INNER JOIN vehicles v ON et.vehicle_id = v.id

UNION ALL

SELECT 
  'LICENSE' AS expense_type,
  lr.id,
  lr.organization_id,
  lr.vehicle_id,
  lr.expense_id,
  lr.licensing_authority AS provider_name,
  lr.transaction_number AS reference_number,
  lr.amount_zar,
  lr.renewal_date AS effective_date,
  lr.expiry_date AS end_date,
  lr.is_locked,
  lr.locked_at,
  lr.locked_reason,
  lr.notes,
  lr.created_at,
  v.registration_number AS vehicle_registration,
  v.make || ' ' || v.model AS vehicle_name,
  (SELECT COUNT(*) FROM entry_images ei WHERE ei.entry_type = 'EXPENSE' AND ei.entry_id = lr.expense_id) AS image_count
FROM license_renewals lr
INNER JOIN vehicles v ON lr.vehicle_id = v.id

UNION ALL

SELECT 
  'ROADWORTHY' AS expense_type,
  rc.id,
  rc.organization_id,
  rc.vehicle_id,
  rc.expense_id,
  rc.testing_station_name AS provider_name,
  rc.certificate_number AS reference_number,
  rc.amount_zar,
  rc.issue_date AS effective_date,
  rc.expiry_date AS end_date,
  rc.is_locked,
  rc.locked_at,
  rc.locked_reason,
  rc.notes,
  rc.created_at,
  v.registration_number AS vehicle_registration,
  v.make || ' ' || v.model AS vehicle_name,
  (SELECT COUNT(*) FROM entry_images ei WHERE ei.entry_type = 'EXPENSE' AND ei.entry_id = rc.expense_id) AS image_count
FROM roadworthy_certificates rc
INNER JOIN vehicles v ON rc.vehicle_id = v.id

UNION ALL

SELECT 
  'OTHER' AS expense_type,
  ofe.id,
  ofe.organization_id,
  ofe.vehicle_id,
  ofe.expense_id,
  ofe.provider_name,
  ofe.reference_number,
  ofe.amount_zar,
  ofe.expense_date AS effective_date,
  ofe.next_due_date AS end_date,
  ofe.is_locked,
  ofe.locked_at,
  ofe.locked_reason,
  ofe.notes,
  ofe.created_at,
  v.registration_number AS vehicle_registration,
  v.make || ' ' || v.model AS vehicle_name,
  (SELECT COUNT(*) FROM entry_images ei WHERE ei.entry_type = 'EXPENSE' AND ei.entry_id = ofe.expense_id) AS image_count
FROM other_fixed_expenses ofe
INNER JOIN vehicles v ON ofe.vehicle_id = v.id;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON insurance_premiums TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON vehicle_tracking TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON etolls TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON license_renewals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON roadworthy_certificates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON other_fixed_expenses TO authenticated;

GRANT SELECT ON v_insurance_premiums TO authenticated;
GRANT SELECT ON v_vehicle_tracking TO authenticated;
GRANT SELECT ON v_etolls TO authenticated;
GRANT SELECT ON v_license_renewals TO authenticated;
GRANT SELECT ON v_roadworthy_certificates TO authenticated;
GRANT SELECT ON v_other_fixed_expenses TO authenticated;
GRANT SELECT ON v_all_fixed_admin_expenses TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE insurance_premiums IS 'Vehicle insurance policy records';
COMMENT ON TABLE vehicle_tracking IS 'GPS/tracking service subscriptions';
COMMENT ON TABLE etolls IS 'E-toll (SANRAL) charge records';
COMMENT ON TABLE license_renewals IS 'Vehicle license/registration renewal records';
COMMENT ON TABLE roadworthy_certificates IS 'Roadworthy and COF certificate records';
COMMENT ON TABLE other_fixed_expenses IS 'Miscellaneous fixed vehicle expenses';

COMMENT ON VIEW v_all_fixed_admin_expenses IS 'Combined view of all fixed/admin expenses for unified listing';
