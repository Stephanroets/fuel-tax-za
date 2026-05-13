-- ============================================================================
-- FUEL CONSUMPTION FIX - PostgreSQL 16 Schema Update
-- Correct fuel consumption calculation: Full Tank to Full Tank
-- South African Standard: L/100km (liters per 100 kilometers)
-- ============================================================================

-- ============================================================================
-- UPDATED FUEL LOGS TABLE WITH PROPER CONSUMPTION TRACKING
-- ============================================================================

-- Add new columns to fuel_logs for proper consumption tracking
ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS is_baseline_fill BOOLEAN DEFAULT FALSE;
ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS consumption_l_per_100km DECIMAL(6,2);
ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS consumption_calculated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS consumption_notes TEXT;

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_fuel_logs_full_tank ON fuel_logs(full_tank);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_baseline ON fuel_logs(is_baseline_fill);

-- ============================================================================
-- CREATE VEHICLE FUEL CONSUMPTION STATS TABLE
-- Aggregated fuel consumption statistics per vehicle
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicle_fuel_consumption_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  -- Lifetime stats
  total_fuel_logs INTEGER DEFAULT 0,
  total_full_tank_fills INTEGER DEFAULT 0,
  total_liters DECIMAL(12,3) DEFAULT 0,
  total_distance_km DECIMAL(12,2) DEFAULT 0,
  total_fuel_cost_zar DECIMAL(14,2) DEFAULT 0,
  -- Average consumption
  average_consumption_l_per_100km DECIMAL(6,2),
  best_consumption_l_per_100km DECIMAL(6,2),
  worst_consumption_l_per_100km DECIMAL(6,2),
  -- Recent stats (last 10 full tank cycles)
  recent_average_consumption_l_per_100km DECIMAL(6,2),
  -- Last fill info
  last_fill_odometer INTEGER,
  last_fill_date DATE,
  last_fill_full_tank BOOLEAN,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, vehicle_id)
);

CREATE INDEX idx_vehicle_fuel_stats_org ON vehicle_fuel_consumption_stats(organization_id);
CREATE INDEX idx_vehicle_fuel_stats_vehicle ON vehicle_fuel_consumption_stats(vehicle_id);

-- Enable RLS
ALTER TABLE vehicle_fuel_consumption_stats ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FUNCTION: Calculate Fuel Consumption (Full Tank to Full Tank)
-- 
-- Logic:
-- 1. Only calculate when current fill is a FULL TANK
-- 2. Find the PREVIOUS full tank fill for this vehicle
-- 3. Sum all liters filled BETWEEN previous full tank and current fill (inclusive of current)
-- 4. Calculate: (total_liters / distance_km) * 100 = L/100km
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_fuel_consumption_v2()
RETURNS TRIGGER AS $$
DECLARE
  v_vehicle_id UUID;
  v_current_odometer INTEGER;
  v_prev_full_tank_id UUID;
  v_prev_full_tank_odometer INTEGER;
  v_prev_full_tank_date DATE;
  v_total_liters_between DECIMAL(12,3);
  v_distance_km INTEGER;
  v_consumption_l_per_100km DECIMAL(6,2);
