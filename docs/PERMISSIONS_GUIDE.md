# 🔐 Permissions va Roles Bo'yicha Qo'llanma

## Rollar va Permissionlar

### 👥 Rollar:

#### 1. **Creator** ✨

- **Tavsif:** Tizimning yaratuvchisi, to'liq huquqlar
- **Permissionlar:** Barcha 31 ta permission
- **Qanday olish:** Birinchi ro'yxatdan o'tgan user avtomatik creator bo'ladi

#### 2. **Admin** 🛡️

- **Tavsif:** Administrator, to'liq boshqaruv huquqlari
- **Permissionlar:** Barcha 31 ta permission
- **Qanday olish:** Creator tomonidan tayinlanadi

#### 3. **Manager** 👀

- **Tavsif:** Menejer, faqat ko'rish huquqi
- **Permissionlar:** Faqat `GET` endpoints (barcha read operations)
- **Qanday olish:** Creator yoki Admin tomonidan tayinlanadi

#### 4. **User** 👤

- **Tavsif:** Oddiy foydalanuvchi
- **Permissionlar:** Default permissionsiz
- **Qanday olish:** Avtomatik beriladi

---

## 📋 Permissionlar Ro'yxati (Endpoint Format)

### 1. User Management

```
GET    /api/users                      → Foydalanuvchilarni ko'rish
GET    /api/users/:id                  → Foydalanuvchi ma'lumotlari
POST   /api/users                      → Yangi foydalanuvchi yaratish
PATCH  /api/users/:id                  → Foydalanuvchi yangilash
DELETE /api/users/:id                  → Foydalanuvchini o'chirish
GET    /api/users/:id/roles            → Foydalanuvchi rollarini ko'rish
POST   /api/users/:id/roles            → Rol biriktirish
DELETE /api/users/:id/roles/:roleId    → Rolni olib tashlash
```

### 2. Role Management

```
GET    /api/roles                      → Rollarni ko'rish
GET    /api/roles/:id                  → Rol ma'lumotlari
POST   /api/roles                      → Yangi rol yaratish
PATCH  /api/roles/:id                  → Rol yangilash
DELETE /api/roles/:id                  → Rolni o'chirish
```

### 3. Permission Management

```
GET    /api/permissions                → Permissionlarni ko'rish
GET    /api/permissions/:id            → Permission ma'lumotlari
POST   /api/permissions                → Yangi permission yaratish
PATCH  /api/permissions/:id            → Permission yangilash
DELETE /api/permissions/:id            → Permission o'chirish
```

### 4. Company Management

```
GET    /api/companies                  → Kompaniyalarni ko'rish
GET    /api/companies/:id              → Kompaniya ma'lumotlari
POST   /api/companies                  → Yangi kompaniya yaratish
PATCH  /api/companies/:id              → Kompaniya yangilash
DELETE /api/companies/:id              → Kompaniyani o'chirish
POST   /api/companies/:id/upload-logo  → Logo yuklash
```

### 5. OAuth Management

```
GET    /api/oauth-providers                         → OAuth providerlar
GET    /api/oauth-providers/:id                     → Provider ma'lumotlari
POST   /api/oauth-providers                         → Provider yaratish
PATCH  /api/oauth-providers/:id                     → Provider yangilash
DELETE /api/oauth-providers/:id                     → Provider o'chirish
PATCH  /api/oauth-providers/:id/toggle-active       → Faollikni o'zgartirish
GET    /api/oauth-accounts                          → OAuth accountlar
GET    /api/oauth-accounts/user/:userId             → User accountlari
POST   /api/oauth-accounts/user/:userId/link        → Account biriktirish
DELETE /api/oauth-accounts/user/:userId/accounts/:accountId → Account uzish
```

### 6. Auto Role Rules

```
GET    /api/auto-role-rules                         → Qoidalar ro'yxati
GET    /api/auto-role-rules/:id                     → Qoida ma'lumotlari
GET    /api/auto-role-rules/provider/:providerId    → Provider qoidalari
POST   /api/auto-role-rules                         → Qoida yaratish
PATCH  /api/auto-role-rules/:id                     → Qoida yangilash
DELETE /api/auto-role-rules/:id                     → Qoida o'chirish
```

### 7. User Merge

```
GET    /api/user-merge                  → Merge tarixi
GET    /api/user-merge/:id              → Merge ma'lumotlari
GET    /api/user-merge/user/:userId     → User merge tarixi
POST   /api/user-merge                  → Userlarni birlashtirish
```

### 8. User Profiles

```
GET    /api/user-profiles/me            → O'z profilimni ko'rish
GET    /api/user-profiles/all           → Barcha profillar
POST   /api/user-profiles/preferences   → Sozlamalarni saqlash
```

---

## 🎯 Endpointlar va Kerakli Rollar

