# cmos-oauth2-server

## Install

```bash
$ npm i cmos-oauth2-server --save
```

## Usage

```js
// {app_root}/config/plugin.js
exports.oauth2Server = {
  enable: true,
  package: 'cmos-oauth2-server',
};

// {app_root}/app/router.js
app.all('/user/grant', app.oauth.grant());
app.get('/user/check', app.oauth.authorise(), 'user.check');
```

## Configuration

```js
// {app_root}/config/config.default.js
module.exports = config => {
  const exports = {};
  exports.oauth2Server = {
    debug: config.env === 'local',
    grants: [ 'password' ],
  };
  return exports;
};
```

Full description see [https://www.npmjs.com/package/oauth2-server](https://www.npmjs.com/package/oauth2-server).

## Implementation Example

```js
// {app_root}/app/extend/oauth.js
'use strict';

module.exports = app => {
  const model = {};
  model.getClient = (clientId, clientSecret, callback) => {};
  model.grantTypeAllowed = (clientId, grantType, callback) => {};
  model.getUser = (username, password, callback) => {}; // only for password mode
  model.saveAccessToken = (accessToken, clientId, expires, user, callback) => {};
  model.getAccessToken = (bearerToken, callback) => {};
  return model;
};
```

Full description see [https://www.npmjs.com/package/oauth2-server](https://www.npmjs.com/package/oauth2-server).

### password mode `app.oauth.grant()` lifecycle

`getClient` --> `grantTypeAllowed` --> `getUser` --> `saveAccessToken`

### password mode `app.oauth.authorise()` lifecycle

Only `getAccessToken`
