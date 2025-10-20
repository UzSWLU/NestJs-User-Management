# 🚀 Deploy Ko'rsatmalari

## 📋 Umumiy Ma'lumot

Ikkita deploy usuli mavjud:

1. **Hozir qo'lda bir marta** - Serverda to'g'ridan-to'g'ri script ishlatish
2. **Kelajakda avtomatik** - GitHub Actions orqali (faqat siz buyurganda)

---

## 🎯 Variant 1: Hozir Bir Marta Yangilash (TAVSIYA)

### Server Ma'lumotlari

```
Server IP: 172.22.0.19
User: root
Password: Rm09HVd_XhXHa
Loyiha: /var/www/auth-api
```

### Usul A: Oddiy Commandalar (5 daqiqa)

```bash
# 1. Serverga ulaning
ssh root@172.22.0.19

# 2. Loyiha papkasiga o'ting
cd /var/www/auth-api

# 3. Yangi kodlarni oling
git pull origin main

# 4. Containerlarni yangilang
docker-compose -f docker-compose.prod.yml up -d --build

# 5. Migratsiyalarni ishga tushiring
docker-compose -f docker-compose.prod.yml exec api npm run migration:run

# 6. Natijani tekshiring
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs --tail=50 api
curl http://localhost:3000/health

# ✅ Tayyor!
```

### Usul B: Avtomatik Script (7 daqiqa, xatoliksiz)

```bash
# 1. Serverga ulaning
ssh root@172.22.0.19

# 2. Scriptni ishga tushiring
cd /var/www/auth-api
chmod +x scripts/quick-server-update.sh
./scripts/quick-server-update.sh

# Script avtomatik qiladi:
# ✅ GitHub'dan pull
# ✅ Backup yaratadi
# ✅ Containerlarni yangilaydi
# ✅ Migratsiyalarni bajaradi
# ✅ Health check qiladi
# ✅ Natijalarni ko'rsatadi
```

---

## 🤖 Variant 2: Kelajakda GitHub Actions Orqali

### Setup (Bir marta qilish kerak)

#### 1. GitHub Secrets Sozlash

GitHub'da: **Settings → Secrets and variables → Actions → New repository secret**

| Secret Name       | Value                    | Izoh                 |
| ----------------- | ------------------------ | -------------------- |
| `SSH_PRIVATE_KEY` | (SSH private key)        | Server uchun SSH key |
| `SERVER_HOST`     | `172.22.0.19`            | Server IP            |
| `SERVER_USER`     | `root`                   | SSH user             |
| `APP_URL`         | `https://auth.uzswlu.uz` | Health check URL     |

#### 2. SSH Key Yaratish (agar yo'q bo'lsa)

**Serverda:**

```bash
# SSH papkasini yarating
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Yoki mavjud key fayllarini ko'ring
ls -la ~/.ssh/

# Agar key yo'q bo'lsa, yarating:
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/github_deploy
# Bo'sh parol qoldiring (Enter bosing)

# Public keyni authorized_keys ga qo'shing
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Private keyni ko'rsating (nusxa oling)
cat ~/.ssh/github_deploy

# Bu private keyni GitHub Secrets'ga SSH_PRIVATE_KEY sifatida qo'shing
```

### Qanday Ishlatish

1. **GitHub'ga o'ting**: Repository → **Actions** tab

2. **Workflow'ni tanlang**: `🚀 Manual Deploy to Production`

3. **Run workflow tugmasini bosing**

4. **Parametrlarni tanlang**:
   - **Environment**: `production`
   - **Run migrations**: `yes` (bazani yangilash uchun)
   - **Run seeds**: `no` (odatda kerak emas)

5. **Run workflow tugmasini bosing**

6. **Jarayonni kuzating**: Real-time log ko'rsatiladi

7. **Natija**: ~2-3 daqiqada deploy tugaydi ✅

### Workflow Nima Qiladi?

```
1. GitHub'dan kodlarni oladi
2. Serverga ulanadi (SSH)
3. Fayllarni serverga yuklaydi
4. Database backup yaratadi
5. Docker containerlarni yangilaydi
6. Migratsiyalarni bajaradi (agar tanlangan bo'lsa)
7. Health check qiladi
8. Natijalarni ko'rsatadi
```

---

## 🔍 Tekshirish

Deploy tugagandan keyin:

```bash
# Browser'da oching:
https://auth.uzswlu.uz/health
https://auth.uzswlu.uz/api

# Yoki terminal'dan:
curl https://auth.uzswlu.uz/health
curl https://auth.uzswlu.uz/api/oauth-providers/active
```

