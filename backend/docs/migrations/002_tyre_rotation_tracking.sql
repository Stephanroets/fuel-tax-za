-- Migration 002: Tyre Rotation Tracking
-- Links tyre purchases to fuel odometer readings for rotation reminders
-- ============================================================================

CREATE TABLE IF NOT EXISTS tyre_rotation_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  tyre_expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  drivetrain_type VARCHAR(20) NOT NULL CHECK (drivetrain_type IN ('FWD', 'RWD', 'AWD', 'FOUR_BY_FOUR')),
  rotation_interval_km INTEGER NOT NULL CHECK (rotation_interval_km IN (6000, 8000, 10000)),
  installation_odometer INTEGER NOT NULL,
  last_rotation_odometer INTEGER,
  last_rotation_date DATE,
  rotation_count INTEGER DEFAULT 0,
  next_rotation_odometer INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  dismissed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tyre_rotation_org ON tyre_rotation_tracking(organization_id);
CREATE INDEX IF NOT EXISTS idx_tyre_rotation_vehicle ON tyre_rotation_tracking(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_tyre_rotation_active ON tyre_rotation_tracking(is_active, is_dismissed);

ALTER TABLE tyre_rotation_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tyre_rotation_org_policy ON tyre_rotation_tracking;
CREATE POLICY tyre_rotation_org_policy ON tyre_rotation_tracking
  FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id', true)::UUID
  ));

-- Function to get tyre rotation warnings based on fuel odometer readings
CREATE OR REPLACE FUNCTION get_tyre_rotation_warnings(p_organization_id UUID)
RETURNS TABLE (
  tracking_id UUID,
  vehicle_id UUID,
  vehicle_registration VARCHAR(20),
  vehicle_name TEXT,
  tyre_brand VARCHAR(100),
  installation_date DATE,
  installation_odometer INTEGER,
  rotation_interval_km INTEGER,
  next_rotation_odometer INTEGER,
  latest_fuel_odometer INTEGER,
  km_overdue INTEGER,
  rotation_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    trt.id,
    trt.vehicle_id,
    v.registration_number,
    (v.make || ' ' || v.model)::TEXT,
    t.brand,
    e.expense_date,
    trt.installation_odometer,
    trt.rotation_interval_km,
    trt.next_rotation_odometer,
    COALESCE(
      (SELECT fl.odometer_reading 
       FROM fuel_logs fl 
       INNER JOIN expenses fe ON fl.expense_id = fe.id 
       WHERE fe.vehicle_id = trt.vehicle_id 
       ORDER BY fe.expense_date DESC, fe.created_at DESC 
       LIMIT 1),
      v.current_odometer
    )::INTEGER,
    GREATEST(0, COALESCE(
      (SELECT fl.odometer_reading 
       FROM fuel_logs fl 
       INNER JOIN expenses fe ON fl.expense_id = fe.id 
       WHERE fe.vehicle_id = trt.vehicle_id 
       ORDER BY fe.expense_date DESC, fe.created_at DESC 
       LIMIT 1),
      v.current_odometer
    ) - trt.next_rotation_odometer)::INTEGER,
    CASE 
      WHEN COALESCE(
        (SELECT fl.odometer_reading 
         FROM fuel_logs fl 
         INNER JOIN expenses fe ON fl.expense_id = fe.id 
         WHERE fe.vehicle_id = trt.vehicle_id 
         ORDER BY fe.expense_date DESC, fe.created_at DESC 
         LIMIT 1),
        v.current_odometer
      ) >= (trt.next_rotation_odometer + 1000) THEN 'CRITICAL'
      WHEN COALESCE(
        (SELECT fl.odometer_reading 
         FROM fuel_logs fl 
         INNER JOIN expenses fe ON fl.expense_id = fe.id 
         WHERE fe.vehicle_id = trt.vehicle_id 
         ORDER BY fe.expense_date DESC, fe.created_at DESC 
         LIMIT 1),
        v.current_odometer
      ) >= trt.next_rotation_odometer THEN 'WARNING'
      WHEN COALESCE(
        (SELECT fl.odometer_reading 
         FROM fuel_logs fl 
         INNER JOIN expenses fe ON fl.expense_id = fe.id 
         WHERE fe.vehicle_id = trt.vehicle_id 
         ORDER BY fe.expense_date DESC, fe.created_at DESC 
         LIMIT 1),
        v.current_odometer
      ) >= (trt.next_rotation_odometer - 500) THEN 'UPCOMING'
      ELSE 'OK'
    END
  FROM tyre_rotation_tracking trt
  INNER JOIN vehicles v ON trt.vehicle_id = v.id
  INNER JOIN expenses e ON trt.tyre_expense_id = e.id
  INNER JOIN tires t ON t.expense_id = e.id
  WHERE trt.organization_id = p_organization_id
    AND trt.is_active = TRUE
    AND trt.is_dismissed = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to record a tyre rotation
CREATE OR REPLACE FUNCTION record_tyre_rotation(
  p_tracking_id UUID,
  p_rotation_odometer INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_interval INTEGER;
BEGIN
  SELECT rotation_interval_km INTO v_interval
  FROM tyre_rotation_tracking WHERE id = p_tracking_id;
  
  IF NOT FOUND THEN RETURN FALSE; END IF;
  
  UPDATE tyre_rotation_tracking SET
    last_rotation_odometer = p_rotation_odometer,
    last_rotation_date = CURRENT_DATE,
    rotation_count = rotation_count + 1,
    next_rotation_odometer = p_rotation_odometer + v_interval,
    is_dismissed = FALSE,
    dismissed_at = NULL,
    dismissed_by_user_id = NULL,
    updated_at = NOW()
  WHERE id = p_tracking_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to dismiss a warning
CREATE OR REPLACE FUNCTION dismiss_tyre_rotation_warning(
  p_tracking_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE tyre_rotation_tracking SET
    is_dismissed = TRUE,
    dismissed_at = NOW(),
    dismissed_by_user_id = p_user_id,
    updated_at = NOW()
  WHERE id = p_tracking_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

GRANT SELECT, INSERT, UPDATE ON tyre_rotation_tracking TO authenticated;
GRANT EXECUTE ON FUNCTION get_tyre_rotation_warnings TO authenticated;
GRANT EXECUTE ON FUNCTION record_tyre_rotation TO authenticated;
GRANT EXECUTE ON FUNCTION dismiss_tyre_rotation_warning TO authenticated;
