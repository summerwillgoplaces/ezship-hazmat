#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -e

echo "=== 1. Building React Frontend ==="
cd frontend
npm install
npm run build
cd ..

echo "=== 2. Installing Backend Python Dependencies ==="
cd backend
pip install -r requirements.txt
cd ..

echo "=== Build Complete: Frontend dist and Backend Ready ==="
