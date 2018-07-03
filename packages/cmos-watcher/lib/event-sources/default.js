'use strict';

const Base = require('sdk-base');

class DefaultEventSource extends Base {

  constructor() {
    super();
    // delay emit so that can be listened
    setImmediate(() => this.emit('warn', '[cmos-watcher] defaultEventSource watcher will NOT take effect'));
    this.ready(true);
  }

  watch() {
    this.emit('warn', '[cmos-watcher] using defaultEventSource watcher.watch() does NOTHING');
  }

  unwatch() {
    this.emit('warn', '[cmos-watcher] using defaultEventSource watcher.unwatch() does NOTHING');
  }

}

module.exports = DefaultEventSource;
