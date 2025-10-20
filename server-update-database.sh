#!/bin/bash

# ============================================
# Server Database Update Script
# ============================================
# Bu script serverdagi bazani yangilaydi
# Usage: ssh root@172.22.0.19 'bash -s' < server-update-database.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Serverda bazani yangilash boshlandi...${NC}"

# Change to project directory
cd /var/www/auth-api || {
    echo -e "${RED}❌ Loyiha papkasi topilmadi!${NC}"
    exit 1
}

echo -e "${YELLOW}📂 Joriy papka: $(pwd)${NC}"

# Pull latest code
echo -e "${YELLOW}📥 GitHub'dan yangi kodlarni yuklab olish...${NC}"
git pull origin main

# Create backup before changes
echo -e "${YELLOW}💾 Database backup yaratilmoqda...${NC}"
mkdir -p backups
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker-compose -f docker-compose.prod.yml exec -T mysql mysqldump \
    -u root -p${MYSQL_ROOT_PASSWORD} ${DB_NAME} > "backups/db_backup_$TIMESTAMP.sql" 2>/dev/null || \
    echo -e "${YELLOW}⚠️  Database backup o'tkazib yuborildi${NC}"

# Rebuild containers
echo -e "${YELLOW}🔨 Docker containerlarni qayta build qilish...${NC}"
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for API to be ready
echo -e "${YELLOW}⏳ API tayyor bo'lishini kutmoqda...${NC}"
sleep 10

MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker-compose -f docker-compose.prod.yml exec -T api wget -q -O- http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ API ishga tushdi!${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT+1))
    echo -e "${YELLOW}Kutilmoqda... ($RETRY_COUNT/$MAX_RETRIES)${NC}"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}❌ API ishga tushmadi!${NC}"
    docker-compose -f docker-compose.prod.yml logs --tail=50 api
    exit 1
fi

# Run migrations
echo -e "${YELLOW}🗄️  Database migratsiyalarini ishga tushirish...${NC}"
docker-compose -f docker-compose.prod.yml exec -T api npm run migration:run || {
    echo -e "${RED}❌ Migration xato!${NC}"
    exit 1
}

echo -e "${GREEN}✅ Migratsiyalar muvaffaqiyatli o'rnatildi!${NC}"

# Optional: Run seeds
read -p "Seed ma'lumotlarni yuklamoqchimisiz? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🌱 Seed ma'lumotlarni yuklash...${NC}"
    docker-compose -f docker-compose.prod.yml exec -T api npm run seed || {
        echo -e "${YELLOW}⚠️  Seed xato!${NC}"
    }
fi

# Show container status
echo -e "${YELLOW}📊 Container holati:${NC}"
docker-compose -f docker-compose.prod.yml ps

# Show recent logs
echo -e "${YELLOW}📝 So'nggi loglar:${NC}"
docker-compose -f docker-compose.prod.yml logs --tail=30 api

# Test health endpoint
echo -e "${YELLOW}🔍 Health check...${NC}"
HEALTH_STATUS=$(curl -s http://localhost:3000/health)
echo -e "${GREEN}Health: $HEALTH_STATUS${NC}"

echo -e "${GREEN}✅ ✅ ✅ Baza muvaffaqiyatli yangilandi!${NC}"
echo -e "${GREEN}Timestamp: $(date)${NC}"
echo -e "${BLUE}API URL: https://auth.uzswlu.uz${NC}"

exit 0

