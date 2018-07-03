'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const os = require('os');
const mkdirp = require('mkdirp');

const tmpDir = os.tmpdir();
const logger = {
  debug: noop,
  info: noop,
  warn: noop,
  error: noop,
};

exports.getPlugins = opt => {
  const loader = getLoader(opt);
  loader.loadPlugin();
  return loader.allPlugins;
};

exports.getLoadUnits = opt => {
  const loader = getLoader(opt);
  loader.loadPlugin();
  return loader.getLoadUnits();
};

function getLoader({ framework, baseDir }) {
  assert(framework, 'framework is required');
  assert(fs.existsSync(framework), `${framework} should exist`);
  if (!(baseDir && fs.existsSync(baseDir))) {
    baseDir = path.join(tmpDir, String(Date.now()), 'tmpapp');
    mkdirp.sync(baseDir);
    fs.writeFileSync(path.join(baseDir, 'package.json'), JSON.stringify({ name: 'tmpapp' }));
  }

  const CmosLoader = findCmosCore({ baseDir, framework }).CmosLoader;
  const { Application } = require(framework);
  return new CmosLoader({
    baseDir,
    logger,
    app: Object.create(Application.prototype),
  });
}

function findCmosCore({ baseDir, framework }) {
  try {
    const name = 'cmos-core';
    return require(name);
  } catch (_) {
    let cmosCorePath = path.join(baseDir, 'node_modules/cmos-core');
    if (!fs.existsSync(cmosCorePath)) {
      cmosCorePath = path.join(framework, 'node_modules/cmos-core');
    }
    assert(fs.existsSync(cmosCorePath), `Can't find cmos-core from ${baseDir} and ${framework}`);
    return require(cmosCorePath);
  }
}

function noop() {}
