'use strict';

const fs = require('fs');
const path = require('path');

[
  require('./lib/framework'),
  require('./lib/plugin'),
  { getFrameworkOrCmosPath },
]
.forEach(obj => Object.assign(exports, obj));

/**
 * Try to get framework dir path
 * If can't find any framework, try to find cmos dir path
 *
 * @param {String} cwd - current work path
 * @param {Array} [cmosNames] - cmos names, default is ['cmos']
 * @return {String} framework or cmos dir path
 * @deprecated
 */
function getFrameworkOrCmosPath(cwd, cmosNames) {
  cmosNames = cmosNames || [ 'cmos' ];
  const moduleDir = path.join(cwd, 'node_modules');
  if (!fs.existsSync(moduleDir)) {
    return '';
  }

  // try to get framework

  // 1. try to read cmos.framework property on package.json
  const pkgFile = path.join(cwd, 'package.json');
  if (fs.existsSync(pkgFile)) {
    const pkg = require(pkgFile);
    if (pkg.cmos && pkg.cmos.framework) {
      return path.join(moduleDir, pkg.cmos.framework);
    }
  }

  // 2. try the module dependencies includes cmosNames
  const names = fs.readdirSync(moduleDir);
  for (const name of names) {
    const pkgfile = path.join(moduleDir, name, 'package.json');
    if (!fs.existsSync(pkgfile)) {
      continue;
    }
    const pkg = require(pkgfile);
    if (pkg.dependencies) {
      for (const cmosName of cmosNames) {
        if (pkg.dependencies[cmosName]) {
          return path.join(moduleDir, name);
        }
      }
    }
  }

  // try to get cmos
  for (const cmosName of cmosNames) {
    const pkgfile = path.join(moduleDir, cmosName, 'package.json');
    if (fs.existsSync(pkgfile)) {
      return path.join(moduleDir, cmosName);
    }
  }

  return '';
}
