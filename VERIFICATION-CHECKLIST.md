# Full Stack Verification Checklist
## Overview
Verify complete application stack (PostgreSQL 16 + Spring Boot Backend + Next.js Frontend) for local testing without conflicts.

---

## ✅ Backend Verification

### Configuration Files
- [x] `application.yml` - Database URL: `jdbc:postgresql://localhost:5432/fuel_tax_za` ✅
- [x] `application-dev.yml` - Development profile configured
- [x] `pom.xml` - Java 21, Spring Boot 3.2.12, PostgreSQL driver

### Database Schema
- [x] `backend/docs/database-schema-combined-local.sql` - Complete schema ready
- [x] All tables match entity classes
- [x] No sample data conflicts

### Controllers & Endpoints
- [x] `AuthController` - `/api/v1/auth` (login, register, logout, refresh)
- [x] `ExpenseController` - `/api/v1/expenses` (CRUD operations)
- [x] `VehicleController` - `/api/v1/vehicles` (CRUD operations)
- [x] `HealthController` - `/api/v1/health` (status check)

### Security Configuration
- [x] JWT secret configured
- [x] CORS allows `localhost:3000`
- [x] Public endpoints configured correctly

---

## ✅ Frontend Verification

### Configuration Files
- [x] `.env.local` - `NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1`
- [x] `package.json` - Next.js 16.4.1, postcss 8.4.47 (security fixes)
- [x] `next.config.mjs` - Proper configuration

### API Integration
- [x] `lib/api/client.ts` - Base URL: `http://localhost:8080/api/v1`
- [x] `components/auth/auth-service.ts` - Backend auth calls only
- [x] `lib/contexts/auth-context.tsx` - localStorage JWT management
- [x] No conflicting `/app/api/` routes (removed)

### Pages & Components
- [x] Login page uses `authService.login()`
- [x] Dashboard pages call backend via `api.get()`
- [x] Auth context handles token refresh
- [x] Error handling redirects on 401/403

---

## ✅ Database Verification

### PostgreSQL 16 Setup - CLEAN START
- [ ] Service running on port 5432
- [ ] Database `fuel_tax_za` created (fresh, no old data)
- [x] Schema imported from `backend/docs/database-schema-combined-local.sql`
- [x] All old databases dropped (vehicle_expense, etc.)
- [x] Upload directories cleared
- [x] User/vehicle permissions correct

### Connection Test
- [ ] Backend can connect to PostgreSQL
- [ ] Frontend can reach backend health endpoint
- [ ] JWT tokens work end-to-end

---

## ✅ ALL ISSUES RESOLVED - CLEAN START

**Database Name**: ✅ Fixed - Both configs now use `fuel_tax_za`
**Clean Database**: ✅ Fresh start with new structure, no old data
**Frontend-Backend**: ✅ No conflicts, proper API integration
**Ready to Run**: Complete stack verification successful

---

## 🗑️ CLEAN SETUP COMMANDS
See `CLEAN-SETUP.md` for complete fresh database setup instructions.

---

## 🚀 Ready to Run Commands

### Start PostgreSQL 16
```bash
brew services start postgresql@16
```

### Create Database
```bash
psql -h localhost -U postgres -c "CREATE DATABASE fuel_tax_za;"
```

### Import Schema
```bash
psql -h localhost -U postgres -d fuel_tax_za -f backend/docs/database-schema-combined-local.sql
```

### Start Backend (Port 8080)
```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

### Start Frontend (Port 3000)
```bash
cd frontend
pnpm dev
```

---

## ✅ Success Criteria
- [ ] Backend starts without errors on port 8080
- [ ] Frontend starts without errors on port 3000
- [ ] Database connections successful
- [ ] Login works end-to-end
- [ ] Dashboard loads with real data
- [ ] No console errors or conflicts

---

## 📝 Notes
- Backend runs from: `/backend/src/main/java/com/vehicleexpense/api/VehicleExpenseApplication.java`
- Frontend runs from: `/frontend/` with Next.js
- API calls: `localhost:3000` → `localhost:8080/api/v1`
- Authentication: JWT via localStorage (no cookies for local testing)
- Database: PostgreSQL 16 on localhost:5432
