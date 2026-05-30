@echo off
setlocal enabledelayedexpansion

echo.
echo  ============================================
echo   MoneyMap v0.1.10 - Local Preview
echo  ============================================
echo.

if not exist "%~dp0index.html" (
  echo  [ERROR] index.html not found in this folder.
  echo  Make sure you extracted the full zip and run this
  echo  from inside the MoneyMap_v0.1.10 folder.
  pause
  exit /b 1
)

set PORT=8080
set PORT_ALT=8081
set PYTHON_CMD=

:: Try python, then python3, then py
where python >nul 2>&1 && set PYTHON_CMD=python
if "!PYTHON_CMD!"=="" where python3 >nul 2>&1 && set PYTHON_CMD=python3
if "!PYTHON_CMD!"=="" where py >nul 2>&1 && set PYTHON_CMD=py

if "!PYTHON_CMD!"=="" (
  echo  [ERROR] Python not found. Please install Python from https://python.org
  pause
  exit /b 1
)

:: Check if port 8080 is in use
netstat -an 2>nul | find ":%PORT% " | find "LISTENING" >nul 2>&1
if !ERRORLEVEL!==0 (
  echo  Port %PORT% is busy, trying %PORT_ALT%...
  set PORT=%PORT_ALT%
)

echo  Starting MoneyMap on http://127.0.0.1:!PORT!
echo.
echo  Open this URL in your browser:
echo  http://127.0.0.1:!PORT!
echo.
echo  Press Ctrl+C to stop the server.
echo.

cd /d "%~dp0"
!PYTHON_CMD! -m http.server !PORT! --bind 127.0.0.1

pause
