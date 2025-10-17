#!/bin/bash

# ============================================
# Server Initial Setup Script
# ============================================
# Run this script on a fresh Ubuntu/Debian server

set -e

echo "🚀 Starting server setup..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should NOT be run as root. Please run as a normal user with sudo privileges."
   exit 1
fi

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
sudo apt update
sudo apt upgrade -y

# Install essential tools
echo -e "${YELLOW}📦 Installing essential tools...${NC}"
sudo apt install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    net-tools \
    ufw

# Install Docker
echo -e "${YELLOW}🐳 Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo -e "${GREEN}✅ Docker installed${NC}"
else
    echo -e "${GREEN}✅ Docker already installed${NC}"
fi

# Install Docker Compose
echo -e "${YELLOW}🐳 Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    sudo apt install -y docker-compose-plugin
    echo -e "${GREEN}✅ Docker Compose installed${NC}"
else
    echo -e "${GREEN}✅ Docker Compose already installed${NC}"
fi

# Setup Firewall
echo -e "${YELLOW}🔒 Configuring firewall...${NC}"
sudo ufw --force enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
echo -e "${GREEN}✅ Firewall configured${NC}"

# Create application directory
echo -e "${YELLOW}📁 Creating application directory...${NC}"
sudo mkdir -p /opt/management-api
sudo chown $USER:$USER /opt/management-api
echo -e "${GREEN}✅ Application directory created${NC}"

# Create backup directory
echo -e "${YELLOW}📁 Creating backup directory...${NC}"
mkdir -p /opt/management-api/backups
echo -e "${GREEN}✅ Backup directory created${NC}"

# Setup SSL directory
echo -e "${YELLOW}🔐 Creating SSL directory...${NC}"
mkdir -p /opt/management-api/nginx/ssl
echo -e "${GREEN}✅ SSL directory created${NC}"

# Install Certbot (for Let's Encrypt)
echo -e "${YELLOW}🔒 Installing Certbot...${NC}"
sudo apt install -y certbot
echo -e "${GREEN}✅ Certbot installed${NC}"

# Setup log rotation
echo -e "${YELLOW}📝 Configuring log rotation...${NC}"
sudo tee /etc/logrotate.d/docker-management <<EOF
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=10M
    missingok
    delaycompress
    copytruncate
}
EOF
echo -e "${GREEN}✅ Log rotation configured${NC}"

# Setup automatic security updates
echo -e "${YELLOW}🔒 Enabling automatic security updates...${NC}"
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
echo -e "${GREEN}✅ Automatic security updates enabled${NC}"

# Setup swap (if not exists)
if [ ! -f /swapfile ]; then
    echo -e "${YELLOW}💾 Creating swap file (2GB)...${NC}"
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo -e "${GREEN}✅ Swap file created${NC}"
else
    echo -e "${GREEN}✅ Swap file already exists${NC}"
fi

# Configure SSH (optional but recommended)
echo -e "${YELLOW}🔒 Hardening SSH configuration...${NC}"
sudo sed -i 's/#PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/#PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl reload sshd
echo -e "${GREEN}✅ SSH hardened (root login disabled, password auth disabled)${NC}"

# Setup timezone
echo -e "${YELLOW}🌍 Setting timezone to Asia/Tashkent...${NC}"
sudo timedatectl set-timezone Asia/Tashkent
echo -e "${GREEN}✅ Timezone set${NC}"

# Print summary
echo ""
echo -e "${GREEN}==================================="
echo "✅ Server setup completed!"
echo "===================================${NC}"
echo ""
echo "📝 Next steps:"
echo "1. Log out and log back in (for Docker group changes)"
echo "2. Clone your repository:"
echo "   cd /opt/management-api"
echo "   git clone https://github.com/yourorg/management.git ."
echo ""
echo "3. Create .env.production file"
echo "4. Generate SSL certificates (if needed)"
echo "5. Run deployment"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Log out and log back in before using Docker!${NC}"

exit 0

