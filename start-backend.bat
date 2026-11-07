@echo off
title Khushboo Pathshala - Drupal 11 PHP Backend
echo =========================================================
echo   Starting Khushboo Pathshala Drupal 11 PHP Backend...
echo   Database: MariaDB / MySQL (XAMPP)
echo   Listening on: http://127.0.0.1:5001
echo =========================================================

REM Check if MySQL is running
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] MySQL / MariaDB service is already active.
) else (
    echo [INFO] Starting XAMPP MySQL database service...
    if exist "C:\xampp\mysql\bin\mysqld.exe" (
        start /B "" "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
        timeout /t 2 /nobreak >nul
        echo [OK] MySQL database service launched successfully.
    ) else (
        echo [WARNING] Could not locate C:\xampp\mysql\bin\mysqld.exe. Please ensure XAMPP MySQL is started.
    )
)

echo.
echo Launching PHP Development Server on http://127.0.0.1:5001 ...
cd /d "%~dp0drupal-backend\web"
php -S 0.0.0.0:5001 .ht.router.php
pause
