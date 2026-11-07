@echo off
title Khushboo Pathshala - Complete Stack Launcher
echo =========================================================
echo   Khushboo Pathshala: Drupal 11 PHP + React Full Stack
echo =========================================================

REM Check if MySQL is running
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] MySQL database is already active.
) else (
    echo [INFO] Starting XAMPP MySQL database service...
    if exist "C:\xampp\mysql\bin\mysqld.exe" (
        start /B "" "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
        timeout /t 2 /nobreak >nul
        echo [OK] MySQL database launched.
    ) else (
        echo [WARNING] Please ensure XAMPP MySQL is running.
    )
)

echo.
echo Starting Drupal 11 PHP Backend in a new window...
start "Khushboo Pathshala - Drupal Backend" cmd /k "%~dp0start-backend.bat"

echo Starting React Frontend in a new window...
start "Khushboo Pathshala - React Frontend" cmd /k "%~dp0start-frontend.bat"

echo.
echo Both servers are launching!
echo Backend:  http://127.0.0.1:5001/api/health
echo Frontend: http://localhost:5173
echo.
pause
