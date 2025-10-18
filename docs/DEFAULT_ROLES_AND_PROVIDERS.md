# Default Roles va OAuth Providers

## ✅ Default Rollar (6 ta)

### 1. **creator** ✨

- **Tavsif:** Tizimning yaratuvchisi
- **Permissions:** Barcha 31 ta permission
- **Qanday olish:** Birinchi ro'yxatdan o'tgan user

### 2. **admin** 🛡️

- **Tavsif:** Administrator
- **Permissions:** Barcha 31 ta permission
- **Qanday olish:** Creator tomonidan tayinlanadi

### 3. **manager** 👀

- **Tavsif:** Menejer
- **Permissions:** Faqat `*.read` permissionlar (8 ta)
- **Qanday olish:** Creator/Admin tomonidan tayinlanadi

### 4. **user** 👤

- **Tavsif:** Oddiy foydalanuvchi
- **Permissions:** Default permissionsiz
- **Qanday olish:** Avtomatik beriladi

### 5. **employee** 👨‍💼 (Yangi!)

- **Tavsif:** Xodim
- **Permissions:** Default permissionsiz
- **Qanday olish:** Auto-role rules yoki manual berish
- **Maqsad:** HEMIS'dan kelgan xodimlar uchun

### 6. **student** 🎓 (Yangi!)

- **Tavsif:** Talaba
- **Permissions:** Default permissionsiz
- **Qanday olish:** Auto-role rules yoki manual berish
- **Maqsad:** Student Portal'dan kelgan talabalar uchun

---

## 🔐 Default OAuth Providers (5 ta)

### 1. **HEMIS** (Active ✅)

```
Name: hemis
Type: oauth
URL: https://hemis.uzswlu.uz
Is Active: true
```

**Maqsad:** UZSWLU HEMIS OAuth authentication

### 2. **Student Portal** (Active ✅) (Yangi!)

```
Name: student
Type: api
URL Login: https://student.uzswlu.uz/rest/v1/auth/login
URL User Info: https://student.uzswlu.uz/rest/v1/account/me
Is Active: true
```

**Maqsad:** UZSWLU Student Portal external API authentication

### 3. **Google** (Inactive ⚪)

```
Name: google
Type: oauth
URL: https://accounts.google.com
Is Active: false
```

**Maqsad:** Google OAuth (sozlash kerak)

### 4. **OneID** (Inactive ⚪)

```
Name: oneid
Type: oauth
URL: https://sso.egov.uz
Is Active: false
```

**Maqsad:** O'zbekiston OneID (sozlash kerak)

### 5. **GitHub** (Inactive ⚪)

```
Name: github
Type: oauth
URL: https://github.com
Is Active: false
```

**Maqsad:** GitHub OAuth (sozlash kerak)

---

## 🎯 Default Auto Role Rules ✅

Bu qoidalar avtomatik yaratiladi va ishlaydi!

### 1. HEMIS Employee Auto Role

**Qoida:** HEMIS orqali kirgan va `type = "employee"` bo'lgan userga avtomatik `employee` roli beriladi.

```json
{
  "id": 1,
  "rule_name": "HEMIS Employee Auto Role",
  "condition_field": "type",
  "condition_operator": "equals",
  "condition_value": "employee",
  "role_id": 5, // employee role
  "provider_id": 1, // hemis provider
  "is_active": true
}
```

**Misol OAuth Data:**

```json
{
  "type": "employee", // ← Bu tekshiriladi
  "name": "John Doe",
  "email": "john@uzswlu.uz"
}
```

### 2. Student Portal Auto Role

**Qoida:** Student Portal orqali kirgan va `student_id` maydoni bo'lgan userga avtomatik `student` roli beriladi.

```json
{
  "id": 2,
  "rule_name": "Student Portal Auto Role",
  "condition_field": "student_id",
  "condition_operator": "contains",
  "condition_value": "", // Har qanday student_id
  "role_id": 6, // student role
  "provider_id": 2, // student provider
  "is_active": true
}
```

**Misol OAuth Data:**

```json
{
  "student_id": "12345", // ← Bu mavjudligi tekshiriladi
  "name": "Jane Smith",
  "email": "jane@student.uzswlu.uz"
}
```

---

## 💡 Qo'shimcha Auto Role Rules Qo'shish

Swagger orqali yangi qoidalar qo'shishingiz mumkin:

```http
POST /api/auto-role-rules
{
  "rule_name": "HEMIS Admin Auto Role",
  "condition_field": "roles[0].code",
  "condition_operator": "equals",
  "condition_value": "admin",
  "role_id": 2,  // admin role
  "provider_id": 1  // hemis
}
```

---

## 📊 Ma'lumotlar Bazasida Ko'rish

### Rollarni ko'rish:

```sql
SELECT id, name, description, is_system FROM roles;
```

**Natija:**

```
+----+----------+----------------------------------+-----------+
| id | name     | description                      | is_system |
+----+----------+----------------------------------+-----------+
|  1 | creator  | System creator with full access  |         1 |
|  2 | admin    | Administrator with full access   |         1 |
|  3 | manager  | Manager with read-only access    |         1 |
|  4 | user     | Regular user with limited access |         1 |
|  5 | employee | Employee with standard access    |         1 |
|  6 | student  | Student with basic access        |         1 |
+----+----------+----------------------------------+-----------+
```

### OAuth Providers'ni ko'rish:

```sql
SELECT id, name, auth_type, is_active FROM oauth_providers;
```

**Natija:**

```
+----+----------+-----------+-----------+
| id | name     | auth_type | is_active |
+----+----------+-----------+-----------+
|  1 | hemis    | oauth     |         1 |
|  2 | student  | api       |         1 |
|  3 | google   | oauth     |         0 |
|  4 | oneid    | oauth     |         0 |
|  5 | github   | oauth     |         0 |
+----+----------+-----------+-----------+
```

---

## 🧪 API Orqali Ko'rish

### Swagger'da:

```
http://localhost:3000
```

### Rollar:

```http
GET /api/roles
```

### OAuth Providers:

```http
GET /api/oauth-providers
```

### Active Providers (public):

```http
GET /api/oauth-providers/active
```

---

## ✅ Summary

**Qo'shildi:**

- ✅ 2 ta yangi default rol: `employee`, `student`
- ✅ 1 ta yangi OAuth provider: `student` (API type)
- ✅ Barcha seed'lar avtomatik ishlaydi
- ✅ Auto-role rules qo'shish mumkin

**Ishlaydi:**

- ✅ HEMIS OAuth authentication
- ✅ Student Portal API authentication
- ✅ Creator role birinchi userga avtomatik
- ✅ Employee va student rollari auto-assignment uchun tayyor

---

**Mualliflar:** Management System Team  
**Sana:** 2025-10-17  
**Versiya:** 1.1
