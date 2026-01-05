#!/usr/bin/env bash
# repro_script.sh - Reproduces the Ghost Bug
set -euo pipefail

PORT=5000
BASE_URL="http://localhost:$PORT/api"

echo "1. Creating dummy project..."
PROJECT_JSON=$(curl -s -X POST "$BASE_URL/projects" \
  -H "Content-Type: application/json" \
  -d '{"title": "Forensic Repro Project", "rawInput": "Reproduction of ghost bug."}')

PROJECT_ID=$(echo "$PROJECT_JSON" | grep -oP '"id":"\K[^"]+')

if [ -z "$PROJECT_ID" ]; then
  echo "Failed to create project. Response: $PROJECT_JSON"
  exit 1
fi

echo "Created project: $PROJECT_ID"

echo "2. Triggering /vibecode-guide..."
curl -i -X POST "$BASE_URL/projects/$PROJECT_ID/vibecode-guide" \
  -H "Content-Type: application/json" \
  -d '{}'

echo -e "\n\nReproduction attempt completed. Check server logs for [Forensic] output."
