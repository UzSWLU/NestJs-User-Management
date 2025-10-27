# HEMIS Data Sync Guide

## 📋 Umumiy Ma'lumot

Bu loyiha HEMIS tizimidagi student va employee ma'lumotlarini avtomatik ravishda sync qiladi.

## 🚀 Qo'shildi

- ✅ Students sync (paginated, 50 records per page)
- ✅ Employees sync (paginated, 50 records per page)
- ✅ Real-time progress tracking
- ✅ Retry mechanism (3 marta qayta urinish)
- ✅ Error logging va tracking
- ✅ Pause between requests (1 soniya)
- ✅ Scheduled sync (har kuni 01:00 da)
- ✅ Manual sync endpoints

## 📡 API Endpoints

### Manual Sync

```bash
# Barcha studentlarni sync qilish
POST http://localhost:3000/api/hemis/sync/students

# Barcha employeeslarni sync qilish
POST http://localhost:3000/api/hemis/sync/employees

# Bitta studentni sync qilish
POST http://localhost:3000/api/hemis/sync/student
Content-Type: application/json
{
  "hemis_id": 50421,
  "student_id_number": "326251200658"
}

# Bitta employee'ni sync qilish
POST http://localhost:3000/api/hemis/sync/employee
Content-Type: application/json
{
  "hemis_id": 1826,
  "employee_id_number": "3262311010"
}
```

### Progress Tracking

```bash
# Students progress
GET http://localhost:3000/api/hemis/progress/students

# Employees progress
GET http://localhost:3000/api/hemis/progress/employees
```

**Response misoli:**
```json
{
  "status": "running",
  "startTime": 1698345600000,
  "totalRecords": 23238,
  "processedRecords": 1250,
  "errors": [],
  "currentPage": 25,
  "message": "Processing page 25..."
}
```

## ⏰ Scheduled Sync

Har kuni avtomatik **01:00 AM UTC** da sync ishga tushadi.

### Vaqtni o'zgartirish

`.env` faylga qo'shing:

```env
# HEMIS Sync Schedule (Cron format: minute hour day month dayOfWeek)
# Default: Every day at 01:00 AM UTC
HEMIS_SYNC_CRON=0 1 * * *
```

**Cron misollari:**
- `0 1 * * *` - Har kuni 01:00 da (default)
- `0 2 * * *` - Har kuni 02:00 da
- `0 3 * * 1` - Har dushanba 03:00 da
- `0 */6 * * *` - Har 6 soatda bir

## 📊 Real-Time Progress Kuzatish

### 1. Docker Logs

```bash
# Real-time logs
docker-compose logs -f api

# Faqat HEMIS sync logs
docker-compose logs -f api | grep HEMIS
```

### 2. API Endpoint

```bash
# Terminaldan polling
watch -n 1 'curl -s http://localhost:3000/api/hemis/progress/students | jq'

# Yoki browser developer tools orqali
# Console: setInterval(() => fetch('/api/hemis/progress/students').then(r => r.json()).then(console.log), 1000)
```

### 3. Browser'da

```javascript
// Auto-refresh progress har 1 soniyada
setInterval(async () => {
  const res = await fetch('http://localhost:3000/api/hemis/progress/students');
  const data = await res.json();
  console.log(`Progress: ${data.processedRecords}/${data.totalRecords} (${data.currentPage} page)`);
}, 1000);
```

## ⚙️ Sozlamalar

### Environment Variables

`.env` fayl:

```env
# HEMIS API
HEMIS_API_URL=https://student.uzswlu.uz
HEMIS_BEARER_TOKEN=sGTHTD9YyME1AmPDY24FzoKwrb4EXNQS

# HEMIS Sync Schedule
HEMIS_SYNC_CRON=0 1 * * *
```

## 🔧 Xususiyatlar

### Pagination
- Har safar 50 ta record fetch qilinadi
- 1 soniya pause har batch'lar orasida

### Retry Logic
- 3 marta urinish
- Exponential backoff

### Error Handling
- Barcha xatolar tracking'ga olinadi
- Sync davom etadi hatto xato bo'lsa ham
- Final'da barcha xatolar qaytariladi

### Statistics
- Start/End time
- Processed records
- Total records
- Errors list
- Duration

## 📝 Database Schema

### Students
- `hemis_id` (unique)
- `full_name`, `first_name`, `second_name`, `third_name`
- `student_id_number`
- `university_code`, `university_name`
- `department_id`, `department_name`
- `specialty_id`, `specialty_name`
- `group_id`, `group_name`
- va boshqalar...

### Employees
- `hemis_id` (unique)
- `full_name`, `first_name`, `second_name`, `third_name`
- `employee_id_number`
- `department_id`, `department_name`
- `staff_position_name`
- `academic_degree_name`, `academic_rank_name`
- `tutor_groups` (JSON)
- va boshqalar...

## 🧪 Test Qilish

```bash
# 1. Database ishga tushirish
docker-compose up -d db

# 2. API ishga tushirish
docker-compose up -d api

# 3. Test sync (1 ta student)
curl -X POST http://localhost:3000/api/hemis/sync/student \
  -H "Content-Type: application/json" \
  -d '{"hemis_id": 50421}'

# 4. Progress kuzatish
watch -n 1 'curl -s http://localhost:3000/api/hemis/progress/students'
```

## ⚠️ Muhim Eslatmalar

1. **HEMIS API'ga yuklanish**: 1 soniya pause har batch'lar orasida
2. **Bearer Token**: `.env` fayldan olinadi
3. **Database**: Existing records update qilinadi
4. **Obsolete records**: Asosan o'chirilmaydi (kod comment qilingan)
5. **Timezone**: UTC (shuning uchun 01:00 UTC)

## 📞 Aloqa

Muammo bo'lsa: logs qarab chiqing:
```bash
docker-compose logs api | grep ERROR
```

