#!/bin/bash

##############################################
# Full Production Reset Script
# WARNING: This will DELETE all data!
##############################################

set -e  # Exit on error

echo "🔴 =============================================="
echo "🔴 WARNING: FULL PRODUCTION RESET"
echo "🔴 This will:"
echo "🔴   - Stop all containers"
echo "🔴   - Delete all volumes (DATABASE WILL BE LOST!)"
echo "🔴   - Rebuild from scratch"
echo "🔴   - Run fresh seeds"
echo "🔴 =============================================="

# Change to project directory
cd /var/www/auth-api

echo ""
echo "📥 Step 1: Pulling latest code from GitHub..."
git fetch origin main
git reset --hard origin/main

echo ""
echo "🛑 Step 2: Stopping all containers..."
docker-compose -f docker-compose.prod.yml down

echo ""
echo "🗑️  Step 3: Removing ALL volumes (DATABASE WILL BE DELETED!)..."
docker-compose -f docker-compose.prod.yml down -v

echo ""
echo "🧹 Step 4: Cleaning up old images..."
docker system prune -f

echo ""
echo "🔨 Step 5: Building fresh images..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo ""
echo "🚀 Step 6: Starting services..."
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "⏳ Step 7: Waiting for services to be healthy (60 seconds)..."
sleep 60

echo ""
echo "🏥 Step 8: Health check..."
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "📊 Step 9: Checking database..."
docker-compose -f docker-compose.prod.yml exec -T mysql mysql \
  -u root -p"${MYSQL_ROOT_PASSWORD}" \
  auth_management -e "SHOW TABLES;" || echo "⚠️  Database check failed, but continuing..."

echo ""
echo "👥 Step 10: Checking users..."
docker-compose -f docker-compose.prod.yml exec -T mysql mysql \
  -u root -p"${MYSQL_ROOT_PASSWORD}" \
  auth_management -e "SELECT COUNT(*) as user_count FROM user;" || echo "⚠️  User count check failed"

echo ""
echo "✅ =============================================="
echo "✅ FULL RESET COMPLETED!"
echo "✅ =============================================="
echo ""
echo "📊 Quick Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "🔗 API URL: https://auth.uzswlu.uz/"
echo "🔗 Swagger: https://auth.uzswlu.uz/"
echo "🔗 Health: https://auth.uzswlu.uz/api/health"
echo ""
echo "📝 To view logs:"
echo "   docker-compose -f docker-compose.prod.yml logs -f api"

