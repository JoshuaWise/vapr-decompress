# vapr-decompress [![Build Status](https://travis-ci.org/JoshuaWise/vapr-decompress.svg?branch=master)](https://travis-ci.org/JoshuaWise/vapr-decompress)

## Installation

```bash
npm install --save vapr
npm install --save vapr-decompress
```

## Usage

This plugin decompresses the request body based on the Content-Encoding and Transfer-Encoding headers.

```js
const decompress = require('vapr-decompress');
const app = require('vapr')();
const route = app.get('/foo');

route.use(decompress());
route.use((req) => {
  const decompressed = req.read();
});
```

## Options

The `transferOnly` option can be used to leave Content-Encodings intact (i.e., the request body will only be decoded based on the Transfer-Encoding header).

```js
route.use(decompress({ transferOnly: true }));
```

Any other options passed to the plugin are forwarded to the [zlib](https://nodejs.org/api/zlib.html#zlib_class_options) core module.
