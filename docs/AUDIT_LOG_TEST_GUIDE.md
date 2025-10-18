# 🧪 Audit Log Test Guide

Barcha audit log eventlarini test qilish uchun to'liq qo'llanma.

---

## ✅ 1. LOGOUT AUDIT LOG

### Test qilish:

#### 1️⃣ **Register:**

```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Pass123!"
}
```

#### 2️⃣ **Login:**

```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "Pass123!"
}
```

**Natija:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

**refreshToken'ni saqlang!**

#### 3️⃣ **Logout:**

```bash
POST http://localhost:3000/api/auth/logout
Content-Type: application/json

{
  "refreshToken": "<login natijasidan olingan refresh token>"
}
```

#### 4️⃣ **Audit log tekshirish:**

```sql
SELECT id, userId, event_type, ip_address, user_agent, created_at
FROM user_audit_logs
WHERE userId = 1
ORDER BY created_at DESC;
```

**Ko'rishingiz kerak:**

- ✅ `logout` - ip_address va user_agent to'ldirilgan
- ✅ `login` - ip_address va user_agent to'ldirilgan

---

## ✅ 2. PASSWORD CHANGE AUDIT LOG

### Test qilish:

#### 1️⃣ **Login qiling** (yuqoridagi ko'rsatma bilan)

#### 2️⃣ **Password change:**

```bash
PATCH http://localhost:3000/api/auth/change-password
Content-Type: application/json
Authorization: Bearer <accessToken>

{
  "oldPassword": "Pass123!",
  "newPassword": "NewPass123!"
}
```

#### 3️⃣ **Audit log tekshirish:**

```sql
SELECT id, userId, event_type, ip_address, user_agent, created_at
FROM user_audit_logs
WHERE userId = 1 AND event_type = 'password_change'
ORDER BY created_at DESC;
```

**Ko'rishingiz kerak:**

- ✅ `password_change` - ip_address va user_agent to'ldirilgan

---

## ✅ 3. MERGE AUDIT LOG

### Test qilish:

#### 1️⃣ **Birinchi user (register):**

```bash
POST http://localhost:3000/api/auth/register
{
  "username": "main_user",
  "email": "main@test.com",
  "password": "Pass123!"
}
```

#### 2️⃣ **Ikkinchi user (HEMIS login):**

- HEMIS orqali login qiling
- Yangi user yaratiladi (userId=2)

#### 3️⃣ **Main user bilan login:**

```bash
POST http://localhost:3000/api/auth/login
{
  "username": "main_user",
  "password": "Pass123!"
}
```

**accessToken oling!**

#### 4️⃣ **Merge (Link OAuth to User):**

**A. Authorization URL oling:**

```bash
GET http://localhost:3000/api/auth/link/hemis
Authorization: Bearer <accessToken>
```

**Natija:**

```json
{
  "authorizationUrl": "https://hemis.uzswlu.uz/oauth/authorize?..."
}
```

**B. Browser'da ochib HEMIS'ga kiring:**

- `authorizationUrl` ni browser'da oching
- HEMIS'ga login qiling
- Avtomatik merge bo'ladi va redirect qiladi

#### 5️⃣ **Audit log tekshirish:**

```sql
SELECT id, userId, event_type, ip_address, user_agent, description, created_at
FROM user_audit_logs
WHERE event_type IN ('user_merge', 'user_merged')
ORDER BY created_at DESC;
```

**Ko'rishingiz kerak:**

- ✅ `user_merge` (userId=1, main user) - ip_address va user_agent to'ldirilgan
- ✅ `user_merged` (userId=2, merged user) - ip_address va user_agent to'ldirilgan
- ✅ `description`: "Merged user 2 into this account via OAuth"

---

## ✅ 4. EXTERNAL API PROVIDER MERGE (STUDENT)

### **Yangi Endpoint:**

```bash
POST /api/auth/link-external/{provider}
Authorization: Bearer <token>
{
  "login": "student_id",
  "password": "student_password"
}
```

### Test qilish:

#### 1️⃣ **Main user yarating:**

```bash
POST http://localhost:3000/api/auth/register
{
  "username": "main_user",
  "email": "main@test.com",
  "password": "Pass123!"
}
```

#### 2️⃣ **Login qiling:**

```bash
POST http://localhost:3000/api/auth/login
{
  "username": "main_user",
  "password": "Pass123!"
}
```

**accessToken va refreshToken oling!**

#### 3️⃣ **Student account link qiling:**

```bash
POST http://localhost:3000/api/auth/link-external/student
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "login": "your_student_id",
  "password": "your_student_password"
}
```

**Natija:**

- ✅ Agar student account yangi → link yaratiladi
- ✅ Agar boshqa user'da → **avtomatik merge!**
- ✅ Audit log yoziladi (IP, UA, description)

#### 4️⃣ **Audit log tekshiring:**

```sql
SELECT id, userId, event_type, ip_address, user_agent, description, created_at
FROM user_audit_logs
WHERE event_type IN ('user_merge', 'user_merged')
ORDER BY created_at DESC;
```

**Ko'rishingiz kerak:**

- ✅ `user_merge` (main user uchun)
- ✅ `user_merged` (student user uchun)
- ✅ IP address va User-Agent to'ldirilgan

---

## 📊 BARCHA AUDIT LOG'LARNI KO'RISH:

```sql
SELECT id, userId, event_type, ip_address,
       LEFT(user_agent, 50) as ua_short,
       LEFT(description, 40) as desc_short,
       created_at
FROM user_audit_logs
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🔍 EVENT TYPE'LAR:

- ✅ `login` - Kirish
- ✅ `logout` - Chiqish
- ✅ `password_change` - Parol o'zgartirish
- ✅ `user_merge` - Accountlarni birlashtirish (asosiy user)
- ✅ `user_merged` - Accountlarni birlashtirish (qo'shilgan user)
- ✅ `2fa_enable` - 2FA yoqish
- ✅ `2fa_disable` - 2FA o'chirish
- ✅ `token_revoke` - Token bekor qilish

---

## 📝 IMPORTANT:

1. **Logout uchun** - Login'dan **refreshToken**'ni saqlang!
2. **Merge uchun** - Browser orqali OAuth callback'ni ochish kerak
3. **IP address** - Docker ichida `::ffff:172.18.0.1` ko'rinadi (normal)
4. **User-Agent** - Browser'dan avtomatik keladi

---

## 🚀 QUICK TEST:

```bash
# 1. Register
curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{"username":"test1","email":"test1@test.com","password":"Pass123!"}'

# 2. Login
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"username":"test1","password":"Pass123!"}'

# 3. Logout (refreshToken ni 2-qadamdan oling)
curl -X POST http://localhost:3000/api/auth/logout -H "Content-Type: application/json" -d '{"refreshToken":"<paste token here>"}'

# 4. Check audit logs
docker-compose exec -T db mysql -u root -p'P@ssw0rd!' auth_management -e "SELECT * FROM user_audit_logs ORDER BY created_at DESC LIMIT 5;"
```

---

**PhpMyAdmin:** http://localhost:8080  
**Swagger:** http://localhost:3000
