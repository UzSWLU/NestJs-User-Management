# HEMIS OAuth Credentials Update Script
# Replace YOUR_CLIENT_ID and YOUR_CLIENT_SECRET with actual values

$clientId = Read-Host "Enter HEMIS Client ID"
$clientSecret = Read-Host "Enter HEMIS Client Secret"

$sql = @"
UPDATE oauth_providers 
SET 
  client_id = '$clientId',
  client_secret = '$clientSecret',
  redirect_uri = 'http://localhost:3000/api/auth/callback/hemis'
WHERE name = 'hemis';

SELECT id, name, client_id, LEFT(client_secret, 10) as secret_preview, redirect_uri, is_active 
FROM oauth_providers 
WHERE name = 'hemis';
"@

Write-Host "`nUpdating HEMIS credentials in database..." -ForegroundColor Yellow
Write-Host "SQL Query:" -ForegroundColor Cyan
Write-Host $sql -ForegroundColor Gray

# Execute SQL
$sql | docker-compose exec -T db mysql -uroot -proot_password user_auth

Write-Host "`nDone! Restart the API container:" -ForegroundColor Green
Write-Host "docker-compose restart api" -ForegroundColor Cyan

