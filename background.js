(function() {

    var req,
        // API JSON
        reqURL = 'http://theoldreader.com/feeds/counts.json',
        // 10 sec timeout
        reqTimeout = 10 * 1000,
        // 5 mins interval
        reqInterval = 5 * 60 * 1000,
        // 1 min interval after error
        reqErrorInterval = 1 * 60 * 1000,
        // URL to open on button click
        openURL = 'http://theoldreader.com/posts/all',
        // badge colors
        colors = {
            gray: [200, 200, 200, 255],
            red: [255, 0, 0, 255],
            blue: [0, 0, 255, 255],
            green: [0, 255, 0, 255]
        },
        // saved tabs IDs
        tabs = [];

    function request() {
        req = new XMLHttpRequest();

        req.onload = function() {
            if (this.status === 200) {
                var data = JSON.parse(this.responseText),
                    unread = 0,
                    title = '',
                    titles = 1;

                if (!data.feeds) {
                    setError('login error');
                    return;
                }

                data.feeds[0].feeds.forEach(function(feed) {
                    if (feed.unread_count) {
                        // collect only first 5 titles
                        if (titles <= 5) {
                            title = (title ? title + '\n' : '') + feed.title + ': ' + feed.unread_count;
                        } else if (titles ==== 5) {
                            title += '\n…';
                        }

                        titles++;

                        // increment unread count
                        unread += feed.unread_count;
                    }
                });

                if (unread) {
                    setText(unread);
                    setTitle(title);
                    setColor('red');
                } else {
                    setText('');
                    setTitle('nothing\'s new');
                }

                setTimeout(request, reqInterval);
            } else {
                setError('error retrieving data');
            }
        };

        req.timeout = reqTimeout;

        req.ontimeout = function() {
            setError('connection timeout');
        };

        req.onerror = function() {
            setError('connection error');
        };

        req.open('GET', reqURL, true);
        req.send();
    }

    // badge text
    function setText(str) {
        chrome.browserAction.setBadgeText({
            text: (str + '' || '')
        });
    }

    // button onhover title
    function setTitle(str) {
        chrome.browserAction.setTitle({
            title: (str + '' || '')
        });
    }

    // gray + × + title = error
    function setError(str) {
        setColor('gray');
        setText('×');
        setTitle(str);

        // re-check more often
        setTimeout(request, reqErrorInterval);
    }

    // badge color
    function setColor(clr) {
        chrome.browserAction.setBadgeBackgroundColor({
            color: (colors[clr] || colors.red)
        });
    }

    // button click
    chrome.browserAction.onClicked.addListener(function() {
        chrome.tabs.create({
            url: openURL
        });
    });

    // save oldreader's tabs IDs
    chrome.tabs.onCreated.addListener(function(tab) {
        if (/theoldreader\.com/.test(tab.url)) {
            tabs.push(tab.id);
        }
    });

    // update on oldreader's tab(s) close
    chrome.tabs.onRemoved.addListener(function(id) {
        if (~tabs.indexOf(id)) {
            request();
            tabs.splice(tabs.indexOf(id), 1);
        }
    });

    // go
    setTimeout(request, reqInterval);
    request();

})();
