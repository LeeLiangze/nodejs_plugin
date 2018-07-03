'use strict';

const assert = require('assert');
const Redis = require('ioredis');

module.exports = app => {
  app.addSingleton('redis', createClient);
};

let count = 0;

function createClient(config, app) {
  let client;

  if (config.cluster === true) {
    assert(config.nodes && config.nodes.length !== 0, '[cmos-redis] cluster nodes configuration is required when use cluster redis');

    config.nodes.forEach(client => {
      assert(client.host && client.port && client.password !== undefined && client.db !== undefined,
        `[cmos-redis] 'host: ${client.host}', 'port: ${client.port}', 'password: ${client.password}', 'db: ${client.db}' are required on config`);
    });
    app.coreLogger.info('[cmos-redis] cluster connecting start');

    client = new Redis.Cluster(config.nodes, config);
    client.on('connect', function() {
      app.coreLogger.info('[cmos-redis] cluster connect success');
    });
    client.on('error', function(error) {
      app.coreLogger.error(error);
    });
  } else {
    assert(config.host && config.port && config.password !== undefined && config.db !== undefined,
      `[cmos-redis] 'host: ${config.host}', 'port: ${config.port}', 'password: ${config.password}', 'db: ${config.db}' are required on config`);

    app.coreLogger.info('[cmos-redis] connecting redis://:%s@%s:%s/%s',
      config.password, config.host, config.port, config.db);

    client = new Redis(config);
    client.on('connect', function() {
      app.coreLogger.info('[cmos-redis] connect success on redis://:%s@%s:%s/%s',
        config.password, config.host, config.port, config.db);
    });
    client.on('error', function(error) {
      app.coreLogger.error(error);
    });
  }

  app.beforeStart(function* () {
    const result = yield client.info();
    const index = count++;
    app.coreLogger.info(`[cmos-redis] instance[${index}] status OK, redis currentTime: ${result[0]}`);
  });

  return client;
}
