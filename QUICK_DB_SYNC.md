# 🔄 Local Database'ni Serverga Nusxalash

## Oddiy Yo'l (5 daqiqa)

### 1. Local Database Export

**Option A: phpMyAdmin (Oson)**

1. Browser'da oching: http://localhost:8080
2. Login qiling (root va parol)
3. `auth_management` ni tanlang
4. **Export** tab → **Go**
5. `auth_management.sql` fayl yuklab olinadi

**Option B: Command Line**

```powershell
# Local MySQL container'ga ulanish
docker exec -it mysql-db mysql -u root -p

# Ichida parolni toping:
SHOW VARIABLES LIKE '%password%';

# Keyin boshqa terminalda:
docker exec mysql-db mysqldump -u root -p[PAROL] auth_management > auth_management.sql
```

### 2. Serverga Yuklash

```powershell
# Faylni serverga yuklash
scp auth_management.sql root@172.22.0.19:/var/www/auth-api/backups/
```

### 3. Serverdagi Database'ni Almashtirish

Serverda:

```bash
ssh root@172.22.0.19

cd /var/www/auth-api

# Eski bazadan backup (xavfsizlik uchun)
docker-compose -f docker-compose.prod.yml exec -T mysql mysqldump \
  -u root -pP67ey4oyhQIzqM6qD0lbMNoDSa8BFbQGTC1TE4tvO5LUOtfH \
  auth_management > backups/old_backup_$(date +%Y%m%d_%H%M%S).sql

# Bazani tozalash va yangisini yuklash
docker-compose -f docker-compose.prod.yml exec -T mysql mysql \
  -u root -pP67ey4oyhQIzqM6qD0lbMNoDSa8BFbQGTC1TE4tvO5LUOtfH \
  -e "DROP DATABASE IF EXISTS auth_management; CREATE DATABASE auth_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Yangi bazani yuklash
docker-compose -f docker-compose.prod.yml exec -T mysql mysql \
  -u root -pP67ey4oyhQIzqM6qD0lbMNoDSa8BFbQGTC1TE4tvO5LUOtfH \
  auth_management < backups/auth_management.sql

# API'ni restart
docker-compose -f docker-compose.prod.yml restart api

# Tekshirish
docker-compose -f docker-compose.prod.yml exec -T mysql mysql \
  -u root -pP67ey4oyhQIzqM6qD0lbMNoDSa8BFbQGTC1TE4tvO5LUOtfH \
  -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='auth_management';"

curl http://localhost:3000/api/health
```

### 4. Tekshirish

```bash
# Jadvallar soni
docker-compose -f docker-compose.prod.yml exec -T mysql mysql \
  -u root -pP67ey4oyhQIzqM6qD0lbMNoDSa8BFbQGTC1TE4tvO5LUOtfH \
  auth_management -e "SHOW TABLES;"

# API health
curl http://localhost:3000/api/health

# OAuth providers
curl http://localhost:3000/api/oauth-providers/active
```

---

## ✅ Tayyor!

Endi local va server database bir xil! 🎉

**Browser'da tekshiring:**

- Server: http://172.22.0.19:8081 (phpmyadmin)
- API: https://auth.uzswlu.uz/





