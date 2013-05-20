(function(NotifierButton) {

    var oldreaderButton = new NotifierButton({
        // JSON
        reqURL: 'http://theoldreader.com/feeds/counts.json',
        // 10 sec timeout
        reqTimeout: 10 * 1000,
        // 5 mins interval
        reqInterval: 5 * 60 * 1000,
        // 1 min interval after error
        reqErrorInterval: 1 * 60 * 1000,
        // URL to open on button click
        openURL: 'http://theoldreader.com/posts/all',
        // URL regexp to match tabs
        tabsURL: /theoldreader\.com/
    });

    oldreaderButton
        .onupdate(function(data) {

            // login error
            if (!data.feeds) {
                this.throwError('login error');
                return false;
            }

            var unread = 0,
                title = '',
                titles = 1;

            data.feeds[0].feeds.forEach(function(feed) {
                if (feed.unread_count) {
                    // collect only first 5 titles
                    if (titles <= 5) {
                        title = (title ? title + '\n' : '') + feed.title + ': ' + feed.unread_count;
                    } else if (titles === 6) {
                        title += '\n…';
                    }

                    titles++;

                    // increment unread count
                    unread += feed.unread_count;
                }
            });

            if (unread) {
                this.updateBadge({
                    color: 'red',
                    text: unread,
                    title: title
                });
            } else {
                this.updateBadge({
                    text: '',
                    title: 'nothing\'s new'
                });
            }

        })
        .go();

})(window.NotifierButton);
