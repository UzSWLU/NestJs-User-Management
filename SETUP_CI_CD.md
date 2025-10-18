# 🚀 CI/CD Setup - auth.uzswlu.uz

## ✅ Sizning Konfiguratsiyangiz

### Server Ma'lumotlari:
- **Repository:** `a-d-sh/nestjs-user-management`
- **Domain:** `https://auth.uzswlu.uz`
- **Server Directory:** `/var/www/auth-api`
- **Database:** MySQL 8.0 (auth_management)

---

## 🔐 1-QADAM: GitHub Secrets Sozlash

### Repository Settings → Secrets and variables → Actions

Quyidagi secretlarni qo'shing:

#### 1. `GHCR_TOKEN` (GitHub Container Registry Token)

**Personal Access Token yaratish:**

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token (classic)" tugmasini bosing
3. **Note:** `CI/CD Deployment Token`
4. **Expiration:** 90 days (yoki No expiration)
5. **Scopes:** Quyidagilarni belgilang:
   - ✅ `write:packages`
   - ✅ `read:packages`
   - ✅ `delete:packages`
   - ✅ `repo` (barcha qismlari)
6. "Generate token" tugmasini bosing
7. **Token ni nusxalang** (faqat 1 marta ko'rinadi!)

**GitHub Secrets ga qo'shing:**
- Name: `GHCR_TOKEN`
- Value: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (token)

---

#### 2. `SSH_PRIVATE_KEY`

**Serverda SSH key bor yoki yo'qligini tekshiring:**

```bash
# Server ga kirish
ssh root@your-server-ip

# SSH keylarni ko'rish
ls -la ~/.ssh/

# Agar authorized_keys bo'lsa, qaysi key ishlatilganini ko'ring
cat ~/.ssh/authorized_keys
```

**Agar yangi key kerak bo'lsa:**

```bash
# Local kompyuterda
ssh-keygen -t ed25519 -C "github-ci-cd" -f ~/.ssh/github_deploy

# Public keyni serverga qo'shish
ssh-copy-id -i ~/.ssh/github_deploy.pub root@your-server-ip

# Private keyni ko'rish
cat ~/.ssh/github_deploy
```

**GitHub Secrets ga qo'shing:**
- Name: `SSH_PRIVATE_KEY`
- Value: (butun private key, `-----BEGIN` dan `-----END` gacha)

---

#### 3. `SERVER_HOST`

**GitHub Secrets ga qo'shing:**
- Name: `SERVER_HOST`
- Value: `your-server-ip` (masalan: `185.196.214.123`)

---

#### 4. `SERVER_USER`

**GitHub Secrets ga qo'shing:**
- Name: `SERVER_USER`
- Value: `root` (yoki `ubuntu`, serverda qaysi user ishlatayotganingiz)

---

#### 5. `APP_URL` (Ixtiyoriy)

**GitHub Secrets ga qo'shing:**
- Name: `APP_URL`
- Value: `https://auth.uzswlu.uz`

---

## ✅ 2-QADAM: GitHub Container Registry Sozlash

### Repository Settings → Packages

1. **Packages** bo'limiga o'ting
2. **Package visibility** ni `Public` yoki `Private` qiling
3. Repository ga **write:packages** ruxsati berilganini tekshiring

---

## 🧪 3-QADAM: Test Qilish (Manual)

Birinchi marta **qo'lda test** qiling:

### 3.1 GitHub Actions Tab

1. Repository → **Actions** tab
2. **Deploy to Production** workflow ni toping
3. **Run workflow** tugmasini bosing
4. **Branch:** `main` (yoki `master`)
5. **Environment:** `production`
6. **Run workflow** ni bosing

### 3.2 Loglarni Kuzatish

- Real-time loglarni ko'ring
- Har bir qadamni kuzating:
  - 🏗️ Build Docker Image
  - 🚀 Deploy to Server
  - 🧪 Post-Deployment Tests

### 3.3 Serverda Tekshirish

```bash
# Server ga kirish
ssh root@your-server-ip

# Direktoryga o'tish
cd /var/www/auth-api

# Container statusini ko'rish
docker-compose -f docker-compose.prod.yml ps

# Loglarni ko'rish
docker-compose -f docker-compose.prod.yml logs -f --tail=50 api

# Health check
curl http://localhost:3000/health
```

---

## 🚀 4-QADAM: Auto-Deploy Yoqish

Test muvaffaqiyatli bo'lsa, endi **har push auto-deploy** qiladi:

```bash
# Biror o'zgarish qiling
git add .
git commit -m "test: CI/CD deployment"
git push origin main

# ✅ GitHub Actions avtomatik:
# 1. Docker image build qiladi
# 2. GitHub Container Registry ga push qiladi
# 3. Serverga deploy qiladi
# 4. Health check qiladi
# 5. Natija haqida xabar beradi

# ⏱️ Jami vaqt: ~1-2 minut!
```

---

## 📋 SECRETS CHECKLISTI

Quyidagilarni GitHub Secrets ga qo'shganingizni tekshiring:

- [ ] `GHCR_TOKEN` - GitHub Container Registry token
- [ ] `SSH_PRIVATE_KEY` - SSH private key (butun key!)
- [ ] `SERVER_HOST` - Server IP manzili
- [ ] `SERVER_USER` - SSH username (root yoki ubuntu)
- [ ] `APP_URL` - Application URL (https://auth.uzswlu.uz)

---

## 🔍 Tekshirish

### GitHub Secrets Tekshirish

1. Repository → Settings → Secrets and variables → Actions
2. Quyidagi secretlar ko'rinishi kerak:
   - `GHCR_TOKEN` ✅
   - `SSH_PRIVATE_KEY` ✅
   - `SERVER_HOST` ✅
   - `SERVER_USER` ✅
   - `APP_URL` ✅

### SSH Connection Test

```bash
# Local kompyuterda
ssh -i ~/.ssh/github_deploy root@your-server-ip

# Muvaffaqiyatli bo'lsa, server command line ko'rinadi
```

---

## ⚠️ MUHIM ESLATMALAR

### 1. First Deploy

Birinchi deploy **qo'lda test qiling** (GitHub Actions → Run workflow)

### 2. Server Directory

Workflow `/var/www/auth-api` ni ishlatadi. Agar boshqa joyda bo'lsa, `.github/workflows/deploy.yml` ni o'zgartiring.

### 3. Docker Compose Version

Serverda `docker compose` (v2) yoki `docker-compose` (v1) ekanligini tekshiring:

```bash
# Serverda
docker compose version  # v2
# yoki
docker-compose version  # v1
```

Agar v1 bo'lsa, workflow da `docker compose` ni `docker-compose` ga o'zgartiring.

### 4. Environment File

Serverda `.env.production` file mavjud va to'g'ri ma'lumotlar bor.

---

## 🐛 TROUBLESHOOTING

### Issue: Permission Denied (publickey)

```bash
# SSH key permissions tekshirish
chmod 600 ~/.ssh/github_deploy
chmod 700 ~/.ssh

# Server da authorized_keys tekshirish
cat ~/.ssh/authorized_keys
```

### Issue: Image Pull Failed

```bash
# Serverda GitHub CR ga login
echo $GHCR_TOKEN | docker login ghcr.io -u yourusername --password-stdin

# Image ni qo'lda pull qilish
docker pull ghcr.io/a-d-sh/nestjs-user-management:latest
```

### Issue: Container Won't Start

```bash
# Serverda logs ko'rish
docker-compose -f docker-compose.prod.yml logs --tail=100 api

# Environment variables tekshirish
docker-compose -f docker-compose.prod.yml config

# Manual restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

---

## ✅ TEST NATIJASI

Agar hammasi to'g'ri sozlangan bo'lsa:

1. **GitHub Actions** - ✅ Green checkmark
2. **Server containers** - ✅ Running
3. **Health check** - ✅ Returns `{"status":"ok"}`
4. **Swagger** - ✅ Accessible at https://auth.uzswlu.uz/api

---

## 🎯 NEXT: PRODUCTION GA O'TISH

```bash
# Hozirgi kodingizni push qiling
git add .
git commit -m "feat: CI/CD configured for auth.uzswlu.uz"
git push origin main

# 🎉 Auto-deploy boshlanadi!
# 📊 GitHub Actions tab da kuzating
# ⏱️ 1-2 minutda deploy bo'ladi
```

---

**🚀 TAYYOR! Endi har push avtomatik deploy qiladi!**

**Domain:** https://auth.uzswlu.uz  
**Swagger:** https://auth.uzswlu.uz/api  
**Deploy Time:** ~1-2 minut ⚡

