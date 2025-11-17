@echo off
echo ================================================
echo    NIRBHAYA - Women Safety Platform
echo    Starting Development Environment
echo ================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js 20+ from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/4] Checking backend environment...
cd backend

REM Check if virtual environment exists
if not exist "venv\" (
    echo [INFO] Creating Python virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
)

REM Activate virtual environment
call venv\Scripts\activate
if errorlevel 1 (
    echo [ERROR] Failed to activate virtual environment
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "venv\Lib\site-packages\fastapi\" (
    echo [INFO] Installing backend dependencies...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check .env file
if not exist ".env" (
    echo [WARNING] Backend .env file not found
    if exist ".env.example" (
        echo [INFO] Copying .env.example to .env
        copy .env.example .env >nul
        echo [ACTION REQUIRED] Please edit backend\.env and add your OPENAI_API_KEY
        notepad .env
    ) else (
        echo [ERROR] .env.example not found
        echo Please create backend\.env with OPENAI_API_KEY
        pause
        exit /b 1
    )
)

cd ..

echo [2/4] Checking frontend environment...
cd self\app

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [INFO] Installing frontend dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install frontend dependencies
        cd ..\..
        pause
        exit /b 1
    )
)

REM Check .env.local file
if not exist ".env.local" (
    echo [WARNING] Frontend .env.local file not found
    if exist ".env.example" (
        echo [INFO] Copying .env.example to .env.local
        copy .env.example .env.local >nul
        echo [ACTION REQUIRED] Please edit self\app\.env.local and add your credentials
        notepad .env.local
    ) else (
        echo [ERROR] .env.example not found
        cd ..\..
        pause
        exit /b 1
    )
)

cd ..\..

echo.
echo [3/4] Starting Backend Server...
echo ================================================
start "Nirbhaya Backend" cmd /k "cd backend && venv\Scripts\activate && uvicorn main:app --reload --port 8000"
timeout /t 3 >nul

echo [4/4] Starting Frontend Server...
echo ================================================
start "Nirbhaya Frontend" cmd /k "cd self\app && npm run dev"

echo.
echo ================================================
echo    Setup Complete!
echo ================================================
echo.
echo Backend:  http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo Frontend: http://localhost:3000
echo.
echo Press any key to view logs...
pause >nul

REM Open browser to frontend
start http://localhost:3000

echo.
echo Servers are running in separate windows.
echo Close those windows to stop the servers.
echo.
pause
