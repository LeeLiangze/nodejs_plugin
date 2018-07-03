'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const isFunction = require('is-type-of').function;
const debug = require('debug')('cmos-core');
const homedir = require('node-homedir');
const FileLoader = require('./file_loader');
const ContextLoader = require('./context_loader');
const utils = require('../utils');


class CmosLoader {

  /**
   * @constructor
   * @param {Object} options - options
   * @param {String} options.baseDir - the directory of application
   * @param {CmosCore} options.app - Application instance
   * @param {Logger} options.logger - logger
   * @param {Object} [options.plugins] - custom plugins
   * @since 1.0.0
   */
  constructor(options) {
    this.options = options;
    assert(fs.existsSync(this.options.baseDir), `${this.options.baseDir} not exists`);
    assert(this.options.app, 'options.app is required');
    assert(this.options.logger, 'options.logger is required');
    debug('CmosLoader options %j', options);

    this.app = this.options.app;

    /**
     * @member {Object} CmosLoader#pkg
     * @see {@link AppInfo#pkg}
     * @since 1.0.0
     */
    this.pkg = require(path.join(this.options.baseDir, 'package.json'));

    /**
     * All framework directories.
     *
     * You can extend Application of cmos, the entry point is options.app,
     *
     * loader will find all directories from the prototype of Application,
     * you should define `Symbol.for('cmos#cmosPath')` property.
     *
     * ```
     * // lib/example.js
     * const cmos = require('cmos');
     * class ExampleApplication extends cmos.Application {
     *   constructor(options) {
     *     super(options);
     *   }
     *
     *   get [Symbol.for('cmos#cmosPath')]() {
     *     return path.join(__dirname, '..');
     *   }
     * }
     * ```
     * @member {Array} CmosLoader#cmosPaths
     * @see CmosLoader#getCmosPaths
     * @since 1.0.0
     */
    this.cmosPaths = this.getCmosPaths();
    debug('Loaded cmosPaths %j', this.cmosPaths);

    /**
     * @member {String} CmosLoader#serverEnv
     * @see AppInfo#env
     * @since 1.0.0
     */
    this.serverEnv = this.getServerEnv();
    debug('Loaded serverEnv %j', this.serverEnv);

    /**
     * @member {AppInfo} CmosLoader#appInfo
     * @since 1.0.0
     */
    this.appInfo = this.getAppInfo();
  }

  /**
   * Get {@link AppInfo#env}
   * @return {String} env
   * @see AppInfo#env
   * @private
   * @since 1.0.0
   */
  getServerEnv() {
    let serverEnv;

    const envPath = path.join(this.options.baseDir, 'config/env');
    if (fs.existsSync(envPath)) {
      serverEnv = fs.readFileSync(envPath, 'utf8').trim();
    }

    if (!serverEnv) {
      serverEnv = process.env.CMOS_SERVER_ENV;
    }

    if (!serverEnv) {
      if (process.env.NODE_ENV === 'test') {
        serverEnv = 'unittest';
      } else if (process.env.NODE_ENV === 'production') {
        serverEnv = 'prod';
      } else {
        serverEnv = 'local';
      }
    }

    return serverEnv;
  }

  /**
   * Get {@link AppInfo#name}
   * @return {String} appname
   * @private
   * @since 1.0.0
   */
  getAppname() {
    if (this.pkg.name) {
      debug('Loaded appname(%s) from package.json', this.pkg.name);
      return this.pkg.name;
    }
    const pkg = path.join(this.options.baseDir, 'package.json');
    throw new Error(`name is required from ${pkg}`);
  }

  /**
   * Get home directory
   * @return {String} home directory
   * @since 3.4.0
   */
  getHomedir() {
    // CMOS_HOME for test
    return process.env.CMOS_HOME || homedir() || '/home/admin';
  }

  /**
   * Get app info
   * @return {AppInfo} appInfo
   * @since 1.0.0
   */
  getAppInfo() {
    const env = this.serverEnv;
    const home = this.getHomedir();
    const baseDir = this.options.baseDir;

    /**
     * Meta information of the application
     * @class AppInfo
     */
    return {
      /**
       * The name of the application, retrieve from the name property in `package.json`.
       * @member {String} AppInfo#name
       */
      name: this.getAppname(),

      /**
       * The current directory, where the application code is.
       * @member {String} AppInfo#baseDir
       */
      baseDir,

      /**
       * The environment of the application, **it's not NODE_ENV**
       *
       * 1. from `$baseDir/config/env`
       * 2. from CMOS_SERVER_ENV
       * 3. from NODE_ENV
       *
       * env | description
       * ---       | ---
       * test      | system integration testing
       * prod      | production
       * local     | local on your own computer
       * unittest  | unit test
       *
       * @member {String} AppInfo#env
       */
      env,

      /**
       * The use directory, same as `process.env.HOME`
       * @member {String} AppInfo#HOME
       */
      HOME: home,

      /**
       * parsed from `package.json`
       * @member {Object} AppInfo#pkg
       */
      pkg: this.pkg,

      /**
       * The directory whether is baseDir or HOME depend on env.
       * it's good for test when you want to write some file to HOME,
       * but don't want to write to the real directory,
       * so use root to write file to baseDir instead of HOME when unittest.
       * keep root directory in baseDir when local and unittest
       * @member {String} AppInfo#root
       */
      root: env === 'local' || env === 'unittest' ? baseDir : home,
    };
  }

