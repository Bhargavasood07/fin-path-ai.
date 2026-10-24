@echo off
title FinPath AI - Unified Platform (Backend + Frontend)
echo ======================================================================
echo Starting FinPath AI Unified Platform...
echo Frontend Website, Mobile App View, Backend APIs, and SQLite are COMBINED!
echo.
echo URL: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo ======================================================================
cd /d "%~dp0backend"
python run.py
pause
