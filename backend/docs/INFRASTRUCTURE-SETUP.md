# Vehicle Expense System - Infrastructure Setup Guide

This guide provides step-by-step instructions for deploying the complete Vehicle Expense & Tax Compliance System using Supabase (PostgreSQL), AWS S3, Render (Spring Boot), and Brevo (Email).

## Table of Contents

1. [Supabase PostgreSQL Setup](#1-supabase-postgresql-setup)
2. [AWS S3 Bucket Configuration](#2-aws-s3-bucket-configuration)
3. [Render Spring Boot Deployment](#3-render-spring-boot-deployment)
4. [Brevo Email API Setup](#4-brevo-email-api-setup)
5. [Capacitor Android Configuration](#5-capacitor-android-configuration)
6. [Environment Variables Reference](#6-environment-variables-reference)

---

## 1. Supabase PostgreSQL Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a region close to your users (e.g., `eu-west-2` for South Africa)
3. Set a strong database password and **save it securely**

### 1.2 Get Database Connection String

Navigate to **Project Settings > Database** and copy the connection strings:

```
# For Spring Boot (JDBC)
jdbc:postgresql://db.[PROJECT-REF].supabase.co:5432/postgres

# Connection Pooler (recommended for serverless)
postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### 1.3 Run Database Schema

1. Navigate to **SQL Editor** in Supabase Dashboard
2. Copy the contents of `frontend/docs/database-schema.sql`
3. Execute the SQL to create all tables with proper indexes and constraints

### 1.4 Configure Row Level Security (Optional)

If using Supabase Auth in the future, enable RLS:

```sql
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
-- ... etc

-- Example policy: Users can only see their organization's data
CREATE POLICY "Users can view own org data" ON users
  FOR SELECT
  USING (organization_id = current_setting('app.current_org_id')::uuid);
```

### 1.5 Spring Boot Connection Configuration

Add to `application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://db.[PROJECT-REF].supabase.co:5432/postgres
    username: postgres
    password: ${SUPABASE_DB_PASSWORD}
    hikari:
      maximum-pool-size: 10
      connection-timeout: 30000
```

---

## 2. AWS S3 Bucket Configuration

### 2.1 Create S3 Bucket

1. Go to AWS Console > S3 > Create bucket
2. **Bucket name**: `vehicle-expense-receipts-[your-unique-id]`
3. **Region**: `af-south-1` (Africa - Cape Town) for lowest latency
4. **Block all public access**: Keep enabled (we'll use signed URLs)

### 2.2 Create IAM User for Application

1. Go to IAM > Users > Create user
2. **User name**: `vehicle-expense-app`
3. **Access type**: Programmatic access only

### 2.3 Create IAM Policy

Create a custom policy `VehicleExpenseS3Policy`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowReceiptOperations",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::vehicle-expense-receipts-[your-unique-id]",
        "arn:aws:s3:::vehicle-expense-receipts-[your-unique-id]/*"
      ]
    }
  ]
}
```

### 2.4 Attach Policy to User

1. Go to the IAM user > Permissions
2. Click "Add permissions" > "Attach policies directly"
3. Select `VehicleExpenseS3Policy`

### 2.5 Create Access Keys

1. Go to IAM user > Security credentials
2. Create access key for "Application running outside AWS"
3. **Save both keys securely**:
   - Access Key ID: `AKIA...`
   - Secret Access Key: `...`

### 2.6 Configure CORS for S3 Bucket

Go to bucket > Permissions > CORS and add:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": [
      "https://your-app-domain.com",
      "capacitor://localhost",
      "http://localhost:3000"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### 2.7 S3 Folder Structure

Organize uploads by organization and type:

```
vehicle-expense-receipts-xxx/
├── {organization_id}/
│   ├── fuel/
│   │   └── {expense_id}.avif
│   ├── mechanic/
│   │   └── {expense_id}.avif
│   ├── maintenance/
│   │   └── {expense_id}.avif
│   └── tires/
│       └── {expense_id}.avif
```

---

## 3. Render Spring Boot Deployment

### 3.1 Prepare Spring Boot Application

Ensure your `pom.xml` has the production profile:

```xml
<profiles>
  <profile>
    <id>production</id>
    <properties>
      <spring.profiles.active>production</spring.profiles.active>
    </properties>
  </profile>
</profiles>
```

### 3.2 Create Render Web Service

1. Go to [render.com](https://render.com) and create a new Web Service
2. Connect your GitHub repository
3. Configure the build:

   - **Environment**: Docker or Native Java
   - **Build Command**: `./mvnw -Pproduction clean package -DskipTests`
   - **Start Command**: `java -jar target/vehicle-expense-api-0.0.1-SNAPSHOT.jar`

### 3.3 Set Environment Variables

In Render dashboard, add these environment variables:

| Key | Example Value |
|-----|---------------|
| `SPRING_PROFILES_ACTIVE` | `production` |
| `SUPABASE_DB_URL` | `jdbc:postgresql://db.xxx.supabase.co:5432/postgres` |
| `SUPABASE_DB_PASSWORD` | `your-db-password` |
| `JWT_SECRET` | `your-256-bit-secret-key-here-minimum-32-chars` |
| `JWT_EXPIRATION_MS` | `86400000` |
| `AWS_ACCESS_KEY_ID` | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | `...` |
| `AWS_S3_BUCKET` | `vehicle-expense-receipts-xxx` |
| `AWS_S3_REGION` | `af-south-1` |
| `BREVO_API_KEY` | `xkeysib-...` |
| `BREVO_SENDER_EMAIL` | `noreply@yourdomain.com` |

### 3.4 Configure Production application.yml

```yaml
spring:
  profiles: production
  datasource:
    url: ${SUPABASE_DB_URL}
    username: postgres
    password: ${SUPABASE_DB_PASSWORD}

server:
  port: ${PORT:8080}

logging:
  level:
    root: INFO
    com.vehicleexpense: DEBUG
```

### 3.5 Health Check Configuration

Render will check `/health` by default. Ensure Spring Boot Actuator is configured:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info
  endpoint:
    health:
      show-details: when_authorized
```

---

## 4. Brevo Email API Setup

### 4.1 Create Brevo Account

1. Go to [brevo.com](https://www.brevo.com) and create an account
2. Verify your sender domain for production use

### 4.2 Get API Key

1. Navigate to **SMTP & API** in Brevo dashboard
2. Click **Generate a new API key**
3. **Save the key securely** - it starts with `xkeysib-`

### 4.3 Verify Sender Domain (Production)

1. Go to **Senders, Domains & Dedicated IPs**
2. Add your domain and configure DNS records:
   - SPF record
   - DKIM record
   - DMARC record (optional but recommended)

### 4.4 Email Templates

Create templates in Brevo for:

| Template ID | Purpose |
|-------------|---------|
| 1 | Email Verification |
| 2 | Password Reset |
| 3 | Invitation to Organization |
| 4 | Monthly Expense Report |

### 4.5 API Integration Code

The email service is already configured in `/lib/services/email.ts`. Update environment variables:

```bash
BREVO_API_KEY=xkeysib-...
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME="Vehicle Expense"
```

---

## 5. Capacitor Android Configuration

### 5.1 Install Capacitor

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Vehicle Expense" "com.vehicleexpense.app"
npx cap add android
```

### 5.2 Configure capacitor.config.ts

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vehicleexpense.app',
  appName: 'Vehicle Expense',
  webDir: 'out', // For Next.js static export
  server: {
    // Production API URL
    url: 'https://your-render-app.onrender.com',
    cleartext: false, // Force HTTPS
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
```

### 5.3 Android Network Security Config

Create `android/app/src/main/res/xml/network_security_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system"/>
        </trust-anchors>
    </base-config>
    
    <!-- Allow localhost for development -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
    
    <!-- Production domains (HTTPS only) -->
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">your-render-app.onrender.com</domain>
        <domain includeSubdomains="true">supabase.co</domain>
    </domain-config>
</network-security-config>
```

### 5.4 Update AndroidManifest.xml

Add network security config reference:

```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    android:usesCleartextTraffic="false"
    ...>
```

Add required permissions:

```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
<uses-permission android:name="android.permission.CAMERA"/>
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
```

### 5.5 Build and Deploy

```bash
# Build Next.js for static export
npm run build

# Sync web assets to Android
npx cap sync android

# Open in Android Studio
npx cap open android

# Build APK/AAB from Android Studio
```

---

## 6. Environment Variables Reference

### Next.js Frontend (.env.local)

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://your-render-app.onrender.com/api

# Feature Flags
NEXT_PUBLIC_ENABLE_OFFLINE_MODE=true
NEXT_PUBLIC_MAX_IMAGE_SIZE_MB=5

# Analytics (optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Spring Boot Backend (Render)

```bash
# Database
SUPABASE_DB_URL=jdbc:postgresql://db.xxx.supabase.co:5432/postgres
SUPABASE_DB_PASSWORD=your-secure-password

# JWT Authentication
JWT_SECRET=your-256-bit-secret-minimum-32-characters-long
JWT_EXPIRATION_MS=86400000
JWT_REFRESH_EXPIRATION_MS=604800000

# AWS S3
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_S3_BUCKET=vehicle-expense-receipts-xxx
AWS_S3_REGION=af-south-1

# Email (Brevo)
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=Vehicle Expense

# Application
SPRING_PROFILES_ACTIVE=production
SERVER_PORT=8080
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Database schema executed in Supabase
- [ ] S3 bucket created with correct CORS
- [ ] IAM user with appropriate permissions
- [ ] Brevo sender domain verified
- [ ] All environment variables set in Render

### Post-Deployment

- [ ] Health check endpoint responding
- [ ] User registration and email verification working
- [ ] Image upload to S3 working
- [ ] JWT authentication working
- [ ] Android app connecting to API

### Security Audit

- [ ] All secrets stored securely (not in code)
- [ ] HTTPS enforced everywhere
- [ ] CORS configured correctly
- [ ] JWT tokens have appropriate expiration
- [ ] Database passwords are strong
- [ ] S3 bucket is not publicly accessible

---

## Troubleshooting

### Android Cannot Connect to API

1. Check network security config is referenced in AndroidManifest.xml
2. Verify the API URL is correct in capacitor.config.ts
3. Ensure HTTPS is being used (not HTTP)
4. Check Render logs for incoming requests

### S3 Upload Fails

1. Verify IAM user has correct permissions
2. Check CORS configuration includes your origin
3. Verify presigned URL generation is working
4. Check S3 bucket region matches configuration

### Database Connection Issues

1. Verify connection string format (JDBC vs standard)
2. Check password doesn't contain special characters that need escaping
3. Ensure Supabase project is not paused
4. Check connection pool settings

### Email Not Sending

1. Verify Brevo API key is correct
2. Check sender email is verified in Brevo
3. Review Brevo dashboard for delivery logs
4. Check for rate limiting
