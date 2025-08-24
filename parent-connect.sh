#!/bin/bash

# Parent Connect App Startup Script
# Usage: ./startup.sh [start|stop|restart|status]

APP_NAME="Parent Connect App"
FRONTEND_PORT=5173
BACKEND_PORT=3000
FRONTEND_PID_FILE=".frontend.pid"
BACKEND_PID_FILE=".backend.pid"
LOG_FILE="app.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Function to check if a process is running
is_process_running() {
    local pid_file=$1
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        else
            rm -f "$pid_file"
        fi
    fi
    return 1
}

# Function to check if a port is in use
is_port_in_use() {
    local port=$1
    if lsof -i :$port > /dev/null 2>&1; then
        return 0
    fi
    return 1
}

# Function to find next available port
find_next_available_port() {
    local base_port=$1
    local port=$base_port
    local max_attempts=10
    
    for ((i=0; i<max_attempts; i++)); do
        if ! is_port_in_use $port; then
            echo $port
            return 0
        fi
        port=$((port + 1))
    done
    
    return 1
}

# Function to check for existing instances
check_existing_instances() {
    local frontend_running=false
    local backend_running=false
    
    # Check if our PID files indicate running processes
    if is_process_running "$FRONTEND_PID_FILE"; then
        frontend_running=true
        print_warning "Frontend already running (PID: $(cat $FRONTEND_PID_FILE))"
    fi
    
    if is_process_running "$BACKEND_PID_FILE"; then
        backend_running=true
        print_warning "Backend already running (PID: $(cat $BACKEND_PID_FILE))"
    fi
    
    # Check if ports are in use by other processes
    if ! $frontend_running && is_port_in_use $FRONTEND_PORT; then
        print_error "Port $FRONTEND_PORT is already in use by another process"
        print_status "Checking what's using the port..."
        lsof -i :$FRONTEND_PORT
        return 1
    fi
    
    if ! $backend_running && is_port_in_use $BACKEND_PORT; then
        print_error "Port $BACKEND_PORT is already in use by another process"
        print_status "Checking what's using the port..."
        lsof -i :$BACKEND_PORT
        return 1
    fi
    
    return 0
}

# Function to kill processes on specific ports
kill_processes_on_port() {
    local port=$1
    local process_name=$2
    
    if is_port_in_use $port; then
        print_warning "Port $port is in use. Attempting to kill existing process..."
        local pids=$(lsof -ti :$port)
        if [ -n "$pids" ]; then
            for pid in $pids; do
                print_status "Killing process $pid on port $port"
                kill -TERM $pid 2>/dev/null
                sleep 1
                if ps -p $pid > /dev/null 2>&1; then
                    print_status "Force killing process $pid"
                    kill -KILL $pid 2>/dev/null
                fi
            done
            sleep 2
            if is_port_in_use $port; then
                print_error "Failed to free port $port"
                return 1
            else
                print_success "Port $port is now available"
            fi
        fi
    fi
    return 0
}

