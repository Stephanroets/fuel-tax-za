-- Migration 004: Fix Fuel Consumption Calculation
-- Correct L/100km calculation from full tank to full tank
-- ============================================================================

-- Add new columns to fuel_logs for proper consumption tracking
ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS is_baseline_fill BOOLEAN DEFAULT FALSE;
ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS consumption_l_per_100km DECIMAL(5,2);
ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS consumption_calculated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS consumption_notes TEXT;

-- ============================================================================
-- VEHICLE FUEL CONSUMPTION STATS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS vehicle_fuel_consumption_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  total_fuel_logs INTEGER DEFAULT 0,
  total_full_tank_fills INTEGER DEFAULT 0,
  total_liters DECIMAL(12,2) DEFAULT 0,
  total_distance_km INTEGER DEFAULT 0,
  total_fuel_cost_zar DECIMAL(12,2) DEFAULT 0,
  average_consumption_l_per_100km DECIMAL(5,2),
  best_consumption_l_per_100km DECIMAL(5,2),
  worst_consumption_l_per_100km DECIMAL(5,2),
  recent_average_l_per_100km DECIMAL(5,2),
  last_fill_odometer INTEGER,
  last_fill_date DATE,
  last_fill_full_tank BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(vehicle_id)
);

CREATE INDEX IF NOT EXISTS idx_fuel_stats_org ON vehicle_fuel_consumption_stats(organization_id);
CREATE INDEX IF NOT EXISTS idx_fuel_stats_vehicle ON vehicle_fuel_consumption_stats(vehicle_id);

ALTER TABLE vehicle_fuel_consumption_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY fuel_stats_org_policy ON vehicle_fuel_consumption_stats FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id', true)::UUID
  ));

-- ============================================================================
-- FUNCTION: Calculate consumption on full tank fill
-- This is the KEY LOGIC: Only calculate when filling to full, using all fuel
-- (including partial fills) since the previous full tank fill
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_fuel_consumption()
RETURNS TRIGGER AS $$
DECLARE
  v_prev_full_tank_record RECORD;
  v_total_liters DECIMAL(10,2);
  v_distance_km INTEGER;
  v_consumption DECIMAL(5,2);
BEGIN
  -- Only calculate when this is a full tank fill
  IF NEW.full_tank = TRUE THEN
    -- Find the previous full tank fill for this vehicle
    SELECT fl.*, e.expense_date, e.vehicle_id
    INTO v_prev_full_tank_record
    FROM fuel_logs fl
    INNER JOIN expenses e ON fl.expense_id = e.id
    WHERE e.vehicle_id = (SELECT vehicle_id FROM expenses WHERE id = NEW.expense_id)
      AND fl.full_tank = TRUE
      AND fl.id != NEW.id
      AND fl.odometer_reading < NEW.odometer_reading
    ORDER BY fl.odometer_reading DESC
    LIMIT 1;
    
    IF FOUND THEN
      -- Calculate total fuel used since last full tank (including partial fills)
      SELECT COALESCE(SUM(fl2.liters), 0) + NEW.liters
      INTO v_total_liters
      FROM fuel_logs fl2
      INNER JOIN expenses e2 ON fl2.expense_id = e2.id
      WHERE e2.vehicle_id = (SELECT vehicle_id FROM expenses WHERE id = NEW.expense_id)
        AND fl2.odometer_reading > v_prev_full_tank_record.odometer_reading
        AND fl2.odometer_reading < NEW.odometer_reading;
      
      -- Add current fill
      v_total_liters := v_total_liters + NEW.liters;
      
      -- Calculate distance
      v_distance_km := NEW.odometer_reading - v_prev_full_tank_record.odometer_reading;
      
      -- Calculate L/100km (SA standard)
      IF v_distance_km > 0 THEN
        v_consumption := (v_total_liters / v_distance_km) * 100;
        
        -- Update the current record with consumption
        NEW.consumption_l_per_100km := v_consumption;
        NEW.consumption_calculated_at := NOW();
        NEW.consumption_notes := format(
          'Full tank to full tank: %.2fL over %skm',
          v_total_liters, v_distance_km
        );
      END IF;
    ELSE
      -- This is the first full tank fill - mark as baseline
      NEW.is_baseline_fill := TRUE;
      NEW.consumption_notes := 'Baseline fill - no previous full tank to calculate from';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS fuel_consumption_trigger ON fuel_logs;
CREATE TRIGGER fuel_consumption_trigger
  BEFORE INSERT ON fuel_logs
  FOR EACH ROW EXECUTE FUNCTION calculate_fuel_consumption();

