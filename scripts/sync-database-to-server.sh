#!/bin/bash

# ============================================
# Local Database'ni Serverga To'liq Nusxalash
# ============================================
# Faqat bir marta ishlatish uchun!

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🔄 LOCAL BAZANI SERVERGA NUSXALASH     ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Local database backup
echo -e "${YELLOW}[1/5]${NC} 💾 Local database'dan backup olinmoqda..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="local_backup_$TIMESTAMP.sql"

docker-compose exec -T mysql mysqldump \
  -u root -proot auth_management > $BACKUP_FILE

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Backup yaratib bo'lmadi!${NC}"
    exit 1
fi

FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo -e "${GREEN}✓ Backup yaratildi: $BACKUP_FILE ($FILE_SIZE)${NC}"
echo ""

# Step 2: Upload to server
echo -e "${YELLOW}[2/5]${NC} 📤 Serverga yuklash..."
scp "$BACKUP_FILE" root@172.22.0.19:/var/www/auth-api/backups/

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Serverga yuklab bo'lmadi!${NC}"
    echo -e "${YELLOW}Qo'lda bajaring:${NC}"
    echo -e "${BLUE}scp $BACKUP_FILE root@172.22.0.19:/var/www/auth-api/backups/${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Serverga yuklandi${NC}"
echo ""

# Step 3: Restore on server
echo -e "${YELLOW}[3/5]${NC} 🔄 Serverdagi bazani almashtirish..."

ssh root@172.22.0.19 << ENDSSH
set -e
cd /var/www/auth-api

echo "Serverdagi eski bazadan backup yaratilmoqda..."
docker-compose -f docker-compose.prod.yml exec -T mysql mysqldump \
  -u root -pP67ey4oyhQIzqM6qD0lbMNoDSa8BFbQGTC1TE4tvO5LUOtfH \
  auth_management > backups/server_backup_before_sync_$TIMESTAMP.sql 2>/dev/null || echo "Backup o'tkazib yuborildi"

echo "Serverdagi bazani tozalash va yangi bazani yuklash..."
docker-compose -f docker-compose.prod.yml exec -T mysql mysql \
  -u root -pP67ey4oyhQIzqM6qD0lbMNoDSa8BFbQGTC1TE4tvO5LUOtfH \
  -e "DROP DATABASE IF EXISTS auth_management; CREATE DATABASE auth_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo "Yangi bazani tiklash..."
docker-compose -f docker-compose.prod.yml exec -T mysql mysql \
  -u root -pP67ey4oyhQIzqM6qD0lbMNoDSa8BFbQGTC1TE4tvO5LUOtfH \
  auth_management < backups/$BACKUP_FILE

echo "✓ Baza muvaffaqiyatli tiklandi!"
ENDSSH

echo -e "${GREEN}✓ Serverdagi baza yangilandi${NC}"
echo ""

# Step 4: Restart API
echo -e "${YELLOW}[4/5]${NC} 🔄 API'ni qayta ishga tushirish..."
ssh root@172.22.0.19 "cd /var/www/auth-api && docker-compose -f docker-compose.prod.yml restart api"
echo -e "${GREEN}✓ API qayta ishga tushdi${NC}"
echo ""

# Step 5: Verify
echo -e "${YELLOW}[5/5]${NC} ✅ Tekshirish..."
sleep 5

ssh root@172.22.0.19 << 'ENDSSH'
cd /var/www/auth-api

# Table count
TABLE_COUNT=$(docker-compose -f docker-compose.prod.yml exec -T mysql mysql \
  -u root -pP67ey4oyhQIzqM6qD0lbMNoDSa8BFbQGTC1TE4tvO5LUOtfH \
  -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='auth_management';" 2>/dev/null)

echo "Jadvallar soni: $TABLE_COUNT"

# API health
HEALTH=$(curl -s http://localhost:3000/api/health | grep -o '"status":"ok"' || echo "")
if [ -n "$HEALTH" ]; then
    echo "✓ API ishlayapti"
else
    echo "⚠ API tekshirish kutilmoqda..."
fi
ENDSSH

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ BAZA MUVAFFAQIYATLI NUSXALANDI!     ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📊 Ma'lumotlar:${NC}"
echo -e "   Local backup: $BACKUP_FILE"
echo -e "   Timestamp: $TIMESTAMP"
echo ""
echo -e "${YELLOW}💡 Backup faylini o'chirish:${NC}"
echo -e "   ${GREEN}rm $BACKUP_FILE${NC}"
echo ""
echo -e "${BLUE}🌐 Tekshirish:${NC}"
echo -e "   https://auth.uzswlu.uz/"
echo -e "   https://auth.uzswlu.uz/api/health"
echo ""

exit 0