BEGIN
  -- Get vehicle_id and current odometer from parent expense
  SELECT e.vehicle_id, e.odometer_reading 
  INTO v_vehicle_id, v_current_odometer
  FROM expenses e
  WHERE e.id = NEW.expense_id;

  -- Store previous odometer (from last fuel log of any type)
  SELECT e.odometer_reading 
  INTO NEW.previous_odometer
  FROM expenses e
  INNER JOIN fuel_logs fl ON fl.expense_id = e.id
  WHERE e.vehicle_id = v_vehicle_id
    AND e.category = 'FUEL_LOG'
    AND e.id != NEW.expense_id
  ORDER BY e.expense_date DESC, e.created_at DESC
  LIMIT 1;

  -- Calculate km since last fill
  IF NEW.previous_odometer IS NOT NULL AND v_current_odometer IS NOT NULL THEN
    NEW.km_since_last_fill := v_current_odometer - NEW.previous_odometer;
  END IF;

  -- Only calculate consumption if this is a FULL TANK fill
  IF NEW.full_tank = TRUE THEN
    -- Find the PREVIOUS full tank fill for this vehicle
    SELECT fl.id, e.odometer_reading, e.expense_date
    INTO v_prev_full_tank_id, v_prev_full_tank_odometer, v_prev_full_tank_date
    FROM fuel_logs fl
    INNER JOIN expenses e ON fl.expense_id = e.id
    WHERE e.vehicle_id = v_vehicle_id
      AND e.category = 'FUEL_LOG'
      AND fl.full_tank = TRUE
      AND fl.id != NEW.id
      AND e.id != NEW.expense_id
    ORDER BY e.expense_date DESC, e.created_at DESC
    LIMIT 1;

    IF v_prev_full_tank_id IS NOT NULL AND v_prev_full_tank_odometer IS NOT NULL THEN
      -- Calculate distance between full tanks
      v_distance_km := v_current_odometer - v_prev_full_tank_odometer;

      IF v_distance_km > 0 THEN
        -- Sum all liters filled AFTER the previous full tank up to and including current fill
        -- This includes partial fills in between
        SELECT COALESCE(SUM(fl.liters), 0)
        INTO v_total_liters_between
        FROM fuel_logs fl
        INNER JOIN expenses e ON fl.expense_id = e.id
        WHERE e.vehicle_id = v_vehicle_id
          AND e.category = 'FUEL_LOG'
          AND e.odometer_reading > v_prev_full_tank_odometer
          AND e.odometer_reading <= v_current_odometer
          AND fl.id != v_prev_full_tank_id;

        -- Calculate L/100km
        IF v_total_liters_between > 0 THEN
          v_consumption_l_per_100km := (v_total_liters_between / v_distance_km) * 100;
          
          NEW.consumption_l_per_100km := v_consumption_l_per_100km;
          NEW.consumption_calculated_at := NOW();
          NEW.consumption_notes := FORMAT(
            'Distance: %s km, Total fuel: %s L (from odo %s to %s)',
            v_distance_km,
            ROUND(v_total_liters_between::numeric, 2),
            v_prev_full_tank_odometer,
            v_current_odometer
          );
          
          -- Also calculate simple km/L for backwards compatibility
          NEW.efficiency_km_per_liter := v_distance_km / v_total_liters_between;
        END IF;
      END IF;
    ELSE
      -- No previous full tank found - this is a baseline fill
      NEW.is_baseline_fill := TRUE;
      NEW.consumption_notes := 'Baseline fill - no previous full tank to calculate from';
    END IF;
  ELSE
    -- Not a full tank - can't calculate accurate consumption
    NEW.consumption_notes := 'Partial fill - consumption calculated on next full tank';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger and create new one
DROP TRIGGER IF EXISTS calculate_fuel_efficiency_trigger ON fuel_logs;
CREATE TRIGGER calculate_fuel_consumption_trigger
  BEFORE INSERT ON fuel_logs
  FOR EACH ROW EXECUTE FUNCTION calculate_fuel_consumption_v2();

-- ============================================================================
-- FUNCTION: Update Vehicle Fuel Consumption Stats
-- Called after fuel log insert to update aggregated stats
-- ============================================================================

CREATE OR REPLACE FUNCTION update_vehicle_fuel_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_vehicle_id UUID;
  v_organization_id UUID;
  v_current_odometer INTEGER;
  v_expense_date DATE;
