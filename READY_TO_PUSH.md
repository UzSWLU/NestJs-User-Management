# ✅ GITHUB GA PUSH QILISHGA TAYYOR!

## 🎯 Hozirgi Holat

### ✅ Bajarildi:
- ✅ CI/CD pipeline sozlandi (GitHub Actions)
- ✅ Production Docker konfiguratsiyasi
- ✅ Deployment scripts
- ✅ To'liq documentation
- ✅ Repository: `a-d-sh/nestjs-user-management`
- ✅ Domain: `https://auth.uzswlu.uz`

---

## 🔐 GITHUB SECRETS (Qo'shish Kerak!)

### Qayerda sozlash:
**Repository → Settings → Secrets and variables → Actions → New repository secret**

### 5 ta Secret Kerak:

#### 1. `GHCR_TOKEN` ⭐ (Eng muhim!)

**GitHub Personal Access Token yaratish:**

```
1. GitHub profilingiz → Settings
2. Developer settings (pastda)
3. Personal access tokens → Tokens (classic)
4. "Generate new token (classic)"
5. Note: "CI/CD Deploy Token"
6. Select scopes:
   ✅ write:packages
   ✅ read:packages
   ✅ delete:packages
   ✅ repo (barcha subtypes)
7. Generate token
8. TOKEN NI NUSXALANG! (1 marta ko'rinadi)
```

**GitHub Secrets ga qo'shing:**
- Name: `GHCR_TOKEN`
- Value: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

#### 2. `SSH_PRIVATE_KEY`

**Serverda hozirgi SSH key:**

```bash
# Local kompyuterdan serverga kirish
ssh root@your-server-ip

# Qaysi SSH key ishlatilganini bilish uchun
cat ~/.ssh/authorized_keys
```

**Yoki yangi SSH key yaratish:**

```bash
# Local kompyuterda
ssh-keygen -t ed25519 -C "github-ci" -f ~/.ssh/github_ci

# Public key ni serverga qo'shish
ssh-copy-id -i ~/.ssh/github_ci.pub root@your-server-ip

# Private key ni ko'rish
cat ~/.ssh/github_ci
# Butun natijani nusxalang (-----BEGIN ... -----END)
```

**GitHub Secrets ga qo'shing:**
- Name: `SSH_PRIVATE_KEY`
- Value: (butun private key)

---

#### 3. `SERVER_HOST`

Server IP manzili yoki domain.

**GitHub Secrets ga qo'shing:**
- Name: `SERVER_HOST`
- Value: `your-server-ip` (masalan: `185.196.214.123`)

---

#### 4. `SERVER_USER`

SSH username (odatda `root` yoki `ubuntu`)

**GitHub Secrets ga qo'shing:**
- Name: `SERVER_USER`
- Value: `root`

---

#### 5. `APP_URL` (Ixtiyoriy)

**GitHub Secrets ga qo'shing:**
- Name: `APP_URL`
- Value: `https://auth.uzswlu.uz`

---

## 🧪 TEST QILISH

### 1. GitHub Secrets Tekshirish

Repository → Settings → Secrets and variables → Actions

Quyidagilar ko'rinishi kerak:
- ✅ `GHCR_TOKEN`
- ✅ `SSH_PRIVATE_KEY`
- ✅ `SERVER_HOST`
- ✅ `SERVER_USER`
- ✅ `APP_URL`

### 2. Manual Test (Birinchi marta)

```
1. Repository → Actions tab
2. "Deploy to Production" workflow
3. "Run workflow" tugmasini bosing
4. Branch: main
5. "Run workflow" bosing
6. Loglarni kuzating (real-time)
```

### 3. Muvaffaqiyatli Bo'lsa

```bash
# Endi avtomatik ishlaydi!
git add .
git commit -m "feat: any change"
git push origin main

# ✅ Auto-deploy boshlanadi!
# ⏱️ 1-2 minutda tayyor!
```

---

## 📋 PUSH QILISHDAN OLDIN

### Tekshirish:

- [ ] Local da build ishlayaptimi: `npm run build`
- [ ] Docker ishlayaptimi: `docker-compose ps`
- [ ] Barcha o'zgarishlar commit qilinganmi
- [ ] `.env` fayllar `.gitignore` da
- [ ] GitHub Secrets sozlangan

### Yangilanishi Kerak Bo'lgan Fayllar:

```
O'zgargan: 22 fayl
Yangi: 19 fayl
Jami: 41 fayl
```

---

## 🚀 PUSH QILISH

### Commit & Push:

```bash
# Barcha o'zgarishlarni qo'shish
git add .

# Commit
git commit -m "feat: CI/CD configured for auth.uzswlu.uz

- Added GitHub Actions workflow for auto-deploy
- Configured production Docker setup
- Added deployment documentation
- Priority-based user profile selection
- Company management module
- User profiles module
- Complete CI/CD pipeline"

# Push to GitHub
git push origin main
```