  /**
   * Get {@link CmosLoader#cmosPaths}
   * @return {Array} framework directories
   * @see {@link CmosLoader#cmosPaths}
   * @private
   * @since 1.0.0
   */
  getCmosPaths() {
    // avoid require recursively
    const CmosCore = require('../cmos');
    const cmosPaths = [];

    let proto = this.app;

    // Loop for the prototype chain
    while (proto) {
      proto = Object.getPrototypeOf(proto);
      // stop the loop if
      // - object extends Object
      // - object extends CmosCore
      if (proto === Object.prototype || proto === CmosCore.prototype) {
        break;
      }

      assert(proto.hasOwnProperty(Symbol.for('cmos#cmosPath')), 'Symbol.for(\'cmos#cmosPath\') is required on Application');
      const cmosPath = proto[Symbol.for('cmos#cmosPath')];
      assert(cmosPath && typeof cmosPath === 'string', 'Symbol.for(\'cmos#cmosPath\') should be string');
      const realpath = fs.realpathSync(cmosPath);
      if (cmosPaths.indexOf(realpath) === -1) {
        cmosPaths.unshift(realpath);
      }
    }

    return cmosPaths;
  }

  // Low Level API

  /**
   * Load single file, will invoke when export is function
   *
   * @param {String} filepath - fullpath
   * @param {Array} arguments - pass rest arguments into the function when invoke
   * @return {Object} exports
   * @example
   * ```js
   * app.loader.loadFile(path.join(app.options.baseDir, 'config/router.js'));
   * ```
   * @since 1.0.0
   */
  loadFile(filepath, ...inject) {
    if (!fs.existsSync(filepath)) {
      return null;
    }

    const ret = utils.loadFile(filepath);
    // function(arg1, args, ...) {}
    if (inject.length === 0) inject = [ this.app ];
    return isFunction(ret) ? ret(...inject) : ret;
  }

  /**
   * Get all loadUnit
   *
   * loadUnit is a directory that can be loaded by CmosLoader, it has the same structure.
   * loadUnit has a path and a type(app, framework, plugin).
   *
   * The order of the loadUnits:
   *
   * 1. plugin
   * 2. framework
   * 3. app
   *
   * @return {Array} loadUnits
   * @since 1.0.0
   */
  getLoadUnits() {
    if (this.dirs) {
      return this.dirs;
    }

    const dirs = this.dirs = [];

    if (this.orderPlugins) {
      for (const plugin of this.orderPlugins) {
        dirs.push({
          path: plugin.path,
          type: 'plugin',
        });
      }
    }

    // framework or cmos path
    for (const cmosPath of this.cmosPaths) {
      dirs.push({
        path: cmosPath,
        type: 'framework',
      });
    }

    // application
    dirs.push({
      path: this.options.baseDir,
      type: 'app',
    });

    debug('Loaded dirs %j', dirs);
    return dirs;
  }

  /**
   * Load files using {@link FileLoader}, inject to {@link Application}
   * @param {String|Array} directory - see {@link FileLoader}
   * @param {String} property - see {@link FileLoader}
   * @param {Object} opt - see {@link FileLoader}
   * @since 1.0.0
   */
  loadToApp(directory, property, opt) {
    const target = this.app[property] = {};
    opt = Object.assign({}, {
      directory,
      target,
      inject: this.app,
    }, opt);
    new FileLoader(opt).load();
  }

  /**
   * Load files using {@link ContextLoader}
   * @param {String|Array} directory - see {@link ContextLoader}
   * @param {String} property - see {@link ContextLoader}
   * @param {Object} opt - see {@link ContextLoader}
   * @since 1.0.0
   */
  loadToContext(directory, property, opt) {
    opt = Object.assign({}, {
      directory,
      property,
      inject: this.app,
    }, opt);
    new ContextLoader(opt).load();
  }

  /**
   * @member {FileLoader} CmosLoader#FileLoader
   * @since 1.0.0
   */
  get FileLoader() {
    return FileLoader;
  }

  /**
   * @member {ContextLoader} CmosLoader#ContextLoader
   * @since 1.0.0
   */
  get ContextLoader() {
    return ContextLoader;
  }

}

/**
 * Mixin methods to CmosLoader
 * // ES6 Multiple Inheritance
 * https://medium.com/@leocavalcante/es6-multiple-inheritance-73a3c66d2b6b
 */
const loaders = [
  require('./mixin/plugin'),
  require('./mixin/config'),
  require('./mixin/extend'),
  require('./mixin/custom'),
  require('./mixin/service'),
  require('./mixin/middleware'),
  require('./mixin/controller'),
  require('./mixin/router'),
];

for (const loader of loaders) {
  Object.assign(CmosLoader.prototype, loader);
}

module.exports = CmosLoader;
