'use strict';
const path = require('path');

module.exports = {
  config: path.resolve('./node_modules/cmos-sequelize/lib/database.js'),
  'migrations-path': path.resolve('migrations'),
};
