'use strict';

const Benchmark = require('benchmark');
const benchmarks = require('beautify-benchmark');
const CmosCookies = require('..');
const Cookies = require('cookies');
const Keygrip = require('Keygrip');
const suite = new Benchmark.Suite();

const keys = [ 'this is a very very loooooooooooooooooooooooooooooooooooooong key' ];
const keygrip = new Keygrip(keys);

const cmos = createCmosCookie();
const cookie = createCookie();

console.log('------------get test----------');
console.log(cmosCookie.get('cmosSign', { signed: true }));
console.log(cmosCookie.get('cmosSign'));
console.log(cmosCookie.get('cmosEncrypt', { encrypt: true }));
console.log(cookie.get('sign', { signed: true }));
console.log(cookie.get('sign'));

console.log('------------set test----------');
cmosCookie.set('cmosSign', 'cmos signed cookie', { signed: true });
cookie.set('sign', 'signed cookie', { signed: true });
cmosCookie.set('cmosEncrypt', 'cmos encrypt cookie', { encrypt: true });
console.log(cmosCookie.ctx.response.headers);
console.log(cookie.response.headers);

console.log('------------benchmark start----------');

suite
.add('create CmosCookie', function() {
  createCmosCookie();
})
.add('create Cookie', function() {
  createCookie();
})
.add('CmosCookies.set with signed', function() {
  createCmosCookie().set('foo', 'bar', { signed: true });
})
.add('Cookies.set with signed', function() {
  createCookie().set('foo', 'bar', { signed: true });
})
.add('CmosCookies.set without signed', function() {
  createCmosCookie().set('foo', 'bar', { signed: false });
})
.add('Cookies.set without signed', function() {
  createCookie().set('foo', 'bar', { signed: false });
})
.add('CmosCookies.set with encrypt', function() {
  createCmosCookie().set('foo', 'bar', { encrypt: true });
})
.add('CmosCookies.get with signed', function() {
  createCmosCookie().get('cmosSign', { signed: true });
})
.add('Cookies.get with signed', function() {
  createCookie().get('sign', { signed: true });
})
.add('CmosCookies.get without signed', function() {
  createCmosCookie().get('cmosSign', { signed: false });
})
.add('Cookies.get without signed', function() {
  createCookie().get('sign', { signed: false });
})
.add('CmosCookies.get with encrypt', function() {
  createCmosCookie().get('cmosEncrypt', { encrypt: true });
})
.on('cycle', event => benchmarks.add(event.target))
.on('start', () => console.log('\n  node version: %s, date: %s\n  Starting...', process.version, Date()))
.on('complete', () => {
  benchmarks.log();
  process.exit(0);
})
.run({ async: false });

function createCtx(cmos) {
  const request = {
    headers: { cookie: 'cmosSign=cmos signed cookie; cmosSign.sig=SQ4wyGWr8vhSg7XCiz_MSxpHQ2GImbxE24fg4JVz7-o; sign=signed cookie; sign.sig=PvhhL9qTxML8uYSOaG_4Fr6EIEE; cmosEncrypt=EpfmKzY4tX5OhafZS-onWOEIL0-CR6N_uGkFUFDCUno=;' },
    get(key) {
      return this.headers[key.toLowerCase()];
    },
    getHeader(key) {
      return this.get(key);
    },
    protocol: 'https',
    secure: true,
  };
  const response = {
    headers: {},
    get(key) {
      return this.headers[key.toLowerCase()];
    },
    getHeader(key) {
      return this.get(key);
    },
  };
  function set(key, value) {
    this.headers[key.toLowerCase()] = value;
  }
  if (cmos) response.set = set;
  else response.setHeader = set;

  return {
    request,
    response,
    res: response,
    req: request,
    set(key, value) {
      this.response.set(key, value);
    },
    get(key) {
      return this.request.get(key);
    },
  };
}

function createCmosCookie() {
  return new CmosCookies(createCtx(true), keys);
}

function createCookie() {
  const ctx = createCtx();
  return new Cookies(ctx.req, ctx.res, { keys: keygrip });
}

// create CmosCookie              x 6,892,450 ops/sec ±1.19% (85 runs sampled)
// create Cookie                 x 3,885,528 ops/sec ±1.07% (84 runs sampled)
// CmosCookies.set with signed    x    87,470 ops/sec ±1.63% (84 runs sampled)
// Cookies.set with signed       x    85,711 ops/sec ±1.26% (85 runs sampled)
// CmosCookies.set without signed x   557,636 ops/sec ±0.97% (86 runs sampled)
// Cookies.set without signed    x   550,085 ops/sec ±1.16% (86 runs sampled)
// CmosCookies.set with encrypt   x    68,705 ops/sec ±1.78% (80 runs sampled)
// CmosCookies.get with signed    x    78,196 ops/sec ±1.70% (83 runs sampled)
// Cookies.get with signed       x    93,181 ops/sec ±1.58% (81 runs sampled)
// CmosCookies.get without signed x 1,942,366 ops/sec ±1.14% (84 runs sampled)
// Cookies.get without signed    x 1,707,255 ops/sec ±1.13% (86 runs sampled)
// CmosCookies.get with encrypt   x    71,063 ops/sec ±2.53% (81 runs sampled)