BEGIN
  -- Get vehicle info from parent expense
  SELECT e.vehicle_id, e.organization_id, e.odometer_reading, e.expense_date
  INTO v_vehicle_id, v_organization_id, v_current_odometer, v_expense_date
  FROM expenses e
  WHERE e.id = NEW.expense_id;

  -- Upsert vehicle fuel consumption stats
  INSERT INTO vehicle_fuel_consumption_stats (
    organization_id,
    vehicle_id,
    total_fuel_logs,
    total_full_tank_fills,
    total_liters,
    total_fuel_cost_zar,
    last_fill_odometer,
    last_fill_date,
    last_fill_full_tank
  )
  VALUES (
    v_organization_id,
    v_vehicle_id,
    1,
    CASE WHEN NEW.full_tank THEN 1 ELSE 0 END,
    NEW.liters,
    NEW.liters * NEW.price_per_liter,
    v_current_odometer,
    v_expense_date,
    NEW.full_tank
  )
  ON CONFLICT (organization_id, vehicle_id) DO UPDATE SET
    total_fuel_logs = vehicle_fuel_consumption_stats.total_fuel_logs + 1,
    total_full_tank_fills = vehicle_fuel_consumption_stats.total_full_tank_fills + 
      CASE WHEN NEW.full_tank THEN 1 ELSE 0 END,
    total_liters = vehicle_fuel_consumption_stats.total_liters + NEW.liters,
    total_fuel_cost_zar = vehicle_fuel_consumption_stats.total_fuel_cost_zar + 
      (NEW.liters * NEW.price_per_liter),
    last_fill_odometer = v_current_odometer,
    last_fill_date = v_expense_date,
    last_fill_full_tank = NEW.full_tank,
    updated_at = NOW();

  -- Update consumption averages (from full tank fills only)
  UPDATE vehicle_fuel_consumption_stats
  SET
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
    -- Recent average (last 10 full tank cycles)
    recent_average_consumption_l_per_100km = (
      SELECT AVG(consumption_l_per_100km)
      FROM (
        SELECT fl.consumption_l_per_100km
        FROM fuel_logs fl
        INNER JOIN expenses e ON fl.expense_id = e.id
        WHERE e.vehicle_id = v_vehicle_id
          AND fl.consumption_l_per_100km IS NOT NULL
        ORDER BY e.expense_date DESC, e.created_at DESC
        LIMIT 10
      ) recent
    ),
    -- Calculate total distance from first fuel log to last
    total_distance_km = (
      SELECT MAX(e.odometer_reading) - MIN(e.odometer_reading)
      FROM expenses e
      INNER JOIN fuel_logs fl ON fl.expense_id = e.id
      WHERE e.vehicle_id = v_vehicle_id
    ),
    updated_at = NOW()
  WHERE vehicle_id = v_vehicle_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vehicle_fuel_stats_trigger
  AFTER INSERT ON fuel_logs
  FOR EACH ROW EXECUTE FUNCTION update_vehicle_fuel_stats();

-- ============================================================================
-- FUNCTION: Get Fuel Consumption History for a Vehicle
-- Returns consumption per fill-up with running average
-- ============================================================================

