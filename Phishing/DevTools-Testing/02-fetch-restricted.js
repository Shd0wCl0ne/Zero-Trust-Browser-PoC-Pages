// =============================================================
// TEST 02: Fetch Restricted Sites from Console
// =============================================================
// Tests if DevTools console can bypass URL filtering

// --- Test 2.1: Direct fetch to restricted site ---
fetch('https://darkforums.su/')
  .then(r => r.text())
  .then(t => console.log('[TEST 2.1] FETCHED darkforums.su:', t.substring(0, 200)))
  .catch(e => console.log('[TEST 2.1] BLOCKED:', e.message));

// --- Test 2.2: fetch with no-cors ---
fetch('https://darkforums.su/', {mode: 'no-cors'})
  .then(r => console.log('[TEST 2.2] no-cors response type:', r.type, 'status:', r.status))
  .catch(e => console.log('[TEST 2.2] BLOCKED:', e.message));

// --- Test 2.3: XMLHttpRequest ---
var xhr = new XMLHttpRequest();
xhr.open('GET', 'https://darkforums.su/', true);
xhr.onload = function() { console.log('[TEST 2.3] XHR loaded:', xhr.status, xhr.responseText.substring(0, 200)); };
xhr.onerror = function() { console.log('[TEST 2.3] XHR BLOCKED'); };
xhr.send();

// --- Test 2.4: Fetch via CORS proxy ---
fetch('https://corsproxy.io/?https://darkforums.su/')
  .then(r => r.text())
  .then(t => console.log('[TEST 2.4] CORS proxy SUCCESS:', t.substring(0, 200)))
  .catch(e => console.log('[TEST 2.4] CORS proxy BLOCKED:', e.message));

// --- Test 2.5: Image beacon to restricted site ---
var img = new Image();
img.onload = function() { console.log('[TEST 2.5] Image loaded from restricted site'); };
img.onerror = function() { console.log('[TEST 2.5] Image BLOCKED/failed'); };
img.src = 'https://darkforums.su/favicon.ico';

// --- Test 2.6: WebSocket to restricted ---
try {
    var ws = new WebSocket('wss://darkforums.su/');
    ws.onopen = function() { console.log('[TEST 2.6] WebSocket CONNECTED'); ws.close(); };
    ws.onerror = function() { console.log('[TEST 2.6] WebSocket BLOCKED'); };
} catch(e) { console.log('[TEST 2.6] WebSocket BLOCKED:', e.message); }

// --- Test 2.7: Iframe injection from console ---
var f = document.createElement('iframe');
f.src = 'https://darkforums.su/';
f.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;';
document.body.appendChild(f);
console.log('[TEST 2.7] Iframe injected — check if content loaded');

// --- Test 2.8: window.open restricted ---
var popup = window.open('https://darkforums.su/', '_blank');
console.log('[TEST 2.8] window.open result:', popup ? 'OPENED' : 'BLOCKED');

// --- Test 2.9: Navigation to restricted ---
// WARNING: This will navigate away! Uncomment to test.
// window.location.href = 'https://darkforums.su/';
console.log('[TEST 2.9] Uncomment to test direct navigation');

// --- Test 2.10: Fetch internal/metadata from console ---
fetch('http://169.254.169.254/latest/meta-data/')
  .then(r => r.text())
  .then(t => console.log('[TEST 2.10] METADATA ACCESSED:', t))
  .catch(e => console.log('[TEST 2.10] Metadata blocked:', e.message));
