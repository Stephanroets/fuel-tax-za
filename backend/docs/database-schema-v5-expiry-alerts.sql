-- ============================================================================
-- FUEL TAX ZA - EXPIRY ALERTS SYSTEM
-- PostgreSQL 16 Schema for tracking expiring documents and renewals
-- ============================================================================

-- ============================================================================
-- EXPIRY ALERT TYPES
-- ============================================================================

CREATE TYPE expiry_item_type AS ENUM (
  'VEHICLE_LICENSE',      -- Vehicle license disc
  'DRIVERS_LICENSE',      -- Driver's license
  'PDP',                  -- Professional Driving Permit
  'INSURANCE',            -- Insurance policy coverage
  'TRACKING_CONTRACT',    -- Vehicle tracking subscription
  'ROADWORTHY',           -- Roadworthy/COF certificate
  'OPERATING_LICENSE'     -- Operating license
);

CREATE TYPE expiry_status AS ENUM (
  'VALID',                -- Not expiring soon (> 60 days)
  'UPCOMING',             -- Expiring in 31-60 days
  'WARNING',              -- Expiring in 8-30 days
  'CRITICAL',             -- Expiring in 0-7 days
  'EXPIRED'               -- Already expired
);

-- ============================================================================
-- FUNCTION: Get all expiring items for an organization
-- Returns a unified list of all items that are expiring or expired
-- ============================================================================

