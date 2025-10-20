# 🔧 .env.production Update Guide

Bu qo'llanma `.env.production` faylini yangilash va OAuth URL'larni sozlashni ko'rsatadi.

---

## 🎯 Muammo

`.env.production`'da `BACKEND_URL` va `FRONTEND_CALLBACK_URL` yo'q bo'lsa:

- ❌ OAuth providers `localhost` URL'larni ishlatadi
- ❌ HEMIS redirect serverga kelmaydi
- ❌ Yangi user'lar yaratilmaydi

---

## ✅ Yechim: GitHub Workflow Orqali

### Option 1: GitHub Actions'dan Yangilash (TAVSIYA!)

1. **GitHub'ga boring:**

   ```
   https://github.com/a-d-sh/NestJs-User-Management/actions
   ```

2. **Workflow'ni tanlang:**
   - "🔧 Update .env.production"

3. **"Run workflow"** bosing

4. **Input'larni kiriting:**
   - **Backend URL:** `https://auth.uzswlu.uz` (default)
   - **Frontend Callback:** `https://front.uzswlu.uz/callback` (default)

5. **"Run workflow"** (yashil tugma)

6. **Natija (5-10 daqiqa):**
   - ✅ `.env.production` yangilandi
   - ✅ Containers rebuilt (volume'lar tozalandi)
   - ✅ Fresh database (seeds bilan)
   - ✅ OAuth URL'lar to'g'ri

---

### Option 2: Manual (SSH)

**Agar GitHub Actions ishlamasa:**

```bash
# 1. SSH
ssh root@172.22.0.19

# 2. Project directory
cd /var/www/auth-api

# 3. Backup .env.production
cp .env.production .env.production.backup

# 4. Add OAuth URLs
cat >> .env.production << 'EOF'

# OAuth URLs
BACKEND_URL=https://auth.uzswlu.uz
FRONTEND_CALLBACK_URL=https://front.uzswlu.uz/callback
EOF

# 5. Verify
cat .env.production | grep -E "BACKEND_URL|FRONTEND_CALLBACK_URL"

# 6. Rebuild
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d --build

# 7. Wait
sleep 60

# 8. Check
docker-compose -f docker-compose.prod.yml exec -T mysql mysql \
  -u root -pP67ey4oyhQIzqM6qD0lbMNoDSa8BFbQGTC1TE4tvO5LUOtfH \
  auth_management -e "SELECT name, redirect_uri, front_redirect FROM oauth_providers WHERE name='hemis';"
```

---

## 📊 Kutilgan Natija

### .env.production (yangi):

```bash
# ... existing vars ...

# OAuth URLs
BACKEND_URL=https://auth.uzswlu.uz
FRONTEND_CALLBACK_URL=https://front.uzswlu.uz/callback
```

### Database (yangi):

```sql
name  | redirect_uri                                    | front_redirect
------+-------------------------------------------------+----------------------------------
hemis | https://auth.uzswlu.uz/api/auth/callback/hemis | https://front.uzswlu.uz/callback
```

### Seed Log:

```
🌱 Seeding OAuth providers...
📍 Backend URL: https://auth.uzswlu.uz
📍 Frontend Callback: https://front.uzswlu.uz/callback
✅ OAuth providers seeded successfully!
```

---

## 🚀 Multiple Frontend URLs

Agar bir nechta frontend URL kerak bo'lsa:

### .env.production:

```bash
# Primary frontend
FRONTEND_CALLBACK_URL=https://front.uzswlu.uz/callback

# Fallback URLs (for testing)
# You can test with: http://localhost:3003/callback
```

### Database'da Manual O'zgartirish:

```bash
# Update for testing with localhost
docker-compose -f docker-compose.prod.yml exec -T mysql mysql \
  -u root -pYOUR_PASSWORD \
  auth_management -e "
UPDATE oauth_providers
SET front_redirect = 'http://localhost:3003/callback'
WHERE name='hemis';
"

# Restart API
docker-compose -f docker-compose.prod.yml restart api
```

---

## ⚠️ MUHIM: HEMIS Admin Panel

**`.env.production` yangilangandan KEYIN:**

HEMIS OAuth admin panelida **Redirect URI**'ni ham yangilang:

```
✅ To'g'ri: https://auth.uzswlu.uz/api/auth/callback/hemis
```

Bu ikkalasi ham to'g'ri bo'lishi shart:

1. ✅ `.env.production` → `BACKEND_URL`
2. ✅ HEMIS admin panel → Redirect URI

---

## 🔍 Troubleshooting

### Problem: OAuth URL'lar hali localhost

**Sabab:** `.env.production` yangilanmagan yoki container restart qilinmagan.

**Yechim:**

```bash
# Check .env
cat .env.production | grep BACKEND_URL

# If empty, add it
echo "BACKEND_URL=https://auth.uzswlu.uz" >> .env.production
echo "FRONTEND_CALLBACK_URL=https://front.uzswlu.uz/callback" >> .env.production

# Rebuild
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d --build
```

### Problem: Database'da hali localhost

**Sabab:** OAuth providers allaqachon seeded (skip qilindi).

**Yechim:**

```bash
# Database volume'ni tozalash (data yo'qoladi!)
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d --build

# Yoki manual update
docker-compose exec mysql mysql -u root -p -e "
UPDATE auth_management.oauth_providers
SET
  redirect_uri = 'https://auth.uzswlu.uz/api/auth/callback/hemis',
  front_redirect = 'https://front.uzswlu.uz/callback'
WHERE name='hemis';
"
```

---

## 🎯 Summary

| Step                  | Method             | Time    |
| --------------------- | ------------------ | ------- |
| 1. Update .env        | GitHub Workflow    | instant |
| 2. Rebuild containers | Auto (in workflow) | 5-10min |
| 3. Verify OAuth URLs  | Auto (in workflow) | instant |
| 4. Test OAuth login   | Manual             | instant |

**Hamma narsa GitHub orqali!** 🚀
