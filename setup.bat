@echo off
REM DataUniverse LMS - Quick Setup Script for Windows
REM ==================================================

echo.
echo 🎓 DataUniverse LMS Setup
echo =========================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do echo ✅ Node.js %%i

REM Check npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm is not installed
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm -v') do echo ✅ npm %%i

echo.
echo 📦 Installing Backend Dependencies...
cd backend
call npm install

echo.
echo 📦 Installing Frontend Dependencies...
cd ..
call npm install

echo.
echo 🔧 Setting up environment files...

REM Backend .env
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        copy "backend\.env.example" "backend\.env"
        echo ⚠️  Created backend\.env from example. Please edit with your values!
    ) else (
        echo ❌ backend\.env.example not found
    )
) else (
    echo ✅ backend\.env already exists
)

REM Frontend .env
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env"
        echo ⚠️  Created .env from example. Please edit with your values!
    ) else (
        echo ❌ .env.example not found
    )
) else (
    echo ✅ .env already exists
)

echo.
echo 📝 Next Steps:
echo ==============
echo.
echo 1. Create MySQL database:
echo    mysql -u root -p -e "CREATE DATABASE DataUniverse;"
echo.
echo 2. Edit backend\.env with your database credentials
echo.
echo 3. Push database schema:
echo    cd backend ^&^& npx prisma db push
echo.
echo 4. Seed the database:
echo    cd backend ^&^& npx prisma db seed
echo.
echo 5. Start the servers:
echo    Terminal 1: cd backend ^&^& npm run dev
echo    Terminal 2: npm run dev
echo.
echo 6. Open http://localhost:8080
echo.
echo Default Login:
echo   Admin: admin@datauniverse.com / Admin123!
echo   Student: student@datauniverse.com / Student123!
echo.
echo ✅ Setup preparation complete!
echo.
pause
