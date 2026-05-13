# Vehicle Expense API - Local Development Guide

## Phase 1: Database Setup (PostgreSQL 16)

### 1.1 Start PostgreSQL (if not running)
```bash
# Using Homebrew on Mac
brew services start postgresql@16

# Or verify it's running
brew services list | grep postgresql
```

### 1.2 Create Database and Import Schema
```bash
# Create database
createdb vehicle_compliance

# Import schema
psql -d vehicle_compliance -f docs/database-schema-local.sql

# Verify tables were created
psql -d vehicle_compliance -c "\dt"
```

### Expected Output
```
                 List of relations
 Schema |        Name        | Type  |  Owner
--------+--------------------+-------+----------
 public | expenses           | table | postgres
 public | fixed_expenses     | table | postgres
 public | fuel_logs          | table | postgres
 public | maintenance_topups | table | postgres
 public | mechanic_services  | table | postgres
 public | odometer_verifications | table | postgres
 public | organizations      | table | postgres
 public | refresh_tokens     | table | postgres
 public | tires              | table | postgres
 public | trips              | table | postgres
 public | users              | table | postgres
 public | vehicles           | table | postgres
```

## Phase 2: Backend Setup (Spring Boot)

### 2.1 Build the Project
```bash
cd backend

# Download dependencies and compile
./mvnw clean compile

# Or using Maven directly if installed
mvn clean compile
```

### 2.2 Set Environment Variables (optional - defaults work for local dev)
```bash
# Optional: Set custom database credentials
export DB_USERNAME=postgres
export DB_PASSWORD=postgres
export JWT_SECRET=$(openssl rand -base64 32)
```

### 2.3 Run with Dev Profile
```bash
# Using Maven
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# Or
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# Or run the JAR directly after building
./mvnw clean package -DskipTests
java -jar target/vehicle-expense-api-*.jar --spring.profiles.active=dev
```

### 2.4 Verify Backend is Running
```bash
# Test health endpoint
curl http://localhost:8080/api/v1/health

# Expected response:
{
  "status": "UP",
  "service": "vehicle-expense-api",
  "timestamp": "2024-01-15T10:30:00",
  "database": "connected"
}
```

### 2.5 Access API Documentation
- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI Spec: http://localhost:8080/v3/api-docs

## Phase 3: Frontend (Next.js)

### 3.1 Install Dependencies
```bash
# From project root (fuel-tax-za/frontend/)
pnpm install
# or
npm install
```

### 3.2 Configure Environment
Create `.env.local` in frontend root:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

### 3.3 Start Development Server
```bash
pnpm dev
# or
npm run dev
```

Frontend will be available at: http://localhost:3000

## Complete Startup Sequence

### Terminal 1: Database (one-time setup)
```bash
createdb vehicle_compliance
psql -d vehicle_compliance -f docs/database-schema-local.sql
```

