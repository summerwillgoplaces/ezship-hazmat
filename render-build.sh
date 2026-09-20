#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -e

echo "=== 1. Building React Frontend ==="
npm --prefix frontend install
npm --prefix frontend run build

echo "=== 2. Installing Backend Python Dependencies ==="
pip install --upgrade pip
pip install -r backend/requirements.txt

echo "=== Build Complete: Frontend dist and Backend Ready ==="