### Companies

```typescript
POST   /api/companies              → creator, admin
GET    /api/companies              → creator, admin
GET    /api/companies/:id          → creator, admin
PATCH  /api/companies/:id          → creator, admin
DELETE /api/companies/:id          → creator, admin
POST   /api/companies/:id/upload-logo → creator, admin
```

### Users

```typescript
POST   /api/users                  → creator, admin
GET    /api/users                  → creator, admin, manager
GET    /api/users/:id              → creator, admin, manager
PATCH  /api/users/:id              → creator, admin
DELETE /api/users/:id              → creator, admin
GET    /api/users/:id/roles        → creator, admin, manager
POST   /api/users/:id/roles        → creator, admin
DELETE /api/users/:id/roles/:roleId → creator, admin
```

### Roles

```typescript
POST   /api/roles                  → creator, admin
GET    /api/roles                  → creator, admin, manager
GET    /api/roles/:id              → creator, admin, manager
PATCH  /api/roles/:id              → creator, admin
DELETE /api/roles/:id              → creator, admin
```

### OAuth Providers

```typescript
POST   /api/oauth-providers        → creator, admin
GET    /api/oauth-providers        → creator, admin, manager
GET    /api/oauth-providers/:id    → creator, admin, manager
PATCH  /api/oauth-providers/:id    → creator, admin
DELETE /api/oauth-providers/:id    → creator, admin
PATCH  /api/oauth-providers/:id/toggle-active → creator, admin
```

---

## 🧪 Test Qilish

### 1. Birinchi User (Creator)

```bash
# Register qiling (birinchi user avtomatik creator bo'ladi)
POST /api/auth/register
{
  "username": "admin",
  "email": "admin@example.com",
  "password": "Admin123456"
}

# Response'da token oling
{
  "accessToken": "eyJhbGc...",
  "user": {
    "id": 1,
    "username": "admin",
    "roles": [
      {
        "role": {
          "name": "creator"
        }
      }
    ]
  }
}
```

### 2. Token bilan Swagger'da Test

1. Swagger'ni oching: `http://localhost:3000`
2. **Authorize** tugmasini bosing
3. Token'ni kiriting: `Bearer eyJhbGc...`
4. Istalgan endpoint'ni test qiling

### 3. Boshqa Userlarga Rol Berish

```bash
# Admin roli berish (creator sifatida)
POST /api/users/:userId/roles
{
  "roleId": 2  # admin role ID
}
```

---

## 🔧 Troubleshooting

### 403 Forbidden Xatosi

**Muammo:** Endpoint'ga kirish rad etildi

**Yechimlar:**

1. **Token'ni tekshiring:**

```bash
GET /api/auth/me
```

2. **User rollarini ko'ring:**

```bash
GET /api/users/:id
# Response:
{
  "id": 1,
  "username": "admin",
  "roles": [
    {
      "role": {
        "name": "creator",
        "permissions": [...]
      }
    }
  ]
}
```

3. **Birinchi user creator emasligini tekshiring:**

```bash
# Ma'lumotlar bazasida:
SELECT u.id, u.username, r.name as role
FROM user u
LEFT JOIN user_roles ur ON u.id = ur.userId
LEFT JOIN roles r ON ur.roleId = r.id
WHERE u.id = 1;

# Agar rol yo'q bo'lsa, qo'lda qo'shing:
INSERT INTO user_roles (userId, roleId)
VALUES (1, (SELECT id FROM roles WHERE name = 'creator'));
```

---

## 🚀 Production uchun

### Birinchi User Creator Bo'lishi

Server deploy qilinganda:

1. **Birinchi user yaratish:**

```bash
curl -X POST http://your-api.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin",
    "email": "admin@company.com",
    "password": "SecurePassword123!"
  }'
```

2. **Tekshirish:**

```bash
curl -X GET http://your-api.com/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📝 Muhim Eslatmalar

1. ✅ **UserId=1** doim **creator** rolida bo'lishi kerak
2. ✅ **Creator** boshqa userlarga **har qanday rol** bera oladi
3. ✅ **Birinchi register** qilingan user avtomatik **creator** bo'ladi
4. ✅ **OAuth** orqali birinchi login ham **creator** rolini oladi
5. ⚠️ **Manager** faqat ko'rish huquqiga ega
6. ⚠️ **User** default permissionsiz, kerakli rollar berilishi kerak

---

## 🔄 Role O'zgartirish

### Creator tomonidan:

```typescript
// Admin berish
POST /api/users/2/roles
{ "roleId": 2 }

// Manager berish
POST /api/users/3/roles
{ "roleId": 3 }

// Rolni olib tashlash
DELETE /api/users/2/roles/2
```

---

**Mualliflar:** Management System Team  
**Versiya:** 1.0  
**Sana:** 2025-10-17
