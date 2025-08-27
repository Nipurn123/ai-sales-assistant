#!/bin/bash
set -e

echo "Starting AI Sales Assistant..."

# Start Next.js development server in background
echo "Starting Next.js development server..."
npm run dev &
NEXT_PID=$!

# Give Next.js a moment to start
sleep 5

# Start Python room agent connector
echo "Starting Python room agent connector..."
python3 room_agent_connector.py dev &
PYTHON_PID=$!

# Function to cleanup processes on exit
cleanup() {
    echo "Stopping services..."
    kill $NEXT_PID $PYTHON_PID 2>/dev/null || true
    exit
}

# Setup signal handlers
trap cleanup SIGTERM SIGINT

# Wait for either process to exit
wait $NEXT_PID $PYTHON_PID