-- ============================================================================
-- FUNCTION: Update vehicle fuel stats after each fill
-- ============================================================================
CREATE OR REPLACE FUNCTION update_vehicle_fuel_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_vehicle_id UUID;
  v_org_id UUID;
BEGIN
  SELECT vehicle_id, organization_id INTO v_vehicle_id, v_org_id
  FROM expenses WHERE id = NEW.expense_id;
  
  INSERT INTO vehicle_fuel_consumption_stats (
    organization_id, vehicle_id, total_fuel_logs, total_full_tank_fills,
    total_liters, total_fuel_cost_zar, last_fill_odometer, last_fill_date, last_fill_full_tank
  )
  VALUES (
    v_org_id, v_vehicle_id, 1, 
    CASE WHEN NEW.full_tank THEN 1 ELSE 0 END,
    NEW.liters, NEW.liters * NEW.price_per_liter,
    NEW.odometer_reading, (SELECT expense_date FROM expenses WHERE id = NEW.expense_id),
    NEW.full_tank
  )
  ON CONFLICT (vehicle_id) DO UPDATE SET
    total_fuel_logs = vehicle_fuel_consumption_stats.total_fuel_logs + 1,
    total_full_tank_fills = vehicle_fuel_consumption_stats.total_full_tank_fills + 
      CASE WHEN NEW.full_tank THEN 1 ELSE 0 END,
    total_liters = vehicle_fuel_consumption_stats.total_liters + NEW.liters,
    total_fuel_cost_zar = vehicle_fuel_consumption_stats.total_fuel_cost_zar + (NEW.liters * NEW.price_per_liter),
    last_fill_odometer = NEW.odometer_reading,
    last_fill_date = (SELECT expense_date FROM expenses WHERE id = NEW.expense_id),
    last_fill_full_tank = NEW.full_tank,
    updated_at = NOW();
  
  -- Update averages if consumption was calculated
  IF NEW.consumption_l_per_100km IS NOT NULL THEN
    UPDATE vehicle_fuel_consumption_stats SET
      average_consumption_l_per_100km = (
        SELECT AVG(fl.consumption_l_per_100km)
        FROM fuel_logs fl
        INNER JOIN expenses e ON fl.expense_id = e.id
        WHERE e.vehicle_id = v_vehicle_id
          AND fl.consumption_l_per_100km IS NOT NULL
      ),
      best_consumption_l_per_100km = (
        SELECT MIN(fl.consumption_l_per_100km)
        FROM fuel_logs fl
        INNER JOIN expenses e ON fl.expense_id = e.id
        WHERE e.vehicle_id = v_vehicle_id
          AND fl.consumption_l_per_100km IS NOT NULL
      ),
      worst_consumption_l_per_100km = (
        SELECT MAX(fl.consumption_l_per_100km)
        FROM fuel_logs fl
        INNER JOIN expenses e ON fl.expense_id = e.id
        WHERE e.vehicle_id = v_vehicle_id
          AND fl.consumption_l_per_100km IS NOT NULL
      ),
      total_distance_km = (
        SELECT MAX(fl.odometer_reading) - MIN(fl.odometer_reading)
        FROM fuel_logs fl
        INNER JOIN expenses e ON fl.expense_id = e.id
        WHERE e.vehicle_id = v_vehicle_id
      )
    WHERE vehicle_id = v_vehicle_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS fuel_stats_trigger ON fuel_logs;
CREATE TRIGGER fuel_stats_trigger
  AFTER INSERT ON fuel_logs
  FOR EACH ROW EXECUTE FUNCTION update_vehicle_fuel_stats();

-- ============================================================================
-- VIEW: Vehicle fuel consumption summary
-- ============================================================================
CREATE OR REPLACE VIEW v_vehicle_fuel_consumption AS
SELECT 
  vfcs.*,
  v.registration_number,
  v.make || ' ' || v.model AS vehicle_name,
  v.fuel_type,
  v.tank_capacity_liters,
  CASE 
    WHEN vfcs.average_consumption_l_per_100km IS NOT NULL AND v.tank_capacity_liters IS NOT NULL
    THEN ROUND((v.tank_capacity_liters / vfcs.average_consumption_l_per_100km) * 100)
    ELSE NULL
  END AS estimated_range_km,
  CASE
    WHEN vfcs.total_distance_km > 0 
    THEN ROUND(vfcs.total_fuel_cost_zar / vfcs.total_distance_km, 2)
    ELSE NULL
  END AS cost_per_km_zar
FROM vehicle_fuel_consumption_stats vfcs
INNER JOIN vehicles v ON vfcs.vehicle_id = v.id;

GRANT SELECT, INSERT, UPDATE ON vehicle_fuel_consumption_stats TO authenticated;
