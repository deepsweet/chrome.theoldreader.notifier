(function(chrome, win) {

    /**
     * Create an instance of Notifier Button.
     *
     * @constructor
     * @this {NotifierButton}
     * @param {Object} params params
     */
    function NotifierButton(params) {

        var self = this;

        self.params = params;

        self.params.badgeColors = {
            gray: [200, 200, 200, 255],
            red: [255, 0, 0, 255],
            blue: [0, 0, 255, 255],
            green: [0, 255, 0, 255]
        };

        return this;

    }

    /**
     * Go!
     * Binds to button click, tab(s) close,
     * online, offline and update events.
     *
     * @this {NotifierButton}
     * @return {NotifierButton}
     */
    NotifierButton.prototype.go = function() {

        var self = this;

        // button click
        chrome.browserAction.onClicked.addListener(function() {
            chrome.tabs.create({
                url: self.params.openURL
            });
        });

        // update on tab(s) close
        if (self.params.tabsURL) {

            self.tabs = [];

            // save tabs IDs
            chrome.tabs.onCreated.addListener(function(tab) {
                if (self.params.tabsURL.test(tab.url)) {
                    self.tabs.push(tab.id);
                }
            });

            // update on tab(s) close and renew timeout
            chrome.tabs.onRemoved.addListener(function(id) {
                if (~self.tabs.indexOf(id)) {
                    self.request();
                    self.tabs.splice(self.tabs.indexOf(id), 1);
                }
            });

        }

        // bind to 'update' interval
        chrome.alarms.onAlarm.addListener(function(alarm) {
            if (alarm.name === 'update') {
                self.request();
            }
        });

        // online
        win.ononline = function() {
            setTimeout(function() {
                self.request.call(self);
            }, 3000);
        };

        // offline
        win.onoffline = function() {
            chrome.alarms.clear('update');
            self.throwError('no internet connection', true);
        };

        self.request();

        return self;

    };

    /**
     * XHR.
     *
     * @this {NotifierButton}
     * @return {NotifierButton}
     */
    NotifierButton.prototype.request = function() {

        console.log('update: ' + new Date(Date.now()).toTimeString());

        var self = this,
            req = new XMLHttpRequest();

        req.onload = function() {
            if (this.status === 200) {
                if (self.updateCallback.call(self, JSON.parse(this.responseText)) === false) {
                    self.throwError('login error');
                } else {
                    self.next();
                }
            } else {
                self.throwError('error retrieving data');
            }
        };

        req.timeout = self.params.reqTimeout;

        req.ontimeout = function() {
            self.throwError('connection timeout');
        };

        req.onerror = function() {
            self.throwError(navigator.onLine ? 'connection error' : 'no internet connection');
        };

        req.open('GET', self.params.reqURL, true);
        req.send();

        return self;

    };

    /**
     * On-update handler.
     *
     * @param {Function} callback callback function
     * @this {NotifierButton}
     * @return {NotifierButton}
     */
    NotifierButton.prototype.onupdate = function(callback) {

        this.updateCallback = callback;

        return this;

    };

    /**
     * "Throw" error via badge color and title.
     *
     * @param {String} title badge title
     * @param {Boolean} clearTimeout do not call next()
     * @this {NotifierButton}
     * @return {NotifierButton}
     */
    NotifierButton.prototype.throwError = function(title, clearTimeout) {

        this.updateBadge({
            color: 'gray',
            text: '×',
            title: title
        });

        // re-check more often
        if (!clearTimeout) {
            this.next(this.params.reqErrorInterval);
        }

    };

    /**
     * Update badge color, text and title.
     *
     * @param {Object} data data
     * @this {NotifierButton}
     * @return {NotifierButton}
     */
    NotifierButton.prototype.updateBadge = function(data) {

        var self = this;

        chrome.browserAction.setBadgeBackgroundColor({
            color: (self.params.badgeColors[data.color] || self.params.badgeColors.red)
        });

        chrome.browserAction.setBadgeText({
            text: (data.text + '' || '')
        });

        chrome.browserAction.setTitle({
            title: (data.title + '' || '')
        });

    };

    /**
     * Call next request after timeout.
     *
     * @param {Number} time interval time
     * @this {NotifierButton}
     * @return {NotifierButton}
     */
    NotifierButton.prototype.next = function(time) {

        var self = this;

        chrome.alarms.clear('update');

        chrome.alarms.create('update', {
            when: Date.now() + (time || self.params.reqInterval)
        });

        return this;

    };

    win.NotifierButton = win.NotifierButton || NotifierButton;

})(chrome, window);
