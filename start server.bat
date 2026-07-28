@echo off
title Ola Ride Dashboard - Server Launcher
color 0A

echo ============================================
echo    Ola Ride Booking Dashboard
echo    Starting Development Servers...
echo ============================================
echo.

:: Navigate to the project root
cd /d "%~dp0"

:: Check if node_modules exist for backend
if not exist "node_modules" (
    echo [INFO] Installing backend dependencies...
    call npm install
    echo.
)

:: Check if node_modules exist for frontend
if not exist "frontend\node_modules" (
    echo [INFO] Installing frontend dependencies...
    call npm install --prefix frontend
    echo.
)

echo [1/2] Starting Backend Server on http://localhost:5000 ...
start "Ola Backend (Port 5000)" cmd /k "cd /d "%~dp0" && color 0B && title Backend Server - Port 5000 && npm run dev -- --backend-only 2>nul || nodemon server.js"

:: Small delay so backend starts first
timeout /t 2 /nobreak >nul

echo [2/2] Starting Frontend Dev Server on http://localhost:5173 ...
start "Ola Frontend (Port 5173)" cmd /k "cd /d "%~dp0\frontend" && color 0E && title Frontend Server - Port 5173 && npm run dev"

echo.
echo ============================================
echo  Both servers are launching in new windows!
echo  Backend  : http://localhost:5000
echo  Frontend : http://localhost:5173
echo ============================================
echo.
echo  Close this window or press any key to exit.
pause >nul