# Function to start frontend
start_frontend() {
    print_status "Starting frontend..."
    
    if is_process_running "$FRONTEND_PID_FILE"; then
        print_warning "Frontend is already running (PID: $(cat $FRONTEND_PID_FILE))"
        return 0
    fi
    
    cd "$(dirname "$0")"
    
    # Check if node_modules exists, if not install dependencies
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm install
    fi
    
    # Check port availability
    if is_port_in_use $FRONTEND_PORT; then
        print_error "Port $FRONTEND_PORT is already in use"
        print_status "Attempting to free the port..."
        if ! kill_processes_on_port $FRONTEND_PORT "frontend"; then
            print_error "Cannot start frontend - port $FRONTEND_PORT is occupied"
            return 1
        fi
    fi
    
    # Start frontend in background with separate log file using nohup for better process management
    nohup npm run dev > "frontend.log" 2>&1 &
    local frontend_pid=$!
    echo $frontend_pid > "$FRONTEND_PID_FILE"
    
    # Wait a moment for the process to start and then get the actual Vite process PID
    sleep 2
    local vite_pid=$(pgrep -f "vite.*dev" | head -1)
    if [ -n "$vite_pid" ]; then
        echo $vite_pid > "$FRONTEND_PID_FILE"
        frontend_pid=$vite_pid
    fi
    
    # Wait for Vite to start up with simpler detection
    print_status "Waiting for frontend to start..."
    local max_attempts=20
    local attempt=0
    local frontend_ready=false
    
    while [ $attempt -lt $max_attempts ]; do
        sleep 1
        attempt=$((attempt + 1))
        
        # Check if process is still running
        if ! is_process_running "$FRONTEND_PID_FILE"; then
            print_error "Frontend process died during startup"
            print_status "Check frontend.log for error details"
            rm -f "$FRONTEND_PID_FILE"
            return 1
        fi
        
        # Simple check: if port is in use, consider it ready
        if is_port_in_use $FRONTEND_PORT; then
            frontend_ready=true
            break
        fi
        
        if [ $((attempt % 5)) -eq 0 ]; then
            print_status "Waiting for frontend... (attempt $attempt/$max_attempts)"
        fi
    done
    
    if $frontend_ready; then
        print_success "Frontend started successfully (PID: $frontend_pid)"
        print_status "Frontend available at: http://localhost:$FRONTEND_PORT"
        return 0
    else
        print_error "Frontend process started but port $FRONTEND_PORT is not responding"
        print_status "Check frontend.log for details"
        kill $frontend_pid 2>/dev/null
        rm -f "$FRONTEND_PID_FILE"
        return 1
    fi
}

# Function to start backend
start_backend() {
    print_status "Starting backend..."
    
    if is_process_running "$BACKEND_PID_FILE"; then
        print_warning "Backend is already running (PID: $(cat $BACKEND_PID_FILE))"
        return 0
    fi
    
    cd "$(dirname "$0")/backend"
    
    # Check if bun is installed
    if ! command -v bun &> /dev/null; then
        print_error "Bun is not installed. Please install bun first."
        print_status "Install bun: curl -fsSL https://bun.sh/install | bash"
        return 1
    fi
    
    # Check if node_modules exists, if not install dependencies
    if [ ! -d "node_modules" ]; then
        print_status "Installing backend dependencies..."
        bun install
    fi
    
    # Check port availability
    if is_port_in_use $BACKEND_PORT; then
        print_error "Port $BACKEND_PORT is already in use"
        print_status "Attempting to free the port..."
        if ! kill_processes_on_port $BACKEND_PORT "backend"; then
            print_error "Cannot start backend - port $BACKEND_PORT is occupied"
            return 1
        fi
    fi
    
    # Start backend in background with separate log file using nohup for better process management
    nohup bun run dev > "../backend.log" 2>&1 &
    local backend_pid=$!
    echo $backend_pid > "../$BACKEND_PID_FILE"
    
    # Wait a moment for the process to start and then get the actual Bun process PID
    sleep 2
    local bun_pid=$(pgrep -f "bun.*dev" | head -1)
    if [ -n "$bun_pid" ]; then
        echo $bun_pid > "../$BACKEND_PID_FILE"
        backend_pid=$bun_pid
    fi
    
    # Wait longer for backend to start up and check multiple times
    print_status "Waiting for backend to start..."
    local max_attempts=8
    local attempt=0
    local backend_ready=false
    
    while [ $attempt -lt $max_attempts ]; do
        sleep 2
        attempt=$((attempt + 1))
        
        # Check if process is still running
        if ! is_process_running "../$BACKEND_PID_FILE"; then
            print_error "Backend process died during startup"
            rm -f "../$BACKEND_PID_FILE"
            return 1
        fi
        
        # Check if port is in use
        if is_port_in_use $BACKEND_PORT; then
            # Additional check: try to connect to the API
            if curl -s "http://localhost:$BACKEND_PORT" > /dev/null 2>&1; then
                backend_ready=true
                break
            fi
        fi
        
        print_status "Waiting for backend... (attempt $attempt/$max_attempts)"
    done
    
    if $backend_ready; then
        print_success "Backend started successfully (PID: $backend_pid)"
        print_status "Backend available at: http://localhost:$BACKEND_PORT"
        return 0
    else
        print_error "Backend process started but port $BACKEND_PORT is not responding"
        print_status "Check backend.log for details"
        kill $backend_pid 2>/dev/null
        rm -f "../$BACKEND_PID_FILE"
        return 1
    fi
}

