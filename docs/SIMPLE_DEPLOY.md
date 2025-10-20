# 🚀 Oddiy Deploy Yo'li (GitHub Actions'siz)

## ⚠️ Muammo: GitHub Actions → Server Timeout

GitHub Actions serverga ulanolmayapti (`i/o timeout`).

**Sabab:** Firewall yoki network restrictions.

---

## ✅ YECHIM: Server-Side Auto Deploy

Serverda script ishlatamiz - GitHub Actions kerak emas!

---

## 📋 Setup (5 Daqiqa)

### 1. Serverda Script Yaratish

```bash
ssh root@172.22.0.19
cd /var/www/auth-api

# Deploy script yaratish
cat > deploy.sh << 'EOF'
#!/bin/bash
set -e
cd /var/www/auth-api
git pull origin main
docker-compose -f docker-compose.prod.yml up -d --build
echo "✅ Deploy completed!"
docker-compose -f docker-compose.prod.yml ps
EOF

# Executable qilish
chmod +x deploy.sh
```

---

## 🚀 Qanday Ishlatish

### Variant 1: Local'dan Push + SSH Deploy (Tavsiya)

```bash
# 1. Local'da push qiling
git add .
git commit -m "new feature"
git push origin main

# 2. Serverda deploy qiling
ssh root@172.22.0.19 '/var/www/auth-api/deploy.sh'
```

**Yoki bitta commandda:**

```bash
git push origin main && ssh root@172.22.0.19 '/var/www/auth-api/deploy.sh'
```

---

### Variant 2: Serverda Manual Deploy

```bash
# Serverga ulanasiz
ssh root@172.22.0.19

# Deploy qilasiz
cd /var/www/auth-api
./deploy.sh
```

---

### Variant 3: Cron Job (Avtomatik, har 5 daqiqada)

```bash
ssh root@172.22.0.19

# Cron job qo'shish
crontab -e

# Quyidagi qatorni qo'shing (har 5 daqiqada check qiladi):
*/5 * * * * cd /var/www/auth-api && git pull origin main && docker-compose -f docker-compose.prod.yml up -d --build >> /var/log/auto-deploy.log 2>&1
```

---

## 🎯 PowerShell Alias (Windows)

Local Windows'da oddiy qilish uchun:

```powershell
# PowerShell profile'ga qo'shing
notepad $PROFILE

# Quyidagini qo'shing:
function Deploy-Server {
    git push origin main
    ssh root@172.22.0.19 '/var/www/auth-api/deploy.sh'
}

Set-Alias deploy Deploy-Server

# Keyin faqat:
deploy
```

---

## ✅ Natija

**GitHub Actions'siz, oddiy va ishonchli!**

```
git push origin main
ssh root@172.22.0.19 '/var/www/auth-api/deploy.sh'

# Yoki
deploy  (agar alias sozlagan bo'lsangiz)
```

---

## 🔄 Workflow

```
1. Kod yozing
2. git push origin main
3. ssh ... deploy.sh
4. ✅ Server yangilandi!
```

Oddiy, tez, ishonchli! 🎉

