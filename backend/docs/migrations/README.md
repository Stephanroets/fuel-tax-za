# Database Migrations Guide

This document explains how to apply the database schema changes for the Fuel Tax ZA application.

## Migration Files

The migrations are located in `backend/docs/migrations/` and should be run **in order**:

| Order | File | Description |
|-------|------|-------------|
| Base | `database-schema.sql` | Original base schema (run first if starting fresh) |
| 001 | `001_lock_images.sql` | Lock status for entries + entry images table |
| 002 | `002_tyre_rotation_tracking.sql` | Tyre rotation warnings linked to fuel odometer |
| 003 | `003_fixed_admin_separate_tables.sql` | Separate tables for each Fixed & Admin expense type |
| 004 | `004_fuel_consumption_fix.sql` | Corrected L/100km calculation (full tank to full tank) |
| 005 | `005_expiry_alerts.sql` | Expiry alerts for licenses, insurance, certificates |

## How to Run Migrations

### Option 1: Using psql (Command Line)

```bash
# Connect to your PostgreSQL 16 database
psql -h your-host -U your-user -d your-database

# Run migrations in order
\i backend/docs/database-schema.sql
\i backend/docs/migrations/001_lock_images.sql
\i backend/docs/migrations/002_tyre_rotation_tracking.sql
\i backend/docs/migrations/003_fixed_admin_separate_tables.sql
\i backend/docs/migrations/004_fuel_consumption_fix.sql
\i backend/docs/migrations/005_expiry_alerts.sql
```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of each migration file
4. Run them **in order** (001 first, then 002, etc.)

### Option 3: Using a Migration Tool

If you're using a migration tool like `node-pg-migrate` or `prisma`:

```bash
# Example with node-pg-migrate
npx node-pg-migrate up
```

## Environment Variables

Make sure your database connection is configured:

```env
# For direct PostgreSQL connection
DATABASE_URL=postgresql://user:password@host:5432/database

# For Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Backend API Routes Needed

After running the migrations, the frontend expects these API endpoints. Create them in your backend:

### Entries (Lock/Edit/Delete)

```
POST   /api/entries/:type/:id/lock      - Lock an entry
POST   /api/entries/:type/:id/unlock    - Unlock an entry
PUT    /api/entries/:type/:id           - Update an entry
DELETE /api/entries/:type/:id           - Delete an entry
POST   /api/entries/:type/:id/images    - Upload image for entry
DELETE /api/images/:id                  - Delete an image
POST   /api/images/:id/lock             - Lock an image
```

### Tyre Rotation Tracking

```
GET    /api/vehicles/:id/tyre-rotation-warnings   - Get warnings for vehicle
POST   /api/tyre-rotation-tracking                - Create tracking record
POST   /api/tyre-rotation-tracking/:id/rotate     - Record a rotation
POST   /api/tyre-rotation-tracking/:id/dismiss    - Dismiss warning
```

### Expiry Alerts

```
GET    /api/expiry-alerts                - Get all expiry alerts
POST   /api/expiry-alerts/:type/:id/dismiss    - Dismiss alert
POST   /api/expiry-alerts/:type/:id/undismiss  - Undismiss alert
```

### Fixed & Admin Expenses

```
POST   /api/expenses/insurance-premiums           - Create insurance record
POST   /api/expenses/vehicle-tracking             - Create tracking subscription
POST   /api/expenses/etoll-payments               - Create e-toll payment
POST   /api/expenses/license-renewals             - Create license renewal
POST   /api/expenses/roadworthy-certificates      - Create roadworthy cert
POST   /api/expenses/other-fixed                  - Create other expense
```

### Fuel Consumption

```
GET    /api/vehicles/:id/fuel-consumption         - Get consumption stats
GET    /api/vehicles/:id/fuel-history             - Get consumption history
```

## Example Backend Implementation (Next.js API Route)

Here's an example of how to implement the expiry alerts endpoint:

```typescript
// app/api/expiry-alerts/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  // Get user's organization from auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  // Get organization ID
  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()
  
  // Call the database function
  const { data, error } = await supabase.rpc('get_expiry_alerts', {
    p_organization_id: userData.organization_id,
    p_include_dismissed: false
  })
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  
  return NextResponse.json(data)
}
```

## Testing the Migrations

After running migrations, verify with:

```sql
-- Check new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'entry_images', 
  'tyre_rotation_tracking', 
  'insurance_premiums',
  'vehicle_tracking_subscriptions',
  'etoll_payments',
  'license_renewals',
  'roadworthy_certificates',
  'other_fixed_expenses',
  'vehicle_fuel_consumption_stats',
  'expiry_dismissals'
);