# Function to stop frontend
stop_frontend() {
    print_status "Stopping frontend..."
    
    if [ -f "$FRONTEND_PID_FILE" ]; then
        local pid=$(cat "$FRONTEND_PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            kill "$pid"
            rm -f "$FRONTEND_PID_FILE"
            print_success "Frontend stopped"
        else
            print_warning "Frontend process not found"
            rm -f "$FRONTEND_PID_FILE"
        fi
    else
        print_warning "Frontend PID file not found"
    fi
}

# Function to stop backend
stop_backend() {
    print_status "Stopping backend..."
    
    if [ -f "$BACKEND_PID_FILE" ]; then
        local pid=$(cat "$BACKEND_PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            kill "$pid"
            rm -f "$BACKEND_PID_FILE"
            print_success "Backend stopped"
        else
            print_warning "Backend process not found"
            rm -f "$BACKEND_PID_FILE"
        fi
    else
        print_warning "Backend PID file not found"
    fi
}

# Function to show status
show_status() {
    print_status "Checking application status..."
    echo
    
    echo "Frontend Status:"
    if is_process_running "$FRONTEND_PID_FILE"; then
        local frontend_pid=$(cat "$FRONTEND_PID_FILE")
        print_success "Running (PID: $frontend_pid)"
        print_status "URL: http://localhost:$FRONTEND_PORT"
    else
        print_error "Not running"
    fi
    
    # Check if port is in use by any process
    if is_port_in_use $FRONTEND_PORT; then
        local port_pid=$(lsof -ti :$FRONTEND_PORT | head -1)
        if [ -n "$port_pid" ] && [ "$port_pid" != "$(cat $FRONTEND_PID_FILE 2>/dev/null)" ]; then
            print_warning "Port $FRONTEND_PORT is in use by another process (PID: $port_pid)"
        fi
    fi
    
    echo
    echo "Backend Status:"
    if is_process_running "$BACKEND_PID_FILE"; then
        local backend_pid=$(cat "$BACKEND_PID_FILE")
        print_success "Running (PID: $backend_pid)"
        print_status "URL: http://localhost:$BACKEND_PORT"
    else
        print_error "Not running"
    fi
    
    # Check if port is in use by any process
    if is_port_in_use $BACKEND_PORT; then
        local port_pid=$(lsof -ti :$BACKEND_PORT | head -1)
        if [ -n "$port_pid" ] && [ "$port_pid" != "$(cat $BACKEND_PID_FILE 2>/dev/null)" ]; then
            print_warning "Port $BACKEND_PORT is in use by another process (PID: $port_pid)"
        fi
    fi
    
    echo
    echo "Logs:"
    if [ -f "frontend.log" ]; then
        print_status "Frontend log: frontend.log"
        print_status "Last 5 lines:"
        tail -n 5 "frontend.log"
    else
        print_warning "No frontend log file found"
    fi
    
    if [ -f "backend.log" ]; then
        print_status "Backend log: backend.log"
        print_status "Last 5 lines:"
        tail -n 5 "backend.log"
    else
        print_warning "No backend log file found"
    fi
}

# Function to start everything
start_all() {
    print_status "Starting $APP_NAME..."
    echo
    
    # Check for existing instances and port conflicts
    if ! check_existing_instances; then
        print_error "Cannot start application due to port conflicts or existing instances"
        print_status "Use './parent-connect.sh status' to check current state"
        print_status "Use './parent-connect.sh stop' to stop existing instances"
        return 1
    fi
    
    # Start backend first
    if start_backend; then
        # Wait a moment for backend to fully initialize
        sleep 2
        # Start frontend
        if start_frontend; then
            print_success "$APP_NAME started successfully!"
            echo
            print_status "Application URLs:"
            print_status "Frontend: http://localhost:$FRONTEND_PORT"
            print_status "Backend:  http://localhost:$BACKEND_PORT"
            print_status "Logs:     frontend.log, backend.log"
        else
            print_error "Failed to start frontend"
            stop_backend
            return 1
        fi
    else
        print_error "Failed to start backend"
        return 1
    fi
}

# Function to stop everything
stop_all() {
    print_status "Stopping $APP_NAME..."
    stop_frontend
    stop_backend
    print_success "$APP_NAME stopped"
}

# Function to restart everything
restart_all() {
    print_status "Restarting $APP_NAME..."
    stop_all
    sleep 2
    start_all
}

# Function to clean up
cleanup() {
    print_status "Cleaning up..."
    rm -f "$FRONTEND_PID_FILE" "$BACKEND_PID_FILE"
    print_success "Cleanup completed"
}

# Function to force kill processes on ports
force_kill_ports() {
    print_status "Force killing processes on application ports..."
    
    if kill_processes_on_port $FRONTEND_PORT "frontend"; then
        print_success "Frontend port $FRONTEND_PORT freed"
    fi
    
    if kill_processes_on_port $BACKEND_PORT "backend"; then
        print_success "Backend port $BACKEND_PORT freed"
    fi
    
    cleanup
    print_success "Port cleanup completed"
}

# Function to shutdown gracefully
shutdown_graceful() {
    print_status "Shutting down $APP_NAME gracefully..."
    
    # Try graceful shutdown first
    if [ -f "$FRONTEND_PID_FILE" ]; then
        local frontend_pid=$(cat "$FRONTEND_PID_FILE")
        if ps -p "$frontend_pid" > /dev/null 2>&1; then
            print_status "Sending SIGTERM to frontend (PID: $frontend_pid)..."
            kill -TERM "$frontend_pid"
        fi
    fi
    
    if [ -f "$BACKEND_PID_FILE" ]; then
        local backend_pid=$(cat "$BACKEND_PID_FILE")
        if ps -p "$backend_pid" > /dev/null 2>&1; then
            print_status "Sending SIGTERM to backend (PID: $backend_pid)..."
            kill -TERM "$backend_pid"
        fi
    fi
    
    # Wait for graceful shutdown (up to 10 seconds)
    local wait_time=0
    while [ $wait_time -lt 10 ]; do
        if ! is_process_running "$FRONTEND_PID_FILE" && ! is_process_running "$BACKEND_PID_FILE"; then
            print_success "Graceful shutdown completed"
            cleanup
            return 0
        fi
        sleep 1
        wait_time=$((wait_time + 1))
    done
    
    # Force kill if graceful shutdown failed
    print_warning "Graceful shutdown timeout, forcing termination..."
    stop_all
}

# Main script logic
case "${1:-start}" in
    start)
        start_all
        ;;
    stop|shutdown)
        if [ "$1" = "shutdown" ]; then
            shutdown_graceful
        else
            stop_all
        fi
        ;;
    restart)
        restart_all
        ;;
    status)
        show_status
        ;;
    cleanup)
        cleanup
        ;;
    force-kill)
        force_kill_ports
        ;;
    *)
        echo "Usage: $0 {start|stop|shutdown|restart|status|cleanup|force-kill}"
        echo
        echo "Commands:"
        echo "  start      - Start the application (frontend + backend)"
        echo "  stop       - Stop the application"
        echo "  shutdown   - Gracefully shutdown the application"
        echo "  restart    - Restart the application"
        echo "  status     - Show current status"
        echo "  cleanup    - Clean up PID files"
        echo "  force-kill - Force kill processes on app ports"
        echo
        echo "Examples:"
        echo "  ./parent-connect.sh start"
        echo "  ./parent-connect.sh stop"
        echo "  ./parent-connect.sh shutdown"
        echo "  ./parent-connect.sh restart"
        echo "  ./parent-connect.sh status"
        echo "  ./parent-connect.sh force-kill"
        echo
        echo "Login Tips:"
        echo "  - Enter username (e.g., 'Sarah Johnson')"
        echo "  - Enter any password (demo mode)"
        echo "  - Press Enter key to login (no mouse required)"
        echo "  - Or click the 'Continue to ParentConnect' button"
        exit 1
        ;;
esac
