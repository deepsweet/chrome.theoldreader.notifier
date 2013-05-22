(function(chrome, win) {

    /**
     * Create an instance of Notifier Button.
     *
     * @constructor
     * @this {NotifierButton}
     * @param {Object} params params
     */
    function NotifierButton(params) {

        // 10 sec timeout
        params.reqTimeout = params.reqTimeout || 10 * 1000;
        // 5 mins interval
        params.reqInterval = params.reqInterval || 5 * 60 * 1000;
        // 1 min interval after error
        params.reqErrorInterval = params.reqErrorInterval || 1 * 60 * 1000;
        // badge colors
        params.badgeColors = {
            gray: [200, 200, 200, 255],
            red: [255, 0, 0, 255],
            blue: [0, 0, 255, 255],
            green: [0, 255, 0, 255]
        };

        this.params = params;

        return this;

    }

    /**
     * Go!
     * Binds to button click, online, offline and update events.
     *
     * @this {NotifierButton}
     * @return {NotifierButton}
     */
    NotifierButton.prototype.go = function() {

        var self = this;

        // button click
        chrome.browserAction.onClicked.addListener(self._onclick || function() {
            chrome.tabs.create({
                url: self.params.openURL
            });
        });

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
                self._onupdate.call(self, JSON.parse(this.responseText));
            } else {
                self.throwError('error retrieving data');
            }
        };

        req.timeout = self.params.reqTimeout;

        req.ontimeout = function() {
            self.throwError('connection timeout');
        };

        req.onerror = function() {
            self.throwError('connection error');
        };

        req.open('GET', self.params.reqURL, true);
        req.send();

        return self;

    };

    /**
     * On update handler.
     *
     * @param {Function} callback callback function
     * @this {NotifierButton}
     * @return {NotifierButton}
     */
    NotifierButton.prototype.onupdate = function(callback) {

        this._onupdate = callback;

        return this;

    };

    /**
     * On click handler.
     *
     * @param {Function} callback callback function
     * @this {NotifierButton}
     * @return {NotifierButton}
     */
    NotifierButton.prototype.onclick = function(callback) {

        this._onclick = callback;

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

        if (navigator.onLine === false) {
            title = 'no internet connection';
        }

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

        return self;

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

        return self;

    };

    win.NotifierButton = win.NotifierButton || NotifierButton;

})(chrome, window);
