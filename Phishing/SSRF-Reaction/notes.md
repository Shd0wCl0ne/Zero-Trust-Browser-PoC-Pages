# SSRF - Browser Reaction Testing

## Objective
Test how the zero-trust browser detects, blocks, or restricts SSRF attempts.

## Test Cases
- [ ] Fetch internal IP (127.0.0.1, 169.254.169.254)
- [ ] DNS rebinding attack
- [ ] URL schema abuse (file://, gopher://, dict://)
- [ ] Redirect-based SSRF (302 to internal)
- [ ] Cloud metadata endpoint access
- [ ] IPv6 bypass (::1, [::]
- [ ] Decimal/octal IP encoding bypass
- [ ] URL parser differential exploitation

## Results
| Test | Detected? | Blocked? | Alert Shown? | Notes |
|------|-----------|----------|--------------|-------|
