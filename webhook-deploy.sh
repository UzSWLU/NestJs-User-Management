#!/bin/bash

# ============================================
# GitHub Webhook Deploy Script
# ============================================
# Serverda ishlaydi va GitHub webhook'dan
# signal olganda avtomatik deploy qiladi

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}📥 Deploy started...${NC}"

# Navigate to project
cd /var/www/auth-api

# Pull latest code
echo -e "${YELLOW}📥 Pulling latest code...${NC}"
git pull origin main

# Rebuild containers
echo -e "${YELLOW}🔨 Rebuilding containers...${NC}"
docker-compose -f docker-compose.prod.yml up -d --build

echo -e "${GREEN}✅ Deploy completed!${NC}"

# Show status
docker-compose -f docker-compose.prod.yml ps

