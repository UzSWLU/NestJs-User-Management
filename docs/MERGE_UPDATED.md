# ✅ User Merge - To'g'ri Implementatsiya

## 📋 Yangi Mexanizm:

### ❌ Oldingi (Noto'g'ri):

```typescript
// Merged user soft delete qilinardi
mergedUser.deleted_at = new Date();
mergedUser.status = 'blocked';

// Natija: User o'chib ketadi, faqat merge_history da saqlanadi
```

### ✅ Hozir (To'g'ri):

```typescript
// Merged user FAQAT blocked, soft delete YO'Q
mergedUser.status = 'blocked';
// deleted_at NULL qoladi!

// Natija: Ikkala user ham saqlanadi
// - Main user: status = 'active'
// - Merged user: status = 'blocked'
// - Merge history: bog'lash uchun
```

---

## 🔄 Merge Jarayoni:

### 1. Ikkita User:

```
User 1: username=creator, email=creator@test.com, status=active
User 2: username=employee, email=employee@test.com, status=active
```

### 2. Merge (User 2 → User 1):

```json
POST /api/user-merge
{
  "mainUserId": 1,
  "mergedUserId": 2
}
```

### 3. Natija:

```
User 1:
  - id: 1
  - username: creator
  - email: creator@test.com
  - status: active ✅
  - deleted_at: NULL ✅

User 2:
  - id: 2
  - username: employee
  - email: employee@test.com
  - status: blocked ⚠️
  - deleted_at: NULL ✅  (SOFT DELETE YO'Q!)

user_merge_history:
  - id: 1
  - main_user_id: 1
  - merged_user_id: 2
  - merged_at: NOW

user_audit_logs:
  - userId=1, event_type='user_merge', description='Merged user 2...'
  - userId=2, event_type='user_merged', description='This account was merged...'
```

---

## 🔐 Login Scenariyalari:

### Scenario 1: Main User (Active)

```
User 1 → Sistema Login → ✅ Success
User 1 → OAuth Login → ✅ Success
```

### Scenario 2: Merged User (Blocked)

```
User 2 → Sistema Login → ❌ "Account blocked"
User 2 → OAuth Login → ✅ Redirect to User 1 (main)
```

**Muhim:** OAuth orqali kirganda avtomatik main user'ga redirect!

---

## 📊 Ma'lumotlar Bazasida Ko'rinishi:

### user table:

```sql
SELECT id, username, email, status, deleted_at
FROM user
ORDER BY id;
```

**Natija:**

```
+----+----------+---------------------+---------+------------+
| id | username | email               | status  | deleted_at |
+----+----------+---------------------+---------+------------+
|  1 | creator  | creator@test.com    | active  | NULL       |
|  2 | employee | employee@test.com   | blocked | NULL       |
+----+----------+---------------------+---------+------------+
```

### user_merge_history:

```sql
SELECT * FROM user_merge_history;
```

**Natija:**

```
+----+--------------+---------------+---------------------+
| id | main_user_id | merged_user_id| merged_at           |
+----+--------------+---------------+---------------------+
|  1 |            1 |             2 | 2025-10-18 08:00:00 |
+----+--------------+---------------+---------------------+
```

### user_audit_logs:

```sql
SELECT id, userId, event_type, description
FROM user_audit_logs
WHERE event_type IN ('user_merge', 'user_merged')
ORDER BY id;
```

**Natija:**

```
+----+--------+--------------+------------------------------------------------+
| id | userId | event_type   | description                                    |
+----+--------+--------------+------------------------------------------------+
|  3 |      1 | user_merge   | Merged user 2 (employee) into this account     |
|  4 |      2 | user_merged  | This account was merged into user 1 (creator)  |
+----+--------+--------------+------------------------------------------------+
```

---

## 🎯 Afzalliklari:

1. ✅ **Ikkala user ham saqlanadi** - Ma'lumotlar yo'qolmaydi
2. ✅ **Merge history aniq** - Qaysi user qaysi userga merged
3. ✅ **Audit logs to'liq** - Har ikki user uchun log
4. ✅ **OAuth seamless** - Blocked user OAuth orqali main user'ga kiradi
5. ✅ **Sistema login himoyalangan** - Blocked user kira olmaydi
6. ✅ **Duplicate error yo'q** - Email/phone check qilinadi

---

## 🧪 Test Qo'llanma:

### Swagger: http://localhost:3000

**Qadam 1:** 2 ta user yarating
**Qadam 2:** Merge qiling (creator token bilan)
**Qadam 3:** PhpMyAdmin'da tekshiring (http://localhost:8080)

```sql
-- Ikkala user ham bor
SELECT id, username, status, deleted_at FROM user;

-- Merge history
SELECT * FROM user_merge_history;

-- Audit logs
SELECT * FROM user_audit_logs WHERE event_type LIKE 'user_merge%';
```

---

**Endi to'g'ri! Ikkala user ham saqlanadi!** ✅
