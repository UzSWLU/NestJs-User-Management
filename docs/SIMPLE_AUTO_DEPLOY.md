# 🚀 Oddiy Avtomatik Deploy (Node.js'siz)

Node.js serverda yo'q, lekin biz oddiy yechimlar bilan avtomatik deploy qilishimiz mumkin!

---

## ✅ Variant 1: Cron Job (Har 5 Daqiqada, Eng Oddiy)

### Setup:

```bash
ssh root@172.22.0.19

# Cron job qo'shish
crontab -e

# Quyidagini qo'shing (har 5 daqiqada check qiladi):
*/5 * * * * cd /var/www/auth-api && git fetch origin main && [ $(git rev-parse HEAD) != $(git rev-parse origin/main) ] && git pull origin main && docker-compose -f docker-compose.prod.yml up -d --build >> /var/log/auto-deploy.log 2>&1

# Saqlang (Ctrl+X, Y, Enter)
```

### Qanday Ishlaydi:

```
Har 5 daqiqada:
  ✅ GitHub'dan check qiladi
  ✅ Agar yangi commit bo'lsa → pull + rebuild
  ✅ Agar yo'q bo'lsa → hech narsa qilmaydi
```

**Afzalliklari:**
- ✅ Juda oddiy
- ✅ Ishonchli
- ✅ Qo'shimcha dastur kerak emas

**Kamchiliklari:**
- ⏱️ 5 daqiqagacha kutish

---

## ✅ Variant 2: Git Hook (Push + SSH, Tezkor)

### Setup:

Local Windows PowerShell'da bir marta:

```powershell
# 1. PowerShell profile ochish
notepad $PROFILE

# 2. Quyidagini qo'shing:
function Deploy-Server {
    param(
        [string]$Message = "update"
    )
    
    Write-Host "🚀 Deploying..." -ForegroundColor Cyan
    
    # Git push
    git add .
    git commit -m $Message
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Pushed to GitHub" -ForegroundColor Green
        
        # Server deploy
        ssh root@172.22.0.19 '/var/www/auth-api/deploy.sh'
        
        Write-Host "✅ Deployed to server!" -ForegroundColor Green
    } else {
        Write-Host "❌ Push failed" -ForegroundColor Red
    }
}

Set-Alias deploy Deploy-Server

# 3. Saqlang va PowerShell'ni qayta oching
```

### Ishlatish:

```powershell
# Oddiy deploy
deploy

# Commit message bilan
deploy "feat: new feature"
```

**Afzalliklari:**
- ✅ Juda tez (10 sekund)
- ✅ To'liq nazorat
- ✅ Oddiy

**Kamchiliklari:**
- 📝 Manual trigger kerak (lekin 1 ta command)

---

## ✅ Variant 3: Watch Script (Doimiy Kuzatish)

### Serverda:

```bash
ssh root@172.22.0.19
cd /var/www/auth-api

# Watch script yaratish
cat > watch-and-deploy.sh << 'EOF'
#!/bin/bash

echo "🔍 Watching for changes..."

while true; do
  # Fetch yangilanishlar
  git fetch origin main > /dev/null 2>&1
  
  # Local va remote'ni solishtirish
  LOCAL=$(git rev-parse HEAD)
  REMOTE=$(git rev-parse origin/main)
  
  if [ "$LOCAL" != "$REMOTE" ]; then
    echo "📥 New changes detected!"
    echo "🚀 Starting deploy..."
    
    git pull origin main
    docker-compose -f docker-compose.prod.yml up -d --build
    
    echo "✅ Deploy completed!"
  fi
  
  # 30 sekund kutish
  sleep 30
done
EOF

chmod +x watch-and-deploy.sh

# Screen session'da ishga tushirish
screen -dmS autodeploy ./watch-and-deploy.sh

# Status ko'rish
screen -ls

# Loglarni ko'rish
screen -r autodeploy
# (Ctrl+A, D - detach qilish)
```

**Afzalliklari:**
- ✅ Tez (30 sekund)
- ✅ Real-time monitoring

**Kamchiliklari:**
- 🔋 Doimiy ishlab turadi

---

## 🎯 Tavsiya: Variant 1 (Cron) + Variant 2 (Alias)

### Eng Yaxshi Kombinatsiya:

1. **Cron Job** o'rnating (fallback, har 5 daqiqada)
2. **PowerShell Alias** ishlating (tez deploy kerak bo'lsa)

```bash
# Serverda cron
*/5 * * * * cd /var/www/auth-api && git fetch origin main && [ $(git rev-parse HEAD) != $(git rev-parse origin/main) ] && /var/www/auth-api/deploy.sh >> /var/log/auto-deploy.log 2>&1
```

```powershell
# Local'da alias
deploy "new feature"
```

---

## 📊 Qaysi Birini Tanlash?

| Variant | Tezlik | Qulaylik | Oddiylik |
|---------|--------|----------|----------|
| **Cron** | 5 min | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Alias** | 10s | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Watch** | 30s | ⭐⭐⭐⭐ | ⭐⭐⭐ |

**Men tavsiya qilaman: Cron + Alias kombo!** ✅

---

## 🚀 Hozir Setup:

```bash
# 1. Serverda Cron
ssh root@172.22.0.19
crontab -e
# Qo'shing: */5 * * * * cd /var/www/auth-api && git fetch origin main && [ $(git rev-parse HEAD) != $(git rev-parse origin/main) ] && /var/www/auth-api/deploy.sh >> /var/log/auto-deploy.log 2>&1

# 2. Local'da PowerShell alias
notepad $PROFILE
# setup-deploy-alias.ps1 dan function'ni copy qiling
```

**Tayyor!** 🎉

