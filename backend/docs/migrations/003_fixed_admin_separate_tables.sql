-- Migration 003: Separate Tables for Fixed & Admin Expenses
-- Each expense type gets its own dedicated table
-- ============================================================================

-- ============================================================================
-- INSURANCE PREMIUMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS insurance_premiums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  insurer_name VARCHAR(100) NOT NULL,
  policy_number VARCHAR(50) NOT NULL,
  policy_type VARCHAR(30) NOT NULL CHECK (policy_type IN ('COMPREHENSIVE', 'THIRD_PARTY', 'THIRD_PARTY_FIRE_THEFT')),
  coverage_start_date DATE NOT NULL,
  coverage_end_date DATE NOT NULL,
  monthly_premium_zar DECIMAL(10,2) NOT NULL,
  excess_amount_zar DECIMAL(10,2),
  broker_name VARCHAR(100),
  broker_phone VARCHAR(20),
  claim_phone_number VARCHAR(20),
  cover_details TEXT,
  is_locked BOOLEAN DEFAULT FALSE,
  locked_at TIMESTAMP WITH TIME ZONE,
  locked_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  locked_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insurance_expense ON insurance_premiums(expense_id);
CREATE INDEX IF NOT EXISTS idx_insurance_coverage ON insurance_premiums(coverage_end_date);

-- ============================================================================
-- VEHICLE TRACKING SUBSCRIPTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS vehicle_tracking_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  provider_name VARCHAR(100) NOT NULL,
  subscription_type VARCHAR(20) NOT NULL CHECK (subscription_type IN ('MONTHLY', 'ANNUAL', 'ONCE_OFF')),
  monthly_fee_zar DECIMAL(10,2) NOT NULL,
  contract_start_date DATE NOT NULL,
  contract_end_date DATE,
  device_serial_number VARCHAR(50),
  device_type VARCHAR(50),
  installation_date DATE,
  recovery_included BOOLEAN DEFAULT FALSE,
  app_login_email VARCHAR(100),
  support_phone_number VARCHAR(20),
  features TEXT,
  is_locked BOOLEAN DEFAULT FALSE,
  locked_at TIMESTAMP WITH TIME ZONE,
  locked_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  locked_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracking_expense ON vehicle_tracking_subscriptions(expense_id);
CREATE INDEX IF NOT EXISTS idx_tracking_contract ON vehicle_tracking_subscriptions(contract_end_date);

-- ============================================================================
-- E-TOLL (SANRAL) PAYMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS etoll_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  account_number VARCHAR(50),
  tag_serial_number VARCHAR(50),
  vehicle_registration VARCHAR(20) NOT NULL,
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('ETAG', 'VIOLATION', 'ALTERNATE_ROUTE', 'MONTHLY_PASS')),
  toll_routes TEXT,
  period_start_date DATE,
  period_end_date DATE,
  total_gantries INTEGER,
  total_amount_zar DECIMAL(10,2) NOT NULL,
  vat_amount_zar DECIMAL(10,2),
  reference_number VARCHAR(50),
  notes TEXT,
  is_locked BOOLEAN DEFAULT FALSE,
  locked_at TIMESTAMP WITH TIME ZONE,
  locked_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  locked_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_etoll_expense ON etoll_payments(expense_id);

-- ============================================================================
-- LICENSE RENEWALS
-- ============================================================================
CREATE TABLE IF NOT EXISTS license_renewals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  license_type VARCHAR(20) NOT NULL CHECK (license_type IN ('VEHICLE_LICENSE', 'DRIVERS_LICENSE', 'PDP', 'OPERATING_LICENSE')),
  license_number VARCHAR(50),
  registration_authority VARCHAR(100),
  previous_expiry_date DATE,
  new_expiry_date DATE NOT NULL,
  renewal_fee_zar DECIMAL(10,2) NOT NULL,
  penalties_zar DECIMAL(10,2) DEFAULT 0,
  arrears_zar DECIMAL(10,2) DEFAULT 0,
  transaction_number VARCHAR(50),
  renewal_method VARCHAR(20) NOT NULL CHECK (renewal_method IN ('ONLINE', 'POST_OFFICE', 'LICENSING_DEPT', 'AGENT')),
  processing_days INTEGER,
  notes TEXT,
  is_locked BOOLEAN DEFAULT FALSE,
  locked_at TIMESTAMP WITH TIME ZONE,
  locked_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  locked_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_license_expense ON license_renewals(expense_id);
