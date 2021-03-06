'use strict';

const path = require('path');

module.exports = {

  /**
   * Load app/router.js
   * @method CmosLoader#loadRouter
   * @param {Object} opt - LoaderOptions
   * @since 1.0.0
   */
  loadRouter() {
    // 加载 router.js
    this.loadFile(path.join(this.options.baseDir, 'app/router.js'));
  },
};
