# 🎮 GitHub'dan Production Serverni Boshqarish

Bu qo'llanma sizga **serverga SSH qilmasdan** GitHub orqali production'ni to'liq boshqarishni ko'rsatadi.

---

## 🚀 Asosiy Workflow'lar

### 1️⃣ **Auto Deploy** (Avtomatik)

**File:** `.github/workflows/deploy.yml`

**Qachon ishlaydi:**

- `main` branch'ga push qilganingizda
- Avtomatik ravishda server'da deploy qiladi

**Nima qiladi:**

```bash
✅ Code'ni pull qiladi
✅ Docker container'larni rebuild qiladi
✅ API'ni restart qiladi
✅ Health check qiladi
```

**Ishlatish:**

```bash
# Local'da
git add .
git commit -m "fix: something"
git push origin main

# 30 sekund ichida server avtomatik yangilanadi! 🚀
```

---

### 2️⃣ **Full Reset** (Manual - Barcha Ma'lumotlarni O'chiradi!)

**File:** `.github/workflows/full-reset.yml`

**Qachon ishlatish kerak:**

- Database'ni butunlay yangilash kerak bo'lganda
- Seed'larni qaytadan yuklash kerak bo'lganda
- Fresh install kerak bo'lganda (local kabi)

**⚠️ OGOHLANTIRISH:** Barcha database ma'lumotlari o'chiriladi!

**Ishlatish:**

1. **GitHub'ga boring:** `https://github.com/a-d-sh/NestJs-User-Management/actions`
2. **Workflow'ni tanlang:** "🔴 Full Production Reset"
3. **"Run workflow"** tugmasini bosing
4. **Tasdiqlash:** `RESET` deb yozing
5. **"Run workflow"** (yashil tugma)

**Nima qiladi:**

```bash
✅ Git pull (latest code)
✅ Stop all containers
✅ Delete all volumes (DATABASE LOST!)
✅ Build from scratch (no cache)
✅ Start fresh
✅ Auto-seed database
✅ Health check
```

**Natija:** 5-10 daqiqada fresh production server!

---

### 3️⃣ **Check Errors** (Xatolarni Tekshirish)

**File:** `.github/workflows/check-errors.yml`

**Qachon ishlaydi:**

- Har 6 soatda avtomatik
- Yoki manual trigger qilsangiz

**Ishlatish:**

1. **GitHub'ga boring:** `https://github.com/a-d-sh/NestJs-User-Management/actions`
2. **Workflow'ni tanlang:** "🔍 Check Production Errors"
3. **"Run workflow"** tugmasini bosing

**Nima qiladi:**

```bash
✅ Container status
✅ API errors (last 500 lines)
✅ MySQL errors
✅ Nginx errors
✅ Test API endpoints
✅ Database statistics
✅ System resources
```

**Log'larni Ko'rish:**

- GitHub Actions'da run'ni oching
- Har bir step'ning log'larini ko'rasiz

---

## 📊 GitHub Actions'da Log'larni Ko'rish

### Step-by-Step:

1. **GitHub repo'ga boring**
2. **"Actions" tab'ni oching**
3. **Workflow run'ni tanlang** (eng yuqoridagi)
4. **Job'ni oching** (masalan: "full-reset")
5. **Har bir step'ni oching va log'larni ko'ring**

### Log'larda Nimalarni Ko'rasiz:

```bash
📊 Container Status
📝 API Logs (real-time)
🔍 Error Messages
✅ Success/Failure status
📈 Database statistics
💾 System resources
```

---

## 🎯 Umumiy Workflow'lar

### A) **Oddiy Code O'zgarishi:**

```bash
# 1. Code yozish (local)
# 2. Test qilish (local)
# 3. Commit va push
git add .
git commit -m "feat: new feature"
git push origin main

# 4. GitHub Actions avtomatik deploy qiladi
# 5. 30 sekund kuting
# 6. https://auth.uzswlu.uz/ ga boring va tekshiring
```

### B) **Database Reset Kerak:**

```bash
# 1. GitHub Actions'ga boring
# 2. "Full Production Reset" workflow'ni run qiling
# 3. "RESET" deb tasdiqlang
# 4. 5-10 daqiqa kuting
# 5. Fresh database tayyor!
```

### C) **Xatolik Tekshirish:**

```bash
# 1. GitHub Actions'ga boring
# 2. "Check Production Errors" workflow'ni run qiling
# 3. Log'larni o'qing
# 4. Agar xatolik bo'lsa - tuzating va push qiling
```

---

## 🔗 Foydali Havolalar

### GitHub:

- **Actions:** `https://github.com/a-d-sh/NestJs-User-Management/actions`
- **Workflows:** `.github/workflows/`

### Production:

- **API:** `https://auth.uzswlu.uz/`
- **Swagger:** `https://auth.uzswlu.uz/`
- **Health:** `https://auth.uzswlu.uz/api/health`

---

## 🛠️ Workflow'larni O'zgartirish

### Deploy Workflow'ni O'zgartirish:

```yaml
# .github/workflows/deploy.yml
# Bu file'ni edit qiling va push qiling
```

### Yangi Workflow Qo'shish:

```yaml
# .github/workflows/my-workflow.yml
name: My Custom Workflow

on:
  workflow_dispatch: # Manual trigger

jobs:
  my-job:
    runs-on: [self-hosted, Linux, X64]
    steps:
      - name: Do something
        run: |
          echo "Hello from GitHub Actions!"
```

---

## 🔐 Server Access (Faqat Zarurat Bo'lganda)

Agar juda zarur bo'lsa, server'ga kirishingiz mumkin:

```bash
# SSH
ssh root@172.22.0.19

# Project directory
cd /var/www/auth-api

# View logs
docker-compose -f docker-compose.prod.yml logs -f api

# Manual commands
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml restart api
```

**Lekin odatda SSH kerak emas!** GitHub Actions hammasi qiladi! 🎉

---

## ✅ Advantages (Afzalliklar)

✅ **No SSH needed** - Serverga kirmasdan ishlaysiz  
✅ **GitHub'da log'lar** - Barcha log'lar saqlangan  
✅ **History** - Har bir deploy tarixi  
✅ **Automatic** - Push qiling, deploy bo'ladi  
✅ **Safe** - Confirmation'lar bor  
✅ **Fast** - 30 sekund ichida deploy

---

## 🎯 Summary

| Action           | Method                       | Time      |
| ---------------- | ---------------------------- | --------- |
| **Deploy Code**  | Push to `main`               | ~30s auto |
| **Full Reset**   | GitHub Actions (manual)      | ~10min    |
| **Check Errors** | GitHub Actions (manual/auto) | ~1min     |
| **View Logs**    | GitHub Actions UI            | instant   |

**Endi serverga SSH qilishingiz shart emas!** 🚀

GitHub orqali **barchasi** boshqariladi! 🎮
