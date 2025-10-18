# 🔄 User Merge Jarayoni va Kirish Mexanizmi

## Muammo va Yechim

### ❌ Muammo:

User merge bo'lgandan keyin:

1. Eski user **blocked** va **soft deleted** qilinadi
2. Uning OAuth accountlari main user'ga transfer qilinadi
3. Agar eski user yana OAuth orqali kirishga urinsa, account topiladi
4. Lekin user blocked bo'lgani uchun kirish rad etilardi

### ✅ Yechim:

OAuth kirish jarayonida endi avtomatik merge detection qo'shildi:

1. OAuth account topiladi
2. Agar user blocked/deleted bo'lsa → merge history tekshiriladi
3. Agar merge qilingan bo'lsa → main user topiladi
4. OAuth account avtomatik main user'ga yangilanadi
5. Main user bilan login qilinadi

---

## 🔄 Jarayon Diagrammasi

### Scenario 1: Normal User (Active)

```
OAuth Login
   ↓
OAuth Account topildi
   ↓
User: active ✅
   ↓
Login Success → Access Token
```

### Scenario 2: Merged User

```
OAuth Login (eski user credentials bilan)
   ↓
OAuth Account topildi
   ↓
User: blocked/deleted ⚠️
   ↓
Merge History tekshiriladi
   ↓
Main User topildi ✅
   ↓
OAuth Account → Main User'ga yangilanadi
   ↓
Login Success → Main User Access Token
```

### Scenario 3: Blocked User (Merge qilinmagan)

```
OAuth Login
   ↓
OAuth Account topildi
   ↓
User: blocked/deleted ⚠️
   ↓
Merge History topilmadi ❌
   ↓
Error: "Account blocked. Contact support"
```

---

## 💻 Kod Implementatsiyasi

### OAuth Service - findOrCreateUser metodi

```typescript
if (existingOAuthAccount) {
  let user = existingOAuthAccount.user;

  // Check if user is blocked or soft deleted
  if (user.status === 'blocked' || user.deleted_at !== null) {
    console.log(
      `⚠️  User ${user.id} is blocked/deleted, checking for merge...`,
    );

    // Check if this user was merged to another user
    const mergeHistory = await this.mergeHistoryRepo.findOne({
      where: { merged_user: { id: user.id } },
      relations: ['main_user'],
    });

    if (mergeHistory && mergeHistory.main_user) {
      // User was merged, use the main user instead
      user = mergeHistory.main_user;
      console.log(`✅ Redirecting to main user ${user.id}`);

      // Update OAuth account to point to main user
      if (existingOAuthAccount.user.id !== user.id) {
        existingOAuthAccount.user = user;
        await this.oauthAccountRepo.save(existingOAuthAccount);
        console.log(`✅ OAuth account updated to main user`);
      }

      // Check if main user is also blocked
      if (user.status === 'blocked' || user.deleted_at !== null) {
        throw new BadRequestException('Account blocked. Contact support.');
      }
    } else {
      // User is blocked but not merged
      throw new BadRequestException('Account blocked. Contact support.');
    }
  }

  // Continue with login...
  return user;
}
```

---

## 🧪 Test Scenariysi

### Tayyorgarlik:

1. **User A yaratish:**

```bash
POST /api/auth/register
{
  "username": "user_a",
  "email": "usera@example.com",
  "password": "Test123"
}
# UserId = 2
```

2. **User A ga HEMIS account ulash:**

```bash
# HEMIS orqali login qilish
GET /api/auth/login/hemis
# OAuth jarayonidan o'tish
```

3. **User B yaratish:**

```bash
POST /api/auth/register
{
  "username": "user_b",
  "email": "userb@example.com",
  "password": "Test123"
}
# UserId = 3
```

### Merge Jarayoni:

4. **User A ni User B ga merge qilish (Creator sifatida):**

```bash
POST /api/user-merge
{
  "sourceUserId": 2,  // User A
  "targetUserId": 3   // User B
}
```

**Natija:**

- User A: blocked + soft deleted
- User A ning HEMIS account'i → User B ga o'tkazildi
- User A ning barcha rollari → User B ga o'tkazildi

### Test - Merge'dan Keyin OAuth Login:

5. **User A credentials bilan HEMIS orqali kirish:**

```bash
GET /api/auth/login/hemis
# HEMIS'dan kelgan data: user A ning provider_user_id'si
```

**Kutilayotgan Natija:**

```json
{
  "accessToken": "...",
  "user": {
    "id": 3, // ← User B (main user)
    "username": "user_b",
    "email": "userb@example.com",
    "status": "active"
  }
}
```

**Console Log:**

```
⚠️  User 2 (user_a) is blocked/deleted, checking for merge...
✅ Found merge: redirecting to main user 3 (user_b)
✅ OAuth account updated to main user
```

---

## 🔒 Sistema Login uchun

Agar user merge qilingan bo'lsa, sistema login (username+password) ishlamaydi:

```bash
POST /api/auth/login
{
  "usernameOrEmail": "user_a",
  "password": "Test123"
}
```

**Natija:**

```json
{
  "statusCode": 401,
  "message": "Your account has been blocked. Please contact support."
}
```

**Sabab:** Система login'da merge detection yo'q, faqat OAuth'da bor.

Agar kerak bo'lsa, sistema login'ga ham merge detection qo'shishimiz mumkin.

---

## 📊 Ma'lumotlar Bazasida Ko'rish

### User Merge History:

```sql
SELECT
    mh.id,
    mh.merged_user_id AS old_user,
    u1.username AS old_username,
    u1.status AS old_status,
    mh.main_user_id AS new_user,
    u2.username AS new_username,
    u2.status AS new_status,
    mh.merged_at
FROM user_merge_history mh
LEFT JOIN user u1 ON mh.merged_user_id = u1.id
LEFT JOIN user u2 ON mh.main_user_id = u2.id;
```

### OAuth Accounts After Merge:

```sql
SELECT
    uoa.id,
    uoa.provider_user_id,
    uoa.userId,
    u.username,
    u.status,
    u.deleted_at,
    p.name AS provider
FROM user_oauth_accounts uoa
LEFT JOIN user u ON uoa.userId = u.id
LEFT JOIN oauth_providers p ON uoa.providerId = p.id
WHERE uoa.provider_user_id = 'HEMIS_USER_ID';
```

---

## ✅ Xulosa

1. ✅ Merge qilingan user OAuth orqali kirganda avtomatik main user'ga yo'naltiriladi
2. ✅ OAuth account avtomatik yangilanadi
3. ✅ Blocked user (merge qilinmagan) kirolmaydi
4. ✅ Sistema login'da ham blocked userlar kirolmaydi
5. ⚠️ Sistema login'da merge detection yo'q (faqat OAuth'da)

**Agar sistema login uchun ham merge detection kerak bo'lsa, ayting - qo'shamiz!** 💡
