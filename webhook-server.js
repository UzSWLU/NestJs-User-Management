#!/usr/bin/env node

/**
 * GitHub Webhook Listener
 * 
 * Bu server GitHub'dan webhook qabul qiladi va
 * avtomatik deploy qiladi
 */

const http = require('http');
const { exec } = require('child_process');
const crypto = require('crypto');

const PORT = 9000;
const SECRET = process.env.WEBHOOK_SECRET || 'your-secret-key-here';
const DEPLOY_SCRIPT = '/var/www/auth-api/deploy.sh';

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        // Verify signature
        const signature = req.headers['x-hub-signature-256'];
        if (signature) {
          const hmac = crypto.createHmac('sha256', SECRET);
          const digest = 'sha256=' + hmac.update(body).digest('hex');
          
          if (signature !== digest) {
            console.log('❌ Invalid signature');
            res.writeHead(401);
            res.end('Invalid signature');
            return;
          }
        }
        
        const payload = JSON.parse(body);
        const branch = payload.ref?.split('/').pop();
        
        console.log('📥 Webhook received');
        console.log(`   Branch: ${branch}`);
        console.log(`   Commit: ${payload.head_commit?.message || 'N/A'}`);
        
        // Deploy faqat main branch uchun
        if (branch === 'main') {
          console.log('🚀 Starting deploy...');
          
          exec(DEPLOY_SCRIPT, (error, stdout, stderr) => {
            if (error) {
              console.error('❌ Deploy failed:', error);
              return;
            }
            console.log('✅ Deploy completed!');
            console.log(stdout);
          });
          
          res.writeHead(200);
          res.end('Deploy started');
        } else {
          console.log(`⏭️  Skipping deploy for branch: ${branch}`);
          res.writeHead(200);
          res.end('Branch ignored');
        }
      } catch (error) {
        console.error('❌ Error:', error);
        res.writeHead(500);
        res.end('Error');
      }
    });
  } else if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200);
    res.end('Webhook listener is running');
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log('🎧 GitHub Webhook Listener');
  console.log(`   Port: ${PORT}`);
  console.log(`   Endpoint: http://localhost:${PORT}/webhook`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log('');
  console.log('✅ Ready to receive webhooks!');
});