-- Check new columns on existing tables
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'vehicles' AND column_name = 'is_locked';

-- Test expiry alerts function
SELECT * FROM get_expiry_alerts('your-org-id-here', false);

-- Test tyre rotation function  
SELECT * FROM get_tyre_rotation_warnings('your-org-id-here');
```

## Rollback (If Needed)

To rollback migrations, run in reverse order:

```sql
-- Rollback 005
DROP TABLE IF EXISTS expiry_dismissals CASCADE;
DROP FUNCTION IF EXISTS get_expiry_alerts CASCADE;
DROP FUNCTION IF EXISTS dismiss_expiry_alert CASCADE;
DROP FUNCTION IF EXISTS undismiss_expiry_alert CASCADE;

-- Rollback 004
ALTER TABLE fuel_logs DROP COLUMN IF EXISTS is_baseline_fill;
ALTER TABLE fuel_logs DROP COLUMN IF EXISTS consumption_l_per_100km;
ALTER TABLE fuel_logs DROP COLUMN IF EXISTS consumption_calculated_at;
ALTER TABLE fuel_logs DROP COLUMN IF EXISTS consumption_notes;
DROP TABLE IF EXISTS vehicle_fuel_consumption_stats CASCADE;
DROP VIEW IF EXISTS v_vehicle_fuel_consumption;

-- Rollback 003
DROP TABLE IF EXISTS insurance_premiums CASCADE;
DROP TABLE IF EXISTS vehicle_tracking_subscriptions CASCADE;
DROP TABLE IF EXISTS etoll_payments CASCADE;
DROP TABLE IF EXISTS license_renewals CASCADE;
DROP TABLE IF EXISTS roadworthy_certificates CASCADE;
DROP TABLE IF EXISTS other_fixed_expenses CASCADE;

-- Rollback 002
DROP TABLE IF EXISTS tyre_rotation_tracking CASCADE;
DROP FUNCTION IF EXISTS get_tyre_rotation_warnings CASCADE;
DROP FUNCTION IF EXISTS record_tyre_rotation CASCADE;
DROP FUNCTION IF EXISTS dismiss_tyre_rotation_warning CASCADE;

-- Rollback 001
ALTER TABLE vehicles DROP COLUMN IF EXISTS is_locked;
ALTER TABLE vehicles DROP COLUMN IF EXISTS locked_at;
ALTER TABLE vehicles DROP COLUMN IF EXISTS locked_by_user_id;
ALTER TABLE vehicles DROP COLUMN IF EXISTS locked_reason;
-- (repeat for expenses, trips, odometer_verifications)
DROP TABLE IF EXISTS entry_images CASCADE;
DROP FUNCTION IF EXISTS lock_entry CASCADE;
DROP FUNCTION IF EXISTS unlock_entry CASCADE;
```

## Frontend Integration

The frontend components have already been updated to use these new features:

1. **Entry Actions** (`components/entries/entry-actions.tsx`) - Edit, delete, lock buttons
2. **Entry Image Manager** (`components/entries/entry-image-manager.tsx`) - Image upload/delete/lock
3. **Dashboard Header** (`components/navigation/dashboard-header.tsx`) - Notification bell with expiry alerts and tyre rotation warnings
4. **Fixed Admin Form** (`components/forms/fixed-admin-form.tsx`) - Separate forms for each expense type
5. **Tyre Rotation Hook** (`lib/hooks/use-tyre-rotation-warnings.ts`) - Client-side state management
6. **Expiry Alerts Hook** (`lib/hooks/use-expiry-alerts.ts`) - Client-side state management

The frontend currently uses localStorage for demo purposes. Connect to your backend API by updating the hooks to make real API calls.
