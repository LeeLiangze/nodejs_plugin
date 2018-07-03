'use strict';

const mm = require('mm');
const cluster = require('./lib/cluster');
const app = require('./lib/app');

// cmos-bin will set this flag to require files for instrument
if (process.env.CMOS_BIN_PREREQUIRE) require('./lib/prerequire');

/**
 * @namespace mm
 */

function mock(...args) {
  return mm(...args);
}
module.exports = mock;

// inherit & extends mm
Object.assign(mock, mm, {
  restore() {
    cluster.restore();
    mm.restore();
  },

  /**
   * Create a cmos mocked application
   * @method mm#app
   * @param {Object} [options]
   * - {String} baseDir - The directory of the application
   * - {Object} plugins - Tustom you plugins
   * - {String} framework - The directory of the cmos framework
   * - {Boolean} [true] cache - Cache application based on baseDir
   * - {Boolean} [true] coverage - Swtich on process coverage, but it'll be slower
   * - {Boolean} [true] clean - Remove $baseDir/logs
   * @return {App} return {@link Application}
   * @example
   * ```js
   * var app = mm.app();
   * ```
   */
  app,

  /**
   * Create a cmos mocked cluster application
   * @method mm#cluster
   * @see ClusterApplication
   */
  cluster,

  /**
   * mock the serverEnv of Cmos
   * @member {Function} mm#env
   * @param {String} env - contain default, test, prod, local, unittest
   */
  env(env) {
    mm(process.env, 'CMOS_MOCK_SERVER_ENV', env);
    mm(process.env, 'CMOS_SERVER_ENV', env);
  },

  /**
   * mock console level
   * @param {String} level - logger level
   */
  consoleLevel(level) {
    level = (level || '').toUpperCase();
    mm(process.env, 'CMOS_LOG', level);
  },

  home(homePath) {
    if (homePath) {
      mm(process.env, 'CMOS_HOME', homePath);
    }
  },
});

process.setMaxListeners(100);

process.once('SIGQUIT', () => {
  process.exit(0);
});

process.once('SIGTERM', () => {
  process.exit(0);
});

process.once('SIGINT', () => {
  process.exit(0);
});
