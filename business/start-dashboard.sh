#!/bin/bash

# MyBidFit Internal Operations Dashboard Launcher
# Starts local HTTP server and opens dashboard in browser

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
DASHBOARD_PORT=8001
DASHBOARD_FILE="internal-dashboard.html"
PIDFILE=".dashboard-server.pid"

# Function to print colored output
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

# Check if port is in use
check_port() {
    if lsof -Pi :$DASHBOARD_PORT -sTCP:LISTEN -t >/dev/null; then
        print_warning "Port $DASHBOARD_PORT is already in use"
        
        # Check if it's our server
        if [ -f "$PIDFILE" ]; then
            local pid=$(cat "$PIDFILE")
            if ps -p $pid > /dev/null 2>&1; then
                print_status "Dashboard server is already running (PID: $pid)"
                print_status "Opening dashboard in browser..."
                open_dashboard
                exit 0
            else
                # Stale PID file
                rm -f "$PIDFILE"
            fi
        fi
        
        print_error "Please stop the process using port $DASHBOARD_PORT or use a different port"
        exit 1
    fi
}

# Start HTTP server
start_server() {
    print_status "Starting HTTP server on port $DASHBOARD_PORT..."
    
    # Change to business directory
    cd "$(dirname "$0")"
    
    # Start Python HTTP server in background
    if command -v python3 &> /dev/null; then
        python3 -m http.server $DASHBOARD_PORT > /dev/null 2>&1 &
        local server_pid=$!
    elif command -v python &> /dev/null; then
        python -m SimpleHTTPServer $DASHBOARD_PORT > /dev/null 2>&1 &
        local server_pid=$!
    else
        print_error "Python is required but not installed"
        exit 1
    fi
    
    # Save PID for cleanup
    echo $server_pid > "$PIDFILE"
    print_success "Server started (PID: $server_pid)"
    
    # Wait a moment for server to start
    sleep 2
    
    # Verify server is running
    if ! ps -p $server_pid > /dev/null 2>&1; then
        print_error "Failed to start server"
        rm -f "$PIDFILE"
        exit 1
    fi
    
    return $server_pid
}

# Open dashboard in browser
open_dashboard() {
    local url="http://localhost:$DASHBOARD_PORT/$DASHBOARD_FILE"
    
    print_status "Opening dashboard at: $url"
    
    # Cross-platform browser opening
    if command -v xdg-open &> /dev/null; then
        xdg-open "$url" 2>/dev/null
    elif command -v open &> /dev/null; then
        open "$url"
    elif command -v start &> /dev/null; then
        start "$url"
    else
        print_warning "Could not auto-open browser. Please visit: $url"
    fi
}

# Cleanup function
cleanup() {
    if [ -f "$PIDFILE" ]; then
        local pid=$(cat "$PIDFILE")
        if ps -p $pid > /dev/null 2>&1; then
            print_status "Stopping dashboard server (PID: $pid)..."
            kill $pid 2>/dev/null || true
            rm -f "$PIDFILE"
            print_success "Dashboard server stopped"
        fi
    fi
}

# Handle script termination
trap cleanup EXIT INT TERM

# Main execution
main() {
    print_status "🚀 MyBidFit Internal Operations Dashboard"
    print_status "==========================================="
    
    # Check if dashboard file exists
    if [ ! -f "$DASHBOARD_FILE" ]; then
        print_error "Dashboard file '$DASHBOARD_FILE' not found in current directory"
        exit 1
    fi
    
    # Check port availability
    check_port
    
    # Start server
    start_server
    local server_pid=$?
    
    # Open dashboard
    open_dashboard
    
    print_success "Dashboard is running!"
    echo
    print_status "📊 Dashboard URL: http://localhost:$DASHBOARD_PORT/$DASHBOARD_FILE"
    print_status "🔧 Edit assumptions using the floating gear button"
    print_status "📄 Export data using the Export button"
    print_status "🔄 Refresh data using the Refresh button"
    echo
    print_status "Press Ctrl+C to stop the dashboard server"
    
    # Keep script running
    while true; do
        if ! ps -p $server_pid > /dev/null 2>&1; then
            print_error "Server process died unexpectedly"
            exit 1
        fi
        sleep 5
    done
}

# Help function
show_help() {
    echo "MyBidFit Internal Operations Dashboard Launcher"
    echo
    echo "Usage: $0 [options]"
    echo
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -p, --port     Specify port (default: 8001)"
    echo "  --stop         Stop running dashboard server"
    echo
    echo "Examples:"
    echo "  $0                    Start dashboard on default port"
    echo "  $0 -p 8080           Start dashboard on port 8080"
    echo "  $0 --stop            Stop running dashboard"
}

# Stop running server
stop_server() {
    if [ -f "$PIDFILE" ]; then
        local pid=$(cat "$PIDFILE")
        if ps -p $pid > /dev/null 2>&1; then
            print_status "Stopping dashboard server (PID: $pid)..."
            kill $pid 2>/dev/null || true
            rm -f "$PIDFILE"
            print_success "Dashboard server stopped"
        else
            print_warning "Dashboard server is not running"
            rm -f "$PIDFILE"
        fi
    else
        print_warning "No dashboard server PID file found"
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -p|--port)
            DASHBOARD_PORT="$2"
            shift 2
            ;;
        --stop)
            stop_server
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Run main function
main