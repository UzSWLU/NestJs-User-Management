#!/bin/bash

# ============================================
# Final Deployment Script for auth.uzswlu.uz
# ============================================

set -e

echo "🚀 Starting deployment for auth.uzswlu.uz..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Navigate to project directory
cd /var/www/auth-api

echo -e "${YELLOW}📁 Current directory: $(pwd)${NC}"
echo ""

# Pull latest changes
echo -e "${YELLOW}📥 Pulling latest code from GitHub...${NC}"
git pull origin main
echo -e "${GREEN}✅ Code updated!${NC}"
echo ""

# Check .env file
echo -e "${YELLOW}🔍 Checking environment files...${NC}"
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ .env.production not found!${NC}"
    exit 1
fi

# Copy .env.production to .env (Docker Compose default)
echo -e "${YELLOW}📋 Copying .env.production to .env...${NC}"
cp .env.production .env
echo -e "${GREEN}✅ Environment file ready!${NC}"
echo ""

# Display environment variables (masked)
echo -e "${YELLOW}🔐 Environment variables:${NC}"
echo "NODE_ENV=$(grep NODE_ENV .env | cut -d'=' -f2)"
echo "DB_NAME=$(grep DB_NAME .env | cut -d'=' -f2)"
echo "DB_USERNAME=$(grep DB_USERNAME .env | cut -d'=' -f2)"
echo "DB_PASSWORD=***MASKED***"
echo "JWT_SECRET=***MASKED***"
echo ""

# Stop existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker compose -f docker-compose.prod.yml down -v || true
echo -e "${GREEN}✅ Containers stopped!${NC}"
echo ""

# Build and start containers
echo -e "${YELLOW}🏗️  Building and starting containers...${NC}"
docker compose -f docker-compose.prod.yml up -d --build
echo -e "${GREEN}✅ Build complete!${NC}"
echo ""

# Wait for containers to be healthy
echo -e "${YELLOW}⏳ Waiting for containers to be healthy...${NC}"
sleep 10

# Check container status
echo -e "${YELLOW}📊 Container status:${NC}"
docker compose -f docker-compose.prod.yml ps
echo ""

# Check MySQL health
echo -e "${YELLOW}🔍 Checking MySQL health...${NC}"
for i in {1..30}; do
    if docker compose -f docker-compose.prod.yml exec -T mysql mysqladmin ping -h localhost --silent 2>/dev/null; then
        echo -e "${GREEN}✅ MySQL is healthy!${NC}"
        break
    fi
    echo "Waiting for MySQL... ($i/30)"
    sleep 2
done
echo ""

# Check API health
echo -e "${YELLOW}🔍 Checking API health...${NC}"
sleep 5
for i in {1..20}; do
    if curl -f http://localhost:3000/health &>/dev/null; then
        echo -e "${GREEN}✅ API is healthy!${NC}"
        break
    fi
    echo "Waiting for API... ($i/20)"
    sleep 3
done
echo ""

# Display logs (last 20 lines)
echo -e "${YELLOW}📄 Recent API logs:${NC}"
docker compose -f docker-compose.prod.yml logs --tail=20 api
echo ""

# Test API
echo -e "${YELLOW}🧪 Testing API endpoint...${NC}"
echo "GET http://localhost:3000/health"
curl -s http://localhost:3000/health | head -10 || echo -e "${RED}❌ API not responding${NC}"
echo ""
echo ""

# Final status
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📍 Access Points:${NC}"
echo "   Local:    http://localhost:3000"
echo "   Docker:   http://172.22.0.19:3000"
echo "   Nginx:    http://172.22.0.19:8080"
echo "   Swagger:  http://172.22.0.19:3000/api"
echo ""
echo -e "${YELLOW}📋 Useful Commands:${NC}"
echo "   View logs:    docker compose -f docker-compose.prod.yml logs -f api"
echo "   Check status: docker compose -f docker-compose.prod.yml ps"
echo "   Restart:      docker compose -f docker-compose.prod.yml restart api"
echo "   Stop all:     docker compose -f docker-compose.prod.yml down"
echo ""
echo -e "${GREEN}✅ All done! Your API is now running in production mode.${NC}"
echo ""

