@echo off
title Khushboo Pathshala - React Frontend
echo =========================================================
echo   Starting Khushboo Pathshala React 19 Frontend...
echo   Backend URL: http://127.0.0.1:5001/api
echo   Vite Dev Server: http://localhost:5173
echo =========================================================
cd /d "%~dp0client"
if not exist "node_modules\" (
    echo [INFO] First-time setup: Installing frontend dependencies...
    call npm install
)
npm run dev
pause

