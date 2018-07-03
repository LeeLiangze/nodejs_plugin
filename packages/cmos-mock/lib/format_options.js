'use strict';

const path = require('path');
const mm = require('mm');
const debug = require('debug')('mm');
const utils = require('cmos-utils');

/**
 * format the options
 * @param  {Objct} options - options
 * @return {Object} options
 */
module.exports = function formatOptions(options) {
  const defaults = {
    baseDir: process.cwd(),
    cache: true,
    coverage: true,
    clean: true,
  };
  options = Object.assign({}, defaults, options);

  // relative path to test/fixtures
  // ```js
  // formatOptions({ baseDir: 'app' }); // baseDir => $PWD/test/fixtures/app
  // ```
  if (!path.isAbsolute(options.baseDir)) {
    options.baseDir = path.join(process.cwd(), 'test/fixtures', options.baseDir);
  }

  let framework = options.framework || options.customCmos;
  // test for framework
  if (framework === true) {
    framework = process.cwd();
    // diable plugin test when framwork test
    options.plugin = false;
  } else {
    // it will throw when framework is not found
    framework = utils.getFrameworkPath({ framework, baseDir: options.baseDir });
  }
  options.customCmos = options.framework = framework;

  const plugins = options.plugins = options.plugins || {};

  // add self as a plugin
  plugins['cmos-mock'] = {
    enable: true,
    path: path.join(__dirname, '..'),
  };

  // test for plugin
  if (options.plugin !== false) {
    // add self to plugin list
    const pkgPath = path.join(process.cwd(), 'package.json');
    const pluginName = getPluginName(pkgPath);
    if (options.plugin && !pluginName) {
      throw new Error(`should set cmosPlugin in ${pkgPath}`);
    }
    if (pluginName) {
      plugins[pluginName] = {
        enable: true,
        path: process.cwd(),
      };
    }
  }

  // mock HOME as baseDir, but ignore if it has been mocked
  const env = process.env.CMOS_SERVER_ENV;
  if (!mm.isMocked(process.env, 'HOME') &&
    (env === 'default' || env === 'test' || env === 'prod')) {
    mm(process.env, 'HOME', options.baseDir);
  }

  // disable cache after call mm.env(),
  // otherwise it will use cache and won't load again.
  if (process.env.CMOS_MOCK_SERVER_ENV) {
    options.cache = false;
  }

  debug('format options: %j', options);
  return options;
};

function getPluginName(pkgPath) {
  try {
    const pkg = require(pkgPath);
    if (pkg.cmosPlugin && pkg.cmosPlugin.name) {
      return pkg.cmosPlugin.name;
    }
  } catch (_) {
    // ignore
  }
}
