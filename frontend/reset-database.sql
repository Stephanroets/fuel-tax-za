-- =================================================================
-- DATABASE RESET SCRIPT - PostgreSQL 16
-- Clears all data from vehicle_compliance database
-- =================================================================

-- Disable foreign key constraints temporarily
SET session_replication_role = replica;

-- Clear all tables in the correct order (respecting foreign keys)
TRUNCATE TABLE 
    refresh_tokens,
    trips,
    fuel_logs,
    expenses,
    odometer_verifications,
    vehicles,
    maintenance_topups,
    mechanic_services,
    tires,
    fixed_expenses,
    users,
    organizations
    RESTART IDENTITY
    CASCADE;

-- Reset all sequences to start from 1
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT sequencename 
        FROM pg_sequences 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE 'ALTER SEQUENCE ' || r.sequencename || ' RESTART WITH 1';
    END LOOP;
END $$;

-- Re-enable foreign key constraints
SET session_replication_role = DEFAULT;

-- Verify all tables are empty
DO $$
DECLARE
    r RECORD;
    table_count INTEGER;
BEGIN
    RAISE NOTICE '=== DATABASE RESET COMPLETE ===';
    RAISE NOTICE 'Verifying all tables are empty...';
    
    FOR r IN (
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'users', 'organizations', 'vehicles', 'expenses', 
            'trips', 'fuel_logs', 'odometer_verifications',
            'refresh_tokens', 'maintenance_topups', 
            'mechanic_services', 'tires', 'fixed_expenses'
        )
        ORDER BY tablename
    ) LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I', r.tablename) INTO table_count;
        RAISE NOTICE 'Table %: % rows', r.tablename, table_count;
    END LOOP;
    
    RAISE NOTICE '=== DATABASE IS NOW FRESH ===';
END $$;

-- Show table structure for verification
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN (
        'users', 'organizations', 'vehicles', 'expenses', 
        'trips', 'fuel_logs', 'odometer_verifications',
        'refresh_tokens', 'maintenance_topups', 
        'mechanic_services', 'tires', 'fixed_expenses'
    )
ORDER BY table_name, ordinal_position;
