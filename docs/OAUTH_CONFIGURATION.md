# OAuth Configuration Guide

## Environment Variables

The OAuth providers are now configured using environment variables for better flexibility across different environments (development, staging, production).

### Required Environment Variables

Add these to your `.env.production` file on the server:

```bash
# Backend URL (where your API is hosted)
BACKEND_URL=https://auth.uzswlu.uz

# Frontend Callback URL (where users are redirected after OAuth login)
FRONTEND_CALLBACK_URL=http://localhost:3003/callback
```

---

## Configuration Details

### 1. **BACKEND_URL**
- **Purpose:** The base URL of your backend API
- **Used for:** OAuth callback redirects (e.g., `${BACKEND_URL}/api/auth/callback/hemis`)
- **Examples:**
  - Development: `http://localhost:3000`
  - Production: `https://auth.uzswlu.uz`

### 2. **FRONTEND_CALLBACK_URL**
- **Purpose:** Where users are redirected after successful OAuth authentication
- **Used for:** Final redirect with JWT tokens
- **Examples:**
  - Development: `http://localhost:3003/callback`
  - Production: `https://app.uzswlu.uz/callback` or `https://frontend.uzswlu.uz/auth/callback`

---

## Default Values

If environment variables are not set, the following defaults are used:

```typescript
BACKEND_URL = 'http://localhost:3000'
FRONTEND_CALLBACK_URL = 'http://localhost:3003/callback'
```

---

## Updating Production Configuration

### Step 1: Add to `.env.production`

SSH into your server and edit the `.env.production` file:

```bash
cd /var/www/auth-api
nano .env.production
```

Add these lines:

```bash
BACKEND_URL=https://auth.uzswlu.uz
FRONTEND_CALLBACK_URL=http://localhost:3003/callback
```

### Step 2: Restart Services

```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

### Step 3: Verify Database

Check that the OAuth providers were seeded with correct URLs:

```bash
docker-compose -f docker-compose.prod.yml exec -T mysql mysql \
  -u root -p'YOUR_PASSWORD' \
  auth_management -e "SELECT name, redirect_uri, front_redirect FROM oauth_providers;"
```

---

## Important Notes

### 🔴 HEMIS Admin Panel Configuration

**CRITICAL:** You must also update the redirect URI in the HEMIS OAuth admin panel:

1. Log in to HEMIS admin panel
2. Navigate to OAuth Applications
3. Find your application (client_id: 4)
4. Update **Redirect URI** to: `https://auth.uzswlu.uz/api/auth/callback/hemis`
5. Save changes

Without this step, HEMIS will still redirect to `localhost:3000`, and OAuth will fail!

---

## Updating for Production Frontend

When you deploy your frontend to production, update `FRONTEND_CALLBACK_URL`:

**Example for deployed frontend:**

```bash
# If frontend is at https://app.uzswlu.uz
FRONTEND_CALLBACK_URL=https://app.uzswlu.uz/callback

# If frontend is at https://frontend.uzswlu.uz
FRONTEND_CALLBACK_URL=https://frontend.uzswlu.uz/auth/callback
```

Then restart:

```bash
docker-compose -f docker-compose.prod.yml restart api
```

---

## Manual Database Update (Alternative)

If you need to update the URLs manually without re-seeding:

```bash
docker-compose -f docker-compose.prod.yml exec -T mysql mysql \
  -u root -p'YOUR_PASSWORD' \
  auth_management -e "
UPDATE oauth_providers 
SET 
  redirect_uri = 'https://auth.uzswlu.uz/api/auth/callback/hemis',
  front_redirect = 'https://your-frontend.com/callback'
WHERE name='hemis';
"
```

---

## Troubleshooting

### OAuth callback not being called
- ✅ Check HEMIS admin panel has correct redirect URI
- ✅ Verify `BACKEND_URL` in `.env.production`
- ✅ Check database: `SELECT redirect_uri FROM oauth_providers WHERE name='hemis'`

### Users redirected to wrong URL after login
- ✅ Check `FRONTEND_CALLBACK_URL` in `.env.production`
- ✅ Check database: `SELECT front_redirect FROM oauth_providers WHERE name='hemis'`
- ✅ Restart API: `docker-compose restart api`

---

## Testing

1. **Check API status:**
   ```bash
   curl https://auth.uzswlu.uz/api/health
   ```

2. **Try OAuth login:**
   ```bash
   # In browser, visit:
   https://auth.uzswlu.uz/api/auth/login/hemis
   ```

3. **Monitor logs:**
   ```bash
   docker-compose -f docker-compose.prod.yml logs -f api | grep -i oauth
   ```

---

## Summary

✅ Environment variables now control OAuth URLs  
✅ Easy to switch between development and production  
✅ No code changes needed for different environments  
✅ Default values for local development  
✅ CI/CD auto-deploys on push to `main`  

🎯 **Next Step:** Update your frontend URL when you deploy it to production!

