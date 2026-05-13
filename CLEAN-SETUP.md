# Clean Database Setup - Fresh Start

## 🎯 Goal
Start completely fresh with new database structure, no old data or conflicts.

---

## 🗑️ Complete Database Cleanup

### 1. Stop PostgreSQL (if running)
```bash
brew services stop postgresql@16
```

### 2. Remove ALL existing databases
```bash
# Connect to PostgreSQL default database
psql -h localhost -U postgres -d postgres

# List all databases to see what exists
\l

# Drop ALL existing databases (replace with actual database names)
DROP DATABASE IF EXISTS vehicle_expense;
DROP DATABASE IF EXISTS fuel_tax_za;
DROP DATABASE IF EXISTS postgres;  # Will be recreated automatically

# Exit PostgreSQL
\q
```

### 3. Clean up any remaining data files (optional - for complete fresh start)
```bash
# WARNING: This removes ALL PostgreSQL data - use only if you want completely fresh
brew services stop postgresql@16
rm -rf /opt/homebrew/var/postgresql@16/*
brew services start postgresql@16
```

---

## 🆕 Fresh Database Setup

### 4. Create new clean database
```bash
# Create the new database with correct name
psql -h localhost -U postgres -c "CREATE DATABASE fuel_tax_za;"

# Verify it was created
psql -h localhost -U postgres -c "\l"
```

### 5. Import new schema structure
```bash
# Import the combined local schema (clean, no sample data)
psql -h localhost -U postgres -d fuel_tax_za -f backend/docs/database-schema-combined-local.sql
```

### 6. Verify new structure
```bash
# Connect to new database
psql -h localhost -U postgres -d fuel_tax_za

# List all tables
\dt

# Check table structures
\d organizations
\d users
\d vehicles
\d expenses

# Exit
\q
```

---

## 🧹 Clear Uploads & Old Data

### 7. Remove any existing uploads
```bash
# Clear frontend uploads (if any)
rm -rf frontend/public/uploads/*
rm -rf frontend/uploads/*

# Clear backend uploads (if any)
rm -rf backend/uploads/*
rm -rf backend/static/uploads/*
```

---

## ✅ Fresh Start Verification

### 8. Start PostgreSQL
```bash
brew services start postgresql@16
```

### 9. Verify database is ready
```bash
# Test connection
pg_isready -h localhost -p 5432

# Test database access
psql -h localhost -U postgres -d fuel_tax_za -c "SELECT COUNT(*) FROM organizations;"
```

---

## 🚀 Ready for Clean Development

**What you'll have:**
- ✅ Fresh PostgreSQL 16 database `fuel_tax_za`
- ✅ New schema structure (no old data)
- ✅ No conflicting accounts or uploads
- ✅ Clean start for local testing

**Backend Configuration:**
- Database URL: `jdbc:postgresql://localhost:5432/fuel_tax_za`
- Schema: `backend/docs/database-schema-combined-local.sql`
- No sample data, no conflicts

**Frontend Configuration:**
- API URL: `http://localhost:8080/api/v1`
- Clean localStorage (no old tokens)
- Ready for fresh registration

---

## 📝 Notes
- This setup uses the **new database structure** from `database-schema-combined-local.sql`
- **No old data** will be preserved - completely fresh start
- **All accounts** must be created fresh
- **No uploads** from previous versions will exist
- Ready for clean local testing without any legacy conflicts
