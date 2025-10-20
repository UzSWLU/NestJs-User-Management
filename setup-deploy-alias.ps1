# ============================================
# PowerShell Deploy Alias Setup
# ============================================
# Bu scriptni bir marta ishlatib, "deploy" alias yarating

Write-Host "🔧 Setting up PowerShell deploy alias..." -ForegroundColor Cyan

# PowerShell profile pathini olish
$profilePath = $PROFILE

# Agar profile fayl yo'q bo'lsa, yaratish
if (!(Test-Path -Path $profilePath)) {
    Write-Host "📝 Creating PowerShell profile..." -ForegroundColor Yellow
    New-Item -ItemType File -Path $profilePath -Force | Out-Null
}

# Deploy function kodini tayyorlash
$deployFunction = @'

# ============================================
# Auto Deploy Function
# ============================================
function Deploy-Server {
    Write-Host "🚀 Starting deploy..." -ForegroundColor Cyan
    
    # Git push
    Write-Host "📤 Pushing to GitHub..." -ForegroundColor Yellow
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Push successful!" -ForegroundColor Green
        
        # SSH deploy
        Write-Host "📡 Deploying to server..." -ForegroundColor Yellow
        ssh root@172.22.0.19 '/var/www/auth-api/deploy.sh'
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Deploy completed successfully!" -ForegroundColor Green
            Write-Host "🌐 URL: https://auth.uzswlu.uz" -ForegroundColor Cyan
        } else {
            Write-Host "❌ Deploy failed!" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Git push failed!" -ForegroundColor Red
    }
}

# Alias
Set-Alias deploy Deploy-Server

Write-Host "✅ Deploy alias loaded! Use 'deploy' command." -ForegroundColor Green
'@

# Profile'ga qo'shish (agar yo'q bo'lsa)
$currentContent = Get-Content $profilePath -Raw -ErrorAction SilentlyContinue

if ($currentContent -notlike "*Deploy-Server*") {
    Write-Host "📝 Adding deploy function to PowerShell profile..." -ForegroundColor Yellow
    Add-Content -Path $profilePath -Value $deployFunction
    Write-Host "✅ Deploy function added!" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Deploy function already exists in profile" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Setup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Restart PowerShell (yoki: . `$PROFILE)" -ForegroundColor White
Write-Host "   2. cd /path/to/your/project" -ForegroundColor White
Write-Host "   3. Type: deploy" -ForegroundColor White
Write-Host ""
Write-Host "💡 Usage:" -ForegroundColor Cyan
Write-Host "   deploy" -ForegroundColor Green
Write-Host "   → Pushes to GitHub" -ForegroundColor Gray
Write-Host "   → Deploys to server" -ForegroundColor Gray
Write-Host "   → Done! ✅" -ForegroundColor Gray
Write-Host ""