CREATE OR REPLACE FUNCTION get_expiry_alerts(
  p_organization_id UUID,
  p_include_valid BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  item_type expiry_item_type,
  item_id UUID,
  related_id UUID,
  item_name TEXT,
  item_description TEXT,
  vehicle_id UUID,
  vehicle_registration VARCHAR(20),
  vehicle_name TEXT,
  user_id UUID,
  user_name TEXT,
  expiry_date DATE,
  days_until_expiry INTEGER,
  expiry_status expiry_status,
  renewal_url TEXT,
  is_dismissed BOOLEAN,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  last_notified_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  
  -- 1. Vehicle License Disc
  SELECT 
    'VEHICLE_LICENSE'::expiry_item_type AS item_type,
    v.id AS item_id,
    v.id AS related_id,
    'Vehicle License'::TEXT AS item_name,
    ('License disc for ' || v.registration_number)::TEXT AS item_description,
    v.id AS vehicle_id,
    v.registration_number AS vehicle_registration,
    (v.make || ' ' || v.model)::TEXT AS vehicle_name,
    NULL::UUID AS user_id,
    NULL::TEXT AS user_name,
    v.license_expiry AS expiry_date,
    (v.license_expiry - CURRENT_DATE)::INTEGER AS days_until_expiry,
    CASE 
      WHEN v.license_expiry < CURRENT_DATE THEN 'EXPIRED'::expiry_status
      WHEN v.license_expiry <= CURRENT_DATE + INTERVAL '7 days' THEN 'CRITICAL'::expiry_status
      WHEN v.license_expiry <= CURRENT_DATE + INTERVAL '30 days' THEN 'WARNING'::expiry_status
      WHEN v.license_expiry <= CURRENT_DATE + INTERVAL '60 days' THEN 'UPCOMING'::expiry_status
      ELSE 'VALID'::expiry_status
    END AS expiry_status,
    'https://online.natis.gov.za/'::TEXT AS renewal_url,
    COALESCE(ed.is_dismissed, FALSE) AS is_dismissed,
    ed.dismissed_at,
    ed.last_notified_at
  FROM vehicles v
  LEFT JOIN expiry_dismissals ed ON ed.item_type = 'VEHICLE_LICENSE' AND ed.item_id = v.id
  WHERE v.organization_id = p_organization_id
    AND v.is_active = TRUE
    AND v.license_expiry IS NOT NULL
    AND (p_include_valid OR v.license_expiry <= CURRENT_DATE + INTERVAL '60 days')
  
  UNION ALL
  
  -- 2. Driver's License
  SELECT 
    'DRIVERS_LICENSE'::expiry_item_type,
    u.id,
    u.id,
    'Driver''s License'::TEXT,
    ('Driver''s license for ' || u.first_name || ' ' || u.last_name)::TEXT,
    NULL::UUID,
    NULL::VARCHAR(20),
    NULL::TEXT,
    u.id,
    (u.first_name || ' ' || u.last_name)::TEXT,
    u.drivers_license_expiry,
    (u.drivers_license_expiry - CURRENT_DATE)::INTEGER,
    CASE 
      WHEN u.drivers_license_expiry < CURRENT_DATE THEN 'EXPIRED'::expiry_status
      WHEN u.drivers_license_expiry <= CURRENT_DATE + INTERVAL '7 days' THEN 'CRITICAL'::expiry_status
      WHEN u.drivers_license_expiry <= CURRENT_DATE + INTERVAL '30 days' THEN 'WARNING'::expiry_status
      WHEN u.drivers_license_expiry <= CURRENT_DATE + INTERVAL '60 days' THEN 'UPCOMING'::expiry_status
      ELSE 'VALID'::expiry_status
    END,
    'https://online.natis.gov.za/'::TEXT,
    COALESCE(ed.is_dismissed, FALSE),
    ed.dismissed_at,
    ed.last_notified_at
  FROM users u
  LEFT JOIN expiry_dismissals ed ON ed.item_type = 'DRIVERS_LICENSE' AND ed.item_id = u.id
  WHERE u.organization_id = p_organization_id
    AND u.is_active = TRUE
    AND u.drivers_license_expiry IS NOT NULL
    AND (p_include_valid OR u.drivers_license_expiry <= CURRENT_DATE + INTERVAL '60 days')
  
  UNION ALL
  
  -- 3. Insurance Coverage
  SELECT 
    'INSURANCE'::expiry_item_type,
    ip.id,
    ip.expense_id,
    ('Insurance - ' || ip.insurer_name)::TEXT,
    ('Policy ' || ip.policy_number || ' coverage ending')::TEXT,
    e.vehicle_id,
    v.registration_number,
    (v.make || ' ' || v.model)::TEXT,
    NULL::UUID,
    NULL::TEXT,
    ip.coverage_end_date,
    (ip.coverage_end_date - CURRENT_DATE)::INTEGER,
    CASE 
      WHEN ip.coverage_end_date < CURRENT_DATE THEN 'EXPIRED'::expiry_status
      WHEN ip.coverage_end_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'CRITICAL'::expiry_status
      WHEN ip.coverage_end_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'WARNING'::expiry_status
      WHEN ip.coverage_end_date <= CURRENT_DATE + INTERVAL '60 days' THEN 'UPCOMING'::expiry_status
      ELSE 'VALID'::expiry_status
    END,
    NULL::TEXT,
    COALESCE(ed.is_dismissed, FALSE),
    ed.dismissed_at,
    ed.last_notified_at
  FROM insurance_premiums ip
  INNER JOIN expenses e ON ip.expense_id = e.id
  INNER JOIN vehicles v ON e.vehicle_id = v.id
  LEFT JOIN expiry_dismissals ed ON ed.item_type = 'INSURANCE' AND ed.item_id = ip.id
  WHERE e.organization_id = p_organization_id
    AND ip.coverage_end_date IS NOT NULL
    AND (p_include_valid OR ip.coverage_end_date <= CURRENT_DATE + INTERVAL '60 days')
  
  UNION ALL
  
  -- 4. Vehicle Tracking Contract
  SELECT 
    'TRACKING_CONTRACT'::expiry_item_type,
    vt.id,
    vt.expense_id,
    ('Tracking - ' || vt.provider_name)::TEXT,
    ('Contract ending for tracker')::TEXT,
    e.vehicle_id,
    v.registration_number,
    (v.make || ' ' || v.model)::TEXT,
    NULL::UUID,
    NULL::TEXT,
    vt.contract_end_date,
    (vt.contract_end_date - CURRENT_DATE)::INTEGER,
    CASE 
      WHEN vt.contract_end_date < CURRENT_DATE THEN 'EXPIRED'::expiry_status
      WHEN vt.contract_end_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'CRITICAL'::expiry_status
      WHEN vt.contract_end_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'WARNING'::expiry_status
      WHEN vt.contract_end_date <= CURRENT_DATE + INTERVAL '60 days' THEN 'UPCOMING'::expiry_status
      ELSE 'VALID'::expiry_status
    END,
    NULL::TEXT,
    COALESCE(ed.is_dismissed, FALSE),
    ed.dismissed_at,
    ed.last_notified_at
  FROM vehicle_tracking vt
  INNER JOIN expenses e ON vt.expense_id = e.id
  INNER JOIN vehicles v ON e.vehicle_id = v.id
  LEFT JOIN expiry_dismissals ed ON ed.item_type = 'TRACKING_CONTRACT' AND ed.item_id = vt.id
  WHERE e.organization_id = p_organization_id
    AND vt.contract_end_date IS NOT NULL
    AND (p_include_valid OR vt.contract_end_date <= CURRENT_DATE + INTERVAL '60 days')
  
  UNION ALL
  
  -- 5. License Renewals (from license_renewals table)
  SELECT 
    lr.license_type::expiry_item_type,
    lr.id,
    lr.expense_id,
    CASE lr.license_type
      WHEN 'VEHICLE_LICENSE' THEN 'Vehicle License Renewal'
      WHEN 'DRIVERS_LICENSE' THEN 'Driver''s License Renewal'
      WHEN 'PDP' THEN 'PDP Renewal'
      WHEN 'OPERATING_LICENSE' THEN 'Operating License Renewal'
    END::TEXT,
    ('License #' || COALESCE(lr.license_number, 'N/A') || ' expiring')::TEXT,
    e.vehicle_id,
    v.registration_number,
    (v.make || ' ' || v.model)::TEXT,
    e.user_id,
    (u.first_name || ' ' || u.last_name)::TEXT,
    lr.expiry_date,
    (lr.expiry_date - CURRENT_DATE)::INTEGER,
    CASE 
      WHEN lr.expiry_date < CURRENT_DATE THEN 'EXPIRED'::expiry_status
      WHEN lr.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'CRITICAL'::expiry_status
      WHEN lr.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'WARNING'::expiry_status
      WHEN lr.expiry_date <= CURRENT_DATE + INTERVAL '60 days' THEN 'UPCOMING'::expiry_status
      ELSE 'VALID'::expiry_status
    END,
    'https://online.natis.gov.za/'::TEXT,
    COALESCE(ed.is_dismissed, FALSE),
    ed.dismissed_at,
    ed.last_notified_at
  FROM license_renewals lr
  INNER JOIN expenses e ON lr.expense_id = e.id
  INNER JOIN vehicles v ON e.vehicle_id = v.id
  INNER JOIN users u ON e.user_id = u.id
  LEFT JOIN expiry_dismissals ed ON ed.item_type = lr.license_type::expiry_item_type AND ed.item_id = lr.id
  WHERE e.organization_id = p_organization_id
    AND lr.expiry_date IS NOT NULL
    AND (p_include_valid OR lr.expiry_date <= CURRENT_DATE + INTERVAL '60 days')
  
  UNION ALL
  
  -- 6. Roadworthy Certificate
  SELECT 
    'ROADWORTHY'::expiry_item_type,
    rc.id,
    rc.expense_id,
    'Roadworthy Certificate'::TEXT,
    ('Certificate #' || COALESCE(rc.certificate_number, 'N/A') || ' from ' || rc.testing_station_name)::TEXT,
    e.vehicle_id,
    v.registration_number,
    (v.make || ' ' || v.model)::TEXT,
    NULL::UUID,
    NULL::TEXT,
    rc.expiry_date,
    (rc.expiry_date - CURRENT_DATE)::INTEGER,
    CASE 
      WHEN rc.expiry_date < CURRENT_DATE THEN 'EXPIRED'::expiry_status
      WHEN rc.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'CRITICAL'::expiry_status
      WHEN rc.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'WARNING'::expiry_status
      WHEN rc.expiry_date <= CURRENT_DATE + INTERVAL '60 days' THEN 'UPCOMING'::expiry_status
      ELSE 'VALID'::expiry_status
    END,
    NULL::TEXT,
    COALESCE(ed.is_dismissed, FALSE),
    ed.dismissed_at,
    ed.last_notified_at
  FROM roadworthy_certificates rc
  INNER JOIN expenses e ON rc.expense_id = e.id
  INNER JOIN vehicles v ON e.vehicle_id = v.id
  LEFT JOIN expiry_dismissals ed ON ed.item_type = 'ROADWORTHY' AND ed.item_id = rc.id
  WHERE e.organization_id = p_organization_id
    AND rc.expiry_date IS NOT NULL
    AND rc.test_result IN ('PASS', 'CONDITIONAL_PASS')
    AND (p_include_valid OR rc.expiry_date <= CURRENT_DATE + INTERVAL '60 days')
  
  ORDER BY expiry_date ASC NULLS LAST;
  
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABLE: Expiry Dismissals
-- Track which expiry alerts have been dismissed by users
-- ============================================================================

CREATE TABLE IF NOT EXISTS expiry_dismissals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  item_type expiry_item_type NOT NULL,
  item_id UUID NOT NULL,
  is_dismissed BOOLEAN DEFAULT TRUE,
  dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  dismissed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  dismiss_until_date DATE, -- Optional: auto-undismiss after this date
  dismiss_reason TEXT,
  last_notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, item_type, item_id)
);

