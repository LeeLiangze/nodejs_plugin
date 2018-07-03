'use strict';

const CmosApplication = require('../../test/fixtures/cmos');

const app = new CmosApplication({
  baseDir: __dirname,
  type: 'application',
});

app.loader.loadAll();

app.listen(7001);
console.log('server started at 7001');
