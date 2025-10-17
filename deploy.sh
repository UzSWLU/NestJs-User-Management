#!/bin/bash

# ============================================
# Production Deployment Script
# ============================================
# Usage: ./deploy.sh [environment] [version]
# Example: ./deploy.sh production v1.0.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}
APP_DIR="/opt/management-api"
DOCKER_REGISTRY="ghcr.io"
IMAGE_NAME="yourorg/management"

echo -e "${BLUE}🚀 Starting deployment...${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Version: ${VERSION}${NC}"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    echo -e "${RED}❌ Invalid environment. Use 'staging' or 'production'${NC}"
    exit 1
fi

# Check if running as root or with sudo
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ This script must be run as root or with sudo${NC}"
   exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose is not installed${NC}"
    exit 1
fi

# Backup database
echo -e "${YELLOW}📦 Creating database backup...${NC}"
BACKUP_DIR="$APP_DIR/backups"
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker-compose -f docker-compose.prod.yml exec -T mysql mysqldump \
    -u root -p${MYSQL_ROOT_PASSWORD} ${DB_NAME} > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql" 2>/dev/null || echo -e "${YELLOW}⚠️  Database backup skipped${NC}"

# Pull latest images
echo -e "${YELLOW}📥 Pulling Docker images...${NC}"
export IMAGE_TAG=$VERSION
docker-compose -f docker-compose.prod.yml pull

# Stop old containers
echo -e "${YELLOW}🛑 Stopping old containers...${NC}"
docker-compose -f docker-compose.prod.yml down --remove-orphans

# Start new containers
echo -e "${YELLOW}🚀 Starting new containers...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# Wait for health check
echo -e "${YELLOW}⏳ Waiting for application to be healthy...${NC}"
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker-compose -f docker-compose.prod.yml exec -T api wget -q -O- http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Application is healthy!${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT+1))
    echo -e "${YELLOW}Waiting... ($RETRY_COUNT/$MAX_RETRIES)${NC}"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}❌ Health check failed. Rolling back...${NC}"
    
    # Rollback
    docker-compose -f docker-compose.prod.yml down
    export IMAGE_TAG=previous
    docker-compose -f docker-compose.prod.yml up -d
    
    echo -e "${RED}❌ Deployment failed. Rolled back to previous version.${NC}"
    exit 1
fi

# Run database migrations
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
docker-compose -f docker-compose.prod.yml exec -T api npm run migration:run || echo -e "${YELLOW}⚠️  Migration skipped${NC}"

# Clean up old images
echo -e "${YELLOW}🧹 Cleaning up old Docker images...${NC}"
docker image prune -af --filter "until=24h"

# Show container status
echo -e "${YELLOW}📊 Container status:${NC}"
docker-compose -f docker-compose.prod.yml ps

# Show logs
echo -e "${YELLOW}📝 Recent logs:${NC}"
docker-compose -f docker-compose.prod.yml logs --tail=20 api

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}Environment: ${ENVIRONMENT}${NC}"
echo -e "${GREEN}Version: ${VERSION}${NC}"
echo -e "${GREEN}Timestamp: $(date)${NC}"

# Send notification (optional)
# curl -X POST https://hooks.slack.com/... -d "Deployment successful: $ENVIRONMENT $VERSION"

exit 0

