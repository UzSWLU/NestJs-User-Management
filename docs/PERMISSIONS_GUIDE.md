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
- **Permissionlar:** Faqat `*.read` permissionlar (8 ta)
- **Qanday olish:** Creator yoki Admin tomonidan tayinlanadi

#### 4. **User** 👤

- **Tavsif:** Oddiy foydalanuvchi
- **Permissionlar:** Default permissionsiz
- **Qanday olish:** Avtomatik beriladi

---

## 📋 Permissionlar Ro'yxati (31 ta)

### 1. User Management (5 permissions)

```
- users.read          → Foydalanuvchilarni ko'rish
- users.create        → Yangi foydalanuvchi yaratish
- users.update        → Foydalanuvchi ma'lumotlarini yangilash
- users.delete        → Foydalanuvchini o'chirish
- users.assignRole    → Foydalanuvchiga rol biriktirish
```

### 2. Role Management (8 permissions)

```
- roles.read          → Rollarni ko'rish
- roles.create        → Yangi rol yaratish
- roles.update        → Rol ma'lumotlarini yangilash
- roles.delete        → Rolni o'chirish
- permissions.read    → Permissionlarni ko'rish
- permissions.create  → Yangi permission yaratish
- permissions.update  → Permission yangilash
- permissions.delete  → Permission o'chirish
```

### 3. Company Management (5 permissions)

```
- companies.read      → Kompaniyalarni ko'rish
- companies.create    → Yangi kompaniya yaratish
- companies.update    → Kompaniya ma'lumotlarini yangilash
- companies.delete    → Kompaniyani o'chirish
- companies.uploadLogo → Kompaniya logosini yuklash
```

### 4. OAuth Management (7 permissions)

```
- oauth.providers.read    → OAuth providerlarni ko'rish
- oauth.providers.create  → Yangi provider yaratish
- oauth.providers.update  → Provider yangilash
- oauth.providers.delete  → Provider o'chirish
- oauth.accounts.read     → OAuth accountlarni ko'rish
- oauth.accounts.link     → OAuth account biriktirish
- oauth.accounts.unlink   → OAuth account uzish
```

### 5. Auto Role Rules (4 permissions)

```
- autoRoleRules.read      → Qoidalarni ko'rish
- autoRoleRules.create    → Yangi qoida yaratish
- autoRoleRules.update    → Qoidani yangilash
- autoRoleRules.delete    → Qoidani o'chirish
```

### 6. User Merge (2 permissions)

```
- userMerge.read          → Merge tarixini ko'rish
- userMerge.merge         → Userlarni birlashtirish
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
