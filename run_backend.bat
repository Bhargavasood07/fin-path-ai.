@echo off
title FinPath AI - Backend Server
echo ========================================================
echo Starting FinPath AI Backend Server (FastAPI + SQLite)...
echo ========================================================
cd /d "%~dp0backend"
python run.py
pause
