# cmos-validate

基于 [parameter](https://github.com/node-modules/parameter) 提供数据校验方法。

## 安装

```bash
$ npm i cmos-validate --save
```

## 配置

```js
// {app_root}/config/plugin.js
exports.validate = {
  package: 'cmos-validate',
};
```

## 使用方法

- `ctx.validate(rule[, data])`

### 默认验证请求 Body

```js
const createRule = {
  name: 'string',
  age: 'int',
  gender: ['male', 'female', 'unknow'],
};

exports.create = function* () {
  // 校验失败自动返回 422 响应
  this.validate(createRule);
  // 可以传递自己处理过的数据，默认使用 this.request.body
  // this.validate(createRule[, your_data]);
  // 校验通过
  this.body = this.request.body;
};
```

如果验证失败，会返回：

```js
HTTP/1.1 422 Unprocessable Entity

{
  "message": "Validation Failed",
  "errors": [
    {
      "field": "username",
      "code": "missing_field",
      "message": "username required"
    }
  ]
}
```

### addRule

- `app.validator.addRule(rule, checker)`

validate 除了在 `context` 上增加了 validate 方法外，还在 `application` 上增加了一个 `validator` 对象，
可以通过 `app.validator.addRule(rule, checker)` 增加自定义的检查类型。

- `app.js`

```js
module.exports = app => {
  app.validator.addRule('json', (rule, value) => {
    try {
      JSON.parse(value);
    } catch (err) {
      return 'must be json string';
    }
  });
};
```

- 然后在 controller 中使用

```js
const createRule = {
  username: {
    type: 'email',
  },
  password: {
    type: 'password',
    compare: 're-password'
  },
  addition: {
    required: false,
    type: 'json' // 自定义的 json 类型
  },
};

exports.create = function* () {
  this.validate(createRule);
  this.body = this.request.body;
};
```
