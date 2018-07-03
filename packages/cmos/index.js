'use strict';

/**
 * @namespace Cmos
 */

/**
 * Start cmos application with cluster mode
 * @since 1.0.0
 */
exports.startCluster = require('cmos-cluster').startCluster;

/**
 * @member {Application} Cmos#Application
 * @since 1.0.0
 */
exports.Application = require('./lib/application');

/**
 * @member {Agent} Cmos#Agent
 * @since 1.0.0
 */
exports.Agent = require('./lib/agent');

/**
 * @member {AppWorkerLoader} Cmos#AppWorkerLoader
 * @since 1.0.0
 */
exports.AppWorkerLoader = require('./lib/loader').AppWorkerLoader;

/**
 * @member {AgentWorkerLoader} Cmos#AgentWorkerLoader
 * @since 1.0.0
 */
exports.AgentWorkerLoader = require('./lib/loader').AgentWorkerLoader;

/**
 * @member {Controller} Cmos#Controller
 * @since 1.1.0
 */
exports.Controller = require('cmos-core').BaseContextClass;

/**
 * @member {Service} Cmos#Service
 * @since 1.1.0
 */
exports.Service = require('cmos-core').BaseContextClass;
