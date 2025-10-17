# Timezone Configuration

This application is configured to use **Tashkent timezone (UTC+5)** throughout the entire system.

## Configuration Points

### 1. Node.js Application (`src/main.ts`)

```typescript
process.env.TZ = process.env.TZ || 'Asia/Tashkent';
```

Sets the default timezone for the Node.js process.

### 2. TypeORM MySQL Connection

```typescript
// src/app.module.ts and src/database/data-source.ts
timezone: '+05:00';
```

Ensures MySQL stores and retrieves dates in Tashkent timezone.

### 3. Docker Containers

```yaml
# docker-compose.yml
environment:
  - TZ=Asia/Tashkent
```

Both `api` and `db` containers use Tashkent timezone.

### 4. Environment Variable (.env)

```env
TZ=Asia/Tashkent
```

Can be overridden via environment variable if needed.

## Date Utility Functions

Use the `DateUtil` class for consistent date handling:

```typescript
import { DateUtil } from './common/utils/date.util';

// Current time in Tashkent
const now = DateUtil.now();

// Format as ISO string
const isoString = DateUtil.toISOString(); // "2025-10-15T15:30:00.000Z"

// Readable format
const readable = DateUtil.toReadableString(); // "15/10/2025 15:30:00"

// Date only
const dateOnly = DateUtil.toDateString(); // "2025-10-15"

// Time only
const timeOnly = DateUtil.toTimeString(); // "15:30:00"

// Add days/hours
const tomorrow = DateUtil.addDays(new Date(), 1);
const inOneHour = DateUtil.addHours(new Date(), 1);

// Check if expired
const isExpired = DateUtil.isExpired(someDate);

// Calculate difference
const daysDiff = DateUtil.diffInDays(date1, date2);
const hoursDiff = DateUtil.diffInHours(date1, date2);
```

## API Response Timestamps

All API responses include timestamps in Tashkent timezone:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-10-15T15:30:00.123Z",
  "message": "Success"
}
```

## Database Considerations

- All datetime columns in MySQL are stored with +05:00 offset
- TypeORM automatically handles timezone conversions
- Always use `Date` objects in entities; TypeORM handles formatting

## Testing Timezone

To verify timezone is working correctly:

1. Check application logs - timestamps should be in Tashkent time
2. Create a record and check `created_at` in database
3. Call any API endpoint and check response `timestamp`

## Changing Timezone

If you need to change to a different timezone:

1. Update `.env`: `TZ=Your/Timezone`
2. Update `docker-compose.yml` environment variables
3. Update `src/app.module.ts` and `src/database/data-source.ts`: `timezone: '+XX:00'`
4. Update `src/main.ts`: `process.env.TZ = 'Your/Timezone'`
5. Restart containers: `docker compose down && docker compose up -d`

## Common Timezones

- Tashkent: `Asia/Tashkent` (UTC+5)
- UTC: `UTC` (UTC+0)
- New York: `America/New_York` (UTC-5/UTC-4)
- London: `Europe/London` (UTC+0/UTC+1)
- Tokyo: `Asia/Tokyo` (UTC+9)

## Notes

- The timezone is set at multiple layers to ensure consistency
- Docker containers, Node.js process, and MySQL all use the same timezone
- This prevents timezone-related bugs and confusion
- All dates are stored and displayed in Tashkent time consistently

