# 🔐 GitHub Secrets Setup Guide

## Required Secrets for CI/CD

Configure these secrets in: **Repository → Settings → Secrets and variables → Actions**

---

## 🔑 1. SSH_PRIVATE_KEY

### Generate SSH Key Pair

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions-ci-cd" -f ~/.ssh/github_deploy

# This creates two files:
# ~/.ssh/github_deploy (private key) - ADD TO GITHUB SECRETS
# ~/.ssh/github_deploy.pub (public key) - ADD TO SERVER
```

### Add Public Key to Server

```bash
# Copy public key to server
ssh-copy-id -i ~/.ssh/github_deploy.pub deploy@your-server-ip

# Or manually:
cat ~/.ssh/github_deploy.pub
# Copy the output and paste to server's ~/.ssh/authorized_keys
```

### Add Private Key to GitHub

```bash
# Display private key
cat ~/.ssh/github_deploy

# Copy ENTIRE output including:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ...content...
# -----END OPENSSH PRIVATE KEY-----
```

**GitHub Secrets:**

- Name: `SSH_PRIVATE_KEY`
- Value: (paste entire private key)

---

## 🖥️ 2. SERVER_HOST

Your server's IP address or domain name.

**Examples:**

- `123.456.789.012` (IP address)
- `api.yourdomain.com` (domain)
- `server.example.com` (subdomain)

**GitHub Secrets:**

- Name: `SERVER_HOST`
- Value: `your-server-ip-or-domain`

---

## 👤 3. SERVER_USER

SSH username for deployment.

**Common values:**

- `deploy` (recommended)
- `ubuntu` (default on Ubuntu)
- `root` (not recommended for security)

**GitHub Secrets:**

- Name: `SERVER_USER`
- Value: `deploy` or `ubuntu`

---

## 🌐 4. APP_URL

Full URL of your deployed application (for health checks).

**Examples:**

- `https://api.yourdomain.com`
- `http://123.456.789.012:3000`

**GitHub Secrets:**

- Name: `APP_URL`
- Value: `https://api.yourdomain.com`

---

## 🔒 5. Environment Variables (Optional but Recommended)

### DB_PASSWORD

Database password for MySQL.

```bash
# Generate secure password
openssl rand -base64 32
```

**GitHub Secrets:**

- Name: `DB_PASSWORD`
- Value: `your_secure_db_password_here`

---

### MYSQL_ROOT_PASSWORD

MySQL root password.

```bash
# Generate secure password
openssl rand -base64 32
```

**GitHub Secrets:**

- Name: `MYSQL_ROOT_PASSWORD`
- Value: `your_secure_root_password_here`

---

### JWT_SECRET

Secret key for JWT token signing (minimum 32 characters).

```bash
# Generate secure secret
openssl rand -hex 32
```

**GitHub Secrets:**

- Name: `JWT_SECRET`
- Value: `your_jwt_secret_key_at_least_32_characters`

---

### JWT_REFRESH_SECRET

Secret key for refresh token signing (minimum 32 characters).

```bash
# Generate secure secret
openssl rand -hex 32
```

**GitHub Secrets:**

- Name: `JWT_REFRESH_SECRET`
- Value: `your_refresh_secret_key_at_least_32_characters`

---

## 📋 Quick Setup Checklist

### Step 1: Generate SSH Keys

```bash
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/github_deploy
```

### Step 2: Add Public Key to Server

```bash
ssh-copy-id -i ~/.ssh/github_deploy.pub deploy@your-server-ip
```

### Step 3: Add Secrets to GitHub

```bash
# Get private key
cat ~/.ssh/github_deploy

# Add to GitHub Secrets as SSH_PRIVATE_KEY
```

### Step 4: Add Other Secrets

Navigate to: **Settings → Secrets and variables → Actions → New repository secret**

1. `SSH_PRIVATE_KEY` → (contents of ~/.ssh/github_deploy)
2. `SERVER_HOST` → `123.456.789.012` or `api.yourdomain.com`
3. `SERVER_USER` → `deploy` or `ubuntu`
4. `APP_URL` → `https://api.yourdomain.com`

---

## ✅ Verify Setup

### Test SSH Connection

```bash
# Test SSH connection with the key
ssh -i ~/.ssh/github_deploy deploy@your-server-ip

# If successful, you should see server prompt
```

### Test from GitHub Actions

1. Go to **Actions** tab
2. Select **Deploy to Production** workflow
3. Click **Run workflow**
4. Select `production` environment
5. Click **Run workflow**

---

## 🔐 Security Best Practices

### 1. Use Dedicated Deploy User

```bash
# On server
sudo adduser deploy
sudo usermod -aG docker deploy
sudo usermod -aG sudo deploy
```

### 2. Restrict SSH Key Permissions

```bash
# On server: ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### 3. Rotate Secrets Regularly

- Rotate SSH keys every 90 days
- Rotate JWT secrets every 6 months
- Update database passwords periodically

### 4. Use GitHub Environments

Create environments in: **Settings → Environments**

- `production` → Requires approval
- `staging` → Auto-deploy

---

## 🛠️ Troubleshooting

### Issue: SSH Connection Fails

```bash
# Test SSH connection manually
ssh -i ~/.ssh/github_deploy deploy@your-server-ip

# Check SSH key permissions
ls -la ~/.ssh/

# Verify public key on server
cat ~/.ssh/authorized_keys
```

### Issue: Wrong Secret Format

**SSH_PRIVATE_KEY** must include:

```
-----BEGIN OPENSSH PRIVATE KEY-----
...content...
-----END OPENSSH PRIVATE KEY-----
```

Do NOT add quotes or extra spaces!

### Issue: Permission Denied

```bash
# On server, check deploy user permissions
sudo -u deploy docker ps

# If fails, add to docker group
sudo usermod -aG docker deploy
```

---

## 📚 Reference

### All Required Secrets

| Secret Name           | Type    | Required       | Example                  |
| --------------------- | ------- | -------------- | ------------------------ |
| `SSH_PRIVATE_KEY`     | SSH Key | ✅ Yes         | `-----BEGIN OPENSSH...`  |
| `SERVER_HOST`         | String  | ✅ Yes         | `123.456.789.012`        |
| `SERVER_USER`         | String  | ✅ Yes         | `deploy`                 |
| `APP_URL`             | URL     | ✅ Yes         | `https://api.domain.com` |
| `DB_PASSWORD`         | String  | ⚠️ Recommended | `secure_password_here`   |
| `MYSQL_ROOT_PASSWORD` | String  | ⚠️ Recommended | `root_password_here`     |
| `JWT_SECRET`          | String  | ⚠️ Recommended | `32char_secret_key`      |
| `JWT_REFRESH_SECRET`  | String  | ⚠️ Recommended | `32char_refresh_key`     |

---

## 🎯 Quick Commands

### Generate All Secrets at Once

```bash
# SSH Keys
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/github_deploy

# Database Password
echo "DB_PASSWORD=$(openssl rand -base64 32)"

# MySQL Root Password
echo "MYSQL_ROOT_PASSWORD=$(openssl rand -base64 32)"

# JWT Secret
echo "JWT_SECRET=$(openssl rand -hex 32)"

# JWT Refresh Secret
echo "JWT_REFRESH_SECRET=$(openssl rand -hex 32)"
```

---

**✅ After adding all secrets, your CI/CD pipeline is ready!**

Push to `main` branch and watch the magic happen! 🚀
