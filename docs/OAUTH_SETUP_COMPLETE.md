# 🎉 OAuth Complete Setup Guide

## 🚀 Quick Start

### Step 1: Update .env.production (GitHub'dan!)

**GitHub Actions:**

1. Go to: `https://github.com/a-d-sh/NestJs-User-Management/actions`
2. Select: **"🔧 Update .env.production"**
3. Click: **"Run workflow"**
4. Inputs:
   - Backend URL: `https://auth.uzswlu.uz`
   - Frontend Callback: `https://front.uzswlu.uz/callback`
5. Click: **"Run workflow"**
6. Wait: 5-10 minutes
7. Done! ✅

---

### Step 2: HEMIS Admin Panel

**CRITICAL:** Update HEMIS OAuth Redirect URI:

1. Login to HEMIS admin panel
2. Navigate to: **OAuth Applications** / **Developer Settings**
3. Find: **Client ID: 4**
4. Update **Redirect URI** to:
   ```
   https://auth.uzswlu.uz/api/auth/callback/hemis
   ```
5. Save

---

### Step 3: Test OAuth Login

1. **Open browser:**

   ```
   https://auth.uzswlu.uz/api/auth/login/hemis
   ```

2. **Expected flow:**
   - Redirected to HEMIS login
   - Login with HEMIS credentials
   - Redirected back to `https://auth.uzswlu.uz/api/auth/callback/hemis?code=...`
   - User created in database
   - Redirected to frontend: `https://front.uzswlu.uz/callback?accessToken=...&userId=...`

3. **Check logs (GitHub Actions):**
   - Go to: `https://github.com/a-d-sh/NestJs-User-Management/actions`
   - Select: **"🔍 Check Production Errors"**
   - Run workflow
   - View logs

---

## 🔍 Verification

### A) Check .env.production:

```bash
# SSH to server (if needed)
ssh root@172.22.0.19
cd /var/www/auth-api
cat .env.production | grep -E "BACKEND_URL|FRONTEND_CALLBACK_URL"
```

**Expected:**

```bash
BACKEND_URL=https://auth.uzswlu.uz
FRONTEND_CALLBACK_URL=https://front.uzswlu.uz/callback
```

---

### B) Check Database:

```bash
docker-compose -f docker-compose.prod.yml exec -T mysql mysql \
  -u root -pP67ey4oyhQIzqM6qD0lbMNoDSa8BFbQGTC1TE4tvO5LUOtfH \
  auth_management -e "SELECT name, redirect_uri, front_redirect FROM oauth_providers WHERE name='hemis';"
```

**Expected:**

```
name  | redirect_uri                                    | front_redirect
------+-------------------------------------------------+----------------------------------
hemis | https://auth.uzswlu.uz/api/auth/callback/hemis | https://front.uzswlu.uz/callback
```

---

### C) Check Seed Logs:

```bash
docker-compose -f docker-compose.prod.yml logs api | grep "Backend URL\|Frontend Callback"
```

**Expected:**

```
📍 Backend URL: https://auth.uzswlu.uz
📍 Frontend Callback: https://front.uzswlu.uz/callback
```

---

## 🎮 Available GitHub Workflows

| Workflow                    | Purpose             | When to Use           |
| --------------------------- | ------------------- | --------------------- |
| **Deploy**                  | Auto deploy on push | Every code change     |
| **Update .env.production**  | Update environment  | Change OAuth URLs     |
| **Full Production Reset**   | Complete rebuild    | Fresh database needed |
| **Check Production Errors** | View logs/errors    | Debugging             |

---

## 📝 OAuth Configuration Files

| File                                         | Purpose                             |
| -------------------------------------------- | ----------------------------------- |
| `src/database/seeds/oauth-providers.seed.ts` | Seeds OAuth providers with env vars |
| `docker-compose.prod.yml`                    | Passes env vars to container        |
| `env.production.example`                     | Template for .env.production        |
| `.github/workflows/update-env.yml`           | Updates .env via GitHub             |
| `.github/workflows/full-reset.yml`           | Full reset with env check           |

---

## 🔧 Changing Frontend URL

### Temporarily (for testing):

```bash
# Update database directly
docker-compose -f docker-compose.prod.yml exec -T mysql mysql \
  -u root -pYOUR_PASSWORD \
  auth_management -e "
UPDATE oauth_providers
SET front_redirect = 'http://localhost:3003/callback'
WHERE name='hemis';
"

# Restart API
docker-compose -f docker-compose.prod.yml restart api
```

### Permanently:

1. **GitHub Actions** → **"Update .env.production"**
2. Change **Frontend Callback URL**
3. Run workflow
4. Wait for rebuild

---

## ⚠️ Common Issues

### Issue 1: Callback not reaching server

**Symptoms:**

- No callback logs in API
- OAuth redirect URL shows localhost

**Solution:**

- ✅ Check HEMIS admin panel redirect URI
- ✅ Must be: `https://auth.uzswlu.uz/api/auth/callback/hemis`

### Issue 2: Wrong frontend redirect

**Symptoms:**

- Redirected to localhost after OAuth
- Frontend can't receive token

**Solution:**

- ✅ Update `FRONTEND_CALLBACK_URL` in .env.production
- ✅ Use GitHub workflow: "Update .env.production"

### Issue 3: OAuth URLs still localhost after update

**Symptoms:**

- Database shows localhost URLs
- .env.production is correct

**Solution:**

- ✅ Database wasn't rebuilt
- ✅ Use: "Full Production Reset" workflow
- ✅ This will recreate database with new URLs

---

## ✅ Success Checklist

- [ ] `.env.production` has `BACKEND_URL=https://auth.uzswlu.uz`
- [ ] `.env.production` has `FRONTEND_CALLBACK_URL=https://front.uzswlu.uz/callback`
- [ ] HEMIS admin panel redirect URI: `https://auth.uzswlu.uz/api/auth/callback/hemis`
- [ ] Database `redirect_uri`: `https://auth.uzswlu.uz/api/auth/callback/hemis`
- [ ] Database `front_redirect`: `https://front.uzswlu.uz/callback`
- [ ] Seed logs show correct URLs
- [ ] OAuth login redirects to server (not localhost)
- [ ] New users are created in database

---

## 🚀 Next Steps

After everything is configured:

1. **Test OAuth:** `https://auth.uzswlu.uz/api/auth/login/hemis`
2. **Check database:** Should create new user
3. **Check frontend:** Should receive tokens at `https://front.uzswlu.uz/callback`

**All done via GitHub - no SSH needed!** 🎉
