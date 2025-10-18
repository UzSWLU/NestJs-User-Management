# 🧪 User Merge Test Qo'llanma

## Swagger: http://localhost:3000

---

## 📝 Test Jarayoni (Qadam-ba-Qadam)

### STEP 1: Birinchi User (Creator)

```http
POST /api/auth/register
{
  "username": "creator",
  "email": "creator@test.com",
  "password": "Creator123"
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": 1,
    "username": "creator",
    "companyId": 1,
    "roles": [{ "role": { "name": "creator" } }]
  }
}
```

**✅ Token'ni saqlang va Authorize qiling!**

---

### STEP 2: Ikkinchi User

```http
POST /api/auth/register
{
  "username": "user2",
  "email": "user2@test.com",
  "password": "User123"
}
```

**Response:**

```json
{
  "accessToken": "...",
  "user": {
    "id": 2,
    "username": "user2",
    "email": "user2@test.com",
    "companyId": 1,
    "roles": [{ "role": { "name": "user" } }]
  }
}
```

---

### STEP 3: User Merge (Creator sifatida)

```http
POST /api/user-merge
{
  "mainUserId": 1,
  "mergedUserId": 2
}
```

**Response:**

```json
{
  "id": 1,
  "main_user": {
    "id": 1,
    "username": "creator"
  },
  "merged_user": {
    "id": 2,
    "username": "user2",
    "status": "blocked",
    "deleted_at": "2025-10-18T08:00:00.000Z"
  },
  "merged_at": "2025-10-18T08:00:00.000Z"
}
```

---

### STEP 4: Audit Logs Tekshirish

```http
GET /api/auth/me
```

Yoki PhpMyAdmin'da (http://localhost:8080):

```sql
SELECT
  id,
  userId,
  event_type,
  description,
  created_at
FROM user_audit_logs
ORDER BY id DESC
LIMIT 10;
```

**Kutilayotgan Natija:**

```
+----+--------+--------------+------------------------------------------------+---------------------+
| id | userId | event_type   | description                                    | created_at          |
+----+--------+--------------+------------------------------------------------+---------------------+
|  4 |      2 | user_merged  | This account was merged into user 1 (creator)  | 2025-10-18 08:00:00 |
|  3 |      1 | user_merge   | Merged user 2 (user2) into this account        | 2025-10-18 08:00:00 |
|  2 |      2 | login        | NULL                                           | 2025-10-18 07:55:00 |
|  1 |      1 | login        | NULL                                           | 2025-10-18 07:50:00 |
+----+--------+--------------+------------------------------------------------+---------------------+
```

---

### STEP 5: User Status Tekshirish

```sql
SELECT id, username, email, status, deleted_at
FROM user
WHERE id IN (1, 2);
```

**Natija:**

```
+----+----------+-------------------+--------+---------------------+
| id | username | email             | status | deleted_at          |
+----+----------+-------------------+--------+---------------------+
|  1 | creator  | creator@test.com  | active | NULL                |
|  2 | user2    | user2@test.com    | blocked| 2025-10-18 08:00:00 |
+----+----------+-------------------+--------+---------------------+
```

---

### STEP 6: Logout Test

Creator sifatida logout qiling:

```http
POST /api/auth/logout
{
  "refreshToken": "sizning_refresh_tokeningiz"
}
```

**Response:**

```json
{
  "message": "Logged out successfully"
}
```

**PhpMyAdmin'da tekshiring:**

```sql
-- Refresh token revoked
SELECT id, userId, revoked, device
FROM user_refresh_tokens
ORDER BY id DESC
LIMIT 5;

-- Session terminated
SELECT id, userId, status, logout_at
FROM user_sessions
ORDER BY id DESC
LIMIT 5;

-- Logout audit log
SELECT * FROM user_audit_logs
WHERE event_type = 'logout'
ORDER BY id DESC
LIMIT 3;
```

---

## ✅ Kutilayotgan Natijalar:

1. ✅ 2 ta user yaratiladi
2. ✅ Merge muvaffaqiyatli
3. ✅ User 2: status=blocked, deleted_at=NOW
4. ✅ Audit logs'da 2 ta event:
   - userId=1: event_type='user_merge'
   - userId=2: event_type='user_merged'
5. ✅ Logout qilinganda:
   - refresh_token.revoked = 1
   - user_session.status = 'terminated'
   - audit_log: event_type='logout'

---

## 📱 Qisqa Test:

```bash
# 1. Register (Creator)
username: creator, email: creator@test.com, password: Creator123

# 2. Register (User2)
username: user2, email: user2@test.com, password: User123

# 3. Merge (creator token bilan)
mainUserId: 1, mergedUserId: 2

# 4. PhpMyAdmin'da user_audit_logs'ni ko'ring
http://localhost:8080
Database: user_auth
Table: user_audit_logs

# 5. Logout (creator token bilan)
refreshToken: (creator'ning refresh token'i)
```

---

**Barcha yangi funksiyalar ishga tushirildi!** 🚀

Test qiling va natijani ayting!
