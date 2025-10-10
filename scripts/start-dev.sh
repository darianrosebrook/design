#!/bin/bash

# Designer Development Start Script
# Starts both the frontend (design-editor) and MCP server concurrently
# @author @darianrosebrook

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[DESIGNER]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Function to kill processes on specific ports
kill_port() {
    local port=$1
    if port_in_use $port; then
        print_warning "Port $port is in use. Attempting to free it..."
        lsof -ti :$port | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

# Function to cleanup on exit
cleanup() {
    print_status "Shutting down services..."
    # Kill any background processes
    jobs -p | xargs -r kill 2>/dev/null || true
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

print_status "Starting Designer Development Environment"
print_status "=========================================="

# Check prerequisites
print_status "Checking prerequisites..."

if ! command_exists pnpm; then
    print_error "pnpm is not installed. Please install pnpm first."
    exit 1
fi

if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "packages/design-editor" ] || [ ! -d "packages/mcp-adapter" ]; then
    print_error "Please run this script from the project root directory."
    exit 1
fi

print_success "Prerequisites check passed"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    pnpm install
fi

# Build MCP adapter if needed
if [ ! -d "packages/mcp-adapter/dist" ]; then
    print_status "Building MCP adapter..."
    cd packages/mcp-adapter
    pnpm run build
    cd ../..
fi

# Free up commonly used ports
print_status "Checking and freeing up ports..."
kill_port 3000  # Next.js default
kill_port 3001  # Alternative Next.js port

print_success "Ports are ready"

# Start services concurrently
print_status "Starting services..."

# Start MCP server in background
print_status "Starting MCP server..."
cd packages/mcp-adapter
pnpm run start &
MCP_PID=$!
cd ../..

# Give MCP server a moment to start
sleep 2

# Start frontend
print_status "Starting frontend (Next.js)..."
cd packages/design-editor
pnpm run dev &
FRONTEND_PID=$!
cd ../..

print_success "Services started successfully!"
print_status "=========================================="
print_status "Frontend: http://localhost:3000"
print_status "MCP Server: Running on stdio"
print_status "=========================================="
print_warning "Press Ctrl+C to stop all services"

# Wait for both processes
wait $MCP_PID $FRONTEND_PID


















