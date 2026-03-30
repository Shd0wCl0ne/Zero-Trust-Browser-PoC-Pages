/home/kali/scripts/Phishing/
     ├── CSRF-Reaction
     │   ├── loot
     │   ├── notes.md
     │   ├── payloads
     │   ├── poc-pages
     │   └── screenshots
     ├── csrfResetPassword.html
     ├── notes.md
     ├── PAYMENT CAPTURE SYSTEM
     │   ├── assets
     │   ├── bulit.sh
     │   ├── config.json
     │   ├── data
     │   │   ├── backup
     │   │   ├── processed
     │   │   └── raw
     │   ├── error.html
     │   ├── exports
     │   ├── index.html
     │   ├── logs
     │   ├── script.js
     │   ├── server.php
     │   ├── style.css
     │   ├── success.html
     │   ├── TEST_CREDIT_CARDS.js
     │   └── vault.js
     ├── Phishing
     │   ├── clone-sites
     │   ├── credential-harvesting
     │   ├── email-templates
     │   ├── loot
     │   ├── notes.md
     │   └── screenshots
     ├── SSRF-Reaction
     │   ├── loot
     │   ├── notes.md
     │   ├── payloads
     │   ├── poc-pages
     │   └── screenshots
     └── XSS-Reaction
         ├── Blind-XSS
         │   ├── payloads
         │   └── screenshots
         ├── DOM-Based-XSS
         │   ├── payloads
         │   └── screenshots
         ├── loot
         ├── notes.md
         ├── Reflected-XSS
         │   ├── payloads
         │   └── screenshots
         ├── Self-XSS
         │   ├── payloads
         │   └── screenshots
         └── Stored-XSS
             ├── payloads
             └── screenshots
             
             
             
             


Once accessible, the test PC navigates to these URLs:

  ┌────────────────────────┬──────────────────────────────────────────────────────┐
  │          Page          │                         URL                          │
  ├────────────────────────┼──────────────────────────────────────────────────────┤
  │ Main Dashboard         │ http://158.101.104.214:3000/                         │
  ├────────────────────────┼──────────────────────────────────────────────────────┤
  │ Phishing               │ http://158.101.104.214:3000/phishing/                │
  ├────────────────────────┼──────────────────────────────────────────────────────┤
  │ Reflected XSS          │ http://158.101.104.214:3000/xss/reflected/           │
  ├────────────────────────┼──────────────────────────────────────────────────────┤
  │ Stored XSS             │ http://158.101.104.214:3000/xss/stored/              │
  ├────────────────────────┼──────────────────────────────────────────────────────┤
  │ DOM-Based XSS          │ http://158.101.104.214:3000/xss/dom/                 │
  ├────────────────────────┼──────────────────────────────────────────────────────┤
  │ Blind XSS              │ http://158.101.104.214:3000/xss/blind/               │
  ├────────────────────────┼──────────────────────────────────────────────────────┤
  │ Self-XSS               │ http://158.101.104.214:3000/xss/self/                │
  ├────────────────────────┼──────────────────────────────────────────────────────┤
  │ CSRF                   │ http://158.101.104.214:3000/csrf/                    │
  ├────────────────────────┼──────────────────────────────────────────────────────┤
  │ CSRF Password Reset    │ http://158.101.104.214:3000/csrf/password-reset.html │
  ├────────────────────────┼──────────────────────────────────────────────────────┤
  │ SSRF                   │ http://158.101.104.214:3000/ssrf/                    │
  ├────────────────────────┼──────────────────────────────────────────────────────┤
  │ Restricted Site Bypass │ http://158.101.104.214:3000/bypass/                  │
  └────────────────────────┴──────────────────────────────────────────────────────┘
    
    
    
