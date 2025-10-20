# 🚀 Avtomatik Deploy Setup (GitHub Webhook)

## 🎯 Natija:

```
Git push origin main
↓
GitHub webhook yuboradi
↓
Server qabul qiladi
↓
Avtomatik deploy! ✅
```

---

## 📋 Setup (10 Daqiqa)

### 1️⃣ Serverda Setup

```bash
ssh root@172.22.0.19
cd /var/www/auth-api

# GitHub'dan yangi fayllarni oling
git pull origin main

# Webhook secret yarating (random string)
WEBHOOK_SECRET=$(openssl rand -hex 32)
echo "WEBHOOK_SECRET=$WEBHOOK_SECRET"
# Bu secretni copy qiling! ⬆️

# Webhook server executable qilish
chmod +x webhook-server.js

# Systemd service sozlash
nano webhook-listener.service
# WEBHOOK_SECRET ni yuqoridagi qiymat bilan almashtiring

# Service faylni ko'chirish
sudo cp webhook-listener.service /etc/systemd/system/

# Service'ni ishga tushirish
sudo systemctl daemon-reload
sudo systemctl enable webhook-listener
sudo systemctl start webhook-listener

# Status tekshirish
sudo systemctl status webhook-listener
```

### 2️⃣ Nginx Proxy (Port 9000 ni ochish)

```bash
# Nginx config yangilash
sudo nano /etc/nginx/sites-available/default

# Qo'shing:
```

```nginx
location /webhook {
    proxy_pass http://localhost:9000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

```bash
# Nginx restart
sudo nginx -t
sudo systemctl restart nginx
```

### 3️⃣ Firewall (Port 9000 internal, 80/443 external)

```bash
# Faqat nginx orqali ochiq bo'ladi
sudo ufw status
```

---

## 🔐 GitHub'da Webhook Sozlash

### 1. GitHub Repository'ga O'ting:

```
https://github.com/a-d-sh/NestJs-User-Management/settings/hooks
```

### 2. "Add webhook" Tugmasini Bosing

### 3. Webhook Sozlamalari:

| Field                | Value                              |
| -------------------- | ---------------------------------- |
| **Payload URL**      | `https://auth.uzswlu.uz/webhook`   |
| **Content type**     | `application/json`                 |
| **Secret**           | (Serverda yaratgan WEBHOOK_SECRET) |
| **SSL verification** | Enable SSL verification            |
| **Events**           | Just the push event                |
| **Active**           | ✅ Checked                         |

### 4. "Add webhook" Tugmasini Bosing

---

## ✅ Test Qilish

### 1. Webhook Status Tekshirish:

```bash
# Serverda
curl http://localhost:9000/health
# Javob: Webhook listener is running

# Tashqaridan
curl https://auth.uzswlu.uz/webhook
# Javob: Not found (GET uchun normal)
```

### 2. Real Deploy Test:

```bash
# Local'da
echo "# test webhook" >> README.md
git add .
git commit -m "test: webhook deploy"
git push origin main

# 5-10 sekund ichida serverda avtomatik deploy bo'ladi!
```

### 3. Serverda Log Ko'rish:

```bash
# Webhook listener logs
sudo journalctl -u webhook-listener -f

# Deploy logs
sudo journalctl -u webhook-listener | tail -50
```

---

## 🔍 Troubleshooting

### Webhook Ishlamasa:

```bash
# 1. Service status
sudo systemctl status webhook-listener

# 2. Logs
sudo journalctl -u webhook-listener -n 50

# 3. Port ochiqligini tekshirish
sudo netstat -tulpn | grep 9000

# 4. Service restart
sudo systemctl restart webhook-listener
```

### GitHub Webhook Status:

```
GitHub → Settings → Webhooks → Recent Deliveries
```

- ✅ Green checkmark = Success
- ❌ Red X = Failed (check logs)

---

## 🎉 Tayyor!

Endi:

```bash
git push origin main
# 5-10 sekund → Server avtomatik yangilanadi! 🚀
```

**Hech qanday qo'shimcha command kerak emas!**

---

## 📊 Workflow:

```
1. Kod yozing
2. git push origin main
3. ✨ MAGIC! ✨
4. Server avtomatik deploy bo'ldi!
```

Shunchaki! 🎊
