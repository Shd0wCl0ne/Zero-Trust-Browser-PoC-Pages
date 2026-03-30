// =============================================================
// TEST 01: Console Execution — Can JS run from DevTools at all?
// =============================================================
// Paste each block one at a time. Document what gets blocked.

// --- Test 1.1: Basic alert ---
alert('DevTools Console Execution - Test 1.1');

// --- Test 1.2: DOM access ---
console.log('[TEST 1.2] document.title:', document.title);
console.log('[TEST 1.2] document.domain:', document.domain);
console.log('[TEST 1.2] document.cookie:', document.cookie);
console.log('[TEST 1.2] window.location:', window.location.href);

// --- Test 1.3: eval() from console ---
eval('console.log("[TEST 1.3] eval() executed successfully")');

// --- Test 1.4: Function constructor ---
new Function('console.log("[TEST 1.4] Function constructor executed")')();

// --- Test 1.5: setTimeout with string ---
setTimeout('console.log("[TEST 1.5] setTimeout string executed")', 100);

// --- Test 1.6: Dynamic script injection ---
var s = document.createElement('script');
s.textContent = 'console.log("[TEST 1.6] Injected script executed")';
document.head.appendChild(s);

// --- Test 1.7: Import external script ---
var ext = document.createElement('script');
ext.src = 'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js';
ext.onload = function() { console.log('[TEST 1.7] External script loaded. _.VERSION:', _.VERSION); };
ext.onerror = function() { console.log('[TEST 1.7] External script BLOCKED'); };
document.head.appendChild(ext);

// --- Test 1.8: Debugger statement ---
debugger; // Does the browser allow breakpoints from console?
console.log('[TEST 1.8] Debugger statement passed');

// --- Test 1.9: Prototype modification ---
String.prototype.leak = function() { return this.valueOf(); };
console.log('[TEST 1.9] Prototype modified:', 'secret'.leak());

// --- Test 1.10: Worker creation ---
try {
    var blob = new Blob(['postMessage("Worker executed")'], {type: 'application/javascript'});
    var w = new Worker(URL.createObjectURL(blob));
    w.onmessage = function(e) { console.log('[TEST 1.10] Web Worker:', e.data); };
} catch(e) { console.log('[TEST 1.10] Worker BLOCKED:', e.message); }
