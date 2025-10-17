# 🚀 NestJS User Management System

Production-ready user management and authentication system built with NestJS, TypeORM, and MySQL.

[![CI](https://github.com/yourorg/management/workflows/CI/badge.svg)](https://github.com/yourorg/management/actions)
[![CD](https://github.com/yourorg/management/workflows/CD/badge.svg)](https://github.com/yourorg/management/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## ✨ Features

### 🔐 Authentication & Authorization

- **JWT-based authentication** with access & refresh tokens
- **Local strategy** (username/email + password)
- **Token rotation** - old refresh tokens are revoked on refresh
- **Role-based access control (RBAC)** with permissions
- **First user auto-assignment** to "creator" role
- **Session tracking** with device, IP, and user-agent

### 👥 User Management

- Full CRUD operations for users
- Pagination support
- Email & phone verification fields
- Password history tracking
- 2FA support entities
- Audit logging
- Soft delete support

### 🛡️ Security Features

- **Helmet** - Security headers
- **CORS** - Configurable cross-origin requests
- **Rate limiting** - Protection against brute force
- **Password hashing** with bcrypt
- **Global exception filter** for consistent error responses
- **Request validation** with class-validator

### 📚 API Documentation

- **Swagger UI** - Interactive API documentation at `/`
- Full request/response examples
- Bearer token authentication support
- Organized by tags (auth, users, roles, permissions)

### 🌍 Timezone Support

- **Tashkent timezone (UTC+5)** configured globally
- Consistent timestamps across app, database, and Docker
- Utility functions for date operations

### 🗄️ Database Features

- **TypeORM** with MySQL 8.0
- Auto-synchronization in development
- Migration support (production-ready)
- Comprehensive entity relationships
- Seeding for roles & permissions

## 📋 Database Schema

### Core Entities

- **User** - User accounts with authentication
- **Company** - Multi-tenant support
- **Role** - User roles (creator, admin, manager, user)
- **Permission** - Granular permissions
- **PermissionGroup** - Organized permission groups
- **RolePermission** - Role-permission mapping
- **UserRole** - User-role mapping

### Auth Entities

- **UserRefreshToken** - Token rotation & tracking
- **UserSession** - Active session management
- **UserPasswordHistory** - Password change history
- **User2FA** - Two-factor authentication
- **UserAuditLog** - Security audit trail
- **JwtSecretVersion** - JWT secret rotation

### OAuth Entities

- **OAuthProvider** - OAuth provider config (Google, HEMIS, OneID)
- **UserOAuthAccount** - Linked OAuth accounts
- **UserProfile** - Extended user profiles
- **UserProfilePreference** - User preferences
- **UserAutoRoleRule** - Auto role assignment rules
- **UserMergeHistory** - Account merge tracking

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 22+ (for local development)

### 1. Environment Setup

Create a `.env` file in the root:

```env
# App Configuration
APP_PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_ACCESS_EXPIRES_SECONDS=900
JWT_REFRESH_EXPIRES_SECONDS=604800

# Database Configuration
DB_HOST=db
DB_PORT=3306
DB_USER=app
DB_PASSWORD=app
DB_PASS=app
DB_NAME=management

# Timezone
TZ=Asia/Tashkent

# phpMyAdmin
PMA_PORT=8080
```

### 2. Start with Docker

```bash
# Build and start all services
docker compose up -d --build

# View logs
docker compose logs -f api

# Stop services
docker compose down

# Stop and remove volumes (clean slate)
docker compose down -v
```

### 3. Access Services

- **API & Swagger**: http://localhost:3000/
- **phpMyAdmin**: http://localhost:8080/
  - Server: `db`
  - Username: `app`
  - Password: `app`

## 📖 API Endpoints

### Authentication (`/auth`)

| Method | Endpoint                   | Description                         | Auth Required |
| ------ | -------------------------- | ----------------------------------- | ------------- |
| POST   | `/auth/register`           | Register new user                   | ❌            |
| POST   | `/auth/login`              | Login user                          | ❌            |
| POST   | `/auth/refresh`            | Refresh access token                | ❌            |
| POST   | `/auth/logout`             | Logout (revoke token)               | ❌            |
| GET    | `/auth/me`                 | Get current user profile            | ✅            |
| PATCH  | `/auth/change-password`    | Change user password                | ✅            |
| GET    | `/auth/login/:provider`    | **🚀 Direct OAuth login (browser)** | ❌            |
| GET    | `/auth/oauth/:provider`    | Get OAuth authorization URL (API)   | ❌            |
| GET    | `/auth/callback/:provider` | OAuth callback (auto-handled)       | ❌            |

### Users (`/users`)

| Method | Endpoint                   | Description            | Roles                   |
| ------ | -------------------------- | ---------------------- | ----------------------- |
| POST   | `/users`                   | Create user            | admin                   |
| GET    | `/users`                   | List users (paginated) | admin, manager          |
| GET    | `/users/:id`               | Get user by ID         | admin, manager          |
| PATCH  | `/users/:id`               | Update user            | admin                   |
| DELETE | `/users/:id`               | Delete user            | admin                   |
| GET    | `/users/:id/roles`         | Get user roles         | admin, creator, manager |
| POST   | `/users/:id/roles`         | Assign role to user    | admin, creator          |
| DELETE | `/users/:id/roles/:roleId` | Remove role from user  | admin, creator          |

### Roles (`/roles`)

| Method | Endpoint     | Description            | Roles          |
| ------ | ------------ | ---------------------- | -------------- |
| POST   | `/roles`     | Create role            | admin          |
| GET    | `/roles`     | List roles (paginated) | admin, manager |
| GET    | `/roles/:id` | Get role by ID         | admin, manager |
| PATCH  | `/roles/:id` | Update role            | admin          |
| DELETE | `/roles/:id` | Delete role            | admin          |

### Permissions (`/permissions`)

| Method | Endpoint           | Description                  | Roles          |
| ------ | ------------------ | ---------------------------- | -------------- |
| POST   | `/permissions`     | Create permission            | admin          |
| GET    | `/permissions`     | List permissions (paginated) | admin, manager |
| GET    | `/permissions/:id` | Get permission by ID         | admin, manager |
| PATCH  | `/permissions/:id` | Update permission            | admin          |
| DELETE | `/permissions/:id` | Delete permission            | admin          |

### OAuth Providers (`/oauth-providers`)

| Method | Endpoint                             | Description                   | Roles          |
| ------ | ------------------------------------ | ----------------------------- | -------------- |
| POST   | `/oauth-providers`                   | Create OAuth provider         | admin, creator |
| GET    | `/oauth-providers`                   | List all providers            | admin, creator |
| GET    | `/oauth-providers/:id`               | Get provider by ID            | admin, creator |
| PATCH  | `/oauth-providers/:id`               | Update provider               | admin, creator |
| DELETE | `/oauth-providers/:id`               | Delete provider               | admin, creator |
| PATCH  | `/oauth-providers/:id/toggle-active` | Toggle provider active status | admin, creator |

**Provider fields:**

- `name` - Provider name (hemis, google, oneid, github, etc.)
- `client_id` - OAuth client ID
- `client_secret` - OAuth client secret
- `redirect_uri` - OAuth redirect URL
- `url_authorize` - OAuth authorization endpoint
- `url_access_token` - OAuth token endpoint
- `url_resource_owner_details` - OAuth user info endpoint
- `is_active` - Provider status

**Pre-seeded providers:** HEMIS (active), Google, OneID, GitHub (inactive)

### OAuth Accounts (`/oauth-accounts`)

| Method | Endpoint                                           | Description               | Roles          |
| ------ | -------------------------------------------------- | ------------------------- | -------------- |
| GET    | `/oauth-accounts`                                  | List all OAuth accounts   | admin, creator |
| GET    | `/oauth-accounts/user/:userId`                     | Get user's OAuth accounts | admin, creator |
| POST   | `/oauth-accounts/user/:userId/link`                | Link OAuth account        | admin, creator |
| DELETE | `/oauth-accounts/user/:userId/accounts/:accountId` | Unlink OAuth account      | admin, creator |

### User Merge (`/user-merge`)

| Method | Endpoint                   | Description            | Roles          |
| ------ | -------------------------- | ---------------------- | -------------- |
| POST   | `/user-merge`              | Merge two users        | admin, creator |
| GET    | `/user-merge`              | List merge history     | admin, creator |
| GET    | `/user-merge/:id`          | Get merge by ID        | admin, creator |
| GET    | `/user-merge/user/:userId` | Get user merge history | admin, creator |

### Auto Role Rules (`/auto-role-rules`)

| Method | Endpoint                                | Description           | Roles          |
| ------ | --------------------------------------- | --------------------- | -------------- |
| POST   | `/auto-role-rules`                      | Create auto-role rule | admin, creator |
| GET    | `/auto-role-rules`                      | List all rules        | admin, creator |
| GET    | `/auto-role-rules/:id`                  | Get rule by ID        | admin, creator |
| PATCH  | `/auto-role-rules/:id`                  | Update rule           | admin, creator |
| DELETE | `/auto-role-rules/:id`                  | Delete rule           | admin, creator |
| GET    | `/auto-role-rules/provider/:providerId` | Get rules by provider | admin, creator |

## 🔑 Default Roles

The system seeds 4 default roles on startup:

1. **creator** (🔥 First registered user)
   - Full access to all resources
   - Cannot be deleted
   - 12 permissions

2. **admin**
   - Full access to all resources
   - Can manage users, roles, permissions
   - 12 permissions

3. **manager**
   - Read-only access
   - Can view users, roles, permissions
   - 3 permissions (\*.read)

4. **user** (Default for all other users)
   - No default permissions
   - Requires manual permission assignment

## 🎯 Usage Examples

### Register First User (Creator)

```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "username": "admin",
  "email": "admin@example.com",
  "password": "SecurePass123!"
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "status": "active"
  }
}
```

### Login

```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "login": "admin",
  "password": "SecurePass123!"
}
```

### Refresh Token

```bash
POST http://localhost:3000/api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

**Note**: Old refresh token is automatically revoked (`revoked=1`), and a new token is issued with:

- `device`, `ip_address`, `user_agent` tracked
- `rotated_from` links to old token ID
- `rotated_at` timestamp recorded

### OAuth Login (HEMIS Example)

#### 🚀 **Recommended Flow (API + Browser)**

**Step 1:** Get authorization URL from API

```bash
GET http://localhost:3000/api/auth/login/hemis
```

**Response:**

```json
{
  "authorizationUrl": "https://hemis.uzswlu.uz/oauth/authorize?response_type=code&client_id=4&redirect_uri=http://localhost:3000/api/auth/callback/hemis",
  "provider": "hemis",
  "callbackUrl": "http://localhost:3000/api/auth/callback/hemis",
  "message": "Open authorizationUrl in browser to login"
}
```

> 📝 **Note:** Authorization URL is fetched from database (`oauth_providers` table) with `client_id`, `redirect_uri`, and `url_authorize` configured.

**Step 2:** Open `authorizationUrl` in browser

User will be redirected to HEMIS login page to authenticate.

**Step 3:** After successful login, HEMIS redirects back to callback:

```
http://localhost:3000/api/auth/callback/hemis?code=abc123def456
```

**Step 4:** Backend automatically:

- ✅ Exchanges authorization code for access token
- ✅ Fetches user info from HEMIS
- ✅ Creates/updates user in `users` table
- ✅ Links OAuth account in `user_oauth_accounts`
- ✅ Applies auto-role rules (if configured)
- ✅ Generates JWT tokens (accessToken + refreshToken)
- ✅ Redirects to `front_redirect` URL from database with tokens

**Step 5:** User is redirected to frontend with tokens:

```
http://your-frontend-app.com/auth/success?accessToken=...&refreshToken=...&userId=...&username=...&email=...
```

> 🔐 **Important:** The `front_redirect` URL is configured in the `oauth_providers.front_redirect` field in database.

**Example Response (if no `front_redirect` configured):**

```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": 2,
    "username": "hemis_12345",
    "email": "user@uzswlu.uz",
    "full_name": "John Doe",
    "status": "active",
    "roles": [
      {
        "id": 4,
        "role": {
          "id": 4,
          "name": "user",
          "description": "Default user role"
        }
      }
    ]
  }
}
```

---

#### **What happens on first OAuth login:**

1. ✅ User info fetched from OAuth provider (HEMIS)
2. ✅ New user created in `users` table (if doesn't exist)
3. ✅ OAuth account linked in `user_oauth_accounts` table
4. ✅ Auto-role rules applied based on `user_auto_role_rules` (e.g., assign "student" role if `type=student`)
5. ✅ Default "user" role assigned (if no auto-role matched)
6. ✅ Session created in `user_sessions`
7. ✅ Refresh token stored in `user_refresh_tokens`
8. ✅ Login event logged in `user_audit_logs`
9. ✅ User redirected to `front_redirect` URL with tokens

---

#### **Alternative: OAuth URL Method (For Frontend Apps)**

If you prefer to get just the OAuth URL:

```bash
GET http://localhost:3000/api/auth/oauth/hemis
```

**Response:**

```json
{
  "authUrl": "https://hemis.uzswlu.uz/oauth/authorize?response_type=code&client_id=4&redirect_uri=http://localhost:3000/api/auth/callback/hemis",
  "provider": "hemis",
  "redirectUri": "http://localhost:3000/api/auth/callback/hemis"
}
```

> **Note:** Scope parameter is automatically set based on provider:
>
> - **HEMIS**: No scope (not required)
> - **OneID**: No scope (not required)
> - **Google**: `openid email profile`
> - **GitHub**: `user:email`

Then redirect user to `authUrl` in your frontend application.

---

### OAuth Provider Configuration

OAuth providers are automatically seeded on first startup. You can manage them via API:

#### View All Providers

```bash
GET http://localhost:3000/api/oauth-providers
Authorization: Bearer <accessToken>
```

#### Update Provider (Configure `front_redirect`)

```bash
PATCH http://localhost:3000/api/oauth-providers/1
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "front_redirect": "http://localhost:3001/auth/success"
}
```

#### Update Provider Credentials

```bash
PATCH http://localhost:3000/api/oauth-providers/1
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "client_id": "your_client_id",
  "client_secret": "your_client_secret",
  "redirect_uri": "http://localhost:3000/api/auth/callback/hemis",
  "is_active": true
}
```

**Seeded Providers:**

| Provider | Name     | Status      | Description         |
| -------- | -------- | ----------- | ------------------- |
| HEMIS    | `hemis`  | ✅ Active   | UZSWLU HEMIS system |
| Google   | `google` | ⚠️ Inactive | Needs configuration |
| OneID    | `oneid`  | ⚠️ Inactive | Needs configuration |
| GitHub   | `github` | ⚠️ Inactive | Needs configuration |

---

### Link OAuth Account to Existing User

If you already have a user account and want to link an OAuth provider (e.g., HEMIS) to it:

**Step 1:** Login to get access token

```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "login": "testuser",
  "password": "Test123!"
}
```

**Step 2:** Get OAuth link URL

```bash
GET http://localhost:3000/api/auth/link/hemis
Authorization: Bearer <accessToken>
```

**Response:**

```json
{
  "authorizationUrl": "https://hemis.uzswlu.uz/oauth/authorize?response_type=code&client_id=4&redirect_uri=http://localhost:3000/api/auth/callback/hemis&state=eyJ1c2VySWQiOjEsImZsb3ciOiJsaW5rIn0=",
  "provider": "hemis",
  "message": "Open authorizationUrl in browser to link your HEMIS account..."
}
```

**Step 3:** Open `authorizationUrl` in browser and login to HEMIS

**Step 4:** After successful linking:

**With `front_redirect` configured:**

```
Redirects to: http://your-frontend.com/auth/success?linked=true&provider=hemis&userId=1&username=testuser&email=test@example.com
```

**Without `front_redirect`:**

```json
{
  "success": true,
  "message": "HEMIS account linked successfully",
  "provider": "hemis",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

**On error (account already linked to another user):**

**With `front_redirect`:**

```
Redirects to: http://your-frontend.com/auth/success?linked=false&error=This+hemis+account+is+already+linked...&provider=hemis
```

**Without `front_redirect`:**

```json
{
  "success": false,
  "message": "Failed to link OAuth account",
  "error": "This hemis account is already linked to another user",
  "provider": "hemis"
}
```

**Auto-merge feature:**

- ✅ If the OAuth account is already linked to a user with **the same email**, it will automatically merge
- ❌ If different emails, linking will fail (manual unlink required)

---

### Protected Endpoints

Add `Authorization: Bearer <accessToken>` header:

```bash
GET http://localhost:3000/api/users
Authorization: Bearer eyJhbGc...
```

## 🔧 Development

### Local Development (without Docker)

```bash
# Install dependencies
npm install

# Start MySQL (or use Docker Compose for DB only)
docker compose up -d db phpmyadmin

# Update .env for local DB connection
DB_HOST=localhost

# Run development server
npm run start:dev

# Build for production
npm run build

# Run production build
npm run start:prod
```

### Code Quality

```bash
# Lint
npm run lint

# Format
npm run format

# Run tests
npm run test

# E2E tests
npm run test:e2e
```

## 📁 Project Structure

```
src/
├── common/               # Shared utilities
│   ├── decorators/      # @Public, @Roles, @CurrentUser
│   ├── dto/             # ApiResponse, PaginationDto
│   ├── filters/         # HttpExceptionFilter
│   ├── guards/          # JwtAuthGuard, RolesGuard
│   └── utils/           # DateUtil (Tashkent timezone)
├── database/
│   ├── entities/        # TypeORM entities
│   │   ├── auth/       # Auth-related entities
│   │   ├── core/       # Core business entities
│   │   └── oauth/      # OAuth entities
│   ├── seeds/          # Database seeders
│   └── data-source.ts  # TypeORM configuration
├── modules/
│   ├── auth/           # Authentication module
│   ├── users/          # User management
│   ├── roles/          # Role management
│   └── permissions/    # Permission management
├── app.module.ts       # Root module
└── main.ts            # Application entry point
```

## 🔐 Security Best Practices

✅ **Passwords**: Hashed with bcrypt (cost factor 10)  
✅ **Tokens**: JWT with configurable expiration  
✅ **Refresh Tokens**: Single-use with rotation  
✅ **Rate Limiting**: 1000 requests per 15 minutes  
✅ **Input Validation**: class-validator on all DTOs  
✅ **SQL Injection**: Protected by TypeORM parameterized queries  
✅ **XSS Protection**: Helmet security headers  
✅ **CORS**: Configurable origin policy

## 🌍 Timezone Configuration

All timestamps use **Tashkent timezone (UTC+5)**:

- Application logs: `3:55:41 PM` (Tashkent time)
- Database: `timezone: '+05:00'`
- Docker containers: `TZ=Asia/Tashkent`

See [docs/TIMEZONE.md](docs/TIMEZONE.md) for details.

## 📦 Technology Stack

- **NestJS** 11.x - Progressive Node.js framework
- **TypeORM** 0.3.x - ORM with MySQL
- **MySQL** 8.0 - Relational database
- **Passport** - Authentication middleware
- **JWT** - JSON Web Tokens
- **Bcrypt** - Password hashing
- **Swagger** - API documentation
- **Docker** - Containerization

## 🐛 Troubleshooting

### Database not connecting

```bash
# Check if DB is running
docker compose ps

# View DB logs
docker compose logs db

# Verify .env DB_HOST is set to 'db' for Docker
```

### Tables not created

Tables are auto-created via TypeORM `synchronize: true`. Check logs:

```bash
docker compose logs api | grep "CREATE TABLE"
```

### Timezone issues

```bash
# Verify container timezone
docker compose exec api date
# Should show: Wed Oct 15 16:12:38 +05 2025

# Check MySQL timezone
docker compose exec db date
```

### Port already in use

```bash
# Change APP_PORT in .env
APP_PORT=3001

# Restart
docker compose down && docker compose up -d
```

## 🚀 Deployment

### Quick Deploy to Production

This project includes complete CI/CD setup with GitHub Actions.

#### 1. **Setup GitHub Secrets**

Configure these secrets in your repository:

```
PROD_HOST       # Production server IP/domain
PROD_USER       # SSH username
PROD_SSH_KEY    # Private SSH key
PROD_PORT       # SSH port (default: 22)
```

See **[GITHUB_SECRETS.md](GITHUB_SECRETS.md)** for detailed setup guide.

#### 2. **Prepare Your Server**

```bash
# Run server setup script
curl -fsSL https://raw.githubusercontent.com/yourorg/management/main/scripts/server-setup.sh | bash

# Or manually download and run
wget https://raw.githubusercontent.com/yourorg/management/main/scripts/server-setup.sh
chmod +x server-setup.sh
./server-setup.sh
```

#### 3. **Deploy**

**Automatic (GitHub Actions):**

```bash
git tag v1.0.0
git push origin v1.0.0
# GitHub Actions will automatically deploy
```

**Manual:**

```bash
# SSH to server
ssh deploy@your-server.com

# Clone repository
cd /opt/management-api
git clone https://github.com/yourorg/management.git .

# Configure environment
cp .env.production.example .env.production
nano .env.production

# Deploy
sudo ./deploy.sh production v1.0.0
```

### CI/CD Pipelines

**Continuous Integration (`ci.yml`)**

- ✅ Linting & code quality
- ✅ Unit & E2E tests
- ✅ Docker build verification
- ✅ Security scanning

**Continuous Deployment (`deploy.yml`)**

- 🚀 Build & push Docker images
- 🚀 Deploy to staging (on `develop` branch)
- 🚀 Deploy to production (on `main` branch or tags)
- 🔄 Automatic rollback on failure

### Deployment Features

- 🐳 **Multi-stage Docker build** for optimized images
- 🔒 **HTTPS/SSL support** with Let's Encrypt
- 🔄 **Zero-downtime deployments**
- 📊 **Health checks** for container monitoring
- 📦 **Automated database backups**
- 🔐 **Secrets management** via GitHub
- 🌐 **Nginx reverse proxy** with caching
- 📝 **Structured logging**

### Documentation

- 📚 **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete deployment guide
- 🔐 **[GITHUB_SECRETS.md](GITHUB_SECRETS.md)** - GitHub secrets setup
- 🏗️ **[Dockerfile.prod](Dockerfile.prod)** - Production Docker config
- 🚀 **[deploy.sh](deploy.sh)** - Deployment script

---

## 📝 License

This project is [MIT licensed](LICENSE).

## 👨‍💻 Author

Built with ❤️ using NestJS

---

**Happy Coding! 🎉**
