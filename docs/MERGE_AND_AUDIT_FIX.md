# 🔧 User Merge va Audit Log Tuzatildi

## 🐛 Topilgan Muammolar:

### 1. **Duplicate Email Error (OAuth Merge Login)**

**Muammo:**

- User 2 (merged) OAuth orqali kirganda
- User 1 (main) topiladi
- User 2 ning email'i User 1 ga yozishga uriniladi
- User 1 da u email allaqachon bor
- Database: `Duplicate entry for key 'user.email'`

**Yechim:**

```typescript
// Email yangilashdan oldin tekshirish
if (email && email !== user.email) {
  const emailExists = await this.userRepo.findOne({
    where: { email, deleted_at: IsNull() },
  });
  // Faqat agar email boshqa userda yo'q bo'lsa yoki o'sha userniki bo'lsa
  if (!emailExists || emailExists.id === user.id) {
    user.email = email;
  }
}

// Phone uchun ham xuddi shunday
```

---

### 2. **Merge Audit Log Yo'q**

**Muammo:**

- User merge qilinganda audit_logs'ga hech narsa yozilmasdi
- Merge history bor, lekin kim merge qilganligini bilish qiyin

**Yechim:**

- UserAuditLog entity'ga 2 ta yangi event type qo'shildi:
  - `user_merge` - Main user uchun
  - `user_merged` - Merged user uchun
- `description` column qo'shildi (merge details uchun)

```typescript
// Main user uchun
await this.logAudit(
  mainUser,
  'user_merge',
  `Merged user ${mergedUser.id} (${mergedUser.username}) into this account`,
);

// Merged user uchun
await this.logAudit(
  mergedUser,
  'user_merged',
  `This account was merged into user ${mainUser.id} (${mainUser.username})`,
);
```

---

## ✅ Yangi Event Types (8 ta):

```typescript
enum EventType {
  'login', // Login qilganda
  'logout', // Logout qilganda
  'password_change', // Parol o'zgarganda
  '2fa_enable', // 2FA yoqilganda
  '2fa_disable', // 2FA o'chirilganda
  'token_revoke', // Refresh token revoke/rotate
  'user_merge', // 🆕 User merge qilganda (main user uchun)
  'user_merged', // 🆕 User merge qilinganda (merged user uchun)
}
```

---

## 🔄 To'liq Merge Jarayoni:

### Kod:

```typescript
async mergeUsers(dto: MergeUsersDto) {
  // 1. Users'ni topish
  const mainUser = await this.userRepo.findOne({ where: { id: dto.mainUserId } });
  const mergedUser = await this.userRepo.findOne({ where: { id: dto.mergedUserId } });

  // 2. Merge history yaratish
  const mergeHistory = this.mergeHistoryRepo.create({
    main_user: mainUser,
    merged_user: mergedUser,
  });
  await this.mergeHistoryRepo.save(mergeHistory);

  // 3. Merged user'ni soft delete va block
  mergedUser.deleted_at = new Date();
  mergedUser.status = 'blocked';
  await this.userRepo.save(mergedUser);

  // 4. ✅ Audit logs yozish
  await this.logAudit(
    mainUser,
    'user_merge',
    `Merged user ${mergedUser.id} (${mergedUser.username}) into this account`,
  );
  await this.logAudit(
    mergedUser,
    'user_merged',
    `This account was merged into user ${mainUser.id} (${mainUser.username})`,
  );
}
```

---

## 🧪 Test Jarayoni:

### 1. Ikkita User Yarating:

```bash
# User 1
POST /api/auth/register
{
  "username": "user1",
  "email": "user1@example.com",
  "password": "Test123"
}

# User 2
POST /api/auth/register
{
  "username": "user2",
  "email": "user2@example.com",
  "password": "Test123"
}
```

### 2. Merge Qiling:

```bash
POST /api/user-merge
{
  "mainUserId": 1,
  "mergedUserId": 2
}
```

### 3. Audit Logs'ni Tekshiring:

```sql
SELECT
  id,
  userId,
  event_type,
  description,
  created_at
FROM user_audit_logs
WHERE event_type IN ('user_merge', 'user_merged')
ORDER BY created_at DESC;
```

**Kutilayotgan Natija:**

```
+----+--------+--------------+------------------------------------------------+---------------------+
| id | userId | event_type   | description                                    | created_at          |
+----+--------+--------------+------------------------------------------------+---------------------+
|  5 |      2 | user_merged  | This account was merged into user 1 (user1)    | 2025-10-18 08:00:00 |
|  4 |      1 | user_merge   | Merged user 2 (user2) into this account        | 2025-10-18 08:00:00 |
+----+--------+--------------+------------------------------------------------+---------------------+
```

### 4. Merged User OAuth Login Test:

```bash
# User 2 credentials bilan OAuth orqali kirish
GET /api/auth/login/hemis
# (OAuth jarayonidan o'ting)
```

**Kutilayotgan Natija:**

```json
{
  "accessToken": "...",
  "user": {
    "id": 1, // ← User 1 (main user)
    "username": "user1",
    "email": "user1@example.com"
  }
}
```

**Console Log:**

```
⚠️  User 2 (user2) is blocked/deleted, checking for merge...
✅ Found merge: redirecting to main user 1 (user1)
✅ OAuth account updated to main user
```

---

## ✅ Tuzatilgan Muammolar:

1. ✅ Duplicate email error hal qilindi
2. ✅ Duplicate phone error hal qilindi
3. ✅ Merge jarayonida audit log yoziladi (2 ta log)
4. ✅ Merged user OAuth orqali kirganda main user'ga yo'naltiriladi
5. ✅ OAuth account avtomatik yangilanadi
6. ✅ Description field qo'shildi (merge details uchun)

---

## 📊 UserAuditLog Schema Yangilandi:

```sql
CREATE TABLE user_audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT,
  event_type ENUM(
    'login',
    'logout',
    'password_change',
    '2fa_enable',
    '2fa_disable',
    'token_revoke',
    'user_merge',      -- 🆕 Yangi
    'user_merged'      -- 🆕 Yangi
  ),
  ip_address VARCHAR(45),
  user_agent VARCHAR(255),
  description TEXT,   -- 🆕 Yangi
  created_at TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);
```

---

**Status:** ✅ Tayyor  
**Test:** Swagger'da test qiling - http://localhost:3000
