#!/bin/bash
set -e

echo "1. Checking TypeScript compilation for apps/api..."
cd apps/api
bun run check
echo "TypeScript compilation passed!"
cd ../..

echo "2. Verifying Runtime (Mock)..."
# Start the server in background
PORT=5005
export PORT
# Use tsx from node_modules
./node_modules/.bin/tsx apps/api/src/index.ts &
PID=$!

echo "Server started with PID $PID on port $PORT"
# Wait for server to start
sleep 5

# Check health
echo "Checking /api/health..."
CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/api/health)

echo "Response Code: $CODE"

# Kill the server
kill $PID || true

if [ "$CODE" == "200" ]; then
  echo "Verification Success: API returned 200 OK"
  exit 0
else
  echo "Verification Failed: API returned $CODE"
  exit 1
fi
