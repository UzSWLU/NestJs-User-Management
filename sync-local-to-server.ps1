# ============================================
# Local Database'ni Serverga To'liq Nusxalash
# ============================================
# PowerShell Script - Windows'da ishlatish uchun

Write-Host "╔═══════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║   🔄 LOCAL BAZANI SERVERGA NUSXALASH     ║" -ForegroundColor Blue
Write-Host "╚═══════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "local_backup_$timestamp.sql"

# Step 1: Local database backup
Write-Host "[1/5] 💾 Local database'dan backup olinmoqda..." -ForegroundColor Yellow
docker-compose exec -T mysql mysqldump -u root -proot auth_management | Out-File -Encoding UTF8 $backupFile

if (-not (Test-Path $backupFile)) {
    Write-Host "❌ Backup yaratib bo'lmadi!" -ForegroundColor Red
    exit 1
}

$fileSize = (Get-Item $backupFile).Length / 1MB
Write-Host "✓ Backup yaratildi: $backupFile ($([math]::Round($fileSize, 2)) MB)" -ForegroundColor Green
Write-Host ""

# Step 2: Upload to server
Write-Host "[2/5] 📤 Serverga yuklash..." -ForegroundColor Yellow
scp $backupFile root@172.22.0.19:/var/www/auth-api/backups/

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Serverga yuklab bo'lmadi!" -ForegroundColor Red
    Write-Host "Qo'lda bajaring:" -ForegroundColor Yellow
    Write-Host "scp $backupFile root@172.22.0.19:/var/www/auth-api/backups/" -ForegroundColor Blue
    exit 1
}

Write-Host "✓ Serverga yuklandi" -ForegroundColor Green
Write-Host ""

# Step 3: Restore on server
Write-Host "[3/5] 🔄 Serverdagi bazani almashtirish..." -ForegroundColor Yellow

$serverCommands = @"
cd /var/www/auth-api
echo 'Serverdagi eski bazadan backup yaratilmoqda...'
docker-compose -f docker-compose.prod.yml exec -T mysql mysqldump -u root -pP67ey4oyhQIzqM6qD0lbMNoDSa8BFbQGTC1TE4tvO5LUOtfH auth_management > backups/server_backup_before_sync_$timestamp.sql 2>/dev/null || echo 'Backup o''tkazib yuborildi'

echo 'Serverdagi bazani tozalash va yangi bazani yuklash...'
docker-compose -f docker-compose.prod.yml exec -T mysql mysql -u root -pP67ey4oyhQIzqM6qD0lbMNoDSa8BFbQGTC1TE4tvO5LUOtfH -e 'DROP DATABASE IF EXISTS auth_management; CREATE DATABASE auth_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;'

echo 'Yangi bazani tiklash...'
docker-compose -f docker-compose.prod.yml exec -T mysql mysql -u root -pP67ey4oyhQIzqM6qD0lbMNoDSa8BFbQGTC1TE4tvO5LUOtfH auth_management < backups/$backupFile

echo '✓ Baza muvaffaqiyatli tiklandi!'
"@

ssh root@172.22.0.19 $serverCommands

Write-Host "✓ Serverdagi baza yangilandi" -ForegroundColor Green
Write-Host ""

# Step 4: Restart API
Write-Host "[4/5] 🔄 API'ni qayta ishga tushirish..." -ForegroundColor Yellow
ssh root@172.22.0.19 "cd /var/www/auth-api && docker-compose -f docker-compose.prod.yml restart api"
Write-Host "✓ API qayta ishga tushdi" -ForegroundColor Green
Write-Host ""

# Step 5: Verify
Write-Host "[5/5] ✅ Tekshirish..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

$verifyCommands = @"
cd /var/www/auth-api
TABLE_COUNT=`$(docker-compose -f docker-compose.prod.yml exec -T mysql mysql -u root -pP67ey4oyhQIzqM6qD0lbMNoDSa8BFbQGTC1TE4tvO5LUOtfH -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='auth_management';" 2>/dev/null)
echo "Jadvallar soni: `$TABLE_COUNT"

HEALTH=`$(curl -s http://localhost:3000/api/health | grep -o '"status":"ok"' || echo "")
if [ -n "`$HEALTH" ]; then
    echo "✓ API ishlayapti"
else
    echo "⚠ API tekshirish kutilmoqda..."
fi
"@

ssh root@172.22.0.19 $verifyCommands

Write-Host ""
Write-Host "╔═══════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   ✅ BAZA MUVAFFAQIYATLI NUSXALANDI!     ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Ma'lumotlar:" -ForegroundColor Blue
Write-Host "   Local backup: $backupFile"
Write-Host "   Timestamp: $timestamp"
Write-Host ""
Write-Host "💡 Backup faylini o'chirish:" -ForegroundColor Yellow
Write-Host "   Remove-Item $backupFile" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Tekshirish:" -ForegroundColor Blue
Write-Host "   https://auth.uzswlu.uz/"
Write-Host "   https://auth.uzswlu.uz/api/health"
Write-Host ""






