# cmos-brac

Provide dynamic roles based authorisation. Use [koa-roles](https://github.com/koajs/koa-roles).

## 安装

```bash
$ npm i cmos-brac --save
```

## 使用
```javascript
// {app_root}/config/plugin.js
exports.brac = {
  package: 'cmos-brac',
};
```

### Build-in

`Roles` build-in `failureHandler`:

```javascript
function failureHandler(action) {
  const message = 'Forbidden, required role: ' + action;
  if (this.acceptJSON) {
    this.body = {
      message: message,
      stat: 'deny',
    };
  } else {
    this.status = 403;
    this.body = message;
  }
};
```

Build-in `user` role define:

```javascript
app.role.use('user', function() {
  return !!this.user;
});
```

### 自定义`failureHandler`

在 `config/role.js`中，定义 `app.role.failureHandler(action)` 方法

- `app/extend/context.js`

```javascript
// {app_root}/config/role.js or {framework_root}/config/role.js
module.exports = app => {
  app.role.failureHandler = function(action) {
    if (this.acceptJSON) {
      this.body = { target: loginURL, stat: 'deny' };
    } else {
      this.realStatus = 200;
      this.redirect(loginURL);
    }
  };
}
```

### 自定义角色

```javascript
// {app_root}/config/role.js or {framework_root}/config/role.js
module.exports = function(app) {
  app.role.use('admin', function() {
    return this.user && this.user.isAdmin;
  });
};
```
