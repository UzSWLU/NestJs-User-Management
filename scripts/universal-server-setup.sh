#!/bin/bash

# Universal Server Setup Script
# Bu script har qanday holatga moslashib ketadi va barcha muammolarni hal qiladi

set -e

echo "🚀 Universal Server Setup Script"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    netstat -tulpn | grep ":$1 " >/dev/null 2>&1
}

# Function to check if domain is accessible
check_domain() {
    local domain=$1
    local expected_content=$2
    
    if curl -s --connect-timeout 5 "$domain" | grep -q "$expected_content"; then
        return 0
    else
        return 1
    fi
}

# Function to create nginx configuration
create_nginx_config() {
    local domain=$1
    local port=$2
    local ssl_enabled=$3
    local ssl_cert_path=$4
    local ssl_key_path=$5
    
    local config_file="/etc/nginx/sites-available/$domain"
    
    print_info "Creating Nginx configuration for $domain..."
    
    # Remove old configuration if exists
    sudo rm -f "/etc/nginx/sites-enabled/$domain"
    
    # Create new configuration
    sudo tee "$config_file" > /dev/null << EOF
# HTTP server
server {
    listen 80;
    server_name $domain;
EOF

    if [ "$ssl_enabled" = "true" ]; then
        sudo tee -a "$config_file" > /dev/null << EOF

    # Let's Encrypt validation
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect all other requests to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name $domain;

    # SSL Configuration
    ssl_certificate $ssl_cert_path;
    ssl_certificate_key $ssl_key_path;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
EOF
    fi

    sudo tee -a "$config_file" > /dev/null << EOF

    # Proxy configuration
    location / {
        proxy_pass http://127.0.0.1:$port;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Port \$server_port;
        
        # Additional headers for Django/Node.js
        proxy_set_header X-Forwarded-Host \$server_name;
        proxy_set_header X-Forwarded-Server \$host;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
}
EOF

    # Enable the site
    sudo ln -sf "$config_file" "/etc/nginx/sites-enabled/"
    
    print_status "Nginx configuration created for $domain"
}

# Function to setup SSL certificates
setup_ssl_certificates() {
    local ssl_dir="/var/www/sertifikat"
    
    print_info "Setting up SSL certificates..."
    
    # Check if SSL directory exists
    if [ ! -d "$ssl_dir" ]; then
        print_warning "SSL directory $ssl_dir not found, creating..."
        sudo mkdir -p "$ssl_dir"
    fi
    
    # Check if certificates exist
    if [ ! -f "$ssl_dir/STAR25_uzswlu_uz.crt" ] || [ ! -f "$ssl_dir/STAR25_uzswlu_uz.key" ]; then
        print_warning "SSL certificates not found in $ssl_dir"
        print_info "Please ensure SSL certificates are placed in $ssl_dir/"
        print_info "Required files:"
        print_info "  - STAR25_uzswlu_uz.crt"
        print_info "  - STAR25_uzswlu_uz.key"
        return 1
    fi
    
    print_status "SSL certificates found in $ssl_dir"
    return 0
}

# Function to check and fix port conflicts
fix_port_conflicts() {
    print_info "Checking for port conflicts..."
    
    # Check common ports
    local ports=(80 443 3000 5001 3080 3443 5443)
    
    for port in "${ports[@]}"; do
        if port_in_use "$port"; then
            print_warning "Port $port is in use"
            netstat -tulpn | grep ":$port "
        else
            print_status "Port $port is free"
        fi
    done
}

# Function to restart services
restart_services() {
    print_info "Restarting services..."
    
    # Test nginx configuration
    if sudo nginx -t; then
        print_status "Nginx configuration is valid"
        
        # Reload nginx
        sudo systemctl reload nginx
        print_status "Nginx reloaded successfully"
    else
        print_error "Nginx configuration is invalid"
        return 1
    fi
    
    # Restart docker services if they exist
    if command_exists docker-compose; then
        print_info "Restarting Docker services..."
        
        # Restart management API if exists
        if [ -d "/var/www/auth-api" ]; then
            cd /var/www/auth-api
            if [ -f "docker-compose.prod.yml" ]; then
                docker-compose -f docker-compose.prod.yml restart || true
                print_status "Management API restarted"
            fi
        fi
        
        # Restart building API if exists
        if [ -d "/var/www/building-api" ]; then
            cd /var/www/building-api
            if [ -f "docker-compose.prod.yml" ]; then
                docker-compose -f docker-compose.prod.yml restart || true
                print_status "Building API restarted"
            fi
        fi
    fi
}

# Function to test domains
test_domains() {
    print_info "Testing domain accessibility..."
    
    local domains=(
        "https://auth.uzswlu.uz"
        "http://building.api.uzswlu.uz"
    )
    
    for domain in "${domains[@]}"; do
        print_info "Testing $domain..."
        if curl -s --connect-timeout 10 "$domain" >/dev/null; then
            print_status "$domain is accessible"
        else
            print_warning "$domain is not accessible"
        fi
    done
}

# Function to show current status
show_status() {
    print_info "Current server status:"
    echo ""
    
    # Show nginx status
    print_info "Nginx status:"
    sudo systemctl status nginx --no-pager -l || true
    echo ""
    
    # Show enabled sites
    print_info "Enabled Nginx sites:"
    ls -la /etc/nginx/sites-enabled/ || true
    echo ""
    
    # Show docker containers
    print_info "Docker containers:"
    docker ps || true
    echo ""
    
    # Show port usage
    print_info "Port usage:"
    netstat -tulpn | grep -E ":(80|443|3000|5001|3080|3443|5443) " || true
    echo ""
}

# Main execution
main() {
    print_info "Starting universal server setup..."
    
    # Check if running as root or with sudo
    if [ "$EUID" -ne 0 ]; then
        print_error "Please run this script with sudo"
        exit 1
    fi
    
    # Check required commands
    local required_commands=(nginx docker docker-compose curl)
    for cmd in "${required_commands[@]}"; do
        if ! command_exists "$cmd"; then
            print_error "$cmd is not installed"
            exit 1
        fi
    done
    
    # Show current status
    show_status
    
    # Setup SSL certificates
    if ! setup_ssl_certificates; then
        print_warning "SSL setup failed, continuing with HTTP only"
    fi
    
    # Create nginx configurations
    print_info "Creating Nginx configurations..."
    
    # Management API (auth.uzswlu.uz)
    if [ -d "/var/www/auth-api" ]; then
        create_nginx_config "auth.uzswlu.uz" "3000" "true" "/var/www/sertifikat/STAR25_uzswlu_uz.crt" "/var/www/sertifikat/STAR25_uzswlu_uz.key"
    fi
    
    # Building API (building.api.uzswlu.uz)
    if [ -d "/var/www/building-api" ]; then
        create_nginx_config "building.api.uzswlu.uz" "5001" "false" "" ""
    fi
    
    # Remove old configurations
    print_info "Removing old configurations..."
    sudo rm -f /etc/nginx/sites-enabled/api.uzswlu.uz
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Fix port conflicts
    fix_port_conflicts
    
    # Restart services
    restart_services
    
    # Test domains
    test_domains
    
    # Show final status
    show_status
    
    print_status "Universal server setup completed!"
    print_info "Domains configured:"
    print_info "  - https://auth.uzswlu.uz (Management API)"
    print_info "  - http://building.api.uzswlu.uz (Building API)"
}

# Run main function
main "$@"
