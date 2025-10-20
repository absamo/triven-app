#!/bin/bash

# Wait for server to be ready
sleep 5

echo "Testing GET /api/roadmap/features..."
curl -s http://localhost:3001/api/roadmap/features

echo -e "\n\nTesting GET /api/roadmap/features with status filter..."
curl -s "http://localhost:3001/api/roadmap/features?status=TODO"
