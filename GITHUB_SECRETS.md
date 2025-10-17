# 🔐 GitHub Secrets Configuration Guide

This guide explains how to configure GitHub Secrets for automated deployment.

## Table of Contents

- [Required Secrets](#required-secrets)
- [Setting Up Secrets](#setting-up-secrets)
- [SSH Key Generation](#ssh-key-generation)
- [Environment-Specific Secrets](#environment-specific-secrets)

---

## Required Secrets

### Shared Secrets

These secrets are used across both staging and production:

| Secret Name    | Description                      | Example    |
| -------------- | -------------------------------- | ---------- |
| `GITHUB_TOKEN` | Automatically provided by GitHub | N/A (auto) |

### Staging Environment Secrets

Required for deploying to staging server:

| Secret Name       | Description                         | Example                                    |
| ----------------- | ----------------------------------- | ------------------------------------------ |
| `STAGING_HOST`    | Staging server hostname or IP       | `staging.example.com` or `123.45.67.89`    |
| `STAGING_USER`    | SSH username for deployment         | `deploy`                                   |
| `STAGING_SSH_KEY` | Private SSH key for authentication  | `-----BEGIN OPENSSH PRIVATE KEY-----\n...` |
| `STAGING_PORT`    | SSH port (optional, defaults to 22) | `22`                                       |

### Production Environment Secrets

Required for deploying to production server:

| Secret Name    | Description                         | Example                                    |
| -------------- | ----------------------------------- | ------------------------------------------ |
| `PROD_HOST`    | Production server hostname or IP    | `api.example.com` or `234.56.78.90`        |
| `PROD_USER`    | SSH username for deployment         | `deploy`                                   |
| `PROD_SSH_KEY` | Private SSH key for authentication  | `-----BEGIN OPENSSH PRIVATE KEY-----\n...` |
| `PROD_PORT`    | SSH port (optional, defaults to 22) | `22`                                       |

---

## Setting Up Secrets

### Step 1: Navigate to Repository Settings

1. Go to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**

### Step 2: Add New Secret

1. Click **New repository secret**
2. Enter the **Name** (e.g., `PROD_HOST`)
3. Enter the **Value**
4. Click **Add secret**

### Step 3: Verify Secrets

After adding all secrets, you should see them listed (values will be hidden):

```
STAGING_HOST
STAGING_USER
STAGING_SSH_KEY
STAGING_PORT
PROD_HOST
PROD_USER
PROD_SSH_KEY
PROD_PORT
```

---

## SSH Key Generation

### 1. Generate SSH Key Pair

On your local machine:

```bash
# Generate ED25519 key (recommended)
ssh-keygen -t ed25519 -C "deploy@management-api" -f ~/.ssh/deploy_management

# Or generate RSA key (if ED25519 not supported)
ssh-keygen -t rsa -b 4096 -C "deploy@management-api" -f ~/.ssh/deploy_management
```

This creates two files:

- `~/.ssh/deploy_management` (private key) → Add to GitHub Secrets
- `~/.ssh/deploy_management.pub` (public key) → Add to server

### 2. Add Public Key to Server

```bash
# Copy public key to server
ssh-copy-id -i ~/.ssh/deploy_management.pub deploy@your-server.com

# Or manually:
cat ~/.ssh/deploy_management.pub
# Copy the output and add to server's ~/.ssh/authorized_keys
```

### 3. Add Private Key to GitHub Secrets

```bash
# Display private key
cat ~/.ssh/deploy_management

# Copy the ENTIRE output including:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ...
# -----END OPENSSH PRIVATE KEY-----
```

Add this to GitHub Secrets as `STAGING_SSH_KEY` or `PROD_SSH_KEY`.

**Important**: Include the full key with headers and newlines!

### 4. Test SSH Connection

```bash
ssh -i ~/.ssh/deploy_management deploy@your-server.com
```

---

## Environment-Specific Secrets

### Staging Environment

Create a separate environment in GitHub:

1. Go to **Settings** → **Environments**
2. Click **New environment**
3. Name it `staging`
4. Add environment-specific secrets:
   - `STAGING_HOST`
   - `STAGING_USER`
   - `STAGING_SSH_KEY`
   - `STAGING_PORT` (optional)

### Production Environment

Similarly, create a `production` environment:

1. Go to **Settings** → **Environments**
2. Click **New environment**
3. Name it `production`
4. Add environment-specific secrets:
   - `PROD_HOST`
   - `PROD_USER`
   - `PROD_SSH_KEY`
   - `PROD_PORT` (optional)

**Optional Protection Rules**:

- Required reviewers (approve before deployment)
- Wait timer (delay deployment)
- Deployment branches (only from specific branches)

---

## Security Best Practices

### 1. SSH Key Security

✅ **DO:**

- Use ED25519 keys (more secure than RSA)
- Set strong passphrase for local key storage
- Use separate keys for different servers
- Rotate keys periodically (every 6-12 months)
- Remove old keys from servers

❌ **DON'T:**

- Share private keys
- Commit keys to repository
- Use same key across multiple servers
- Use password authentication (use keys only)

### 2. Server Access

✅ **DO:**

- Create dedicated `deploy` user with limited permissions
- Disable root login via SSH
- Disable password authentication
- Use SSH keys only
- Enable firewall (ufw)
- Keep server updated

### 3. Secret Management

✅ **DO:**

- Use GitHub Environments for production
- Set up required reviewers
- Audit secret access regularly
- Rotate secrets periodically

❌ **DON'T:**

- Echo secrets in logs
- Store secrets in code
- Share secrets via chat/email

---

## Troubleshooting

### SSH Connection Failed

```bash
# Test SSH connection manually
ssh -vvv -i ~/.ssh/deploy_management deploy@server.com

# Check server's auth log
sudo tail -f /var/log/auth.log

# Verify key permissions
chmod 600 ~/.ssh/deploy_management
chmod 644 ~/.ssh/deploy_management.pub
```

### GitHub Actions Can't Connect

1. **Check secret format**:
   - Ensure entire private key is copied
   - Include `-----BEGIN` and `-----END` lines
   - No extra spaces or characters

2. **Verify server access**:

   ```bash
   # On server
   cat ~/.ssh/authorized_keys
   # Should contain your public key
   ```

3. **Check GitHub Actions logs**:
   - Go to Actions tab
   - Click on failed workflow
   - Expand SSH step to see error

### Permission Denied

1. **Server-side check**:

   ```bash
   # Check .ssh directory permissions
   ls -la ~/.ssh/
   # Should be: drwx------ (700)

   # Check authorized_keys permissions
   ls -la ~/.ssh/authorized_keys
   # Should be: -rw------- (600)
   ```

2. **Fix permissions**:
   ```bash
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/authorized_keys
   ```

---

## Example: Complete Setup

```bash
# 1. Generate SSH key
ssh-keygen -t ed25519 -C "deploy@management-api" -f ~/.ssh/deploy_management

# 2. Copy to server
ssh-copy-id -i ~/.ssh/deploy_management.pub deploy@api.example.com

# 3. Test connection
ssh -i ~/.ssh/deploy_management deploy@api.example.com

# 4. Get private key for GitHub
cat ~/.ssh/deploy_management
# Copy entire output

# 5. Add to GitHub Secrets:
# PROD_HOST = api.example.com
# PROD_USER = deploy
# PROD_SSH_KEY = <paste entire private key>
# PROD_PORT = 22
```

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [SSH Key Management](https://www.ssh.com/academy/ssh/keygen)

---

## Support

If you encounter issues:

1. Check GitHub Actions logs
2. Verify secret values
3. Test SSH connection manually
4. Review server logs
5. Open an issue on GitHub
