# Environment Variables Configuration

## File Upload Settings

### MAX_FILE_SIZE_MB

**Default:** `2` (MB)  
**Description:** Logo va boshqa fayllar uchun maksimal hajm (megabaytlarda)  
**Example:**

```env
MAX_FILE_SIZE_MB=5
```

### ALLOWED_FILE_TYPES

**Default:** `jpg,jpeg,png,gif`  
**Description:** Ruxsat berilgan fayl turlari (vergul bilan ajratilgan)  
**Example:**

```env
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,webp,svg
```

## Usage in .env file

Create a `.env` file in the root directory:

```env
# File Upload Configuration
MAX_FILE_SIZE_MB=2
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_NAME=user_auth

# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRATION=7d

# Application
APP_PORT=3001
CORS_ORIGIN=*

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=10
```

## Testing

After configuring, restart the application:

```bash
# Local development
docker-compose restart api

# Production
docker compose -f docker-compose.prod.yml restart api
```
