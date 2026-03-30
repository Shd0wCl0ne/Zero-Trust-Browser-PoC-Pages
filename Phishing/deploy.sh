#!/bin/bash
# Deploy Zero-Trust Browser Testing Suite to Cloud Server
set -e

SERVER="158.101.104.214"
SSH_KEY="/home/kali/.ssh/ssh-key-A1-Flex.key"
SSH_USER="ubuntu"
SSH_CMD="ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SSH_USER@$SERVER"
SCP_CMD="scp -i $SSH_KEY -o StrictHostKeyChecking=no"
WEB_ROOT="/var/www/zerotrust-test"

echo "[+] Deploying Zero-Trust Browser Testing Suite..."

# 1. Install nginx and PHP on server
echo "[+] Installing nginx + PHP..."
$SSH_CMD "sudo apt-get update -qq && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq nginx php-fpm php-sqlite3 php-curl > /dev/null 2>&1"

# 2. Create web root structure
echo "[+] Creating directory structure..."
$SSH_CMD "sudo mkdir -p $WEB_ROOT/{phishing,xss/{reflected,stored,dom,blind,self},csrf,ssrf} && sudo chown -R $SSH_USER:$SSH_USER $WEB_ROOT"

# 3. Upload files
echo "[+] Uploading files..."

# Main index
$SCP_CMD index.html $SSH_USER@$SERVER:$WEB_ROOT/

# Phishing
$SCP_CMD -r "PAYMENT CAPTURE SYSTEM/"* $SSH_USER@$SERVER:$WEB_ROOT/phishing/

# XSS
$SCP_CMD XSS-Reaction/Reflected-XSS/poc-reflected-xss.html $SSH_USER@$SERVER:$WEB_ROOT/xss/reflected/index.html
$SCP_CMD XSS-Reaction/Stored-XSS/poc-stored-xss.html $SSH_USER@$SERVER:$WEB_ROOT/xss/stored/index.html
$SCP_CMD XSS-Reaction/DOM-Based-XSS/poc-dom-xss.html $SSH_USER@$SERVER:$WEB_ROOT/xss/dom/index.html
$SCP_CMD XSS-Reaction/Blind-XSS/poc-blind-xss.html $SSH_USER@$SERVER:$WEB_ROOT/xss/blind/index.html
$SCP_CMD XSS-Reaction/Self-XSS/poc-self-xss.html $SSH_USER@$SERVER:$WEB_ROOT/xss/self/index.html

# CSRF
$SCP_CMD CSRF-Reaction/poc-pages/poc-csrf-auto-submit.html $SSH_USER@$SERVER:$WEB_ROOT/csrf/index.html
$SCP_CMD csrfResetPassword.html $SSH_USER@$SERVER:$WEB_ROOT/csrf/password-reset.html

# SSRF
$SCP_CMD SSRF-Reaction/poc-pages/poc-ssrf.html $SSH_USER@$SERVER:$WEB_ROOT/ssrf/index.html

echo "[+] Files uploaded successfully"

# 4. Configure nginx
echo "[+] Configuring nginx..."
$SSH_CMD "cat > /tmp/zerotrust-test.conf << 'NGINX'
server {
    listen 80;
    server_name _;
    root $WEB_ROOT;
    index index.html index.php;

    # Main landing page
    location / {
        try_files \$uri \$uri/ =404;
    }

    # Phishing section
    location /phishing/ {
        alias $WEB_ROOT/phishing/;
        index index.html;
    }

    # XSS sections
    location /xss/ {
        alias $WEB_ROOT/xss/;
        index index.html;
    }

    # CSRF section
    location /csrf/ {
        alias $WEB_ROOT/csrf/;
        index index.html;
    }

    # SSRF section
    location /ssrf/ {
        alias $WEB_ROOT/ssrf/;
        index index.html;
    }

    # PHP processing for phishing backend
    location ~ \.php\$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
    }

    # Intentionally permissive headers for testing
    add_header Access-Control-Allow-Origin * always;
    add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS' always;
    add_header Access-Control-Allow-Headers '*' always;

    # No security headers — we want the browser to be the defense layer
    # No X-Frame-Options
    # No CSP
    # No X-XSS-Protection
}
NGINX
sudo mv /tmp/zerotrust-test.conf /etc/nginx/sites-available/zerotrust-test.conf && \
sudo ln -sf /etc/nginx/sites-available/zerotrust-test.conf /etc/nginx/sites-enabled/ && \
sudo rm -f /etc/nginx/sites-enabled/default && \
sudo nginx -t && sudo systemctl restart nginx"

# 5. Create writable data dirs for phishing backend
$SSH_CMD "mkdir -p $WEB_ROOT/phishing/{data/{raw,processed,backup},logs,exports} && chmod 777 $WEB_ROOT/phishing/{data,data/raw,data/processed,data/backup,logs,exports}"

# 6. Verify PHP-FPM socket
$SSH_CMD "PHP_SOCK=\$(find /run/php/ -name 'php*-fpm.sock' 2>/dev/null | head -1); if [ -n \"\$PHP_SOCK\" ] && [ \"\$PHP_SOCK\" != '/run/php/php-fpm.sock' ]; then echo \"[!] Fixing PHP-FPM socket path: \$PHP_SOCK\"; sudo sed -i \"s|unix:/run/php/php-fpm.sock|unix:\$PHP_SOCK|\" /etc/nginx/sites-available/zerotrust-test.conf; sudo nginx -t && sudo systemctl restart nginx; fi"

echo ""
echo "[+] ============================================"
echo "[+] DEPLOYMENT COMPLETE"
echo "[+] ============================================"
echo "[+]"
echo "[+] Main Dashboard:     http://$SERVER/"
echo "[+]"
echo "[+] Phishing:           http://$SERVER/phishing/"
echo "[+] Reflected XSS:      http://$SERVER/xss/reflected/"
echo "[+] Stored XSS:         http://$SERVER/xss/stored/"
echo "[+] DOM-Based XSS:      http://$SERVER/xss/dom/"
echo "[+] Blind XSS:          http://$SERVER/xss/blind/"
echo "[+] Self-XSS:           http://$SERVER/xss/self/"
echo "[+] CSRF:               http://$SERVER/csrf/"
echo "[+] CSRF Password:      http://$SERVER/csrf/password-reset.html"
echo "[+] SSRF:               http://$SERVER/ssrf/"
echo "[+]"
echo "[+] ============================================"
