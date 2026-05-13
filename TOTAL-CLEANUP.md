# TOTAL CLEANUP - Remove ALL Data

## 🎯 Goal
Remove EVERYTHING - all accounts, uploads, expenses, fuel entries, receipts, odometer photos. Complete fresh start.

---

## 🗑️ DATABASE CLEANUP

### 1. Stop PostgreSQL and Drop ALL Databases
```bash
# Stop PostgreSQL service
brew services stop postgresql@16

# Connect to default postgres database
psql -h localhost -U postgres -d postgres

# Drop ALL existing databases completely
DROP DATABASE IF EXISTS vehicle_expense;
DROP DATABASE IF EXISTS fuel_tax_za;
DROP DATABASE IF EXISTS postgres;
DROP DATABASE IF EXISTS template1;

# List to verify all are gone
\l

# Exit
\q
```

### 2. Remove ALL PostgreSQL Data Files (Complete Fresh)
```bash
# WARNING: This removes ALL PostgreSQL data - complete fresh start
brew services stop postgresql@16
sudo rm -rf /opt/homebrew/var/postgresql@16/*
brew services start postgresql@16

# Wait for PostgreSQL to initialize
sleep 5
```

### 3. Create Fresh Database and Import Clean Schema
```bash
# Create new database
psql -h localhost -U postgres -c "CREATE DATABASE fuel_tax_za;"

# Import clean schema (NO sample data)
psql -h localhost -U postgres -d fuel_tax_za -f backend/docs/database-schema-combined-local.sql

# Verify clean tables (should be empty)
psql -h localhost -U postgres -d fuel_tax_za -c "SELECT COUNT(*) FROM organizations;"
psql -h localhost -U postgres -d fuel_tax_za -c "SELECT COUNT(*) FROM users;"
psql -h localhost -U postgres -d fuel_tax_za -c "SELECT COUNT(*) FROM expenses;"
```

---

## 📁 BACKEND FILE CLEANUP

### 4. Remove ALL Backend Uploads
```bash
# Remove ALL uploaded files (receipts, odometer photos, etc.)
rm -rf /Users/stefanroets/Downloads/fuel-tax-za/backend/uploads/*

# Verify uploads directory is empty
ls -la /Users/stefanroets/Downloads/fuel-tax-za/backend/uploads/
```

### 5. Remove Backend Generated Files
```bash
# Remove Maven build artifacts
cd /Users/stefanroets/Downloads/fuel-tax-za/backend
rm -rf target/
rm -rf .mvn/

# Remove Spring Boot logs
rm -rf logs/
rm -f *.log

# Remove temporary files
find . -name "*.tmp" -delete
find . -name "*.temp" -delete
```

---

## 🌐 FRONTEND CLEANUP

### 6. Remove ALL Frontend Data
```bash
# Remove any frontend uploads (if they exist)
rm -rf /Users/stefanroets/Downloads/fuel-tax-za/frontend/public/uploads/*
rm -rf /Users/stefanroets/Downloads/fuel-tax-za/frontend/uploads/*

# Remove Next.js build artifacts
cd /Users/stefanroets/Downloads/fuel-tax-za/frontend
rm -rf .next/
rm -rf out/

# Remove Node modules (fresh install)
rm -rf node_modules/
rm -f package-lock.json
rm -f pnpm-lock.yaml
```

### 7. Clear Browser Storage (Manual Instructions)
**Browser localStorage:**
- Open Developer Tools (F12)
- Go to Application → Local Storage
- Remove ALL items for localhost:3000
- Clear: `jwt_token`, `role`, `org_mode`, `user_profile`

**Browser sessionStorage:**
- Go to Application → Session Storage
- Clear ALL items for localhost:3000

**Browser Cookies:**
- Go to Application → Cookies
- Remove ALL cookies for localhost:3000

---

## 🔐 SECURITY CLEANUP

### 8. Clear All JWT Tokens and Sessions
```bash
# Clear any remaining JWT tokens from system
rm -f ~/.jwt_tokens
rm -f ~/.auth_tokens
```

---

## 🧪 VERIFICATION

### 9. Verify Complete Cleanup
```bash
# Verify database is clean and empty
psql -h localhost -U postgres -d fuel_tax_za -c "
SELECT 
  (SELECT COUNT(*) FROM organizations) as orgs,
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM vehicles) as vehicles,
  (SELECT COUNT(*) FROM expenses) as expenses,
  (SELECT COUNT(*) FROM fuel_logs) as fuel_logs;
"

# Should return: 0 | 0 | 0 | 0 | 0

# Verify no upload files exist
ls -la /Users/stefanroets/Downloads/fuel-tax-za/backend/uploads/
# Should be empty

# Verify frontend is clean
ls -la /Users/stefanroets/Downloads/fuel-tax-za/frontend/.next/
# Should not exist
```

---

## 🚀 FRESH START

### 10. Install Dependencies and Start Fresh
```bash
# Install fresh frontend dependencies
cd /Users/stefanroets/Downloads/fuel-tax-za/frontend
pnpm install

# Install fresh backend dependencies
cd /Users/stefanroets/Downloads/fuel-tax-za/backend
./mvnw clean install

# Start PostgreSQL
brew services start postgresql@16

# Start backend (port 8080)
cd /Users/stefanroets/Downloads/fuel-tax-za/backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# Start frontend (port 3000) - in new terminal
cd /Users/stefanroets/Downloads/fuel-tax-za/frontend
pnpm dev
```

---

## ✅ WHAT YOU'LL HAVE AFTER CLEANUP

### Database:
- ✅ **0 Organizations** - No companies created
- ✅ **0 Users** - No accounts exist
- ✅ **0 Vehicles** - No vehicles registered
- ✅ **0 Expenses** - No fuel entries, receipts, or expenses
- ✅ **0 Fuel Logs** - No fuel tracking data
- ✅ **0 Trips** - No trip records

### Files:
- ✅ **0 Uploads** - No receipts or odometer photos
- ✅ **0 Build Artifacts** - Fresh Next.js and Maven builds
- ✅ **0 Browser Data** - Clean localStorage and cookies
- ✅ **0 JWT Tokens** - No active sessions

### Ready For:
- ✅ **Fresh Registration** - Create new admin account
- ✅ **Clean Testing** - No conflicting old data
- ✅ **New Organization** - Setup fresh company/vehicle data
- ✅ **Clean Development** - No legacy conflicts

---

## 📋 CHECKLIST

### Before Starting:
- [ ] PostgreSQL stopped
- [ ] All databases dropped
- [ ] Backend uploads deleted
- [ ] Frontend build artifacts deleted
- [ ] Browser storage cleared

### After Cleanup:
- [ ] Fresh `fuel_tax_za` database created
- [ ] Clean schema imported
- [ ] All counts return 0
- [ ] Dependencies reinstalled
- [ ] Services start without errors

---

## ⚠️ IMPORTANT NOTES

**This is COMPLETE data destruction:**
- ALL accounts will be permanently deleted
- ALL expense data will be permanently deleted  
- ALL uploaded files will be permanently deleted
- ALL tokens and sessions will be invalidated

**Backup if needed:**
- Run this BEFORE cleanup if you want to preserve any data
```bash
pg_dump -h localhost -U postgres fuel_tax_za > backup.sql
```

**After cleanup, you must:**
1. Create new admin account via registration
2. Setup new organization
3. Add vehicles and start fresh tracking
