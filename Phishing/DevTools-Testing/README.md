# DevTools Attack Surface — Zero-Trust Browser Testing

## How to Use
1. Open any allowed website in the zero-trust browser
2. Press F12 (or right-click → Inspect) to open DevTools
3. Go to Console tab
4. Paste scripts from the test files below
5. Document what gets blocked vs allowed

## Test Categories
- `01-console-execution.js` — Can JS run from console at all?
- `02-fetch-restricted.js` — Fetch restricted sites from console
- `03-dom-injection.js` — Inject malicious DOM elements
- `04-cookie-storage.js` — Read/write cookies and storage
- `05-csp-bypass.js` — Override Content-Security-Policy
- `06-network-intercept.js` — Service Workers, request interception
- `07-credential-theft.js` — Keyloggers, form hijacking
- `08-exfiltration.js` — Data exfiltration techniques
- `09-extension-injection.js` — Simulate extension-like behavior
- `10-browser-api-abuse.js` — WebRTC, Geolocation, Camera, Clipboard
