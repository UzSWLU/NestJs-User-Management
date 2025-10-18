# ⚡ Tezkor Test Qo'llanma

## Swagger: http://localhost:3000

---

## 🎯 5 Daqiqalik Test

### 1️⃣ Birinchi User (Creator) - 1 daqiqa

```json
POST /api/auth/register
{
  "username": "creator",
  "email": "creator@company.com",
  "password": "Creator123"
}
```

**Natija:**

- userId = 1
- role = creator
- **Token oling va Authorize qiling!** 🔑

---

### 2️⃣ Ikkinchi User - 1 daqiqa

```json
POST /api/auth/register
{
  "username": "employee",
  "email": "employee@company.com",
  "password": "Employee123"
}
```

**Natija:**

- userId = 2
- role = user

---

### 3️⃣ User Merge - 1 daqiqa

**Creator token bilan:**

```json
POST /api/user-merge
{
  "mainUserId": 1,
  "mergedUserId": 2
}
```

**Natija:**

- Merge history yaratildi
- User 2: blocked, soft deleted
- **2 ta audit log yozilishi kerak!** 📝

---

### 4️⃣ Audit Logs Tekshirish - 1 daqiqa

**PhpMyAdmin:** http://localhost:8080

- Login: root / password (yoki .env da qaysi parol bo'lsa)
- Database: user_auth
- Table: user_audit_logs

```sql
SELECT * FROM user_audit_logs
ORDER BY id DESC;
```

**Kutish:**

```
user_merged  | userId=2 | This account was merged into user 1...
user_merge   | userId=1 | Merged user 2 (employee) into this account
```

---

### 5️⃣ Logout Test - 1 daqiqa

**Creator token bilan:**

```json
POST /api/auth/logout
{
  "refreshToken": "creator_ning_refresh_token"
}
```

**PhpMyAdmin'da tekshiring:**

```sql
-- Logout audit log
SELECT * FROM user_audit_logs
WHERE event_type = 'logout';

-- Token revoked
SELECT id, userId, revoked
FROM user_refresh_tokens
ORDER BY id DESC
LIMIT 3;
```

**Kutish:**

- revoked = 1 ✅
- event_type = 'logout' ✅

---

## 🎁 Bonus: Companies Test

```json
POST /api/companies
{
  "name": "My Company",
  "domain": "mycompany.com"
}

POST /api/companies/1/upload-logo
[File tanlang]
```

---

## ✅ Success Criteria:

- [ ] 2 ta user yaratildi
- [ ] Merge muvaffaqiyatli
- [ ] Audit logs'da `user_merge` va `user_merged` bor
- [ ] Logout'da audit log yozildi
- [ ] Logout'da `revoked = 1`
- [ ] Company CRUD ishlaydi
- [ ] Logo upload ishlaydi

---

**Agar hamma ✅ bo'lsa - PRODUCTION'ga deploy qilishga tayyor!** 🚀
