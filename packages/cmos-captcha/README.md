# cmos-captcha

> Captcha utils for cmos server

*Based on [gd-bmp](https://github.com/zengming00/node-gd-bmp)*

### Install via npm

```plain
npm i -S cmos-captcha
```

### Draw the image

```js
let { drawCaptcha } = require('cmos-captcha')
// ...
router.get('/api/captcha', drawCaptcha)
```

### Verify the code

```js
let { verifyCaptcha } = require('cmos-captcha')
// ...
router.post('/api/login', ctx => {
  if (!verifyCaptcha(ctx)) {
    ctx.throw(400, 'Captcha not correct')
  }
  // ...
})
```
