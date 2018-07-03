'use strict';

const join = require('path').join;
const is = require('is-type-of');
const inspect = require('util').inspect;
const assert = require('assert');
const debug = require('debug')('cmos-core:middleware');
const pathMatching = require('cmos-path-matching');
const utils = require('../../utils');

module.exports = {

  /**
   * Load app/middleware
   *
   * app.config.xx is the options of the middleware xx that has same name as config
   *
   * @method CmosLoader#loadMiddleware
   * @param {Object} opt - LoaderOptions
   * @example
   * ```js
   * // app/middleware/status.js
   * module.exports = function(options, app) {
   *   // options == app.config.status
   *   return function*(next) {
   *     yield next;
   *   }
   * }
   * ```
   * @since 1.0.0
   */
  loadMiddleware(opt) {
    const app = this.app;

    // load middleware to app.middleware
    opt = Object.assign({
      call: false,
      override: true,
      caseStyle: 'lower',
      directory: this.getLoadUnits().map(unit => join(unit.path, 'app/middleware')),
    }, opt);
    const middlewarePaths = opt.directory;
    this.loadToApp(middlewarePaths, 'middlewares', opt);

    for (const name in app.middlewares) {
      Object.defineProperty(app.middleware, name, {
        get() {
          return app.middlewares[name];
        },
        enumerable: false,
        configurable: false,
      });
    }

    this.options.logger.info('Use coreMiddleware order: %j', this.config.coreMiddleware);
    this.options.logger.info('Use appMiddleware order: %j', this.config.appMiddleware);

    // use middleware ordered by app.config.coreMiddleware and app.config.appMiddleware
    const middlewareNames = this.config.coreMiddleware.concat(this.config.appMiddleware);
    debug('middlewareNames: %j', middlewareNames);
    const middlewaresMap = new Map();
    for (const name of middlewareNames) {
      if (!app.middlewares[name]) {
        throw new TypeError(`Middleware ${name} not found`);
      }
      if (middlewaresMap.has(name)) {
        throw new TypeError(`Middleware ${name} redefined`);
      }
      middlewaresMap.set(name, true);

      const options = this.config[name] || {};
      let mw = app.middlewares[name];
      mw = mw(options, app);
      assert(is.function(mw), `Middleware ${name} must be a function, but actual is ${inspect(mw)}`);
      mw._name = name;
      // middlewares support options.enable, options.ignore and options.match
      mw = wrapMiddleware(mw, options);
      if (mw) {
        app.use(mw);
        debug('Use middleware: %s with options: %j', name, options);
        this.options.logger.info('[cmos:loader] Use middleware: %s', name);
      } else {
        this.options.logger.info('[cmos:loader] Disable middleware: %s', name);
      }
    }

    this.options.logger.info('[cmos:loader] Loaded middleware from %j', middlewarePaths);
  },

};

function wrapMiddleware(mw, options) {
  // support options.enable
  if (options.enable === false) return null;

  // support async function
  mw = utils.middleware(mw);

  // support options.match and options.ignore
  if (!options.match && !options.ignore) return mw;
  const match = pathMatching(options);

  const fn = function* (next) {
    if (!match(this)) return yield next;
    yield mw.call(this, next);
  };
  fn._name = mw._name + 'middlewareWrapper';
  return fn;
}
