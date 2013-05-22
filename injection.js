(function(doc, win) {

    /**
     * Prepare injection:
     * replace App.update() with own handler,
     * call original function and send returned data
     * to the extension's content script via window.postMessage().
     */
    var injection = function() {
        window.App._update = window.App.update;

        window.App.update = function() {
            var response = window.App._update.apply(window.App._update, arguments);

            if (response !== false) {
                response.then(function(data) {
                    window.postMessage({
                        type: 'injection',
                        feeds: JSON.stringify(data)
                    }, '*');
                });
            }

            return response;
        };
    };

    /**
     * Get our message from page's window and send it further
     * to the extension via chrome.runtime.sendMessage().
     *
     * @param {Object} event
     */
    win.onmessage = function(event) {
        if (event.data.type === 'injection') {
            chrome.runtime.sendMessage({
                type: 'injection',
                feeds: event.data.feeds
            });
        }
    };

    // stringify, append and run injection in page context
    var script = doc.createElement('script');
    script.innerHTML = '(' + injection.toString() + ')()';
    doc.head.appendChild(script);

})(document, window);
