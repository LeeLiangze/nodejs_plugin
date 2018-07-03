# cmos-logger
主要由 Logger 和 Transport 两个基类组成。

Transport 是一种写入日志的渠道，可以是终端、文件等等。

Logger 是所有日志的基类，可以进行扩展。一个 Logger 可以添加多个 Transport，只要调用一次就可以将日志写入多个地方。

---

## Install

```bash
$ npm i cmos-logger
```

## Usage

创建一个 Logger，添加一个文件的 Transport

```js
const Logger = require('cmos-logger').Logger;
const FileTransport = require('cmos-logger').FileTransport;
const ConsoleTransport = require('cmos-logger').ConsoleTransport;

const logger = new Logger();
logger.set('file', new FileTransport({
  file: '/path/to/file',
  level: 'INFO',
}));
logger.set('console', new ConsoleTransport({
  level: 'DEBUG',
}));
logger.debug('debug foo'); // 不会输出到文件，只输出到终端
logger.info('info foo');
logger.warn('warn foo');
logger.error(new Error('error foo'));
```

### 开启/关闭 Transport

```js
logger.disable('file');
logger.info('info'); // 不会输出
logger.enable('file');
logger.info('info'); // 开启后会输出
```

### 重定向日志

可以将日志重定向到指定的日志对象

```js
logger.redirect('error', errorLogger);
logger.error(new Error('print to errorLogger')); // 等价于调用 errorLogger.error
```

### 重新加载文件

```js
logger.reload(); // will end the exists write stream and create a new one.
```

### 自定义 Transport

可以自定义一个 Transport 用于输出日志，比如发送到服务器。

```js
const urllib = require('urllib');
const Transport = require('cmos-logger').Transport;

class UrllibTransport extends Transport {

  log(level, args, meta) {
    const msg = super.log(level, args, meta);
    return urllib.request('url?msg=' + msg);
  }
}

const logger = new Logger();
logger.set('remote', new UrllibTransport({
  level: 'DEBUG',
}));
logger.info('info');