---

## 🛡️ Xavfsizlik

### Workflow Faqat Manual

- ✅ Har push'da **AVTOMATIK ISHLAMAYDI**
- ✅ Faqat siz **"Run workflow"** bosganda ishlaydi
- ✅ Siz nazorat qilasiz

### SSH Key

- ✅ GitHub Secrets'da xavfsiz saqlanadi
- ✅ Logda ko'rinmaydi
- ✅ Faqat deployment uchun ishlatiladi

---

## 🆘 Muammolar va Yechimlar

### Deploy Xatoligi

```bash
# Serverda loglarni ko'ring
ssh root@172.22.0.19
cd /var/www/auth-api
docker-compose -f docker-compose.prod.yml logs -f api
```

### Container Ishlamayapti

```bash
# Qayta ishga tushiring
docker-compose -f docker-compose.prod.yml restart api

# Statusni tekshiring
docker-compose -f docker-compose.prod.yml ps

# Full restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

### Migration Xatosi

```bash
# Migration statusini ko'ring
docker-compose -f docker-compose.prod.yml exec api npm run migration:show

# Oxirgi migrationni bekor qiling (ehtiyotkorlik bilan!)
docker-compose -f docker-compose.prod.yml exec api npm run migration:revert
```

### Backup'dan Qaytarish

```bash
cd /var/www/auth-api/backups
ls -lh  # Backup fayllarini ko'ring

# Eng so'nggi backup'ni tiklash
docker-compose -f docker-compose.prod.yml exec -T mysql mysql \
  -u root -p${MYSQL_ROOT_PASSWORD} ${DB_NAME} < db_backup_YYYYMMDD_HHMMSS.sql
```

---

## 📊 Foydali Commandalar

```bash
# Container stats
docker stats

# Disk space
df -h

# Database size
docker-compose -f docker-compose.prod.yml exec mysql \
  mysql -u root -p${MYSQL_ROOT_PASSWORD} -e \
  "SELECT table_schema AS 'Database',
   ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
   FROM information_schema.tables
   GROUP BY table_schema;"

# Clean old Docker images
docker system prune -a --volumes -f

# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# Only API logs
docker-compose -f docker-compose.prod.yml logs -f api

# Only errors
docker-compose -f docker-compose.prod.yml logs | grep ERROR
```

---

## 📝 Yangi O'zgarishlarni Deploy Qilish

### Oddiy Jarayon

1. **Kodda o'zgarish qiling** (local)
2. **Test qiling** (local)
3. **Commit va push qiling**:

   ```bash
   git add .
   git commit -m "feat: new feature"
   git push origin main
   ```

4. **Deploy qiling** (2ta variant):

   **A) GitHub Actions (tavsiya):**
   - GitHub → Actions → Run workflow ✅

   **B) Server SSH:**

   ```bash
   ssh root@172.22.0.19
   cd /var/www/auth-api
   ./scripts/quick-server-update.sh
   ```

---

## 🎯 Qaysi Usulni Tanlash?

| Vaziyat             | Tavsiya                          |
| ------------------- | -------------------------------- |
| **Birinchi marta**  | Usul 1B (quick-server-update.sh) |
| **Oddiy yangilash** | GitHub Actions (Variant 2)       |
| **Tez fix**         | Usul 1A (oddiy commandalar)      |
| **Muhim deploy**    | GitHub Actions + Monitor         |

---

## ✅ Checklist

Har deploy'dan keyin:

- [ ] Health check ishlayapti: `/health`
- [ ] API endpoint'lar ishlayapti: `/api`
- [ ] Swagger dokumentatsiya ochilmoqda
- [ ] Database migration bajarildi
- [ ] Logda xatolik yo'q
- [ ] Container'lar running holatda

---

## 💡 Pro Tips

1. **Har doim backup oling** - Script avtomatik qiladi
2. **Migration xatoligida** - Backup'dan tiklab olish mumkin
3. **Health check kutib turing** - API tayyor bo'lguncha
4. **Loglarni tekshiring** - Yashirin xatolarni topish uchun
5. **GitHub Actions'ni ishlating** - Xavfsizroq va kuzatiladi

---

## 🎉 Tayyor!

Endi sizda:

- ✅ Hozir qo'lda deploy qilish imkoniyati
- ✅ Kelajakda avtomatik deploy (faqat buyurganda)
- ✅ Xavfsiz va backup'li jarayon
- ✅ Monitoring va health checks

**Savollar?** Ko'rsatmalarga qarang yoki loglarni tekshiring! 🚀




