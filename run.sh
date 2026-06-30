#!/bin/bash
echo "==================================================="
echo "            Starting VoiceLedger"
echo "==================================================="
echo ""

# Use bundled node if available
export PATH="$(pwd)/node-mac/bin:$PATH"

if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not found."
    exit 1
fi

echo "Starting MongoDB..."
chmod +x ./mongodb/bin/mongod
./mongodb/bin/mongod --dbpath ./mongodb-data > /dev/null 2>&1 &
MONGO_PID=$!

echo "Starting Backend (Port 5001)..."
(cd server && npm install && npm run dev) &
BACKEND_PID=$!

echo "Starting Frontend (Port 5173)..."
(cd client && npm install && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "==================================================="
echo " VoiceLedger is starting!"
echo " - Frontend: http://localhost:5173"
echo " - Backend API: http://localhost:5001"
echo "==================================================="
echo "Press Ctrl+C to stop servers."

trap "kill $MONGO_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM EXIT
wait
