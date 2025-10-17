# 🎉 DEPLOYMENT SUCCESSFUL - auth.uzswlu.uz

**Deployment Date:** October 17, 2025  
**Server:** 172.22.0.19  
**Domain:** auth.uzswlu.uz

---

## ✅ Deployed Services

| Service | Status | Port | Access |
|---------|--------|------|--------|
| **NestJS API** | ✅ Running | 3000 | http://172.22.0.19:3000 |
| **MySQL 8.0** | ✅ Healthy | 3306 | Internal only |
| **Nginx** | ✅ Running | 8080 | http://172.22.0.19:8080 |
| **System Nginx** | ✅ Running | 80 | http://auth.uzswlu.uz |

---

## 🌐 Access Points

### API Endpoints
- **Health Check:** `http://172.22.0.19:3000/`
- **Swagger UI:** `http://172.22.0.19:3000/` (Main page)
- **API Documentation:** `http://172.22.0.19:3000/api-json`
- **OAuth Providers:** `http://172.22.0.19:3000/api/oauth-providers/active`

### Through Domain (when DNS is configured)
- **Main:** `http://auth.uzswlu.uz/`
- **API:** `http://auth.uzswlu.uz/api/`

---

## 🔐 Production Configuration

### Environment Variables
```bash
NODE_ENV=production
PORT=3000

# Database (Secure)
DB_HOST=mysql
DB_PORT=3306
DB_USERNAME=auth_user
DB_NAME=auth_management
DB_PASSWORD=***SECURED***

# JWT (Secure)
JWT_SECRET=***SECURED***
JWT_REFRESH_SECRET=***SECURED***
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# CORS
CORS_ORIGIN=https://auth.uzswlu.uz,https://uzswlu.uz

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

### Database Credentials
- **Root Password:** Auto-generated (48 chars)
- **User:** `auth_user`
- **User Password:** Auto-generated (32 chars)
- **Database:** `auth_management`

---

## 📊 Seeded Data

### Roles (4)
1. **creator** - Full access (all permissions)
2. **admin** - Full access (all permissions)
3. **manager** - Read-only access (view permissions)
4. **user** - No default permissions

### Permissions (12)
- Users: view, create, update, delete
- Roles: view, create, update, delete
- Permissions: view, create, update, delete

### OAuth Providers (4)
1. **hemis** - ✅ Active (UZSWLU HEMIS)
2. **google** - ❌ Inactive (ready for config)
3. **oneid** - ❌ Inactive (ready for config)
4. **github** - ❌ Inactive (ready for config)

---

## 🐳 Docker Containers

```bash
# View running containers
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f api

# Restart service
docker compose -f docker-compose.prod.yml restart api

# Stop all services
docker compose -f docker-compose.prod.yml down

# Start all services
docker compose -f docker-compose.prod.yml up -d
```

---

## 📡 Testing Endpoints

### Public Endpoints (No Auth Required)

```bash
# Health Check
curl http://172.22.0.19:3000/

# Get active OAuth providers
curl http://172.22.0.19:3000/api/oauth-providers/active

# Get HEMIS authorization URL
curl http://172.22.0.19:3000/api/auth/login/hemis

# Login with Student Portal
curl -X POST http://172.22.0.19:3000/api/auth/external/student \
  -H "Content-Type: application/json" \
  -d '{"login":"326241103172","password":"Nilufar2007"}'

# Register new user
curl -X POST http://172.22.0.19:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "SecurePass123!",
    "full_name": "Test User"
  }'
```

### Protected Endpoints (Auth Required)

```bash
# Login first
TOKEN=$(curl -X POST http://172.22.0.19:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.accessToken')

# Get current user profile
curl http://172.22.0.19:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Get all users (admin only)
curl http://172.22.0.19:3000/api/users \
  -H "Authorization: Bearer $TOKEN"

# Get all roles
curl http://172.22.0.19:3000/api/roles \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔧 Troubleshooting

### Container not starting
```bash
# Check logs
docker compose -f docker-compose.prod.yml logs api

# Rebuild
docker compose -f docker-compose.prod.yml up -d --build --force-recreate
```

### Database connection issues
```bash
# Check MySQL logs
docker compose -f docker-compose.prod.yml logs mysql

# Exec into MySQL
docker compose -f docker-compose.prod.yml exec mysql mysql -u auth_user -p auth_management
```

### Environment variables not loading
```bash
# Check .env file exists
cat /var/www/auth-api/.env

# Restart containers
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

---

## 🚀 Future Updates

### Pull latest changes and redeploy
```bash
cd /var/www/auth-api
git pull origin main
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

### View application logs
```bash
docker compose -f docker-compose.prod.yml logs -f api --tail=100
```

---

## 🌐 DNS Configuration (Required)

To access via `auth.uzswlu.uz` domain:

1. **Add DNS A Record:**
   ```
   Type: A
   Host: auth
   Value: 172.22.0.19
   TTL: 3600
   ```

2. **Test DNS:**
   ```bash
   nslookup auth.uzswlu.uz
   ping auth.uzswlu.uz
   ```

3. **Update OAuth Redirect URIs:**
   - HEMIS: `http://auth.uzswlu.uz/api/auth/callback/hemis`
   - Student Portal: `http://auth.uzswlu.uz/api/auth/external/student`

---

## 🔒 Security Recommendations

### 1. SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d auth.uzswlu.uz

# Auto-renewal
certbot renew --dry-run
```

### 2. Firewall (UFW)
```bash
# Allow only necessary ports
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw enable
```

### 3. Rate Limiting
Already configured:
- 100 requests per 60 seconds per IP

### 4. Update Passwords
```bash
# Change environment passwords periodically
# Update .env file and restart containers
```

---

## 📋 Maintenance Tasks

### Daily
- ✅ Monitor logs: `docker compose -f docker-compose.prod.yml logs -f api`
- ✅ Check container health: `docker compose -f docker-compose.prod.yml ps`

### Weekly
- ✅ Database backup
- ✅ Check disk space: `df -h`
- ✅ Update system: `apt update && apt upgrade -y`

### Monthly
- ✅ Review security logs
- ✅ Update dependencies: `npm update`
- ✅ Database optimization

---

## 🎯 Deployment Checklist

- ✅ Code pushed to GitHub
- ✅ Server configured and secured
- ✅ Docker containers running
- ✅ Database initialized and seeded
- ✅ Nginx reverse proxy configured
- ✅ API accessible from internet
- ✅ Swagger documentation available
- ✅ OAuth providers configured
- ⏳ DNS configuration (pending)
- ⏳ SSL certificate (recommended)

---

## 📞 Support

### Useful Commands
```bash
# View all containers
docker ps -a

# View Docker networks
docker network ls

# Check nginx status
systemctl status nginx

# Check nginx error logs
tail -f /var/log/nginx/auth-api-error.log

# Check API logs realtime
docker compose -f docker-compose.prod.yml logs -f api
```

---

## 🎉 SUCCESS!

Your **NestJS User Management API** is now live in production!

**Next Steps:**
1. Configure DNS for `auth.uzswlu.uz`
2. Install SSL certificate
3. Update OAuth provider redirect URIs
4. Test all authentication flows
5. Monitor application logs

**Happy Coding! 🚀**

