# 🚀 Deployment Guide

## Table of Contents

- [Prerequisites](#prerequisites)
- [GitHub Actions Setup](#github-actions-setup)
- [Server Setup](#server-setup)
- [Manual Deployment](#manual-deployment)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Local Development

- Node.js 20+
- Docker & Docker Compose
- Git

### Production Server

- Ubuntu 20.04+ / Debian 11+
- Docker Engine 24+
- Docker Compose V2
- At least 2GB RAM
- 20GB+ disk space

---

## GitHub Actions Setup

### 1. Enable GitHub Container Registry

1. Go to your GitHub repository
2. Settings → Packages → Container registry
3. Enable "Improve container support"

### 2. Configure GitHub Secrets

Go to **Settings → Secrets and variables → Actions** and add:

#### **Staging Environment**

```
STAGING_HOST=staging.example.com
STAGING_USER=deploy
STAGING_SSH_KEY=<your-private-ssh-key>
STAGING_PORT=22
```

#### **Production Environment**

```
PROD_HOST=api.example.com
PROD_USER=deploy
PROD_SSH_KEY=<your-private-ssh-key>
PROD_PORT=22
```

#### **Shared Secrets**

```
GITHUB_TOKEN (automatically provided by GitHub)
```

### 3. SSH Key Setup

Generate SSH key for deployment:

```bash
ssh-keygen -t ed25519 -C "deploy@management-api" -f ~/.ssh/deploy_key
```

Add public key to server:

```bash
ssh-copy-id -i ~/.ssh/deploy_key.pub deploy@your-server.com
```

Add private key to GitHub Secrets as `STAGING_SSH_KEY` or `PROD_SSH_KEY`.

---

## Server Setup

### 1. Initial Server Configuration

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose V2
sudo apt install docker-compose-plugin

# Create deploy user
sudo adduser deploy
sudo usermod -aG docker deploy

# Create application directory
sudo mkdir -p /opt/management-api
sudo chown deploy:deploy /opt/management-api
```

### 2. Clone Repository (First Time)

```bash
# Switch to deploy user
su - deploy

# Clone repository
cd /opt/management-api
git clone https://github.com/yourorg/management.git .

# Copy environment file
cp .env.production.example .env.production
nano .env.production  # Edit with your values
```

### 3. Configure Environment

Edit `/opt/management-api/.env.production`:

```bash
# Application
NODE_ENV=production
PORT=3000
API_PORT=3000

# Database
DB_USERNAME=management_user
DB_PASSWORD=CHANGE_ME_STRONG_PASSWORD
DB_NAME=management_db
MYSQL_ROOT_PASSWORD=CHANGE_ME_ROOT_PASSWORD

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET=YOUR_GENERATED_SECRET_HERE
JWT_REFRESH_SECRET=YOUR_GENERATED_REFRESH_SECRET_HERE

# CORS
CORS_ORIGIN=https://yourdomain.com

# Docker Registry
GITHUB_REPOSITORY=yourorg/management
IMAGE_TAG=latest
```

### 4. SSL Certificate (Production)

#### Using Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d api.example.com

# Copy certificates
sudo cp /etc/letsencrypt/live/api.example.com/fullchain.pem /opt/management-api/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/api.example.com/privkey.pem /opt/management-api/nginx/ssl/key.pem
sudo chown deploy:deploy /opt/management-api/nginx/ssl/*

# Auto-renewal
sudo certbot renew --dry-run
```

#### Using Self-Signed Certificate (Testing)

```bash
cd /opt/management-api/nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout key.pem -out cert.pem \
  -subj "/C=UZ/ST=Tashkent/L=Tashkent/O=Company/CN=api.example.com"
```

### 5. Configure Nginx

Edit `nginx/conf.d/api.conf` and uncomment SSL sections:

```nginx
# Uncomment SSL configuration lines
listen 443 ssl http2;
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;
```

---

## Manual Deployment

### Using Deploy Script

```bash
# Staging
sudo ./deploy.sh staging v1.0.0

# Production
sudo ./deploy.sh production v1.0.0
```

### Manual Docker Deployment

```bash
# Pull latest images
export IMAGE_TAG=latest
docker-compose -f docker-compose.prod.yml pull

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f api

# Check status
docker-compose -f docker-compose.prod.yml ps
```

### Database Migration

```bash
# Run migrations
docker-compose -f docker-compose.prod.yml exec api npm run migration:run

# Revert migration
docker-compose -f docker-compose.prod.yml exec api npm run migration:revert
```

---

## GitHub Actions Workflows

### Automatic Deployments

#### CI Pipeline (`ci.yml`)

Triggers on: Push to `main` or `develop`, Pull Requests

Runs:

- ✅ Linting (ESLint)
- ✅ Tests (Unit & E2E)
- ✅ Build verification
- ✅ Docker image build
- ✅ Security scanning

#### CD Pipeline (`deploy.yml`)

Triggers on:

- Push to `main` → Production
- Push to `develop` → Staging
- Tag `v*` → Production
- Manual dispatch

Deploys:

- 🚀 Build & push Docker image to GHCR
- 🚀 Deploy to staging/production
- 🔄 Automatic rollback on failure

### Manual Deployment via GitHub

1. Go to **Actions** tab
2. Select **CD - Continuous Deployment**
3. Click **Run workflow**
4. Choose environment (staging/production)
5. Click **Run workflow**

---

## Environment Variables

### Required Variables

| Variable             | Description          | Example                  |
| -------------------- | -------------------- | ------------------------ |
| `NODE_ENV`           | Environment          | `production`             |
| `DB_PASSWORD`        | Database password    | `SecurePass123!`         |
| `JWT_SECRET`         | JWT secret key       | `32+ char random`        |
| `JWT_REFRESH_SECRET` | Refresh token secret | `32+ char random`        |
| `CORS_ORIGIN`        | Allowed origins      | `https://yourdomain.com` |

### Generate Secure Secrets

```bash
# JWT Secret
openssl rand -base64 32

# Database Password
openssl rand -base64 24

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Monitoring

### Check Application Status

```bash
# Container status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f api

# Health check
curl http://localhost:3000/health

# API test
curl http://localhost:3000/api
```

### Database Backup

```bash
# Manual backup
docker-compose -f docker-compose.prod.yml exec mysql mysqldump \
  -u root -p${MYSQL_ROOT_PASSWORD} ${DB_NAME} > backup_$(date +%Y%m%d).sql

# Restore backup
docker-compose -f docker-compose.prod.yml exec -T mysql mysql \
  -u root -p${MYSQL_ROOT_PASSWORD} ${DB_NAME} < backup.sql
```

### Log Management

```bash
# View real-time logs
docker-compose -f docker-compose.prod.yml logs -f --tail=100 api

# View error logs only
docker-compose -f docker-compose.prod.yml logs api | grep ERROR

# Check Nginx logs
docker-compose -f docker-compose.prod.yml logs nginx
```

---

## Troubleshooting

### Application won't start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs api

# Check environment variables
docker-compose -f docker-compose.prod.yml exec api env

# Restart services
docker-compose -f docker-compose.prod.yml restart api
```

### Database connection issues

```bash
# Check MySQL status
docker-compose -f docker-compose.prod.yml exec mysql mysqladmin ping

# Check MySQL logs
docker-compose -f docker-compose.prod.yml logs mysql

# Test connection
docker-compose -f docker-compose.prod.yml exec api npm run migration:show
```

### High memory usage

```bash
# Check container stats
docker stats

# Restart containers
docker-compose -f docker-compose.prod.yml restart

# Clean up unused resources
docker system prune -af
```

### SSL Certificate Issues

```bash
# Test SSL
openssl s_client -connect api.example.com:443

# Check certificate expiry
echo | openssl s_client -servername api.example.com \
  -connect api.example.com:443 2>/dev/null | openssl x509 -noout -dates

# Renew Let's Encrypt
sudo certbot renew
```

---

## Rollback Procedure

### Automatic Rollback

GitHub Actions automatically rolls back on deployment failure.

### Manual Rollback

```bash
# List available images
docker images | grep management

# Set previous version
export IMAGE_TAG=previous-version-tag
docker-compose -f docker-compose.prod.yml up -d

# Or restore from backup
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

---

## Performance Optimization

### Enable Redis Caching (Optional)

Add to `docker-compose.prod.yml`:

```yaml
services:
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis-data:/data
```

### Database Optimization

```sql
-- Add indexes (if needed)
CREATE INDEX idx_user_email ON user(email);
CREATE INDEX idx_user_username ON user(username);
```

---

## Security Checklist

- ✅ Strong database passwords
- ✅ JWT secrets (32+ characters)
- ✅ SSL/TLS enabled
- ✅ CORS properly configured
- ✅ Rate limiting enabled
- ✅ Security headers (Nginx)
- ✅ Regular backups
- ✅ Firewall configured
- ✅ SSH key authentication
- ✅ Non-root Docker user

---

## Support

For issues or questions:

- GitHub Issues: https://github.com/yourorg/management/issues
- Documentation: [README.md](README.md)
- Email: support@example.com