### Terminal 2: Backend
```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

### Terminal 3: Frontend
```bash
# From project root
pnpm dev
```

## Key Features Implemented

### Database Schema (PostgreSQL)
- ✅ All core tables: `organizations`, `users`, `vehicles`, `expenses`
- ✅ Expense detail tables: `fuel_logs`, `mechanic_services`, `maintenance_topups`, `tires`, `fixed_expenses`
- ✅ SARS Compliance: `trips`, `odometer_verifications`
- ✅ All PostgreSQL ENUMs matching Java Enums
- ✅ Foreign keys and indexes
- ✅ Auto-updating `updated_at` triggers

### JPA Entities
- ✅ All 11 entities with proper Lombok annotations
- ✅ **Fixed JPA Relationships**:
  - `User` -> `Organization`: `@ManyToOne` (owning)
  - `Organization` -> `User`: `@OneToMany(mappedBy)` (inverse)
  - `Expense` -> `Vehicle`: `@ManyToOne` (owning)
  - `Vehicle` -> `Expense`: `@OneToMany(mappedBy)` (inverse)
- ✅ **JSON Recursion Prevention**:
  - `@JsonBackReference` on owning sides (won't serialize)
  - `@JsonManagedReference` on inverse sides (will serialize)
- ✅ **SARS OdometerVerification entity** with validation helpers

### Java Enums (Strict PostgreSQL Matching)
| PostgreSQL ENUM | Java Enum |
|-----------------|-----------|
| `user_role` | `UserRole` |
| `organization_mode` | `OrganizationMode` |
| `fuel_type` | `FuelType` |
| `expense_category` | `ExpenseCategory` |
| `maintenance_item_type` | `MaintenanceItemType` |
| `service_type` | `ServiceType` |
| `fixed_expense_type` | `FixedExpenseType` |
| `trip_purpose` | `TripPurpose` |
| `odometer_reading_type` | `OdometerReadingType` |

### Service Mocking ("Offline" Mode)
- ✅ `FileStorageService` interface
  - `LocalFileStorageService` (@Profile("dev")) - saves to `uploads/` folder
  - `S3FileStorageService` (@Profile("prod")) - AWS S3 stub for production
- ✅ `EmailService` interface
  - `ConsoleEmailService` (@Profile("dev")) - logs to console
  - `BrevoEmailService` (@Profile("prod")) - Brevo API stub

### Security (JWT)
- ✅ `JwtService` - token generation and validation
- ✅ `JwtAuthenticationFilter` - request filtering
- ✅ `SecurityConfig` - endpoint authorization
- ✅ Password encoding with BCrypt

### Configuration
- ✅ `application.yml` - defaults
- ✅ `application-dev.yml` - local PostgreSQL, verbose logging
- ✅ Static resource serving for uploaded files

## File Structure

```
backend/
├── pom.xml
├── src/
│   └── main/
│       ├── java/com/vehicleexpense/api/
│       │   ├── VehicleExpenseApplication.java
│       │   ├── config/
│       │   │   └── StaticResourceConfig.java
│       │   ├── controller/
│       │   │   └── HealthController.java
│       │   ├── dto/
│       │   │   ├── AuthResponse.java
│       │   │   ├── LoginRequest.java
│       │   │   └── RegisterRequest.java
│       │   ├── entity/
│       │   │   ├── Expense.java
│       │   │   ├── FixedExpense.java
│       │   │   ├── FuelLog.java
│       │   │   ├── MaintenanceTopup.java
│       │   │   ├── MechanicService.java
│       │   │   ├── OdometerVerification.java
│       │   │   ├── Organization.java
│       │   │   ├── Tire.java
│       │   │   ├── Trip.java
│       │   │   ├── User.java
│       │   │   └── Vehicle.java
│       │   ├── enums/
│       │   │   ├── ExpenseCategory.java
│       │   │   ├── FixedExpenseType.java
│       │   │   ├── FuelType.java
│       │   │   ├── MaintenanceItemType.java
│       │   │   ├── OdometerReadingType.java
│       │   │   ├── OrganizationMode.java
│       │   │   ├── ServiceType.java
│       │   │   ├── TripPurpose.java
│       │   │   └── UserRole.java
│       │   ├── repository/
│       │   │   ├── OrganizationRepository.java
│       │   │   └── UserRepository.java
│       │   ├── security/
│       │   │   ├── JwtAuthenticationFilter.java
│       │   │   ├── JwtClaims.java
│       │   │   ├── JwtService.java
│       │   │   └── SecurityConfig.java
│       │   ├── service/
│       │   │   ├── UserDetailsServiceImpl.java
│       │   │   ├── email/
│       │   │   │   ├── BrevoEmailService.java
│       │   │   │   ├── ConsoleEmailService.java
│       │   │   │   └── EmailService.java
│       │   │   └── storage/
│       │   │       ├── FileStorageService.java
│       │   │       ├── LocalFileStorageService.java
│       │   │       └── S3FileStorageService.java
│       │   └── ... (additional services/controllers to be added)
│       └── resources/
│           ├── application.yml
│           └── application-dev.yml
└── uploads/          # Created at runtime for local file storage
```

## Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
brew services list | grep postgresql

# Verify database exists
psql -l | grep vehicle_compliance

# Check connection
createdb -U postgres -h localhost vehicle_compliance
```

### Port 8080 Already in Use
```bash
# Find process using port 8080
lsof -i :8080

# Kill process
kill -9 <PID>

# Or change port in application-dev.yml
server:
  port: 8081
```

### Schema Validation Errors
```bash
# Drop and recreate database
dropdb vehicle_compliance
createdb vehicle_compliance
psql -d vehicle_compliance -f docs/database-schema-local.sql
```

## Next Steps

To complete the backend, implement:
1. `AuthController` - login/register endpoints
2. `VehicleController` - CRUD for vehicles
3. `ExpenseController` - CRUD for expenses with category-specific handling
4. `TripController` - SARS logbook entries
5. `OdometerVerificationController` - SARS compliance photo uploads
6. `ReportService` - tax year summaries

All infrastructure is ready - just add the business logic!
