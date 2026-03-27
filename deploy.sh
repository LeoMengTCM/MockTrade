#!/bin/bash
set -e

echo "=== MockTrade Deploy ==="

# Check .env
if [ ! -f .env ]; then
  echo "ERROR: .env file not found!"
  echo "Copy .env.production.example to .env and fill in your values."
  exit 1
fi

# Pull latest code
echo "Pulling latest code..."
git pull origin main

# Build and start
echo "Building Docker images..."
docker compose build

echo "Starting services..."
docker compose up -d

echo "Waiting for services to start..."
sleep 10

# Health check
echo "Checking health..."
curl -sf http://localhost:3001/api/health > /dev/null && echo "API: OK" || echo "API: FAILED"
curl -sf http://localhost:3000 > /dev/null && echo "Web: OK" || echo "Web: FAILED"
curl -sf http://localhost > /dev/null && echo "Nginx: OK" || echo "Nginx: FAILED"

echo ""
echo "=== Deploy Complete ==="
echo "Web:   http://localhost (via nginx)"
echo "API:   http://localhost/api"
echo ""
echo "First time? Run:"
echo "  docker compose exec server node dist/database/seeds/run-seed.js"
echo "  Then register with your ADMIN_EMAIL to get admin access."
