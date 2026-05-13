# IntelliJ IDEA + WebStorm Development Setup

## 🎯 Project Structure
- **Backend**: `/Users/stefanroets/Downloads/fuel-tax-za/backend` (IntelliJ IDEA)
- **Frontend**: `/Users/stefanroets/Downloads/fuel-tax-za/frontend` (WebStorm)

---

## 🚀 IntelliJ IDEA Setup (Backend)

### 1. Open Backend Project
```bash
# Launch IntelliJ IDEA Ultimate
# Open: /Users/stefanroets/Downloads/fuel-tax-za/backend
# Select "Open as Maven Project" when prompted
```

### 2. Configure Spring Boot Run Configuration
1. **Run/Debug Configurations** → Click **+** → **Spring Boot**
2. **Name**: `Fuel Tax Backend`
3. **Main class**: `com.vehicleexpense.api.VehicleExpenseApplication`
4. **Working directory**: `/Users/stefanroets/Downloads/fuel-tax-za/backend`
5. **Environment variables**:
   - Click **Environment variables**
   - **Add**: `DB_PASSWORD` = `DARKSTAR420`
6. **Program arguments**: `-Dspring-boot.run.profiles=dev`
7. **Use classpath of module**: `vehicle-expense-api`
8. **Click Apply → OK**

### 3. Database Configuration
1. **Database** tab → **+** → **PostgreSQL**
2. **Name**: `Fuel Tax Database`
3. **Host**: `localhost`
4. **Port**: `5432`
5. **Database**: `fuel_tax_za`
6. **User**: `postgres`
7. **Password**: `DARKSTAR420`
8. **Test Connection** → Should show "Successful"

### 4. Start Backend
1. **Select** `Fuel Tax Backend` configuration
2. **Click Debug** (green bug icon) or **Run** (green play icon)
3. **Console**: Spring Boot will start on port 8080
4. **Verify**: Check console for "Started VehicleExpenseApplication"

---

## 🌐 WebStorm Setup (Frontend)

### 1. Open Frontend Project
```bash
# Launch WebStorm Professional
# Open: /Users/stefanroets/Downloads/fuel-tax-za/frontend
# Select "Open as Node.js Project" when prompted
```

### 2. Configure Next.js Run Configuration
1. **Run/Debug Configurations** → Click **+** → **npm**
2. **Name**: `Fuel Tax Frontend`
3. **Package.json**: `/Users/stefanroets/Downloads/fuel-tax-za/frontend/package.json`
4. **Command**: `dev`
5. **Scripts**: Select `dev` from dropdown
6. **Environment variables**:
   - **Add**: `NEXT_PUBLIC_API_URL` = `http://localhost:8080/api/v1`
7. **Node options**: `--max-old-space-size=4096`
8. **Click Apply → OK**

### 3. Start Frontend
1. **Select** `Fuel Tax Frontend` configuration
2. **Click Debug** (green bug icon) or **Run** (green play icon)
3. **Terminal**: Next.js will start on port 3000
4. **Verify**: Check console for "ready on http://localhost:3000"

---

## 🔧 Development Workflow

### Order of Operations
1. **Start PostgreSQL 16** (if not running)
   ```bash
   brew services start postgresql@16
   ```

2. **Start Backend in IntelliJ IDEA**
   - Use `Fuel Tax Backend` configuration
   - Wait for "Started VehicleExpenseApplication" message
   - Verify http://localhost:8080/api/v1/health

3. **Start Frontend in WebStorm**
   - Use `Fuel Tax Frontend` configuration
   - Wait for "ready on http://localhost:3000" message
   - Open http://localhost:3000 in browser

### Debugging Workflow
1. **Backend Debugging** (IntelliJ):
   - Set breakpoints in Java controllers, services, entities
   - Use "Step Over", "Step Into", "Run to Cursor"
   - Inspect variables in debugger window
   - Watch expressions for real-time monitoring

2. **Frontend Debugging** (WebStorm):
   - Set breakpoints in React components, API calls
   - Use browser dev tools integration
   - Inspect state, props, and variables
   - Console logging integrated with IDE

---

## 🐛 Common Issues & Solutions

### Backend Issues
- **Port 8080 in use**: Check for other Java processes
- **Database connection**: Verify PostgreSQL is running and password correct
- **Maven build failures**: Clean and rebuild project
- **Environment variables**: Ensure `DB_PASSWORD=DARKSTAR420` is set

### Frontend Issues
- **Port 3000 in use**: Check for other Node.js processes
- **API connection**: Verify backend is running on 8080
- **Module resolution**: Run `pnpm install` in WebStorm terminal
- **TypeScript errors**: Check tsconfig.json configuration

---

## 🎯 Productivity Tips

### IntelliJ IDEA
- **Live Templates**: Create code snippets for Spring Boot
- **Database Console**: Write and test SQL queries directly
- **Git Integration**: Use built-in Git tools for commits
- **Code Completion**: Trust AI assistance for Java code
- **Navigation**: Use "Navigate to Class/Symbol" shortcuts

### WebStorm
- **React Components**: Use component completion and props
- **CSS Modules**: Enable CSS-in-JS support
- **Hot Reload**: Automatic page refresh on save
- **Terminal Integration**: Run commands without leaving IDE
- **Code Quality**: Use ESLint and Prettier integration

---

## 📱 Testing Integration

### Backend Testing
1. **Right-click** test class → **Run Tests**
2. **Debug Tests**: Set breakpoints in test methods
3. **Coverage**: Run with coverage to see test metrics
4. **Database Tests**: Verify entity relationships

### Frontend Testing
1. **Right-click** test file → **Run Jest Tests**
2. **Debug Tests**: Set breakpoints in test functions
3. **E2E Testing**: Use built-in browser testing
4. **Component Testing**: Test React components in isolation

---

## 🚀 Quick Start Commands

### IntelliJ IDEA
```bash
# Open backend in IntelliJ
idea /Users/stefanroets/Downloads/fuel-tax-za/backend

# Or open from IntelliJ: File → Open → Select backend folder
```

### WebStorm
```bash
# Open frontend in WebStorm
webstorm /Users/stefanroets/Downloads/fuel-tax-za/frontend

# Or open from WebStorm: File → Open → Select frontend folder
```

---

## ✅ Verification Checklist

### Before Starting
- [ ] PostgreSQL 16 running on port 5432
- [ ] Database `fuel_tax_za` exists and empty
- [ ] Environment variables configured in IDEs
- [ ] Run configurations created

### After Starting
- [ ] Backend starts on port 8080
- [ ] Frontend starts on port 3000
- [ ] Health endpoint accessible: http://localhost:8080/api/v1/health
- [ ] Frontend loads: http://localhost:3000
- [ ] API calls working between frontend and backend

---

## 🎯 Success Indicators

**Backend Running:**
- Console shows "Started VehicleExpenseApplication"
- Health endpoint returns 200 OK
- Database connection successful

**Frontend Running:**
- Browser shows login page
- Network tab shows successful API calls
- No console errors

**Full Stack Working:**
- Login creates account in database
- Dashboard loads with real data
- Expenses saved and retrieved correctly

---

**You're now ready for professional-grade development with IntelliJ IDEA + WebStorm!**
