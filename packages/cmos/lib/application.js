'use strict';

const path = require('path');
const graceful = require('graceful');
const http = require('http');
const CmosApplication = require('./cmos');
const AppWorkerLoader = require('./loader').AppWorkerLoader;
const cluster = require('cluster-client');
const { assign } = require('utility');

const KEYS = Symbol('Application#keys');
const HELPER = Symbol('Application#Helper');
const LOCALS = Symbol('Application#locals');
const LOCALS_LIST = Symbol('Application#localsList');
const CMOS_LOADER = Symbol.for('cmos#loader');
const CMOS_PATH = Symbol.for('cmos#cmosPath');
const CLUSTER_CLIENTS = Symbol.for('cmos#clusterClients');

/**
 * Singleton instance in App Worker, extend {@link CmosApplication}
 * @extends CmosApplication
 */
class Application extends CmosApplication {

  /**
   * @constructor
   * @param {Object} options - see {@link CmosApplication}
   */
  constructor(options = {}) {
    options.type = 'application';
    super(options);

    try {
      this.loader.load();
    } catch (e) {
      // close gracefully
      this[CLUSTER_CLIENTS].forEach(cluster.close);
      throw e;
    }

    // dump config after loaded, ensure all the dynamic modifications will be recorded
    this.dumpConfig();
    this.warnConfusedConfig();
    this.bindEvents();
  }

  get [CMOS_LOADER]() {
    return AppWorkerLoader;
  }

  get [CMOS_PATH]() {
    return path.join(__dirname, '..');
  }

  onServer(server) {
    /* istanbul ignore next */
    graceful({
      server: [ server ],
      error: (err, throwErrorCount) => {
        if (err.message) {
          err.message += ' (uncaughtException throw ' + throwErrorCount + ' times on pid:' + process.pid + ')';
        }
        this.coreLogger.error(err);
      },
    });
  }

  /**
   * global locals for view
   * @member {Object} Application#locals
   * @see Context#locals
   */
  get locals() {
    if (!this[LOCALS]) {
      this[LOCALS] = {};
    }
    if (this[LOCALS_LIST] && this[LOCALS_LIST].length) {
      assign(this[LOCALS], this[LOCALS_LIST]);
      this[LOCALS_LIST] = null;
    }
    return this[LOCALS];
  }

  set locals(val) {
    if (!this[LOCALS_LIST]) {
      this[LOCALS_LIST] = [];
    }
    this[LOCALS_LIST].push(val);
  }

  /**
   * Create cmos context
   * @method Application#createContext
   * @param  {Req} req - node native Request object
   * @param  {Res} res - node native Response object
   * @return {Context} context object
   */
  createContext(req, res) {
    const app = this;
    const context = Object.create(app.context);
    const request = context.request = Object.create(app.request);
    const response = context.response = Object.create(app.response);
    context.app = request.app = response.app = app;
    context.req = request.req = response.req = req;
    context.res = request.res = response.res = res;
    request.ctx = response.ctx = context;
    request.response = response;
    response.request = request;
    context.onerror = context.onerror.bind(context);
    context.originalUrl = request.originalUrl = req.url;

    /**
     * Request start time
     * @member {Number} Context#starttime
     */
    context.starttime = Date.now();
    return context;
  }

  /**
   * Create an anonymouse context, the context isn't request level, so the request is mocked.
   * then you can use context level API like `ctx.service`
   * @member {String} Application#createAnonymousContext
   * @param {Request} req - if you want to mock request like querystring, you can pass an object to this function.
   * @return {Context} context
   */
  createAnonymousContext(req) {
    const request = {
      headers: {
        'x-forwarded-for': '127.0.0.1',
      },
      query: {},
      querystring: '',
      host: '127.0.0.1',
      hostname: '127.0.0.1',
      protocol: 'http',
      secure: 'false',
      method: 'GET',
      url: '/',
      path: '/',
      socket: {
        remoteAddress: '127.0.0.1',
        remotePort: 7001,
      },
    };
    if (req) {
      for (const key in req) {
        if (key === 'headers' || key === 'query' || key === 'socket') {
          Object.assign(request[key], req[key]);
        } else {
          request[key] = req[key];
        }
      }
    }
    const response = new http.ServerResponse(request);
    return this.createContext(request, response);
  }

  /**
   * Run generator function in the background
   * @see Context#runInBackground
   * @param {Generator} scope - generator function, the first args is an anonymous ctx
   */
  runInBackground(scope) {
    const ctx = this.createAnonymousContext();
    ctx.runInBackground(scope);
  }

  /**
   * secret key for Application
   * @member {String} Application#keys
   */
  get keys() {
    if (!this[KEYS]) {
      if (!this.config.keys) {
        if (this.config.env === 'local' || this.config.env === 'unittest') {
          const configPath = path.join(this.config.baseDir, 'config/config.default.js');
          console.error('Cookie need secret key to sign and encrypt.');
          console.error('Please add `config.keys` in %s', configPath);
        }
        throw new Error('Please set config.keys first');
      }

      this[KEYS] = this.config.keys.split(',').map(s => s.trim());
    }
    return this[KEYS];
  }

  /**
   * The helper class, `app/helper` will be loaded to it's prototype,
   * then you can use all method on `ctx.helper`
   * @member {Helper} Application#Helper
   */
  get Helper() {
    if (!this[HELPER]) {
      this[HELPER] = class Helper extends this.BaseContextClass {};
    }
    return this[HELPER];
  }

  /**
   * bind app's events
   *
   * @private
   */
  bindEvents() {
    // Browser Cookie Limits: http://browsercookielimits.squawky.net/
    this.on('cookieLimitExceed', ({ name, value, ctx }) => {
      const err = new Error(`cookie ${name}'s length(${value.length}) exceed the limit(4093)`);
      err.name = 'CookieLimitExceedError';
      err.cookie = value;
      ctx.coreLogger.error(err);
    });
    // expose server to support websocket
    this.on('server', server => this.onServer(server));
  }

  /**
   * warn when confused configurations are present
   *
   * @private
   */
  warnConfusedConfig() {
    const confusedConfigurations = this.config.confusedConfigurations;
    Object.keys(confusedConfigurations).forEach(key => {
      if (this.config[key] !== undefined) {
        this.logger.warn('Unexpected config key `%s` exists, Please use `%s` instead.',
        key, confusedConfigurations[key]);
      }
    });
  }
}

module.exports = Application;
