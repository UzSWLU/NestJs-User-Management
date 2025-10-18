# ⚡ TEZKOR SOZLASH - Sizning Serveringiz Uchun

## ✅ Sizda Mavjud GitHub Secrets:

- ✅ `PROD_HOST` - Server IP
- ✅ `PROD_USER` - SSH username  
- ✅ `PROD_SSH_KEY` - SSH private key
- ⚠️ `PROD_PORT` - Kerak emas (ishlatilmaydi)

## 🔐 QO'SHISH KERAK: Faqat 1 ta Secret!

### `GHCR_TOKEN` (GitHub Container Registry Token)

Bu tokenni GitHub Personal Access Token sifatida yaratish kerak.

---

## 📋 QADAMMA-QADAM:

### 1️⃣ GitHub Personal Access Token Yaratish

1. **GitHub profilingiz → Settings**
   - https://github.com/settings/profile
   
2. **Developer settings** (pastki qismda)
   - https://github.com/settings/apps

3. **Personal access tokens → Tokens (classic)**
   - https://github.com/settings/tokens

4. **"Generate new token (classic)"** tugmasini bosing

5. **Token sozlash:**
   - **Note:** `CI/CD Deployment Token for auth.uzswlu.uz`
   - **Expiration:** `90 days` (yoki `No expiration`)
   
6. **Select scopes** (ruxsatlar):
   - ✅ `repo` (barcha sub-scopes avtomatik belgilanadi)
   - ✅ `write:packages`
   - ✅ `read:packages`
   - ✅ `delete:packages`

7. **"Generate token"** tugmasini bosing

8. **TOKEN NI NUSXALANG!** 
   - `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` ko'rinishida
   - ⚠️ **MUHIM:** Token faqat 1 marta ko'rinadi!

---

### 2️⃣ GitHub Secrets ga Qo'shish

1. **Repository → Settings**
   - https://github.com/a-d-sh/nestjs-user-management/settings

2. **Secrets and variables → Actions**
   - https://github.com/a-d-sh/nestjs-user-management/settings/secrets/actions

3. **"New repository secret"** tugmasini bosing

4. **Secret qo'shish:**
   - **Name:** `GHCR_TOKEN`
   - **Secret:** (token ni paste qiling, `ghp_xxx...`)
   - **"Add secret"** tugmasini bosing

---

## ✅ TAYYOR!

### Barcha Kerakli Secrets:

| Secret Name | Status | Tavsif |
|-------------|--------|--------|
| `PROD_SSH_KEY` | ✅ Mavjud | SSH private key |
| `PROD_HOST` | ✅ Mavjud | Server IP |
| `PROD_USER` | ✅ Mavjud | SSH username |
| `GHCR_TOKEN` | ⚠️ QO'SHING! | GitHub Container Registry token |

---

## 🧪 TEST QILISH

### Birinchi Deploy (Manual)

1. **Repository → Actions**
   - https://github.com/a-d-sh/nestjs-user-management/actions

2. **"Deploy to Production"** workflow ni tanlang

3. **"Run workflow"** tugmasini bosing
   - Branch: `main`
   - Environment: `production`

4. **Loglarni kuzating:**
   - 🏗️ Build Docker Image (~30-60s)
   - 🚀 Deploy to Server (~30-60s)
   - 🧪 Post-Deployment Tests (~10s)

### Agar Muvaffaqiyatli Bo'lsa:

```
✅ Build Docker Image - Completed
✅ Deploy to Server - Completed  
✅ Post-Deployment Tests - Completed

Total time: ~1-2 minutes
```

---

## 🚀 AUTO-DEPLOY

Birinchi test muvaffaqiyatli bo'lgandan keyin, **har push avtomatik deploy qiladi:**

```bash
# Kod o'zgartiring
git add .
git commit -m "feat: any update"
git push origin main

# ✅ GitHub Actions avtomatik:
# 1. Docker image build qiladi
# 2. GHCR ga push qiladi
# 3. Serverga deploy qiladi
# 4. Health check qiladi

# ⏱️ Jami: 1-2 minut!
```

---

## 📊 MONITORING

### GitHub Actions Logs

1. **Repository → Actions**
2. Latest workflow run ni bosing
3. Real-time loglarni kuzating

### Serverda Logs

```bash
# SSH ga kirish
ssh root@your-server-ip

# Direktoryga o'tish
cd /var/www/auth-api

# Loglarni ko'rish
docker-compose -f docker-compose.prod.yml logs -f --tail=100 api

# Container status
docker-compose -f docker-compose.prod.yml ps
```

---

## ⚠️ ESLATMA

### PROD_PORT Secret

`PROD_PORT` secret ishlatilmaydi. Docker Compose o'z konfiguratsiyasidan foydalanadi:
- API port: 3000 (internal)
- Nginx: 80, 443 (external)

### Workflow Secrets

Workflow avtomatik ravishda sizning mavjud secretlaringizdan foydalanadi:
- `PROD_SSH_KEY` → `SSH_PRIVATE_KEY` sifatida
- `PROD_HOST` → `SERVER_HOST` sifatida
- `PROD_USER` → `SERVER_USER` sifatida

---

## 🎯 KEYINGI QADAM

### Faqat 1 ta secret qo'shing:

**`GHCR_TOKEN`** - GitHub Personal Access Token

### Keyin:

```bash
git push origin main
```

**Va deploy avtomatik boshlanadi! 🚀**

---

## 📞 TROUBLESHOOTING

### Problem: "Access to packages denied"

Token scopes to'g'ri ekanligini tekshiring:
- ✅ `write:packages`
- ✅ `read:packages`
- ✅ `repo`

### Problem: "SSH connection failed"

`PROD_SSH_KEY` to'g'ri formatda ekanligini tekshiring:

```
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

### Problem: "Cannot find docker-compose.prod.yml"

Workflow avtomatik `/var/www/auth-api` ga o'tadi.

---

## ✅ SUCCESS!

Deploy muvaffaqiyatli bo'lganda:

```
✅ Docker image built and pushed
✅ Deployment completed on server
✅ Containers running
✅ Health check passed

🎉 Your app is live at: https://auth.uzswlu.uz
```

---

**Repository:** a-d-sh/nestjs-user-management  
**Domain:** https://auth.uzswlu.uz  
**Server:** /var/www/auth-api  
**Deploy:** 1-2 minut ⚡

**Faqat `GHCR_TOKEN` qo'shing va push qiling! 🚀**

