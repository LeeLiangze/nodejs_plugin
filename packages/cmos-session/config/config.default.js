'use strict';

exports.session = {
  maxAge: 24 * 3600 * 1000, // ms
  key: 'CMOS_SESS',
  httpOnly: true,
  encrypt: true,
};
