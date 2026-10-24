@echo off
title FinPath AI - Dev Mode (Dual Port Hot Reload)
echo ========================================================
echo Starting FinPath AI in Live Development Mode
echo 1. Backend:  http://127.0.0.1:8000 (Swagger: /docs)
echo 2. Frontend: http://localhost:3000
echo ========================================================
start "FinPath Backend" cmd /k "cd /d "%~dp0backend" && python run.py"
start "FinPath Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"
