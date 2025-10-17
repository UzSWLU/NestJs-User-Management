# 🚀 Quick Deploy Guide - auth.uzswlu.uz

## Server Ma'lumotlari

```
Server: 172.22.0.19
Domain: auth.uzswlu.uz
Login: root
Password: Rm09HVd_XhXHa
```

---

## 📝 Step-by-Step Deployment

### 1. Serverga Ulaning

```bash
ssh root@172.22.0.19
# Password: Rm09HVd_XhXHa
```

### 2. Server Setup

```bash
# Update system
apt update && apt upgrade -y

# Install Docker (agar yo'q bo'lsa)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose plugin
apt install -y docker-compose-plugin

# Create application directory
mkdir -p /var/www/auth-api
cd /var/www/auth-api

# Clone repository
git clone https://github.com/a-d-sh/NestJs-User-Management.git .

# Create .env.production file
cat > .env.production << 'EOF'
# Application
NODE_ENV=production
PORT=3000
API_PORT=3000

# Database
DB_HOST=mysql
DB_PORT=3306
DB_USERNAME=auth_user
DB_PASSWORD=$(openssl rand -base64 24)
DB_NAME=auth_management
MYSQL_ROOT_PASSWORD=$(openssl rand -base64 32)

# JWT Secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# CORS
CORS_ORIGIN=https://auth.uzswlu.uz,https://uzswlu.uz

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Docker Registry
GITHUB_REPOSITORY=a-d-sh/NestJs-User-Management
IMAGE_TAG=latest
EOF

# Generate actual passwords and secrets
DB_PASS=$(openssl rand -base64 24)
MYSQL_ROOT_PASS=$(openssl rand -base64 32)
JWT_SEC=$(openssl rand -base64 32)
JWT_REF_SEC=$(openssl rand -base64 32)

# Update .env.production with real values
cat > .env.production << EOF
# Application
NODE_ENV=production
PORT=3000
API_PORT=3000

# Database
DB_HOST=mysql
DB_PORT=3306
DB_USERNAME=auth_user
DB_PASSWORD=${DB_PASS}
DB_NAME=auth_management
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASS}

# JWT Secrets
JWT_SECRET=${JWT_SEC}
JWT_REFRESH_SECRET=${JWT_REF_SEC}
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# CORS
CORS_ORIGIN=https://auth.uzswlu.uz,https://uzswlu.uz

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Docker Registry
GITHUB_REPOSITORY=a-d-sh/nestjs-user-management
IMAGE_TAG=latest
EOF

echo "✅ Environment file created!"
```

### 3. Nginx Configuration for auth.uzswlu.uz

```bash
# Update Nginx configuration
cat > nginx/conf.d/api.conf << 'EOF'
upstream api_backend {
    server api:3000;
    keepalive 32;
}

# HTTP -> HTTPS redirect
server {
    listen 80;
    server_name auth.uzswlu.uz;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name auth.uzswlu.uz;

    # SSL Configuration (will be added after certbot)
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Logging
    access_log /var/log/nginx/auth_access.log;
    error_log /var/log/nginx/auth_error.log;

    # Health check endpoint (no rate limit)
    location /health {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        access_log off;
    }

    # API endpoints
    location / {
        # Rate limiting
        limit_req zone=api_limit burst=20 nodelay;

        # Proxy settings
        proxy_pass http://api_backend;
        proxy_http_version 1.1;

        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://api_backend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

echo "✅ Nginx configuration updated for auth.uzswlu.uz"
```

### 4. Setup SSL with Let's Encrypt

