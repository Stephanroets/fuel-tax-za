-- ============================================================================
-- VEHICLE EXPENSE & TAX COMPLIANCE SYSTEM - PostgreSQL 16 Schema Migration
-- New Features: Lock Status, Image Management, Audit Trail
-- South African ZAR Currency | SARS Logbook Compliant
-- ============================================================================

-- This migration adds:
-- 1. Lock status for entries (prevents editing/deletion)
-- 2. Image attachment support for all entry types
-- 3. Enhanced audit fields

-- ============================================================================
-- LOCK STATUS ENUM
-- ============================================================================

CREATE TYPE lock_status AS ENUM ('UNLOCKED', 'LOCKED');

-- ============================================================================
-- IMAGE ATTACHMENTS TABLE
-- Centralized image storage for all entry types
-- ============================================================================

CREATE TABLE IF NOT EXISTS entry_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- Polymorphic reference to parent entry
  entry_type VARCHAR(50) NOT NULL, -- 'VEHICLE', 'EXPENSE', 'TRIP', 'ODOMETER_VERIFICATION'
  entry_id UUID NOT NULL,
  -- Image details
  image_url VARCHAR(500) NOT NULL,
  image_key VARCHAR(255), -- S3/storage key for deletion
  image_type VARCHAR(50) DEFAULT 'ATTACHMENT', -- 'RECEIPT', 'ODOMETER', 'ATTACHMENT', 'DAMAGE'
  file_name VARCHAR(255),
  file_size_bytes INTEGER,
  mime_type VARCHAR(100),
  -- Metadata
  description TEXT,
  uploaded_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  -- Lock status (if image is locked, it cannot be deleted/replaced)
  is_locked BOOLEAN DEFAULT FALSE,
  locked_at TIMESTAMP WITH TIME ZONE,
  locked_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  locked_reason TEXT,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_entry_images_organization ON entry_images(organization_id);
CREATE INDEX idx_entry_images_entry ON entry_images(entry_type, entry_id);
CREATE INDEX idx_entry_images_type ON entry_images(image_type);
CREATE INDEX idx_entry_images_locked ON entry_images(is_locked);

-- Enable RLS
ALTER TABLE entry_images ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ADD LOCK FIELDS TO VEHICLES TABLE
-- ============================================================================

ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS locked_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS locked_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_vehicles_locked ON vehicles(is_locked);

-- ============================================================================
-- ADD LOCK FIELDS TO EXPENSES TABLE
-- ============================================================================

ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS locked_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS locked_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_expenses_locked ON expenses(is_locked);

-- ============================================================================
-- ADD LOCK FIELDS TO TRIPS TABLE
-- ============================================================================

ALTER TABLE trips
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS locked_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS locked_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_trips_locked ON trips(is_locked);

-- ============================================================================
-- ADD LOCK FIELDS TO ODOMETER VERIFICATIONS TABLE
-- ============================================================================

ALTER TABLE odometer_verifications
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS locked_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS locked_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_odometer_verifications_locked ON odometer_verifications(is_locked);

-- ============================================================================
-- HELPER FUNCTIONS FOR LOCK MANAGEMENT
-- ============================================================================