### GitHub Actions Avtomatik:

```
1. Code ni checkout qiladi
2. Docker image build qiladi
3. GitHub Container Registry ga push qiladi
4. Serverga SSH orqali ulanadi
5. Yangi image ni pull qiladi
6. Containerlarni restart qiladi
7. Health check qiladi
8. Natija haqida xabar beradi

⏱️ Jami: 1-2 minut!
```

---

## 📊 MONITORING

### Real-time Deploy Kuzatish:

1. GitHub → Repository → **Actions** tab
2. Latest workflow run ni bosing
3. Har bir step ni real-time kuzating:
   - 🏗️ Build Docker Image
   - 🚀 Deploy to Server
   - 🧪 Post-Deployment Tests

### Serverda Monitoring:

```bash
# SSH orqali serverga kirish
ssh root@your-server-ip

# Direktoryga o'tish
cd /var/www/auth-api

# Loglarni ko'rish
docker-compose -f docker-compose.prod.yml logs -f --tail=100 api

# Container statusini ko'rish
docker-compose -f docker-compose.prod.yml ps
```

---

## ⚠️ MUHIM ESLATMALAR

### 1. Birinchi Deploy

Birinchi deploy **qo'lda test qiling**:
- Actions → Run workflow
- Loglarni kuzating
- Xatolar bo'lsa, tuzating

### 2. GHCR_TOKEN

Bu **eng muhim secret**! Bu tokensiz Docker image push qilolmaysiz.

**Scope kerak:**
- ✅ `write:packages`
- ✅ `read:packages`
- ✅ `repo`

### 3. SSH Access

SSH key **butun format** da bo'lishi kerak:

```
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

Quotes yoki extra spaces **QO'SHMANG**!

### 4. Server Directory

Workflow `/var/www/auth-api` ni ishlatadi (sizning serveringiz).

---

## 🎯 KEYINGI QADAMLAR

### 1. GitHub Secrets Sozlash (10 minut)

**SETUP_CI_CD.md** ni o'qing va secretlarni qo'shing.

### 2. Manual Test (5 minut)

Actions tab dan **Run workflow** qiling.

### 3. Auto-Deploy Test (2 minut)

```bash
# Kichik o'zgarish qiling
echo "# Test CI/CD" >> README.md
git add README.md
git commit -m "test: CI/CD"
git push origin main

# Actions tab da kuzating!
```

### 4. Production Deploy

Hammasi ishlasa:

```bash
git add .
git commit -m "feat: production ready with full CI/CD"
git push origin main
```

---

## 🐛 TROUBLESHOOTING

### Problem: "Permission denied (publickey)"

```bash
# SSH key permissions
chmod 600 ~/.ssh/your-key
chmod 700 ~/.ssh

# Test SSH connection
ssh -i ~/.ssh/your-key root@your-server-ip
```

### Problem: "Cannot pull image"

```bash
# Serverda manual login
echo $GHCR_TOKEN | docker login ghcr.io -u a-d-sh --password-stdin

# Manual pull
docker pull ghcr.io/a-d-sh/nestjs-user-management:latest
```

### Problem: "Container won't start"

```bash
# Serverda
cd /var/www/auth-api
docker-compose -f docker-compose.prod.yml logs --tail=100 api
```

---

## ✅ SUCCESS CRITERIA

Deploy muvaffaqiyatli bo'lsa:

- ✅ GitHub Actions - Green checkmark
- ✅ All steps completed successfully
- ✅ Container running on server
- ✅ Health check returns 200
- ✅ Application accessible at https://auth.uzswlu.uz

---

## 📞 QO'SHIMCHA YORDAMLAR

### Dokumentatsiya:
- **SETUP_CI_CD.md** - Sizning serveringiz uchun maxsus
- **DEPLOYMENT_GUIDE.md** - To'liq deployment qo'llanma
- **GITHUB_SECRETS_SETUP.md** - Secrets sozlash
- **PRODUCTION_READY_SUMMARY.md** - Umumiy xulosa

### Test Endpoints:
- Health: `https://auth.uzswlu.uz/health`
- Swagger: `https://auth.uzswlu.uz/api`
- API: `https://auth.uzswlu.uz/api/auth/login`

---

## 🚀 TAYYOR!

### 1. GitHub Secrets Sozlang (SETUP_CI_CD.md)
### 2. Push Qiling (git push origin main)
### 3. Kuzating (GitHub Actions tab)

**1-2 minutda serveringizda yangi kod ishlaydi! ⚡**

---

**Repository:** a-d-sh/nestjs-user-management  
**Domain:** https://auth.uzswlu.uz  
**Server:** /var/www/auth-api  
**Deploy Time:** ~1-2 minut ⚡

**🎉 Har push avtomatik deploy bo'ladi!**

