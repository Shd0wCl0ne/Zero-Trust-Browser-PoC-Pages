// =============================================================
// TEST 10: Browser API Abuse from DevTools
// =============================================================

// --- Test 10.1: Geolocation ---
navigator.geolocation.getCurrentPosition(
    function(pos) {
        console.log('[TEST 10.1] LOCATION:', pos.coords.latitude, pos.coords.longitude, '±' + pos.coords.accuracy + 'm');
    },
    function(err) { console.log('[TEST 10.1] Geolocation BLOCKED:', err.message); },
    {enableHighAccuracy: true}
);

// --- Test 10.2: Camera/Microphone access ---
navigator.mediaDevices.getUserMedia({video: true, audio: true})
    .then(function(stream) {
        console.log('[TEST 10.2] CAMERA+MIC ACCESS GRANTED. Tracks:', stream.getTracks().map(function(t){return t.kind}).join(', '));
        stream.getTracks().forEach(function(t) { t.stop(); }); // Stop immediately
    })
    .catch(function(e) { console.log('[TEST 10.2] Camera/Mic BLOCKED:', e.message); });

// --- Test 10.3: Screen capture ---
navigator.mediaDevices.getDisplayMedia({video: true})
    .then(function(stream) {
        console.log('[TEST 10.3] SCREEN CAPTURE GRANTED');
        stream.getTracks().forEach(function(t) { t.stop(); });
    })
    .catch(function(e) { console.log('[TEST 10.3] Screen capture BLOCKED:', e.message); });

// --- Test 10.4: Clipboard read ---
navigator.clipboard.readText()
    .then(function(text) { console.log('[TEST 10.4] CLIPBOARD READ:', text.substring(0, 200)); })
    .catch(function(e) { console.log('[TEST 10.4] Clipboard read BLOCKED:', e.message); });

// --- Test 10.5: Clipboard write (hijack) ---
navigator.clipboard.writeText('javascript:alert(document.cookie)')
    .then(function() { console.log('[TEST 10.5] Clipboard OVERWRITTEN with malicious content'); })
    .catch(function(e) { console.log('[TEST 10.5] Clipboard write BLOCKED:', e.message); });

// --- Test 10.6: Notification API ---
Notification.requestPermission().then(function(perm) {
    console.log('[TEST 10.6] Notification permission:', perm);
    if (perm === 'granted') {
        new Notification('Security Alert', {
            body: 'Your session has expired. Click to re-authenticate.',
            icon: 'https://www.google.com/favicon.ico'
        });
        console.log('[TEST 10.6] Phishing notification sent');
    }
});

// --- Test 10.7: Battery API (fingerprinting) ---
if (navigator.getBattery) {
    navigator.getBattery().then(function(b) {
        console.log('[TEST 10.7] Battery: level=' + (b.level*100) + '% charging=' + b.charging);
    });
} else { console.log('[TEST 10.7] Battery API not available'); }

// --- Test 10.8: Device enumeration ---
navigator.mediaDevices.enumerateDevices()
    .then(function(devices) {
        console.log('[TEST 10.8] Devices found:', devices.length);
        devices.forEach(function(d) { console.log('  ', d.kind, d.label || '(no label)', d.deviceId.substring(0,20)); });
    })
    .catch(function(e) { console.log('[TEST 10.8] Device enum BLOCKED:', e.message); });

// --- Test 10.9: Bluetooth scanning ---
if (navigator.bluetooth) {
    navigator.bluetooth.requestDevice({acceptAllDevices: true})
        .then(function(device) { console.log('[TEST 10.9] Bluetooth device:', device.name); })
        .catch(function(e) { console.log('[TEST 10.9] Bluetooth BLOCKED:', e.message); });
} else { console.log('[TEST 10.9] Bluetooth API not available'); }

// --- Test 10.10: USB access ---
if (navigator.usb) {
    navigator.usb.requestDevice({filters: []})
        .then(function(device) { console.log('[TEST 10.10] USB device:', device.productName); })
        .catch(function(e) { console.log('[TEST 10.10] USB BLOCKED:', e.message); });
} else { console.log('[TEST 10.10] USB API not available'); }

// --- Test 10.11: File System Access ---
if (window.showOpenFilePicker) {
    window.showOpenFilePicker()
        .then(function(handles) { console.log('[TEST 10.11] File picker opened:', handles.length, 'files'); })
        .catch(function(e) { console.log('[TEST 10.11] File access BLOCKED:', e.message); });
} else { console.log('[TEST 10.11] File System Access API not available'); }

// --- Test 10.12: Browser fingerprint collection ---
var fingerprint = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    languages: navigator.languages,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: navigator.deviceMemory,
    maxTouchPoints: navigator.maxTouchPoints,
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
    screen: {w: screen.width, h: screen.height, depth: screen.colorDepth, dpr: devicePixelRatio},
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    webgl: (function() {
        try {
            var c = document.createElement('canvas');
            var gl = c.getContext('webgl');
            return gl.getParameter(gl.RENDERER);
        } catch(e) { return 'blocked'; }
    })(),
    canvas_hash: (function() {
        var c = document.createElement('canvas');
        c.width = 200; c.height = 50;
        var ctx = c.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('fingerprint', 2, 2);
        return c.toDataURL().substring(0, 60);
    })()
};
console.log('[TEST 10.12] BROWSER FINGERPRINT:', JSON.stringify(fingerprint, null, 2));
