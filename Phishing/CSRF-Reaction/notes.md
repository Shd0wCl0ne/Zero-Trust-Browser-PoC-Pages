# CSRF - Browser Reaction Testing

## Objective
Test how the zero-trust browser detects, blocks, or warns on CSRF attacks.

## Test Cases
- [ ] Auto-submitting form (POST) from external origin
- [ ] GET-based state change via img/script tag
- [ ] JSON content-type CSRF
- [ ] Multipart form CSRF
- [ ] Cross-origin XMLHttpRequest/fetch
- [ ] SameSite cookie bypass attempts
- [ ] Clickjacking-assisted CSRF (iframe overlay)
- [ ] Flash/Silverlight-based CSRF (legacy)

## Results
| Test | Detected? | Blocked? | Alert Shown? | Notes |
|------|-----------|----------|--------------|-------|
