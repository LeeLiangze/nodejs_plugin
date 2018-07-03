# cmos-jwt

cmos's JWT(JSON Web Token Authentication Plugin)

## Install

```bash
$ npm i cmos-jwt --save
```

## Usage

```js
// {app_root}/config/plugin.js
exports.jwt = {
  enable: true,
  package: 'cmos-jwt',
};
```

## Configuration

```js
// {app_root}/config/config.default.js
exports.jwt = {
  secret: '123456',

  enable: true, // default is false
  match: '/success', // optional
};
```

see [config/config.default.js](config/config.default.js) for more detail.

## Example

``` javascript
// app/router.js
'use strict';

module.exports = app => {
  app.get('/', app.jwt, 'render.index'); // use old api app.jwt
  app.get('/login', 'login.index');
  app.get('/success', 'success.index'); // is setting in config.jwt.match
};

// app/controller/render.js
'use strict';

module.exports = app => {
  class RenderController extends app.Controller {
    * index() {
      this.ctx.body = 'hello World';
    }
  }
  return RenderController;
};

// app/controller/login.js
'use strict';

module.exports = app => {
  class LoginController extends app.Controller {
    * index() {
      this.ctx.body = 'hello admin';
    }
  }
  return LoginController;
};

// app/controller/success.js
'use strict';

module.exports = app => {
  class SuccessController extends app.Controller {
    * index() {
      this.ctx.body = this.ctx.state.user;
    }
  }
  return SuccessController;
};
```

Then

```
curl 127.0.0.1:7001
// response 401

curl 127.0.0.1:7001/login
// response hello admin

curl -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmb28iOiJiYXIiLCJpYXQiOjE0OTAwMTU0MTN9.ehQ38YsRlM8hDpUMKYq1rHt-YjBPSU11dFm0NOroPEg" 127.0.0.1:7001/success
// response {foo: bar}
```

## How To Create A Token

```
const token = app.jwt.sign({ foo: 'bar' }, app.config.jwt.secret);
```
