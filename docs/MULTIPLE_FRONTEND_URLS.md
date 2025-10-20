# 🔗 Multiple Frontend URLs Support

Bu guide OAuth'da bir nechta frontend URL'larni qo'llab-quvvatlashni ko'rsatadi.

---

## 🎯 Vazifa

Frontend dasturchilar test paytida `localhost` ishlatadi, lekin production'da `https://front.uzswlu.uz` kerak.

**Masala:** Har safar database'ni o'zgartirib turish noqulay!

**Yechim:** Bir nechta URL'ni qo'llab-quvvatlash! ✅

---

## ⚙️ Configuration

### .env.production (Serverda):

```bash
# Primary URL birinchi bo'lishi kerak
FRONTEND_CALLBACK_URL=https://front.uzswlu.uz/callback,http://localhost:3003/callback,http://localhost:3000/callback
```

**Qanday ishlaydi:**
- Birinchi URL (`,` dan oldingi) - **default/primary**
- Qolgan URL'lar - test/fallback uchun

---

## 🚀 Ishlatish

### Variant 1: Default URL (Production)

**Frontend code:**
```typescript
// OAuth login boshlash
const response = await fetch('https://auth.uzswlu.uz/api/auth/login/hemis');
const data = await response.json();

// data.frontendRedirectUrl = "https://front.uzswlu.uz/callback" (primary)
window.location.href = data.authorizationUrl;
```

**Natija:**
- User HEMIS'da login qiladi
- Backend `https://front.uzswlu.uz/callback?accessToken=...` ga yo'naltiradi ✅

---

### Variant 2: Custom Return URL (Testing)

**Frontend code (local test):**
```typescript
// OAuth login with custom returnUrl
const response = await fetch(
  'https://auth.uzswlu.uz/api/auth/login/hemis?returnUrl=http://localhost:3003/callback'
);
const data = await response.json();

// data.frontendRedirectUrl = "http://localhost:3003/callback"
window.location.href = data.authorizationUrl;
```

**Natija:**
- User HEMIS'da login qiladi
- Backend `http://localhost:3003/callback?accessToken=...` ga yo'naltiradi ✅

---

### Variant 3: Ko'rish va Tanlash

**Frontend code:**
```typescript
const response = await fetch('https://auth.uzswlu.uz/api/auth/login/hemis');
const data = await response.json();

console.log('Available callbacks:', data.availableCallbacks);
// ["https://front.uzswlu.uz/callback", "http://localhost:3003/callback", "http://localhost:3000/callback"]

// Choose one
const myCallback = data.availableCallbacks.find(url => url.includes('localhost')) || data.frontendRedirectUrl;

// Use custom callback
const customResponse = await fetch(
  `https://auth.uzswlu.uz/api/auth/login/hemis?returnUrl=${encodeURIComponent(myCallback)}`
);
```

---

## 📊 Priority System

OAuth callback URL tanlanishi:

```
1. Query parameter: ?returnUrl=...  (eng yuqori)
2. Environment: FRONTEND_CALLBACK_URL (birinchi)
3. Database: provider.front_redirect  (fallback)
```

**Misol:**

```bash
# .env.production
FRONTEND_CALLBACK_URL=https://front.uzswlu.uz/callback,http://localhost:3003/callback

# Request 1: No query param
GET /api/auth/login/hemis
→ Uses: https://front.uzswlu.uz/callback (primary from .env)

# Request 2: With returnUrl
GET /api/auth/login/hemis?returnUrl=http://localhost:3003/callback
→ Uses: http://localhost:3003/callback (from query)

# Request 3: .env not set
GET /api/auth/login/hemis
→ Uses: provider.front_redirect (from database)
```

---

## 🔧 Setup

### 1. Update .env.production (GitHub'dan!)

**GitHub Actions:**
1. Go to: `https://github.com/a-d-sh/NestJs-User-Management/actions`
2. Select: **"🔧 Update .env.production"**
3. Input:
   ```
   Frontend Callback URL:
   https://front.uzswlu.uz/callback,http://localhost:3003/callback,http://localhost:3000/callback
   ```
4. Run workflow

---

### 2. Full Reset (Yangi Database)

**GitHub Actions:**
1. Select: **"🔴 Full Production Reset"**
2. Type: `RESET`
3. Run
4. Wait 10 minutes

**Result:**
- ✅ `.env.production` → Multiple URLs
- ✅ Database `front_redirect` → Primary URL
- ✅ Auth service → Comma-separated list'dan tanlaydi

---

## 🧪 Testing

### Local Frontend Test:

```bash
# 1. OAuth login with localhost callback
curl "https://auth.uzswlu.uz/api/auth/login/hemis?returnUrl=http://localhost:3003/callback"

# Response:
{
  "authorizationUrl": "https://hemis.uzswlu.uz/oauth/authorize?...",
  "provider": "hemis",
  "frontendRedirectUrl": "http://localhost:3003/callback",
  "availableCallbacks": [
    "https://front.uzswlu.uz/callback",
    "http://localhost:3003/callback",
    "http://localhost:3000/callback"
  ]
}
```

### Production Frontend:

```bash
# Default (no returnUrl)
curl "https://auth.uzswlu.uz/api/auth/login/hemis"

# Response:
{
  "frontendRedirectUrl": "https://front.uzswlu.uz/callback",  // Primary!
  "availableCallbacks": [...]
}
```

---

## 📝 Example Frontend Code

```typescript
// OAuth Login Component
class OAuthLogin {
  async startOAuthFlow(provider: string) {
    // For production
    const apiUrl = 'https://auth.uzswlu.uz/api/auth/login/' + provider;
    
    // For local testing, add returnUrl
    const isDev = window.location.hostname === 'localhost';
    const url = isDev 
      ? `${apiUrl}?returnUrl=http://localhost:3003/callback`
      : apiUrl;
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Will redirect to:', data.frontendRedirectUrl);
    
    // Redirect to HEMIS
    window.location.href = data.authorizationUrl;
  }
  
  // After OAuth callback
  handleCallback() {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('accessToken');
    const userId = params.get('userId');
    
    // Save tokens and login
    localStorage.setItem('accessToken', accessToken);
    // ... navigate to dashboard
  }
}
```

---

## ✅ Afzalliklar

✅ **Bir marta configure** - keyin har doim ishlaydi  
✅ **Local test** - `?returnUrl=localhost` bilan  
✅ **Production** - Default URL avtomatik  
✅ **Flexible** - Istalgan URL'ni tanlash mumkin  
✅ **No database changes** - Faqat .env

---

## 🎯 Summary

| Scenario | URL | Method |
|----------|-----|--------|
| **Production** | `https://front.uzswlu.uz/callback` | Default (primary from .env) |
| **Local Test** | `http://localhost:3003/callback` | Query param: `?returnUrl=...` |
| **Custom** | Any URL | Query param: `?returnUrl=...` |

**Hamma narsa bir .env variable bilan!** 🎉

