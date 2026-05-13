-- Migration 005: Expiry Alerts System
-- Tracks expiring licenses, insurance, certificates, etc.
-- ============================================================================

-- Table to track dismissed alerts
CREATE TABLE IF NOT EXISTS expiry_dismissals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type VARCHAR(30) NOT NULL CHECK (item_type IN (
    'VEHICLE_LICENSE', 'DRIVERS_LICENSE', 'PDP', 'INSURANCE', 
    'TRACKING_CONTRACT', 'ROADWORTHY', 'OPERATING_LICENSE'
  )),
  item_id UUID NOT NULL,
  dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  dismiss_until DATE,
  UNIQUE(organization_id, item_type, item_id)
);

CREATE INDEX IF NOT EXISTS idx_expiry_dismissals_org ON expiry_dismissals(organization_id);
CREATE INDEX IF NOT EXISTS idx_expiry_dismissals_item ON expiry_dismissals(item_type, item_id);

ALTER TABLE expiry_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY expiry_dismissals_org_policy ON expiry_dismissals FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id', true)::UUID
  ));

-- ============================================================================
-- FUNCTION: Get all expiry alerts for an organization
-- ============================================================================
CREATE OR REPLACE FUNCTION get_expiry_alerts(
  p_organization_id UUID,
  p_include_dismissed BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  item_type TEXT,
  item_id UUID,
  related_id UUID,
  item_name TEXT,
  item_description TEXT,
  vehicle_id UUID,
  vehicle_registration TEXT,
  vehicle_name TEXT,
  user_id UUID,
  user_name TEXT,
  expiry_date DATE,
  days_until_expiry INTEGER,
  expiry_status TEXT,
  is_dismissed BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  
  -- Vehicle License Expiry
  SELECT 
    'VEHICLE_LICENSE'::TEXT,
    v.id,
    NULL::UUID,
    'Vehicle License'::TEXT,
    'License disc for ' || v.registration_number,
    v.id,
    v.registration_number::TEXT,
    (v.make || ' ' || v.model)::TEXT,
    NULL::UUID,
    NULL::TEXT,
    v.license_expiry,
    (v.license_expiry - CURRENT_DATE)::INTEGER,
    CASE 
      WHEN v.license_expiry < CURRENT_DATE THEN 'EXPIRED'
      WHEN v.license_expiry <= CURRENT_DATE + 7 THEN 'CRITICAL'
      WHEN v.license_expiry <= CURRENT_DATE + 30 THEN 'WARNING'
      WHEN v.license_expiry <= CURRENT_DATE + 60 THEN 'UPCOMING'
      ELSE 'VALID'
    END::TEXT,
    EXISTS(SELECT 1 FROM expiry_dismissals ed WHERE ed.item_type = 'VEHICLE_LICENSE' AND ed.item_id = v.id AND ed.organization_id = p_organization_id)
  FROM vehicles v
  WHERE v.organization_id = p_organization_id
    AND v.is_active = TRUE
    AND v.license_expiry IS NOT NULL
    AND v.license_expiry <= CURRENT_DATE + 60
    AND (p_include_dismissed OR NOT EXISTS(
      SELECT 1 FROM expiry_dismissals ed 
      WHERE ed.item_type = 'VEHICLE_LICENSE' AND ed.item_id = v.id 
        AND ed.organization_id = p_organization_id
        AND (ed.dismiss_until IS NULL OR ed.dismiss_until > CURRENT_DATE)
    ))
  
  UNION ALL
  
  -- Insurance Expiry
  SELECT 
    'INSURANCE'::TEXT,
    ip.id,
    ip.expense_id,
    'Insurance Policy'::TEXT,
    ip.insurer_name || ' - ' || ip.policy_number,
    e.vehicle_id,
    v.registration_number::TEXT,
    (v.make || ' ' || v.model)::TEXT,
    NULL::UUID,
    NULL::TEXT,
    ip.coverage_end_date,
    (ip.coverage_end_date - CURRENT_DATE)::INTEGER,
    CASE 
      WHEN ip.coverage_end_date < CURRENT_DATE THEN 'EXPIRED'
      WHEN ip.coverage_end_date <= CURRENT_DATE + 7 THEN 'CRITICAL'
      WHEN ip.coverage_end_date <= CURRENT_DATE + 30 THEN 'WARNING'
      WHEN ip.coverage_end_date <= CURRENT_DATE + 60 THEN 'UPCOMING'
      ELSE 'VALID'
    END::TEXT,
    EXISTS(SELECT 1 FROM expiry_dismissals ed WHERE ed.item_type = 'INSURANCE' AND ed.item_id = ip.id AND ed.organization_id = p_organization_id)
  FROM insurance_premiums ip
  INNER JOIN expenses e ON ip.expense_id = e.id
  INNER JOIN vehicles v ON e.vehicle_id = v.id
  WHERE e.organization_id = p_organization_id
    AND ip.coverage_end_date IS NOT NULL
    AND ip.coverage_end_date <= CURRENT_DATE + 60
    AND (p_include_dismissed OR NOT EXISTS(
      SELECT 1 FROM expiry_dismissals ed 
      WHERE ed.item_type = 'INSURANCE' AND ed.item_id = ip.id 
        AND ed.organization_id = p_organization_id
        AND (ed.dismiss_until IS NULL OR ed.dismiss_until > CURRENT_DATE)
    ))
  
  UNION ALL
  
  -- Tracking Contract Expiry
  SELECT 
    'TRACKING_CONTRACT'::TEXT,
    vts.id,
    vts.expense_id,
    'Tracking Contract'::TEXT,
    vts.provider_name || ' subscription',
    e.vehicle_id,
    v.registration_number::TEXT,
    (v.make || ' ' || v.model)::TEXT,
    NULL::UUID,
    NULL::TEXT,
    vts.contract_end_date,
    (vts.contract_end_date - CURRENT_DATE)::INTEGER,
    CASE 
      WHEN vts.contract_end_date < CURRENT_DATE THEN 'EXPIRED'
      WHEN vts.contract_end_date <= CURRENT_DATE + 7 THEN 'CRITICAL'
      WHEN vts.contract_end_date <= CURRENT_DATE + 30 THEN 'WARNING'
      WHEN vts.contract_end_date <= CURRENT_DATE + 60 THEN 'UPCOMING'
      ELSE 'VALID'
    END::TEXT,
    EXISTS(SELECT 1 FROM expiry_dismissals ed WHERE ed.item_type = 'TRACKING_CONTRACT' AND ed.item_id = vts.id AND ed.organization_id = p_organization_id)
  FROM vehicle_tracking_subscriptions vts
  INNER JOIN expenses e ON vts.expense_id = e.id
  INNER JOIN vehicles v ON e.vehicle_id = v.id
  WHERE e.organization_id = p_organization_id
    AND vts.contract_end_date IS NOT NULL
    AND vts.contract_end_date <= CURRENT_DATE + 60
    AND (p_include_dismissed OR NOT EXISTS(
      SELECT 1 FROM expiry_dismissals ed 
      WHERE ed.item_type = 'TRACKING_CONTRACT' AND ed.item_id = vts.id 
        AND ed.organization_id = p_organization_id
        AND (ed.dismiss_until IS NULL OR ed.dismiss_until > CURRENT_DATE)
    ))
  
  UNION ALL
  
  -- License Renewal Expiry
  SELECT 
    lr.license_type::TEXT,
    lr.id,
    lr.expense_id,
    CASE lr.license_type
      WHEN 'VEHICLE_LICENSE' THEN 'Vehicle License'
      WHEN 'DRIVERS_LICENSE' THEN 'Driver''s License'
      WHEN 'PDP' THEN 'PDP'
      WHEN 'OPERATING_LICENSE' THEN 'Operating License'
    END::TEXT,
    'Renewed via ' || lr.renewal_method,
    e.vehicle_id,
    COALESCE(v.registration_number, '')::TEXT,
    COALESCE(v.make || ' ' || v.model, '')::TEXT,
    e.user_id,
    (u.first_name || ' ' || u.last_name)::TEXT,
    lr.new_expiry_date,
    (lr.new_expiry_date - CURRENT_DATE)::INTEGER,
    CASE 
      WHEN lr.new_expiry_date < CURRENT_DATE THEN 'EXPIRED'
      WHEN lr.new_expiry_date <= CURRENT_DATE + 7 THEN 'CRITICAL'
      WHEN lr.new_expiry_date <= CURRENT_DATE + 30 THEN 'WARNING'
      WHEN lr.new_expiry_date <= CURRENT_DATE + 60 THEN 'UPCOMING'
      ELSE 'VALID'
    END::TEXT,
    EXISTS(SELECT 1 FROM expiry_dismissals ed WHERE ed.item_type = lr.license_type AND ed.item_id = lr.id AND ed.organization_id = p_organization_id)
  FROM license_renewals lr
  INNER JOIN expenses e ON lr.expense_id = e.id
  LEFT JOIN vehicles v ON e.vehicle_id = v.id
  LEFT JOIN users u ON e.user_id = u.id
  WHERE e.organization_id = p_organization_id
    AND lr.new_expiry_date IS NOT NULL
    AND lr.new_expiry_date <= CURRENT_DATE + 60
    AND (p_include_dismissed OR NOT EXISTS(
      SELECT 1 FROM expiry_dismissals ed 
      WHERE ed.item_type = lr.license_type AND ed.item_id = lr.id 
        AND ed.organization_id = p_organization_id
        AND (ed.dismiss_until IS NULL OR ed.dismiss_until > CURRENT_DATE)
    ))
  
  UNION ALL
  
  -- Roadworthy Certificate Expiry
  SELECT 
    'ROADWORTHY'::TEXT,
    rc.id,
    rc.expense_id,
    'Roadworthy Certificate'::TEXT,
    'Test at ' || rc.testing_station_name,
    e.vehicle_id,
    v.registration_number::TEXT,
    (v.make || ' ' || v.model)::TEXT,
    NULL::UUID,
    NULL::TEXT,
    rc.expiry_date,
    (rc.expiry_date - CURRENT_DATE)::INTEGER,
    CASE 
      WHEN rc.expiry_date < CURRENT_DATE THEN 'EXPIRED'
      WHEN rc.expiry_date <= CURRENT_DATE + 7 THEN 'CRITICAL'
      WHEN rc.expiry_date <= CURRENT_DATE + 30 THEN 'WARNING'
      WHEN rc.expiry_date <= CURRENT_DATE + 60 THEN 'UPCOMING'
      ELSE 'VALID'
    END::TEXT,
    EXISTS(SELECT 1 FROM expiry_dismissals ed WHERE ed.item_type = 'ROADWORTHY' AND ed.item_id = rc.id AND ed.organization_id = p_organization_id)
  FROM roadworthy_certificates rc
  INNER JOIN expenses e ON rc.expense_id = e.id
  INNER JOIN vehicles v ON e.vehicle_id = v.id
  WHERE e.organization_id = p_organization_id
    AND rc.expiry_date IS NOT NULL
    AND rc.expiry_date <= CURRENT_DATE + 60
    AND rc.test_result IN ('PASS', 'CONDITIONAL_PASS')
    AND (p_include_dismissed OR NOT EXISTS(
      SELECT 1 FROM expiry_dismissals ed 
      WHERE ed.item_type = 'ROADWORTHY' AND ed.item_id = rc.id 
        AND ed.organization_id = p_organization_id
        AND (ed.dismiss_until IS NULL OR ed.dismiss_until > CURRENT_DATE)
    ))
  
  ORDER BY days_until_expiry ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Dismiss an expiry alert
-- ============================================================================
CREATE OR REPLACE FUNCTION dismiss_expiry_alert(
  p_organization_id UUID,
  p_user_id UUID,
  p_item_type TEXT,
  p_item_id UUID,
  p_dismiss_until DATE DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO expiry_dismissals (organization_id, user_id, item_type, item_id, dismiss_until)
  VALUES (p_organization_id, p_user_id, p_item_type, p_item_id, p_dismiss_until)
  ON CONFLICT (organization_id, item_type, item_id) DO UPDATE SET
    dismissed_at = NOW(),
    dismiss_until = p_dismiss_until;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Undismiss an expiry alert
-- ============================================================================
CREATE OR REPLACE FUNCTION undismiss_expiry_alert(
  p_organization_id UUID,
  p_item_type TEXT,
  p_item_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM expiry_dismissals
  WHERE organization_id = p_organization_id
    AND item_type = p_item_type
    AND item_id = p_item_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

GRANT SELECT, INSERT, UPDATE, DELETE ON expiry_dismissals TO authenticated;
GRANT EXECUTE ON FUNCTION get_expiry_alerts TO authenticated;
GRANT EXECUTE ON FUNCTION dismiss_expiry_alert TO authenticated;
GRANT EXECUTE ON FUNCTION undismiss_expiry_alert TO authenticated;
