#!/bin/bash

##############################################
# Update .env.production Script
# Adds OAuth URL variables to existing .env
##############################################

set -e

cd /var/www/auth-api

echo "🔧 Updating .env.production with OAuth URLs..."

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ .env.production not found!"
    echo "📝 Create it from template:"
    echo "   cp env.production.example .env.production"
    echo "   nano .env.production"
    exit 1
fi

# Check if OAuth URLs already exist
if grep -q "BACKEND_URL" .env.production; then
    echo "✅ OAuth URLs already configured in .env.production"
    echo ""
    echo "Current values:"
    grep -E "BACKEND_URL|FRONTEND_CALLBACK_URL" .env.production
else
    echo "📝 Adding OAuth URLs to .env.production..."
    cat >> .env.production << 'EOF'

# OAuth URLs (Added by update script)
BACKEND_URL=https://auth.uzswlu.uz
FRONTEND_CALLBACK_URL=https://front.uzswlu.uz/callback
EOF
    
    echo "✅ OAuth URLs added!"
    echo ""
    echo "New values:"
    grep -E "BACKEND_URL|FRONTEND_CALLBACK_URL" .env.production
fi

echo ""
echo "🔄 Restarting API to apply changes..."
docker-compose -f docker-compose.prod.yml restart api

echo ""
echo "⏳ Waiting for API to start..."
sleep 10

echo ""
echo "✅ Done! Checking OAuth providers..."
docker-compose -f docker-compose.prod.yml exec -T mysql mysql \
  -u root -p"${MYSQL_ROOT_PASSWORD}" \
  auth_management -e "SELECT name, redirect_uri, front_redirect FROM oauth_providers WHERE name='hemis';" || echo "⚠️  Check failed"

echo ""
echo "🎯 OAuth URLs configured!"
echo "   Backend: https://auth.uzswlu.uz"
echo "   Frontend: https://front.uzswlu.uz/callback"



