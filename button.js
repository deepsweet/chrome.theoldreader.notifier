(function(NotifierButton) {

    var oldreaderButton = new NotifierButton({
        // JSON
        reqURL: 'http://theoldreader.com/feeds/counts.json',
        // URL to open on button click
        openURL: 'https://theoldreader.com/posts/all'
    });

    oldreaderButton
        .onupdate(function(data) {

            // login error
            if (!data.feeds) {
                this.throwError('login error');
                return false;
            }

            updateButton.call(this, data.feeds[0].feeds);

        })
        .go();

    // update from content script
    chrome.runtime.onMessage.addListener(function(data) {

        if (data.type === 'injection') {
            data = JSON.parse(data.feeds).feeds;

            var out = [];

            data.forEach(function(item) {
                item.subscriptions.forEach(function(subscription) {
                    out.push(subscription);
                });
            });

            updateButton.call(oldreaderButton, out);
        }

    });


    /**
     * Update button with unread count and title.
     *
     * @param {Array} data data array
     */
    function updateButton(data) {

        var unread = {
                count: 0,
                title: ''
            },
            titles = 1;

        data.forEach(function(feed) {
            if (feed.unread_count) {
                // collect only first 5 titles
                if (titles <= 5) {
                    unread.title = (unread.title ? unread.title + '\n' : '') + feed.title + ': ' + feed.unread_count;
                } else if (titles === 6) {
                    unread.title += '\n…';
                }

                titles++;

                // increment unread count
                unread.count += feed.unread_count;
            }
        });

        if (unread.count) {
            this.updateBadge({
                color: 'red',
                text: unread.count,
                title: unread.title
            });
        } else {
            this.updateBadge({
                text: '',
                title: 'nothing\'s new'
            });
        }

        this.next();

    }

})(window.NotifierButton);
