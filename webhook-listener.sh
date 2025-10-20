#!/bin/bash

# ============================================
# Simple Webhook Listener (Bash)
# ============================================
# GitHub webhook'dan signal olganda deploy qiladi

PORT=9000
DEPLOY_SCRIPT="/var/www/auth-api/deploy.sh"
SECRET="${WEBHOOK_SECRET:-your-secret-key}"

echo "🎧 GitHub Webhook Listener"
echo "   Port: $PORT"
echo "   Deploy script: $DEPLOY_SCRIPT"
echo "✅ Ready to receive webhooks!"

# Simple HTTP server using netcat
while true; do
  {
    read -r request
    
    # Read all headers
    while read -r header; do
      header=$(echo "$header" | tr -d '\r\n')
      [ -z "$header" ] && break
    done
    
    # Read body (if POST)
    if [[ $request == "POST /webhook"* ]]; then
      echo "📥 Webhook received!"
      echo "🚀 Starting deploy..."
      
      # Run deploy script in background
      $DEPLOY_SCRIPT >> /var/log/webhook-deploy.log 2>&1 &
      
      # Send response
      echo -e "HTTP/1.1 200 OK\r"
      echo -e "Content-Type: text/plain\r"
      echo -e "Content-Length: 14\r"
      echo -e "\r"
      echo -e "Deploy started"
      
      echo "✅ Deploy triggered!"
      
    elif [[ $request == "GET /health"* ]]; then
      # Health check
      echo -e "HTTP/1.1 200 OK\r"
      echo -e "Content-Type: text/plain\r"
      echo -e "Content-Length: 30\r"
      echo -e "\r"
      echo -e "Webhook listener is running"
      
    else
      # 404
      echo -e "HTTP/1.1 404 Not Found\r"
      echo -e "Content-Length: 9\r"
      echo -e "\r"
      echo -e "Not found"
    fi
  } | nc -l -p $PORT -q 1
done

