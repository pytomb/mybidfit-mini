#!/bin/bash

# MyBidFit Dashboard - Stop Server Script
# Cleanly stops the dashboard HTTP server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PIDFILE=".dashboard-server.pid"

print_status() {
    echo -e "${CYAN}[MyBidFit Dashboard]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Change to business directory
cd "$(dirname "$0")"

print_status "🛑 Stopping MyBidFit Dashboard Server..."

if [ -f "$PIDFILE" ]; then
    pid=$(cat "$PIDFILE")
    
    if ps -p $pid > /dev/null 2>&1; then
        print_status "Stopping server process (PID: $pid)..."
        
        # Try graceful shutdown first
        kill -TERM $pid 2>/dev/null || true
        
        # Wait up to 5 seconds for graceful shutdown
        for i in {1..5}; do
            if ! ps -p $pid > /dev/null 2>&1; then
                break
            fi
            sleep 1
        done
        
        # Force kill if still running
        if ps -p $pid > /dev/null 2>&1; then
            print_warning "Forcefully terminating server..."
            kill -KILL $pid 2>/dev/null || true
        fi
        
        rm -f "$PIDFILE"
        print_success "Dashboard server stopped successfully"
    else
        print_warning "Server process not found (PID: $pid)"
        rm -f "$PIDFILE"
    fi
else
    print_warning "No server PID file found. Dashboard may not be running."
    
    # Try to find and kill any Python HTTP servers on the dashboard port
    local dashboard_port=8001
    local pids=$(lsof -ti:$dashboard_port 2>/dev/null || true)
    
    if [ ! -z "$pids" ]; then
        print_status "Found processes on port $dashboard_port, attempting to stop them..."
        echo $pids | xargs kill -TERM 2>/dev/null || true
        sleep 2
        echo $pids | xargs kill -KILL 2>/dev/null || true
        print_success "Processes on port $dashboard_port terminated"
    else
        print_success "No processes found on dashboard port"
    fi
fi

print_success "Dashboard shutdown complete"