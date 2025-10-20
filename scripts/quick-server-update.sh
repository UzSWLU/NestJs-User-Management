#!/bin/bash

# ============================================
# Tez Server Yangilash (Xatoliksiz)
# ============================================
# Bu script serverda kodlarni yangilaydi va bazani update qiladi
# Faqat bir marta ishlatish uchun

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🚀 SERVER YANGILASH BOSHLANDI          ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Check directory
echo -e "${YELLOW}[1/7]${NC} 📂 Papkani tekshirish..."
cd /var/www/auth-api || {
    echo -e "${RED}❌ Loyiha papkasi topilmadi: /var/www/auth-api${NC}"
    exit 1
}
echo -e "${GREEN}✓ Papka topildi: $(pwd)${NC}"
echo ""

# Step 2: Pull latest code
echo -e "${YELLOW}[2/7]${NC} 📥 GitHub'dan yangi kodlarni yuklab olish..."
git fetch origin main
git reset --hard origin/main
echo -e "${GREEN}✓ Kodlar yangilandi${NC}"
echo ""

# Step 3: Backup database
echo -e "${YELLOW}[3/7]${NC} 💾 Database backup yaratish..."
mkdir -p backups
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
if docker-compose -f docker-compose.prod.yml exec -T mysql mysqldump \
    -u root -p${MYSQL_ROOT_PASSWORD} ${DB_NAME} > "backups/db_backup_$TIMESTAMP.sql" 2>/dev/null; then
    echo -e "${GREEN}✓ Backup yaratildi: backups/db_backup_$TIMESTAMP.sql${NC}"
else
    echo -e "${YELLOW}⚠  Backup yaratib bo'lmadi (davom etamiz)${NC}"
fi
echo ""

# Step 4: Rebuild and restart containers
echo -e "${YELLOW}[4/7]${NC} 🔨 Docker containerlarni yangilash..."
docker-compose -f docker-compose.prod.yml up -d --build
echo -e "${GREEN}✓ Containerlar qayta ishga tushdi${NC}"
echo ""

# Step 5: Wait for API
echo -e "${YELLOW}[5/7]${NC} ⏳ API tayyor bo'lishini kutish..."
sleep 10

MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker-compose -f docker-compose.prod.yml exec -T api wget -q -O- http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ API tayyor!${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT+1))
    printf "${YELLOW}  Kutilmoqda... %d/%d${NC}\r" $RETRY_COUNT $MAX_RETRIES
    sleep 2
done
echo ""

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}❌ API ishga tushmadi!${NC}"
    echo -e "${RED}Loglarni ko'ring:${NC}"
    docker-compose -f docker-compose.prod.yml logs --tail=30 api
    exit 1
fi

# Step 6: Run migrations
echo -e "${YELLOW}[6/7]${NC} 🗄️  Database migratsiyalarini ishga tushirish..."
if docker-compose -f docker-compose.prod.yml exec -T api npm run migration:run; then
    echo -e "${GREEN}✓ Migratsiyalar muvaffaqiyatli bajarildi!${NC}"
else
    echo -e "${RED}❌ Migration xato!${NC}"
    docker-compose -f docker-compose.prod.yml logs --tail=30 api
    exit 1
fi
echo ""

# Step 7: Final checks
echo -e "${YELLOW}[7/7]${NC} 🔍 Natijalarni tekshirish..."

# Container status
echo -e "${BLUE}Container holati:${NC}"
docker-compose -f docker-compose.prod.yml ps

echo ""

# Health check
HEALTH=$(curl -s http://localhost:3000/health || echo "error")
echo -e "${BLUE}Health Check:${NC} $HEALTH"

echo ""

# Recent logs
echo -e "${BLUE}So'nggi loglar:${NC}"
docker-compose -f docker-compose.prod.yml logs --tail=15 api

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ YANGILASH MUVAFFAQIYATLI BAJARILDI   ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📅 Vaqt:${NC} $(date)"
echo -e "${BLUE}🌐 URL:${NC} https://auth.uzswlu.uz"
echo -e "${BLUE}📊 API:${NC} https://auth.uzswlu.uz/api"
echo ""
echo -e "${YELLOW}💡 Qo'shimcha commandalar:${NC}"
echo -e "   Loglarni ko'rish: ${GREEN}docker-compose -f docker-compose.prod.yml logs -f api${NC}"
echo -e "   Status:          ${GREEN}docker-compose -f docker-compose.prod.yml ps${NC}"
echo -e "   Restart:         ${GREEN}docker-compose -f docker-compose.prod.yml restart api${NC}"
echo ""

exit 0