CREATE INDEX IF NOT EXISTS idx_license_expiry ON license_renewals(new_expiry_date);

-- ============================================================================
-- ROADWORTHY CERTIFICATES
-- ============================================================================
CREATE TABLE IF NOT EXISTS roadworthy_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  testing_station_name VARCHAR(100) NOT NULL,
  testing_station_address TEXT,
  testing_station_phone VARCHAR(20),
  test_date DATE NOT NULL,
  certificate_number VARCHAR(50),
  expiry_date DATE,
  test_result VARCHAR(20) NOT NULL CHECK (test_result IN ('PASS', 'FAIL', 'CONDITIONAL_PASS')),
  test_fee_zar DECIMAL(10,2) NOT NULL,
  retest_fee_zar DECIMAL(10,2),
  inspector_name VARCHAR(100),
  vehicle_odometer INTEGER,
  failure_reasons TEXT,
  conditions_applied TEXT,
  notes TEXT,
  is_locked BOOLEAN DEFAULT FALSE,
  locked_at TIMESTAMP WITH TIME ZONE,
  locked_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  locked_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roadworthy_expense ON roadworthy_certificates(expense_id);
CREATE INDEX IF NOT EXISTS idx_roadworthy_expiry ON roadworthy_certificates(expiry_date);

-- ============================================================================
-- OTHER FIXED EXPENSES
-- ============================================================================
CREATE TABLE IF NOT EXISTS other_fixed_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  expense_description VARCHAR(255) NOT NULL,
  category_label VARCHAR(100),
  provider_name VARCHAR(100),
  reference_number VARCHAR(50),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_frequency VARCHAR(20) CHECK (recurrence_frequency IN ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'ONCE_OFF')),
  period_start_date DATE,
  period_end_date DATE,
  notes TEXT,
  is_locked BOOLEAN DEFAULT FALSE,
  locked_at TIMESTAMP WITH TIME ZONE,
  locked_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  locked_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_other_fixed_expense ON other_fixed_expenses(expense_id);

-- Enable RLS on all new tables
ALTER TABLE insurance_premiums ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_tracking_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE etoll_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_renewals ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadworthy_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE other_fixed_expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies (via parent expense organization)
CREATE POLICY insurance_org_policy ON insurance_premiums FOR ALL
  USING (expense_id IN (SELECT id FROM expenses WHERE organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id', true)::UUID
  )));

CREATE POLICY tracking_org_policy ON vehicle_tracking_subscriptions FOR ALL
  USING (expense_id IN (SELECT id FROM expenses WHERE organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id', true)::UUID
  )));

CREATE POLICY etoll_org_policy ON etoll_payments FOR ALL
  USING (expense_id IN (SELECT id FROM expenses WHERE organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id', true)::UUID
  )));

CREATE POLICY license_org_policy ON license_renewals FOR ALL
  USING (expense_id IN (SELECT id FROM expenses WHERE organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id', true)::UUID
  )));

CREATE POLICY roadworthy_org_policy ON roadworthy_certificates FOR ALL
  USING (expense_id IN (SELECT id FROM expenses WHERE organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id', true)::UUID
  )));

CREATE POLICY other_fixed_org_policy ON other_fixed_expenses FOR ALL
  USING (expense_id IN (SELECT id FROM expenses WHERE organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id', true)::UUID
  )));

GRANT SELECT, INSERT, UPDATE, DELETE ON insurance_premiums TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON vehicle_tracking_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON etoll_payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON license_renewals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON roadworthy_certificates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON other_fixed_expenses TO authenticated;
