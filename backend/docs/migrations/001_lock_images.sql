-- Migration 001: Lock Status and Entry Images
-- Run this AFTER the base schema (database-schema.sql) is in place
-- ============================================================================

-- Add lock_status enum if not exists
DO $$ BEGIN
  CREATE TYPE lock_status AS ENUM ('UNLOCKED', 'LOCKED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- ADD LOCK COLUMNS TO EXISTING TABLES
-- ============================================================================

-- Vehicles
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS locked_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS locked_reason TEXT;

-- Expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS locked_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS locked_reason TEXT;

-- Trips
ALTER TABLE trips ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS locked_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS locked_reason TEXT;

-- Odometer Verifications
ALTER TABLE odometer_verifications ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE odometer_verifications ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE odometer_verifications ADD COLUMN IF NOT EXISTS locked_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE odometer_verifications ADD COLUMN IF NOT EXISTS locked_reason TEXT;

-- ============================================================================
-- ENTRY IMAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS entry_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entry_type VARCHAR(30) NOT NULL CHECK (entry_type IN ('VEHICLE', 'EXPENSE', 'TRIP', 'ODOMETER_VERIFICATION')),
  entry_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  image_key TEXT,
  image_type VARCHAR(20) NOT NULL CHECK (image_type IN ('RECEIPT', 'ODOMETER', 'ATTACHMENT', 'DAMAGE')),
  file_name VARCHAR(255),
  file_size_bytes INTEGER,
  mime_type VARCHAR(50),
  description TEXT,
  uploaded_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_locked BOOLEAN DEFAULT FALSE,
  locked_at TIMESTAMP WITH TIME ZONE,
  locked_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  locked_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entry_images_org ON entry_images(organization_id);
CREATE INDEX IF NOT EXISTS idx_entry_images_entry ON entry_images(entry_type, entry_id);
CREATE INDEX IF NOT EXISTS idx_entry_images_type ON entry_images(image_type);

-- Enable RLS
ALTER TABLE entry_images ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS entry_images_org_policy ON entry_images;
CREATE POLICY entry_images_org_policy ON entry_images
  FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id', true)::UUID
  ));

-- ============================================================================
-- LOCK/UNLOCK FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION lock_entry(
  p_table_name TEXT,
  p_entry_id UUID,
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  EXECUTE format(
    'UPDATE %I SET is_locked = TRUE, locked_at = NOW(), locked_by_user_id = $1, locked_reason = $2 WHERE id = $3',
    p_table_name
  ) USING p_user_id, p_reason, p_entry_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION unlock_entry(
  p_table_name TEXT,
  p_entry_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  EXECUTE format(
    'UPDATE %I SET is_locked = FALSE, locked_at = NULL, locked_by_user_id = NULL, locked_reason = NULL WHERE id = $1',
    p_table_name
  ) USING p_entry_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS TO PREVENT MODIFICATION OF LOCKED ENTRIES
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_locked_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_locked = TRUE AND TG_OP = 'UPDATE' THEN
    IF NEW.is_locked = FALSE THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Cannot modify locked entry';
  END IF;
  IF OLD.is_locked = TRUE AND TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Cannot delete locked entry';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS vehicles_lock_trigger ON vehicles;
CREATE TRIGGER vehicles_lock_trigger
  BEFORE UPDATE OR DELETE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION prevent_locked_modification();

DROP TRIGGER IF EXISTS expenses_lock_trigger ON expenses;
CREATE TRIGGER expenses_lock_trigger
  BEFORE UPDATE OR DELETE ON expenses
  FOR EACH ROW EXECUTE FUNCTION prevent_locked_modification();

DROP TRIGGER IF EXISTS trips_lock_trigger ON trips;
CREATE TRIGGER trips_lock_trigger
  BEFORE UPDATE OR DELETE ON trips
  FOR EACH ROW EXECUTE FUNCTION prevent_locked_modification();

DROP TRIGGER IF EXISTS odometer_verifications_lock_trigger ON odometer_verifications;
CREATE TRIGGER odometer_verifications_lock_trigger
  BEFORE UPDATE OR DELETE ON odometer_verifications
  FOR EACH ROW EXECUTE FUNCTION prevent_locked_modification();

GRANT EXECUTE ON FUNCTION lock_entry TO authenticated;
GRANT EXECUTE ON FUNCTION unlock_entry TO authenticated;