CREATE INDEX idx_expiry_dismissals_org ON expiry_dismissals(organization_id);
CREATE INDEX idx_expiry_dismissals_item ON expiry_dismissals(item_type, item_id);
CREATE INDEX idx_expiry_dismissals_dismissed ON expiry_dismissals(is_dismissed);

-- Enable RLS
ALTER TABLE expiry_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY expiry_dismissals_select_policy ON expiry_dismissals
  FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id')::UUID
  ));

CREATE POLICY expiry_dismissals_insert_policy ON expiry_dismissals
  FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id')::UUID
  ));

CREATE POLICY expiry_dismissals_update_policy ON expiry_dismissals
  FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id')::UUID
  ));

-- ============================================================================
-- FUNCTION: Dismiss expiry alert
-- ============================================================================

CREATE OR REPLACE FUNCTION dismiss_expiry_alert(
  p_organization_id UUID,
  p_item_type expiry_item_type,
  p_item_id UUID,
  p_user_id UUID,
  p_dismiss_until DATE DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO expiry_dismissals (
    organization_id,
    item_type,
    item_id,
    is_dismissed,
    dismissed_at,
    dismissed_by_user_id,
    dismiss_until_date,
    dismiss_reason
  ) VALUES (
    p_organization_id,
    p_item_type,
    p_item_id,
    TRUE,
    NOW(),
    p_user_id,
    p_dismiss_until,
    p_reason
  )
  ON CONFLICT (organization_id, item_type, item_id) DO UPDATE SET
    is_dismissed = TRUE,
    dismissed_at = NOW(),
    dismissed_by_user_id = p_user_id,
    dismiss_until_date = p_dismiss_until,
    dismiss_reason = p_reason,
    updated_at = NOW();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Undismiss expiry alert
-- ============================================================================

CREATE OR REPLACE FUNCTION undismiss_expiry_alert(
  p_organization_id UUID,
  p_item_type expiry_item_type,
  p_item_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE expiry_dismissals
  SET 
    is_dismissed = FALSE,
    updated_at = NOW()
  WHERE organization_id = p_organization_id
    AND item_type = p_item_type
    AND item_id = p_item_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Auto-undismiss expired dismissals
-- Should be run periodically (e.g., daily cron job)
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_undismiss_expired_alerts()
RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  UPDATE expiry_dismissals
  SET 
    is_dismissed = FALSE,
    updated_at = NOW()
  WHERE is_dismissed = TRUE
    AND dismiss_until_date IS NOT NULL
    AND dismiss_until_date < CURRENT_DATE;
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Get expiry alerts count by status
-- ============================================================================

CREATE OR REPLACE FUNCTION get_expiry_alert_counts(
  p_organization_id UUID
)
RETURNS TABLE (
  total_alerts INTEGER,
  expired_count INTEGER,
  critical_count INTEGER,
  warning_count INTEGER,
  upcoming_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER AS total_alerts,
    COUNT(*) FILTER (WHERE ea.expiry_status = 'EXPIRED')::INTEGER AS expired_count,
    COUNT(*) FILTER (WHERE ea.expiry_status = 'CRITICAL')::INTEGER AS critical_count,
    COUNT(*) FILTER (WHERE ea.expiry_status = 'WARNING')::INTEGER AS warning_count,
    COUNT(*) FILTER (WHERE ea.expiry_status = 'UPCOMING')::INTEGER AS upcoming_count
  FROM get_expiry_alerts(p_organization_id, FALSE) ea
  WHERE ea.is_dismissed = FALSE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEW: Active expiry alerts (non-dismissed, expiring within 60 days)
-- ============================================================================

CREATE OR REPLACE VIEW v_active_expiry_alerts AS
SELECT *
FROM get_expiry_alerts(
  current_setting('app.current_organization_id')::UUID, 
  FALSE
)
WHERE is_dismissed = FALSE
ORDER BY 
  CASE expiry_status
    WHEN 'EXPIRED' THEN 1
    WHEN 'CRITICAL' THEN 2
    WHEN 'WARNING' THEN 3
    WHEN 'UPCOMING' THEN 4
    ELSE 5
  END,
  expiry_date ASC;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON expiry_dismissals TO authenticated;
GRANT EXECUTE ON FUNCTION get_expiry_alerts TO authenticated;
GRANT EXECUTE ON FUNCTION dismiss_expiry_alert TO authenticated;
GRANT EXECUTE ON FUNCTION undismiss_expiry_alert TO authenticated;
GRANT EXECUTE ON FUNCTION get_expiry_alert_counts TO authenticated;
GRANT SELECT ON v_active_expiry_alerts TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TYPE expiry_item_type IS 'Types of items that can expire and trigger alerts';
COMMENT ON TYPE expiry_status IS 'Status levels for expiry alerts based on days remaining';
COMMENT ON TABLE expiry_dismissals IS 'Tracks dismissed expiry alerts per organization';
COMMENT ON FUNCTION get_expiry_alerts IS 'Returns all expiring/expired items across vehicles, users, insurance, tracking, licenses, and roadworthy certificates';
COMMENT ON FUNCTION dismiss_expiry_alert IS 'Dismiss an expiry alert, optionally until a specific date';
COMMENT ON FUNCTION get_expiry_alert_counts IS 'Returns count of alerts by status for dashboard badges';