-- Function to lock an entry
CREATE OR REPLACE FUNCTION lock_entry(
  p_table_name TEXT,
  p_entry_id UUID,
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  EXECUTE format(
    'UPDATE %I SET 
      is_locked = TRUE, 
      locked_at = NOW(), 
      locked_by_user_id = $1, 
      locked_reason = $2,
      updated_at = NOW()
     WHERE id = $3 AND is_locked = FALSE',
    p_table_name
  ) USING p_user_id, p_reason, p_entry_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to unlock an entry (requires ADMIN or MANAGER role)
CREATE OR REPLACE FUNCTION unlock_entry(
  p_table_name TEXT,
  p_entry_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  EXECUTE format(
    'UPDATE %I SET 
      is_locked = FALSE, 
      locked_at = NULL, 
      locked_by_user_id = NULL, 
      locked_reason = NULL,
      updated_at = NOW()
     WHERE id = $1 AND is_locked = TRUE',
    p_table_name
  ) USING p_entry_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to check if entry is locked
CREATE OR REPLACE FUNCTION is_entry_locked(
  p_table_name TEXT,
  p_entry_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_locked BOOLEAN;
BEGIN
  EXECUTE format(
    'SELECT is_locked FROM %I WHERE id = $1',
    p_table_name
  ) INTO v_is_locked USING p_entry_id;
  
  RETURN COALESCE(v_is_locked, FALSE);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER TO PREVENT MODIFICATION OF LOCKED ENTRIES
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_locked_entry_modification()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow unlock operations (when is_locked changes from TRUE to FALSE)
  IF TG_OP = 'UPDATE' AND OLD.is_locked = TRUE AND NEW.is_locked = FALSE THEN
    RETURN NEW;
  END IF;
  
  -- Prevent modification of locked entries
  IF TG_OP = 'UPDATE' AND OLD.is_locked = TRUE THEN
    RAISE EXCEPTION 'Cannot modify locked entry. Entry ID: %, Locked at: %, Reason: %', 
      OLD.id, OLD.locked_at, COALESCE(OLD.locked_reason, 'No reason provided');
  END IF;
  
  -- Prevent deletion of locked entries
  IF TG_OP = 'DELETE' AND OLD.is_locked = TRUE THEN
    RAISE EXCEPTION 'Cannot delete locked entry. Entry ID: %, Locked at: %, Reason: %', 
      OLD.id, OLD.locked_at, COALESCE(OLD.locked_reason, 'No reason provided');
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to vehicles
DROP TRIGGER IF EXISTS prevent_locked_vehicle_modification ON vehicles;
CREATE TRIGGER prevent_locked_vehicle_modification
  BEFORE UPDATE OR DELETE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_locked_entry_modification();

-- Apply trigger to expenses
DROP TRIGGER IF EXISTS prevent_locked_expense_modification ON expenses;
CREATE TRIGGER prevent_locked_expense_modification
  BEFORE UPDATE OR DELETE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION prevent_locked_entry_modification();

-- Apply trigger to trips
DROP TRIGGER IF EXISTS prevent_locked_trip_modification ON trips;
CREATE TRIGGER prevent_locked_trip_modification
  BEFORE UPDATE OR DELETE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION prevent_locked_entry_modification();

-- Apply trigger to odometer_verifications
DROP TRIGGER IF EXISTS prevent_locked_odometer_verification_modification ON odometer_verifications;
CREATE TRIGGER prevent_locked_odometer_verification_modification
  BEFORE UPDATE OR DELETE ON odometer_verifications
  FOR EACH ROW
  EXECUTE FUNCTION prevent_locked_entry_modification();

-- ============================================================================
-- IMAGE MANAGEMENT FUNCTIONS
-- ============================================================================

-- Function to add image to an entry
CREATE OR REPLACE FUNCTION add_entry_image(
  p_organization_id UUID,
  p_entry_type TEXT,
  p_entry_id UUID,
  p_image_url TEXT,
  p_image_key TEXT,
  p_image_type TEXT DEFAULT 'ATTACHMENT',
  p_file_name TEXT DEFAULT NULL,
  p_file_size_bytes INTEGER DEFAULT NULL,
  p_mime_type TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_uploaded_by_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_image_id UUID;
BEGIN
  INSERT INTO entry_images (
    organization_id,
    entry_type,
    entry_id,
    image_url,
    image_key,
    image_type,
    file_name,
    file_size_bytes,
    mime_type,
    description,
    uploaded_by_user_id
  ) VALUES (
    p_organization_id,
    p_entry_type,
    p_entry_id,
    p_image_url,
    p_image_key,
    p_image_type,
    p_file_name,
    p_file_size_bytes,
    p_mime_type,
    p_description,
    p_uploaded_by_user_id
  )
  RETURNING id INTO v_image_id;
  
  RETURN v_image_id;
END;
$$ LANGUAGE plpgsql;

-- Function to delete image (only if not locked)
CREATE OR REPLACE FUNCTION delete_entry_image(
  p_image_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_locked BOOLEAN;
  v_image_key TEXT;
BEGIN
  SELECT is_locked, image_key INTO v_is_locked, v_image_key
  FROM entry_images
  WHERE id = p_image_id;
  
  IF v_is_locked THEN
    RAISE EXCEPTION 'Cannot delete locked image. Image ID: %', p_image_id;
  END IF;
  
  DELETE FROM entry_images WHERE id = p_image_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to lock an image
CREATE OR REPLACE FUNCTION lock_entry_image(
  p_image_id UUID,
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE entry_images
  SET 
    is_locked = TRUE,
    locked_at = NOW(),
    locked_by_user_id = p_user_id,
    locked_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_image_id AND is_locked = FALSE;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS FOR ENTRIES WITH IMAGES
-- ============================================================================

-- View to get all images for a specific entry
CREATE OR REPLACE VIEW v_entry_images AS
SELECT 
  ei.*,
  u.first_name || ' ' || u.last_name AS uploaded_by_name,
  lu.first_name || ' ' || lu.last_name AS locked_by_name
FROM entry_images ei
LEFT JOIN users u ON ei.uploaded_by_user_id = u.id
LEFT JOIN users lu ON ei.locked_by_user_id = lu.id;

-- View for vehicles with lock and image info
CREATE OR REPLACE VIEW v_vehicles_with_details AS
SELECT 
  v.*,
  lu.first_name || ' ' || lu.last_name AS locked_by_name,
  (SELECT COUNT(*) FROM entry_images WHERE entry_type = 'VEHICLE' AND entry_id = v.id) AS image_count
FROM vehicles v
LEFT JOIN users lu ON v.locked_by_user_id = lu.id;

-- View for expenses with lock and image info
CREATE OR REPLACE VIEW v_expenses_with_details AS
SELECT 
  e.*,
  lu.first_name || ' ' || lu.last_name AS locked_by_name,
  (SELECT COUNT(*) FROM entry_images WHERE entry_type = 'EXPENSE' AND entry_id = e.id) AS image_count,
  v.registration_number AS vehicle_reg,
  v.make || ' ' || v.model AS vehicle_name
FROM expenses e
LEFT JOIN users lu ON e.locked_by_user_id = lu.id
LEFT JOIN vehicles v ON e.vehicle_id = v.id;

-- View for trips with lock and image info
CREATE OR REPLACE VIEW v_trips_with_details AS
SELECT 
  t.*,
  lu.first_name || ' ' || lu.last_name AS locked_by_name,
  (SELECT COUNT(*) FROM entry_images WHERE entry_type = 'TRIP' AND entry_id = t.id) AS image_count,
  v.registration_number AS vehicle_reg,
  v.make || ' ' || v.model AS vehicle_name
FROM trips t
LEFT JOIN users lu ON t.locked_by_user_id = lu.id
LEFT JOIN vehicles v ON t.vehicle_id = v.id;

-- View for odometer verifications with lock and image info
CREATE OR REPLACE VIEW v_odometer_verifications_with_details AS
SELECT 
  ov.*,
  lu.first_name || ' ' || lu.last_name AS locked_by_name,
  (SELECT COUNT(*) FROM entry_images WHERE entry_type = 'ODOMETER_VERIFICATION' AND entry_id = ov.id) AS additional_image_count,
  v.registration_number AS vehicle_reg,
  v.make || ' ' || v.model AS vehicle_name
FROM odometer_verifications ov
LEFT JOIN users lu ON ov.locked_by_user_id = lu.id
LEFT JOIN vehicles v ON ov.vehicle_id = v.id;

-- ============================================================================
-- AUDIT LOG ENTRIES FOR LOCK OPERATIONS
-- ============================================================================

-- Function to log lock/unlock operations
CREATE OR REPLACE FUNCTION log_lock_operation()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when entry is locked
  IF TG_OP = 'UPDATE' AND OLD.is_locked = FALSE AND NEW.is_locked = TRUE THEN
    INSERT INTO audit_logs (
      organization_id,
      user_id,
      action,
      entity_type,
      entity_id,
      old_values,
      new_values
    ) VALUES (
      NEW.organization_id,
      NEW.locked_by_user_id,
      'LOCK_ENTRY',
      TG_TABLE_NAME,
      NEW.id,
      jsonb_build_object('is_locked', FALSE),
      jsonb_build_object(
        'is_locked', TRUE,
        'locked_at', NEW.locked_at,
        'locked_reason', NEW.locked_reason
      )
    );
  END IF;
  
  -- Log when entry is unlocked
  IF TG_OP = 'UPDATE' AND OLD.is_locked = TRUE AND NEW.is_locked = FALSE THEN
    INSERT INTO audit_logs (
      organization_id,
      user_id,
      action,
      entity_type,
      entity_id,
      old_values,
      new_values
    ) VALUES (
      NEW.organization_id,
      NULL, -- Will be set by application
      'UNLOCK_ENTRY',
      TG_TABLE_NAME,
      NEW.id,
      jsonb_build_object(
        'is_locked', TRUE,
        'locked_at', OLD.locked_at,
        'locked_reason', OLD.locked_reason
      ),
      jsonb_build_object('is_locked', FALSE)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply audit trigger to vehicles
DROP TRIGGER IF EXISTS audit_vehicle_lock ON vehicles;
CREATE TRIGGER audit_vehicle_lock
  AFTER UPDATE ON vehicles
  FOR EACH ROW
  WHEN (OLD.is_locked IS DISTINCT FROM NEW.is_locked)
  EXECUTE FUNCTION log_lock_operation();

-- Apply audit trigger to expenses
DROP TRIGGER IF EXISTS audit_expense_lock ON expenses;
CREATE TRIGGER audit_expense_lock
  AFTER UPDATE ON expenses
  FOR EACH ROW
  WHEN (OLD.is_locked IS DISTINCT FROM NEW.is_locked)
  EXECUTE FUNCTION log_lock_operation();

-- Apply audit trigger to trips
DROP TRIGGER IF EXISTS audit_trip_lock ON trips;
CREATE TRIGGER audit_trip_lock
  AFTER UPDATE ON trips
  FOR EACH ROW
  WHEN (OLD.is_locked IS DISTINCT FROM NEW.is_locked)
  EXECUTE FUNCTION log_lock_operation();

-- Apply audit trigger to odometer_verifications
DROP TRIGGER IF EXISTS audit_odometer_verification_lock ON odometer_verifications;
CREATE TRIGGER audit_odometer_verification_lock
  AFTER UPDATE ON odometer_verifications
  FOR EACH ROW
  WHEN (OLD.is_locked IS DISTINCT FROM NEW.is_locked)
  EXECUTE FUNCTION log_lock_operation();

-- ============================================================================
-- SAMPLE RLS POLICIES FOR entry_images TABLE
-- ============================================================================

-- Policy: Users can view images for their organization
CREATE POLICY entry_images_select_policy ON entry_images
  FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id')::UUID
  ));

-- Policy: Users can insert images for their organization
CREATE POLICY entry_images_insert_policy ON entry_images
  FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id')::UUID
  ));

-- Policy: Users can delete unlocked images for their organization
CREATE POLICY entry_images_delete_policy ON entry_images
  FOR DELETE
  USING (
    is_locked = FALSE 
    AND organization_id IN (
      SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id')::UUID
    )
  );

-- Policy: Users can update unlocked images for their organization
CREATE POLICY entry_images_update_policy ON entry_images
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id')::UUID
    )
  )
  WITH CHECK (
    -- Allow locking (is_locked: false -> true) OR updates to unlocked images
    (is_locked = FALSE) OR (is_locked = TRUE AND OLD.is_locked = FALSE)
  );

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions on new tables and functions
GRANT SELECT, INSERT, UPDATE, DELETE ON entry_images TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION lock_entry TO authenticated;
GRANT EXECUTE ON FUNCTION unlock_entry TO authenticated;
GRANT EXECUTE ON FUNCTION is_entry_locked TO authenticated;
GRANT EXECUTE ON FUNCTION add_entry_image TO authenticated;
GRANT EXECUTE ON FUNCTION delete_entry_image TO authenticated;
GRANT EXECUTE ON FUNCTION lock_entry_image TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE entry_images IS 'Centralized image storage for all entry types (vehicles, expenses, trips, odometer verifications)';
COMMENT ON COLUMN entry_images.entry_type IS 'Type of parent entry: VEHICLE, EXPENSE, TRIP, ODOMETER_VERIFICATION';
COMMENT ON COLUMN entry_images.image_type IS 'Purpose of image: RECEIPT, ODOMETER, ATTACHMENT, DAMAGE';
COMMENT ON COLUMN entry_images.is_locked IS 'When TRUE, image cannot be deleted or replaced';

COMMENT ON FUNCTION lock_entry IS 'Lock an entry to prevent modification or deletion';
COMMENT ON FUNCTION unlock_entry IS 'Unlock an entry (requires elevated permissions)';
COMMENT ON FUNCTION is_entry_locked IS 'Check if an entry is locked';