CREATE OR REPLACE FUNCTION get_vehicle_fuel_consumption_history(
  p_vehicle_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  fuel_log_id UUID,
  expense_date DATE,
  odometer_reading INTEGER,
  liters DECIMAL(8,3),
  price_per_liter DECIMAL(8,4),
  total_cost DECIMAL(12,2),
  full_tank BOOLEAN,
  station_name VARCHAR(255),
  km_since_last_fill DECIMAL(10,2),
  consumption_l_per_100km DECIMAL(6,2),
  efficiency_km_per_liter DECIMAL(6,2),
  is_baseline_fill BOOLEAN,
  consumption_notes TEXT,
  running_average_l_per_100km DECIMAL(6,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fl.id AS fuel_log_id,
    e.expense_date,
    e.odometer_reading,
    fl.liters,
    fl.price_per_liter,
    (fl.liters * fl.price_per_liter)::DECIMAL(12,2) AS total_cost,
    fl.full_tank,
    fl.station_name,
    fl.km_since_last_fill,
    fl.consumption_l_per_100km,
    fl.efficiency_km_per_liter,
    fl.is_baseline_fill,
    fl.consumption_notes,
    -- Running average of L/100km up to this point
    AVG(fl.consumption_l_per_100km) OVER (
      ORDER BY e.expense_date, e.created_at
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    )::DECIMAL(6,2) AS running_average_l_per_100km
  FROM fuel_logs fl
  INNER JOIN expenses e ON fl.expense_id = e.id
  WHERE e.vehicle_id = p_vehicle_id
  ORDER BY e.expense_date DESC, e.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEW: Vehicle Fuel Consumption Summary
-- Easy access to consumption stats per vehicle
-- ============================================================================

CREATE OR REPLACE VIEW v_vehicle_fuel_consumption AS
SELECT
  v.id AS vehicle_id,
  v.organization_id,
  v.registration_number,
  v.make,
  v.model,
  v.year,
  v.fuel_type,
  v.tank_capacity_liters,
  v.current_odometer,
  vfcs.total_fuel_logs,
  vfcs.total_full_tank_fills,
  vfcs.total_liters,
  vfcs.total_distance_km,
  vfcs.total_fuel_cost_zar,
  vfcs.average_consumption_l_per_100km,
  vfcs.best_consumption_l_per_100km,
  vfcs.worst_consumption_l_per_100km,
  vfcs.recent_average_consumption_l_per_100km,
  vfcs.last_fill_odometer,
  vfcs.last_fill_date,
  -- Calculate cost per km
  CASE 
    WHEN vfcs.total_distance_km > 0 
    THEN ROUND((vfcs.total_fuel_cost_zar / vfcs.total_distance_km)::numeric, 2)
    ELSE NULL
  END AS cost_per_km_zar,
  -- Calculate average km per tank (using tank capacity)
  CASE 
    WHEN vfcs.average_consumption_l_per_100km > 0 AND v.tank_capacity_liters IS NOT NULL
    THEN ROUND((v.tank_capacity_liters / vfcs.average_consumption_l_per_100km * 100)::numeric, 0)
    ELSE NULL
  END AS estimated_km_per_tank,
  vfcs.updated_at AS stats_updated_at
FROM vehicles v
LEFT JOIN vehicle_fuel_consumption_stats vfcs ON v.id = vfcs.vehicle_id
WHERE v.is_active = TRUE;

-- ============================================================================
-- FUNCTION: Recalculate All Fuel Consumption for a Vehicle
-- Use this to fix historical data
-- ============================================================================

CREATE OR REPLACE FUNCTION recalculate_vehicle_fuel_consumption(
  p_vehicle_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_fuel_log RECORD;
  v_prev_full_tank_odometer INTEGER;
  v_total_liters DECIMAL(12,3);
  v_distance_km INTEGER;
  v_consumption DECIMAL(6,2);
BEGIN
  -- Reset all consumption values for this vehicle
  UPDATE fuel_logs fl
  SET 
    consumption_l_per_100km = NULL,
    consumption_calculated_at = NULL,
    consumption_notes = NULL,
    is_baseline_fill = FALSE
  FROM expenses e
  WHERE fl.expense_id = e.id
    AND e.vehicle_id = p_vehicle_id;

  -- Process each fuel log in chronological order
  FOR v_fuel_log IN
    SELECT 
      fl.id,
      fl.expense_id,
      fl.liters,
      fl.full_tank,
      e.odometer_reading,
      e.expense_date
    FROM fuel_logs fl
    INNER JOIN expenses e ON fl.expense_id = e.id
    WHERE e.vehicle_id = p_vehicle_id
    ORDER BY e.expense_date ASC, e.created_at ASC
  LOOP
    IF v_fuel_log.full_tank = TRUE THEN
      IF v_prev_full_tank_odometer IS NOT NULL THEN
        -- Calculate consumption from previous full tank
        v_distance_km := v_fuel_log.odometer_reading - v_prev_full_tank_odometer;
        
        IF v_distance_km > 0 THEN
          -- Get total liters between fills
          SELECT COALESCE(SUM(fl.liters), 0)
          INTO v_total_liters
          FROM fuel_logs fl
          INNER JOIN expenses e ON fl.expense_id = e.id
          WHERE e.vehicle_id = p_vehicle_id
            AND e.odometer_reading > v_prev_full_tank_odometer
            AND e.odometer_reading <= v_fuel_log.odometer_reading;

          IF v_total_liters > 0 THEN
            v_consumption := (v_total_liters / v_distance_km) * 100;
            
            UPDATE fuel_logs
            SET 
              consumption_l_per_100km = v_consumption,
              consumption_calculated_at = NOW(),
              consumption_notes = FORMAT(
                'Recalculated: %s km, %s L',
                v_distance_km,
                ROUND(v_total_liters::numeric, 2)
              ),
              efficiency_km_per_liter = v_distance_km / v_total_liters
            WHERE id = v_fuel_log.id;
            
            v_count := v_count + 1;
          END IF;
        END IF;
      ELSE
        -- First full tank - mark as baseline
        UPDATE fuel_logs
        SET 
          is_baseline_fill = TRUE,
          consumption_notes = 'Baseline fill'
        WHERE id = v_fuel_log.id;
      END IF;
      
      -- Update previous full tank reference
      v_prev_full_tank_odometer := v_fuel_log.odometer_reading;
    END IF;
  END LOOP;

  -- Update vehicle stats
  PERFORM update_vehicle_fuel_stats_manual(p_vehicle_id);

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Helper function to update stats manually
CREATE OR REPLACE FUNCTION update_vehicle_fuel_stats_manual(
  p_vehicle_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_organization_id UUID;
BEGIN
  SELECT organization_id INTO v_organization_id
  FROM vehicles WHERE id = p_vehicle_id;

  INSERT INTO vehicle_fuel_consumption_stats (
    organization_id,
    vehicle_id,
    total_fuel_logs,
    total_full_tank_fills,
    total_liters,
    total_fuel_cost_zar,
    total_distance_km,
    average_consumption_l_per_100km,
    best_consumption_l_per_100km,
    worst_consumption_l_per_100km,
    recent_average_consumption_l_per_100km
  )
  SELECT
    v_organization_id,
    p_vehicle_id,
    COUNT(*),
    COUNT(*) FILTER (WHERE fl.full_tank),
    COALESCE(SUM(fl.liters), 0),
    COALESCE(SUM(fl.liters * fl.price_per_liter), 0),
    MAX(e.odometer_reading) - MIN(e.odometer_reading),
    AVG(fl.consumption_l_per_100km) FILTER (WHERE fl.consumption_l_per_100km IS NOT NULL),
    MIN(fl.consumption_l_per_100km) FILTER (WHERE fl.consumption_l_per_100km IS NOT NULL),
    MAX(fl.consumption_l_per_100km) FILTER (WHERE fl.consumption_l_per_100km IS NOT NULL),
    (
      SELECT AVG(consumption_l_per_100km)
      FROM (
        SELECT fl2.consumption_l_per_100km
        FROM fuel_logs fl2
        INNER JOIN expenses e2 ON fl2.expense_id = e2.id
        WHERE e2.vehicle_id = p_vehicle_id
          AND fl2.consumption_l_per_100km IS NOT NULL
        ORDER BY e2.expense_date DESC
        LIMIT 10
      ) recent
    )
  FROM fuel_logs fl
  INNER JOIN expenses e ON fl.expense_id = e.id
  WHERE e.vehicle_id = p_vehicle_id
  ON CONFLICT (organization_id, vehicle_id) DO UPDATE SET
    total_fuel_logs = EXCLUDED.total_fuel_logs,
    total_full_tank_fills = EXCLUDED.total_full_tank_fills,
    total_liters = EXCLUDED.total_liters,
    total_fuel_cost_zar = EXCLUDED.total_fuel_cost_zar,
    total_distance_km = EXCLUDED.total_distance_km,
    average_consumption_l_per_100km = EXCLUDED.average_consumption_l_per_100km,
    best_consumption_l_per_100km = EXCLUDED.best_consumption_l_per_100km,
    worst_consumption_l_per_100km = EXCLUDED.worst_consumption_l_per_100km,
    recent_average_consumption_l_per_100km = EXCLUDED.recent_average_consumption_l_per_100km,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON vehicle_fuel_consumption_stats TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_fuel_consumption_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION update_vehicle_fuel_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_vehicle_fuel_consumption_history TO authenticated;
GRANT EXECUTE ON FUNCTION recalculate_vehicle_fuel_consumption TO authenticated;
GRANT EXECUTE ON FUNCTION update_vehicle_fuel_stats_manual TO authenticated;
GRANT SELECT ON v_vehicle_fuel_consumption TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE vehicle_fuel_consumption_stats IS 'Aggregated fuel consumption statistics per vehicle';
COMMENT ON COLUMN fuel_logs.consumption_l_per_100km IS 'Fuel consumption in L/100km - only calculated on full tank fills';
COMMENT ON COLUMN fuel_logs.is_baseline_fill IS 'TRUE for first full tank fill - no consumption can be calculated';
COMMENT ON FUNCTION calculate_fuel_consumption_v2 IS 'Calculates accurate fuel consumption from full tank to full tank';
COMMENT ON FUNCTION recalculate_vehicle_fuel_consumption IS 'Recalculates all consumption history for a vehicle - use to fix historical data';
COMMENT ON VIEW v_vehicle_fuel_consumption IS 'Vehicle fuel consumption summary with cost per km and estimated range';

-- ============================================================================
-- SCHEMA UPDATE COMPLETE
-- 
-- KEY CHANGES:
-- 1. Consumption is now calculated ONLY on full tank fills
-- 2. Includes ALL fuel (including partial fills) between full tanks
-- 3. Uses L/100km (South African standard) instead of km/L
-- 4. Provides vehicle-level aggregated stats
-- 5. Includes recalculation function for fixing historical data
-- ============================================================================