```bash
# Install Certbot
apt install -y certbot

# Create SSL directory
mkdir -p nginx/ssl

# Stop nginx if running
docker-compose -f docker-compose.prod.yml stop nginx 2>/dev/null || true

# Generate certificate
certbot certonly --standalone \
  -d auth.uzswlu.uz \
  --non-interactive \
  --agree-tos \
  --email admin@uzswlu.uz \
  --preferred-challenges http

# Copy certificates
cp /etc/letsencrypt/live/auth.uzswlu.uz/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/auth.uzswlu.uz/privkey.pem nginx/ssl/key.pem
chmod 644 nginx/ssl/*.pem

echo "✅ SSL certificates installed!"

# Setup auto-renewal
echo "0 0 1 * * root certbot renew --quiet && cp /etc/letsencrypt/live/auth.uzswlu.uz/fullchain.pem /var/www/auth-api/nginx/ssl/cert.pem && cp /etc/letsencrypt/live/auth.uzswlu.uz/privkey.pem /var/www/auth-api/nginx/ssl/key.pem && docker-compose -f /var/www/auth-api/docker-compose.prod.yml restart nginx" >> /etc/crontab
```

### 5. Build and Deploy

```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d --build

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 6. Setup Firewall

```bash
# Configure UFW
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable

echo "✅ Firewall configured!"
```

---

## 🔍 Verify Deployment

```bash
# Check containers
docker-compose -f docker-compose.prod.yml ps

# Test health endpoint
curl http://localhost:3000/health

# Test API
curl http://localhost:3000/api

# Test domain (after DNS configured)
curl https://auth.uzswlu.uz/health
curl https://auth.uzswlu.uz
```

---

## 📊 Monitoring

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f api

# Check container stats
docker stats

# Database backup
docker-compose -f docker-compose.prod.yml exec mysql mysqldump \
  -u auth_user -p${DB_PASSWORD} auth_management > backup_$(date +%Y%m%d).sql
```

---

## 🔄 Update Deployment

```bash
cd /var/www/auth-api

# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Check logs
docker-compose -f docker-compose.prod.yml logs -f api
```

---

## ⚙️ Environment Variables Reference

Required variables in `.env.production`:

- `DB_PASSWORD` - Database password (generated)
- `MYSQL_ROOT_PASSWORD` - MySQL root password (generated)
- `JWT_SECRET` - JWT signing key (generated)
- `JWT_REFRESH_SECRET` - Refresh token key (generated)
- `CORS_ORIGIN` - `https://auth.uzswlu.uz,https://uzswlu.uz`

---

## 🆘 Troubleshooting

### Container not starting

```bash
docker-compose -f docker-compose.prod.yml logs api
docker-compose -f docker-compose.prod.yml restart api
```

### Database connection issues

```bash
docker-compose -f docker-compose.prod.yml logs mysql
docker-compose -f docker-compose.prod.yml exec mysql mysql -u root -p
```

### Nginx issues

```bash
docker-compose -f docker-compose.prod.yml logs nginx
docker-compose -f docker-compose.prod.yml exec nginx nginx -t
```

### SSL certificate issues

```bash
certbot certificates
certbot renew --dry-run
```

---

## 📝 DNS Configuration

Configure DNS for `auth.uzswlu.uz`:

```
Type: A
Name: auth
Value: 172.22.0.19
TTL: 3600
```

Wait 5-10 minutes for DNS propagation.

---

## ✅ Post-Deployment Checklist

- [ ] Containers running: `docker-compose ps`
- [ ] Health check: `curl http://localhost:3000/health`
- [ ] API accessible: `curl http://localhost:3000/api`
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] DNS configured
- [ ] HTTPS working: `https://auth.uzswlu.uz`
- [ ] Swagger accessible: `https://auth.uzswlu.uz`

---

## 🎉 Success!

Your API is now running at:

- **API URL**: https://auth.uzswlu.uz
- **Health**: https://auth.uzswlu.uz/health
- **Swagger**: https://auth.uzswlu.uz

**Test endpoints:**

```bash
# Health check
curl https://auth.uzswlu.uz/health

# API status
curl https://auth.uzswlu.uz

# Get OAuth providers
curl https://auth.uzswlu.uz/api/oauth-providers/active
```
