# 🚀 Deployment Guide - Production CI/CD

## 📋 Prerequisites

### Server Requirements

- **Ubuntu 20.04+** or similar Linux distribution
- **Docker** 20.10+ installed
- **Docker Compose** v2.0+ installed
- **Git** installed
- **SSH access** with sudo privileges
- **Minimum 2GB RAM**, 20GB disk space

### GitHub Repository Setup

1. Push your code to GitHub
2. Enable GitHub Actions in repository settings
3. Configure GitHub Container Registry access

---

## 🔐 Step 1: Configure GitHub Secrets

Navigate to: **Repository Settings → Secrets and variables → Actions → New repository secret**

### Required Secrets

| Secret Name       | Description                       | Example                                 |
| ----------------- | --------------------------------- | --------------------------------------- |
| `SSH_PRIVATE_KEY` | SSH private key for server access | (contents of ~/.ssh/id_rsa)             |
| `SERVER_HOST`     | Server IP or domain               | `123.456.789.0` or `api.yourdomain.com` |
| `SERVER_USER`     | SSH username                      | `deploy` or `ubuntu`                    |
| `APP_URL`         | Application URL for health checks | `https://api.yourdomain.com`            |

### Optional Secrets for Production

```bash
DB_PASSWORD=your_secure_database_password
JWT_SECRET=your_super_secret_jwt_key_at_least_32_chars
JWT_REFRESH_SECRET=your_refresh_token_secret_key
MYSQL_ROOT_PASSWORD=your_mysql_root_password
```

---

## 🖥️ Step 2: Server Setup

### 2.1 Connect to Server

```bash
ssh deploy@your-server-ip
```

### 2.2 Install Docker & Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 2.3 Create Application Directory

```bash
sudo mkdir -p /opt/management-api
sudo chown $USER:$USER /opt/management-api
cd /opt/management-api
```

### 2.4 Create Environment File

```bash
# Copy from example
cp .env.example .env

# Edit with your values
nano .env
```

**Important:** Update these values:

- `DB_PASSWORD`
- `MYSQL_ROOT_PASSWORD`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `CORS_ORIGIN`

### 2.5 Create Required Directories

```bash
mkdir -p nginx/conf.d nginx/ssl backups
```

---

## 🔑 Step 3: Setup SSH Access

### 3.1 Generate SSH Key (Local Machine)

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions-deploy"
# Save to: ~/.ssh/github_deploy_key

# Copy public key to server
ssh-copy-id -i ~/.ssh/github_deploy_key.pub deploy@your-server-ip
```

### 3.2 Add Private Key to GitHub Secrets

```bash
# Display private key (copy entire output)
cat ~/.ssh/github_deploy_key

# Add to GitHub Secrets as SSH_PRIVATE_KEY
```

### 3.3 Test SSH Connection

```bash
ssh -i ~/.ssh/github_deploy_key deploy@your-server-ip
```

---

## 🚀 Step 4: Deploy

### Automatic Deployment (Recommended)

1. **Push to main branch:**

   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin main
   ```

2. **GitHub Actions will automatically:**
   - ✅ Build Docker image
   - ✅ Push to GitHub Container Registry
   - ✅ Deploy to server
   - ✅ Run health checks
   - ✅ Notify on completion/failure

3. **Monitor deployment:**
   - Go to: **GitHub → Actions** tab
   - View logs in real-time
   - Estimated time: **1-2 minutes** ⚡

### Manual Deployment

```bash
# On server
cd /opt/management-api
sudo ./deploy.sh production latest
```

---

## 📊 Step 5: Verify Deployment

### Check Application Health

```bash
# Health check endpoint
curl https://your-domain.com/health

# Expected response:
{
  "status": "ok",
  "uptime": 123.45
}
```

### Check Container Status

```bash
# View running containers
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f api

# Check resource usage
docker stats
```

### Access Swagger Documentation

```
https://your-domain.com/api
```

---

## 🔄 CI/CD Workflow Details

### Trigger Events

- **Push to `main` branch** → Auto deploy
- **Manual trigger** → Via Actions tab

### Workflow Steps

1. **Build** (~30-60s)
   - Checkout code
   - Build Docker image
   - Push to GHCR

2. **Deploy** (~30-60s)
   - SSH to server
   - Pull latest image
   - Run database migrations
   - Start containers
   - Health check

3. **Test** (~10s)
   - Smoke tests
   - API health check

**Total Time: ~1-2 minutes** 🚀

---

## 🛠️ Troubleshooting

### Issue: Deployment Fails

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs --tail=100 api

# Restart containers
docker-compose -f docker-compose.prod.yml restart

# Full rebuild
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

### Issue: Database Connection Failed

```bash
# Check MySQL container
docker-compose -f docker-compose.prod.yml logs mysql

# Verify environment variables
docker-compose -f docker-compose.prod.yml exec api env | grep DB_

# Test connection
docker-compose -f docker-compose.prod.yml exec mysql mysql -u root -p
```

### Issue: Health Check Fails

```bash
# Check if app is running
docker-compose -f docker-compose.prod.yml exec api wget -O- http://localhost:3000/health

# Check port binding
netstat -tulpn | grep 3000

# Restart API
docker-compose -f docker-compose.prod.yml restart api
```

---

## 📦 Backup & Rollback

### Create Backup

```bash
# Database backup
docker-compose -f docker-compose.prod.yml exec -T mysql mysqldump \
  -u root -p${MYSQL_ROOT_PASSWORD} ${DB_NAME} > backup_$(date +%Y%m%d).sql

# Copy to safe location
scp backup_*.sql user@backup-server:/backups/
```

### Rollback to Previous Version

```bash
# On server
cd /opt/management-api

# Set previous image tag
export IMAGE_TAG=previous  # or specific version

# Redeploy
sudo ./deploy.sh production $IMAGE_TAG
```

---

## 🔒 Security Best Practices

### 1. SSL/TLS Configuration

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### 2. Firewall Setup

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. Fail2Ban

```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 📈 Monitoring

### Application Logs

```bash
# Real-time logs
docker-compose -f docker-compose.prod.yml logs -f --tail=100 api

# Error logs only
docker-compose -f docker-compose.prod.yml logs | grep ERROR
```

### Resource Monitoring

```bash
# Container stats
docker stats

# System resources
htop
```

### Setup Monitoring (Optional)

- **Prometheus + Grafana** for metrics
- **Sentry** for error tracking
- **Uptime monitoring** (UptimeRobot, StatusCake)

---

## ✅ Production Checklist

Before going live:

- [ ] SSL certificate configured
- [ ] Firewall rules applied
- [ ] Database backups automated
- [ ] Monitoring setup
- [ ] Environment variables secured
- [ ] CORS origins restricted
- [ ] Rate limiting enabled
- [ ] Health checks working
- [ ] Swagger access controlled
- [ ] Log rotation configured

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [GitHub Actions Documentation](https://docs.github.com/actions)
- [NestJS Documentation](https://docs.nestjs.com/)

---

## 🆘 Support

If you encounter issues:

1. Check logs: `docker-compose logs -f api`
2. Review GitHub Actions run
3. Verify environment variables
4. Check server resources
5. Contact DevOps team

---

**🎉 Congratulations! Your application is now deployed with CI/CD automation!**

Every push to `main` branch will automatically deploy to production in ~1-2 minutes! 🚀
