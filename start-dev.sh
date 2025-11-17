#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "================================================"
echo "   NIRBHAYA - Women Safety Platform"
echo "   Starting Development Environment"
echo "================================================"
echo

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}[ERROR] Python is not installed${NC}"
    echo "Please install Python 3.8+ from https://www.python.org/"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR] Node.js is not installed${NC}"
    echo "Please install Node.js 20+ from https://nodejs.org/"
    exit 1
fi

echo -e "${BLUE}[1/4] Checking backend environment...${NC}"
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}[INFO] Creating Python virtual environment...${NC}"
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo -e "${RED}[ERROR] Failed to create virtual environment${NC}"
        exit 1
    fi
fi

# Activate virtual environment
source venv/bin/activate
if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR] Failed to activate virtual environment${NC}"
    exit 1
fi

# Check if dependencies are installed
if [ ! -f "venv/lib/python3.*/site-packages/fastapi/__init__.py" ]; then
    echo -e "${YELLOW}[INFO] Installing backend dependencies...${NC}"
    pip install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo -e "${RED}[ERROR] Failed to install dependencies${NC}"
        exit 1
    fi
fi

# Check .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}[WARNING] Backend .env file not found${NC}"
    if [ -f ".env.example" ]; then
        echo -e "${YELLOW}[INFO] Copying .env.example to .env${NC}"
        cp .env.example .env
        echo -e "${YELLOW}[ACTION REQUIRED] Please edit backend/.env and add your OPENAI_API_KEY${NC}"
        echo "Press Enter after editing the file..."
        read
    else
        echo -e "${RED}[ERROR] .env.example not found${NC}"
        echo "Please create backend/.env with OPENAI_API_KEY"
        exit 1
    fi
fi

cd ..

echo -e "${BLUE}[2/4] Checking frontend environment...${NC}"
cd self/app

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}[INFO] Installing frontend dependencies...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}[ERROR] Failed to install frontend dependencies${NC}"
        cd ../..
        exit 1
    fi
fi

# Check .env.local file
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}[WARNING] Frontend .env.local file not found${NC}"
    if [ -f ".env.example" ]; then
        echo -e "${YELLOW}[INFO] Copying .env.example to .env.local${NC}"
        cp .env.example .env.local
        echo -e "${YELLOW}[ACTION REQUIRED] Please edit self/app/.env.local and add your credentials${NC}"
        echo "Press Enter after editing the file..."
        read
    else
        echo -e "${RED}[ERROR] .env.example not found${NC}"
        cd ../..
        exit 1
    fi
fi

cd ../..

echo
echo -e "${BLUE}[3/4] Starting Backend Server...${NC}"
echo "================================================"

# Start backend in background
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000 > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

echo -e "${GREEN}Backend started (PID: $BACKEND_PID)${NC}"
sleep 3

echo -e "${BLUE}[4/4] Starting Frontend Server...${NC}"
echo "================================================"

# Start frontend in background
cd self/app
npm run dev > ../../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ../..

echo -e "${GREEN}Frontend started (PID: $FRONTEND_PID)${NC}"
sleep 3

echo
echo "================================================"
echo -e "${GREEN}   Setup Complete!${NC}"
echo "================================================"
echo
echo -e "${BLUE}Backend:${NC}  http://localhost:8000"
echo -e "${BLUE}API Docs:${NC} http://localhost:8000/docs"
echo -e "${BLUE}Frontend:${NC} http://localhost:3000"
echo
echo -e "${YELLOW}Logs:${NC}"
echo "  Backend:  tail -f backend.log"
echo "  Frontend: tail -f frontend.log"
echo
echo -e "${YELLOW}To stop servers:${NC}"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo
echo "Press Ctrl+C to stop all servers and exit"

# Function to cleanup on exit
cleanup() {
    echo
    echo -e "${YELLOW}Stopping servers...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}Servers stopped.${NC}"
    exit 0
}

# Set trap to cleanup on Ctrl+C
trap cleanup INT

# Wait for user to stop
wait
