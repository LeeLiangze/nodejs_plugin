'use strict';

const Master = require('./lib/master');

/**
 * cluster start flow:
 *
 * [startCluster] -> master -> agent_worker -> new [Agent]       -> agentWorkerLoader
 *                         `-> app_worker   -> new [Application] -> appWorkerLoader
 *
 */

/**
 * start cmos app
 * @method Cmos#startCluster
 * @param {Object} options {@link Master}
 * @param {Function} callback start success callback
 */
exports.startCluster = function(options, callback) {
  new Master(options).ready(callback);
};
