# XSS (All Types) - Browser Reaction Testing

## Objective
Test how the zero-trust browser detects, blocks, or sanitizes XSS payloads.

## XSS Types

### Reflected XSS
- [ ] Basic script injection via URL parameters
- [ ] Event handler injection (onerror, onload, onfocus)
- [ ] SVG/IMG tag injection
- [ ] Polyglot payloads
- [ ] Encoding bypass (URL, HTML, Unicode)

### Stored XSS
- [ ] Persistent payload in form fields
- [ ] Stored payload in comments/posts
- [ ] Payload in file upload metadata

### DOM-Based XSS
- [ ] document.location manipulation
- [ ] innerHTML/outerHTML sink
- [ ] eval() sink
- [ ] postMessage handler abuse
- [ ] Hash fragment injection

### Blind XSS
- [ ] Out-of-band callback payload
- [ ] Delayed execution payload
- [ ] Admin panel injection

### Self-XSS
- [ ] Console paste social engineering
- [ ] DevTools execution detection

## Results
| Type | Test | Detected? | Blocked? | Sanitized? | Notes |
|------|------|-----------|----------|------------|-------|
