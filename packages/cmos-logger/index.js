'use strict';

module.exports.Logger = require('./lib/logger');

module.exports.Transport = require('./lib/transports/transport');
module.exports.FileBufferTransport = require('./lib/transports/file_buffer');
module.exports.FileTransport = require('./lib/transports/file');
module.exports.ConsoleTransport = require('./lib/transports/console');

module.exports.CmosLogger = require('./lib/cmos/logger');
module.exports.CmosErrorLogger = require('./lib/cmos/error_logger');
module.exports.CmosConsoleLogger = require('./lib/cmos/console_logger');
module.exports.CmosCustomLogger = require('./lib/cmos/custom_logger');
module.exports.CmosContextLogger = require('./lib/cmos/context_logger');
module.exports.CmosLoggers = require('./lib/cmos/loggers');

module.exports.levels = require('./lib/level');
Object.assign(module.exports, module.exports.levels);
