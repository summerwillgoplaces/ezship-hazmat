#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -e

echo "=== 1. Building React Frontend ==="
if command -v npm &> /dev/null; then
    npm --prefix frontend install
    npm --prefix frontend run build
else
    echo "Notice: npm not found in build container. Using pre-built frontend distribution."
fi

echo "=== 2. Installing Backend Python Dependencies ==="
pip install --upgrade pip
pip install -r requirements.txt

echo "=== Build Complete: Application Ready ==="
